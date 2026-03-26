import io
import cv2
import numpy as np
from PIL import Image
from paddleocr import PaddleOCR
from easyocr import Reader
from llm_mapper import map_text_to_json

# Initialize OCR Engines (can take time, so we do it globally)
paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en') # Used for robust layout analysis
easy_ocr = Reader(['en', 'am']) # Used for Amharic/English character extraction

async def process_document(image_bytes: bytes, filename: str) -> dict:
    """
    Takes an image, extracts tables/text, passes to LLM mapping, and returns structured data.
    """
    # 1. Convert bytes to OpenCV image format
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_np = np.array(image)
    
    # Optional: Pre-processing (deskew) can go here
    
    # 2. Extract layout and table cells using PaddleOCR
    # PaddleOCR is powerful for finding boxes
    result = paddle_ocr.ocr(img_np, cls=True)
    
    # 3. Use EasyOCR on the cropped boxes if needed, or rely on PaddleOCR's detected text
    # For now, we'll collect all extracted text from the image for the LLM.
    # In a full production system, we'd crop the bounding boxes and pass them to EasyOCR explicitly.
    raw_text_parts = []
    
    # Fast approach: use EasyOCR on the entire image to get all Amharic/English text
    easy_results = easy_ocr.readtext(img_np)
    for (bbox, text, prob) in easy_results:
        raw_text_parts.append(text)
        
    compiled_text = "\n".join(raw_text_parts)
    print(f"Extracted {len(compiled_text)} characters using OCR.")

    # 4. Map semantic meaning using local LLM
    structured_data = map_text_to_json(compiled_text, filename)
    
    return {
        "status": "success",
        "raw_text_length": len(compiled_text),
        "mapped_data": structured_data
    }
