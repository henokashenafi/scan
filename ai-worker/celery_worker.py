from celery import Celery
import os
from dotenv import load_dotenv
from ocr_pipeline import process_document
import asyncio

load_dotenv()

# Initialize Celery
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("ocr_worker", broker=redis_url, backend=redis_url)

@celery_app.task(name="process_ocr_task")
def process_ocr_task(image_bytes_b64, filename):
    """
    Background task to process an OCR job.
    """
    import base64
    image_bytes = base64.b64decode(image_bytes_b64)
    
    # Run the async process_document function in a synchronous wrapper
    loop = asyncio.get_event_loop()
    result = loop.run_until_complete(process_document(image_bytes, filename))
    
    return result
