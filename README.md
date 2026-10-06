# Detection Lens

Detection Lens is a full-stack language-identification project for pasted text
and uploaded TXT, PDF, and DOCX documents. It detects mixed-language passages,
then reports language names, codes, document proportions, confidence scores,
and browser-local history.

## Project structure

- `app/` — responsive web interface and built-in TypeScript API
- `app/api/detect/route.ts` — hosted document-analysis endpoint
- `backend/` — separate FastAPI backend requested for the academic project
- `lib/language-detection.ts` — hosted language aggregation logic

## Run with the FastAPI backend on Windows

### 1. Start the backend

Open PowerShell in the project folder:

```powershell
cd backend
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API runs at `http://127.0.0.1:8000`. Interactive API documentation is at
`http://127.0.0.1:8000/docs`.

### 2. Connect and start the frontend

Open a second PowerShell window in the main project folder:

```powershell
Set-Content .env.local 'NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000'
npm install
$env:WRANGLER_LOG_PATH='.wrangler/wrangler.log'
npx vite --host 127.0.0.1 --port 4173
```

Open the local address shown in PowerShell. Keep both PowerShell windows open.

## Run the frontend with its built-in API

If you do not need the Python backend, remove `.env.local` and start the site:

```powershell
Remove-Item .env.local -ErrorAction SilentlyContinue
npm install
$env:WRANGLER_LOG_PATH='.wrangler/wrangler.log'
npx vite --host 127.0.0.1 --port 4173
```

## API request formats

The frontend sends `multipart/form-data` to `POST /api/detect` with either:

- `text` and optional `source_name`, or
- one `file` field containing a TXT, PDF, or DOCX document up to 10 MB.

For direct JSON testing, FastAPI also exposes `POST /api/detect-json`:

```json
{
  "text": "Hello. నమస్కారం. नमस्ते।",
  "source_name": "API example"
}
```

## Important limitation

Image-only scanned PDFs do not contain extractable text. Add OCR before sending
those files, or extend the backend with an OCR module in a later project phase.
