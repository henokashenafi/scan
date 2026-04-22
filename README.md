# Student Record Digitizer

A fully local AI system that extracts student records from scanned images (printed or handwritten, Amharic or English) and turns them into structured, filterable, exportable data.

## Stack

- **Frontend** — Next.js + Tailwind CSS
- **Backend** — Node.js + Express
- **AI Worker** — Python + FastAPI + Surya OCR (runs fully locally, no cloud API)

## Setup

### 1. AI Worker

```bash
cd ai-worker
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

Surya models download automatically on first run (~1.5GB). Runs on `http://localhost:8000`.

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## Usage

1. Open `http://localhost:3000`
2. Upload a scanned student record image (PNG, JPG, JPEG)
3. Wait for OCR processing (1–5 minutes depending on image size)
4. Review and edit the extracted table
5. Search, filter, copy cells, or export as CSV / JSON

## Notes

- Processing time is 1–5 minutes per image on CPU. A GPU significantly reduces this.
- Supports Amharic and English text, printed documents.
- Handwritten document support requires fine-tuning on labeled data.
