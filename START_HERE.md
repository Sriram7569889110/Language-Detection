# Run Detection Lens in VS Code on Windows

This package contains the complete project:

- Detection Lens web interface
- TypeScript NLP language detector and built-in API
- FastAPI Python backend
- Mixed-language detection for TXT, PDF, and DOCX files
- Detection history, language proportions, and confidence scores

## Requirements

Install these before starting:

1. Python 3.11 or newer
2. Node.js 22.13 or newer
3. Visual Studio Code

Check them in the VS Code terminal:

```powershell
python --version
node --version
npm --version
```

## Easiest method

1. Open the extracted `Detection-Lens-VSCode` folder in VS Code.
2. Open **Terminal > Run Task**.
3. Run **1. Setup Detection Lens** once and wait for completion.
4. Run **2. Start Detection Lens (Backend + Frontend)**.
5. Open `http://127.0.0.1:4173` in Chrome or Edge.

Keep both VS Code task terminals running while using the application.

## Batch-file method

If VS Code tasks are not visible:

1. Double-click `setup_windows.bat` once.
2. Double-click `run_backend.bat`.
3. Double-click `run_frontend.bat`.
4. Open `http://127.0.0.1:4173`.

The FastAPI documentation is available at `http://127.0.0.1:8000/docs`.

## Test the corrected mixed-language example

Paste this text:

```text
Je mange une pomme I eat an apple
```

The result should contain French and English, not German.

## Important

- Run `setup_windows.bat` again after changing Python or Node dependencies.
- Scanned image-only PDFs require OCR; normal text-based PDFs work directly.
- Browser history is stored only in your browser.
