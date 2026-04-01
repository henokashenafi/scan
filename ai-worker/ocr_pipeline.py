import io
import os
import base64
import time

# Disable model source check to speed up startup
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

import numpy as np
from PIL import Image
from paddleocr import PaddleOCR
from llm_mapper import map_text_to_json

# Initialize OCR Engine (PaddleOCR)
# Note: Using 'en' for layout support even as we pivot to Vision LLM for Amharic.
# Disabling MKLDNN to avoid PIR attribute conversion error on some CPU architectures.
paddle_ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)

async def process_document(image_bytes: bytes, filename: str) -> dict:
    """
    Takes an image, extracts tables/text, passes to LLM mapping, and returns structured data.
    """
    # 1. Convert bytes to base64 for Vision LLM
    base64_image = base64.b64encode(image_bytes).decode('utf-8')

    # 2. Convert bytes to OpenCV image format for PaddleOCR
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_np = np.array(image)
    
    # 3. Extract layout using PaddleOCR (used primarily as a layout hint)
    print(f"--- Starting OCR for {filename} ---")
    start_ocr = time.time()
    try:
        result = paddle_ocr.ocr(img_np)
    except Exception as e:
        print(f"PaddleOCR error (continuing with Vision LLM only): {e}")
        result = None
    end_ocr = time.time()
    print(f"OCR finished in {end_ocr - start_ocr:.2f} seconds.")
    
    # 4. Collect all extracted text from PaddleOCR results
    raw_text_parts = []
    if result and result[0]:
        for line in result[0]:
            text = line[1][0]
            raw_text_parts.append(text)
         
    compiled_text = "\n".join(raw_text_parts)
    print(f"OCR Hint: Extracted {len(compiled_text)} characters.")

    # 5. Map semantic meaning using local Vision-LLM
    print(f"--- Starting Vision LLM analysis for {filename} ---")
    start_llm = time.time()
    structured_data = map_text_to_json(compiled_text, filename, base64_image)
    end_llm = time.time()
    print(f"Vision LLM finished in {end_llm - start_llm:.2f} seconds.")
    
    return {
        "status": "success",
        "processing_time": {
            "ocr": end_ocr - start_ocr,
            "llm": end_llm - start_llm,
            "total": time.time() - start_ocr
        },
        "raw_text_length": len(compiled_text),
        "mapped_data": structured_data
    }
