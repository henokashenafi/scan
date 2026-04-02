import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import base64
from ocr_pipeline import process_document
from celery_worker import process_ocr_task, celery_app
from celery.result import AsyncResult

app = FastAPI(title="Amharic-English OCR Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "OCR Worker"}

@app.post("/process")
async def process_file(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    try:
        # Read file contents into memory
        contents = await file.read()
        
        # Process the document using our hybrid OCR pipeline
        # (Pass the raw bytes to the pipeline)
        result = await process_document(contents, file.filename)
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-batch")
async def process_batch(file: UploadFile = File(...)):
    """
    Submits a file to the celery worker for background processing.
    """
    try:
        contents = await file.read()
        image_bytes_b64 = base64.b64encode(contents).decode('utf-8')
        
        # Dispatch the task to Celery
        task = process_ocr_task.delay(image_bytes_b64, file.filename)
        
        return {"status": "queued", "task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/task-status/{task_id}")
async def get_task_status(task_id: str):
    """
    Check the status of a long-running OCR task.
    """
    res = AsyncResult(task_id, app=celery_app)
    if res.state == 'PENDING':
        return {"status": "processing", "progress": 0}
    elif res.state == 'SUCCESS':
        return {"status": "completed", "result": res.result}
    elif res.state == 'FAILURE':
        return {"status": "failed", "error": str(res.info)}
    else:
        return {"status": res.state}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
