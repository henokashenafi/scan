import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from ocr_pipeline import process_document

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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
