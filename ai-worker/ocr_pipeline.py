import io
import cv2
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR
from easyocr import Reader
from llm_mapper import map_text_to_json

import paddle
# Force static mode to bypass the new PIR API which causes the 'ConvertPirAttribute2RuntimeAttribute' error
paddle.enable_static()
paddle.set_flags({"FLAGS_enable_pir_api": 0})

# Initialize OCR Engines (can take time, so we do it globally)
paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en') # Used for robust layout analysis
easy_ocr = Reader(['en']) # EasyOCR doesn't officially support 'am'. Relying on PaddleOCR for layout.

async def process_document(image_bytes: bytes, filename: str) -> dict:
    """
    Takes an image, extracts tables/text, passes to LLM mapping, and returns structured data.
    """
    # 1. Convert bytes to OpenCV image format
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_np = np.array(image)
    
    # Optional: Pre-processing (deskew) can go here
    
    # 2. Extract text using PaddleOCR
    try:
        result = paddle_ocr.ocr(img_np)
    except Exception as e:
        print(f"PaddleOCR failure (likely PIR error): {e}")
        result = None
    
    # 3. Use EasyOCR and spatially group the results into readable lines
    raw_text_parts = []
    easy_results = easy_ocr.readtext(img_np)
    
    # Calculate bounding box centers
    boxes = []
    for (bbox, text, prob) in easy_results:
        # bbox format: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
        cy = sum([pt[1] for pt in bbox]) / 4.0
        cx = sum([pt[0] for pt in bbox]) / 4.0
        boxes.append({"text": text, "cx": cx, "cy": cy})
        
    # Sort by Y coordinate first
    boxes.sort(key=lambda b: b["cy"])
    
    # Group into lines if Y difference is small (e.g., < 15 pixels)
    y_threshold = 15
    current_line = []
    lines = []
    
    for box in boxes:
        if not current_line:
            current_line.append(box)
        else:
            if abs(box["cy"] - current_line[0]["cy"]) < y_threshold:
                current_line.append(box)
            else:
                # Sort the completed line by X coordinate (left to right)
                current_line.sort(key=lambda b: b["cx"])
                lines.append(" ".join([b["text"] for b in current_line]))
                current_line = [box]
                
    if current_line:
        current_line.sort(key=lambda b: b["cx"])
        lines.append(" ".join([b["text"] for b in current_line]))

    compiled_text = "\n".join(lines)
    print(f"Extracted {len(compiled_text)} characters using OCR.")


    # 4. Map semantic meaning using local LLM
    structured_data = map_text_to_json(compiled_text, filename)
    
    # 5. Programmatic Grade Calculation (Reliable)
    if "students" in structured_data and isinstance(structured_data["students"], list):
        for student in structured_data["students"]:
            scores = [
                student.get("math_score"),
                student.get("english_score"),
                student.get("science_score")
            ]
            valid_scores = [s for s in scores if isinstance(s, (int, float))]
            if valid_scores:
                avg = sum(valid_scores) / len(valid_scores)
                student["average"] = round(avg, 1)
                # Assign Grade
                if avg >= 90: student["grade"] = "A"
                elif avg >= 80: student["grade"] = "B"
                elif avg >= 70: student["grade"] = "C"
                elif avg >= 60: student["grade"] = "D"
                else: student["grade"] = "F"
            else:
                student["average"] = None
                student["grade"] = "N/A"

    return {
        "status": "success",
        "raw_text_length": len(compiled_text),
        "mapped_data": structured_data
    }
