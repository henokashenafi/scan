import io
import time
from PIL import Image

from surya.common.surya.schema import TaskNames
from surya.detection import DetectionPredictor
from surya.foundation import FoundationPredictor
from surya.recognition import RecognitionPredictor
from table_parser import parse_table

# Load models once at startup (downloaded automatically on first run)
print("Loading Surya OCR models...")
_foundation = FoundationPredictor()
det_predictor = DetectionPredictor()
rec_predictor = RecognitionPredictor(_foundation)
print("Surya models loaded.")


async def process_document(image_bytes: bytes, filename: str) -> dict:
    """
    Extracts text from image using Surya OCR (Amharic + English),
    then parses the table structure deterministically.
    """
    start = time.time()

    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    print(f"--- [{filename}] Image loaded: {image.size} ---")

    # Run Surya OCR — detection + recognition in one call
    print("--- Running Surya OCR ---")
    start_ocr = time.time()
    predictions = rec_predictor(
        [image],
        task_names=[TaskNames.ocr_with_boxes],
        det_predictor=det_predictor,
        math_mode=False,   # disable math mode, we're reading text/numbers only
    )
    end_ocr = time.time()
    print(f"OCR finished in {end_ocr - start_ocr:.2f}s")

    text_lines = predictions[0].text_lines
    print(f"Detected {len(text_lines)} text lines")
    for line in text_lines:
        print(f"  bbox={line.bbox}  text='{line.text}'")

    # Parse table structure from bounding boxes
    structured_data = parse_table(text_lines)

    # Raw text fallback — always include extracted lines for non-table documents
    raw_lines = [line.text.strip() for line in text_lines if line.text.strip()]

    return {
        "status": "success",
        "processing_time": {
            "ocr": end_ocr - start_ocr,
            "total": time.time() - start
        },
        "raw_text_length": sum(len(l.text) for l in text_lines),
        "raw_lines": raw_lines,
        "mapped_data": structured_data
    }
