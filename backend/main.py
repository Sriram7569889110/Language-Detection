"""FastAPI backend for Detection Lens."""

from __future__ import annotations

from io import BytesIO
import os
from pathlib import Path
from typing import Annotated

from docx import Document
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader

from detector import analyze_text

MAX_FILE_BYTES = 10 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".docx"}


class TextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=100_000)
    source_name: str = Field(default="Pasted text", max_length=240)


app = FastAPI(
    title="Detection Lens API",
    description="Detect and measure languages in pasted text, TXT, PDF, and DOCX files.",
    version="1.0.0",
)

default_origins = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:4173",
    "http://localhost:4173",
]
origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", ",".join(default_origins)).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


def extract_text_file(content: bytes) -> str:
    for encoding in ("utf-8-sig", "utf-16"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("The TXT file must use UTF-8 or UTF-16 text encoding.")


def extract_pdf(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    return "\n".join(page.extract_text() or "" for page in reader.pages).strip()


def extract_docx(content: bytes) -> str:
    document = Document(BytesIO(content))
    return "\n".join(paragraph.text for paragraph in document.paragraphs).strip()


def extract_document(filename: str, content: bytes) -> str:
    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Upload a TXT, PDF, or DOCX file.")
    if len(content) > MAX_FILE_BYTES:
        raise ValueError("The file is larger than the 10 MB limit.")

    if extension == ".txt":
        text = extract_text_file(content)
    elif extension == ".pdf":
        text = extract_pdf(content)
    else:
        text = extract_docx(content)

    if not text.strip():
        raise ValueError(
            "No readable text was found. Scanned PDFs need OCR before language detection."
        )
    return text


@app.get("/")
def api_home() -> dict:
    return {
        "service": "Detection Lens API",
        "status": "ready",
        "documentation": "/docs",
    }


@app.get("/health")
def health() -> dict:
    return {"status": "healthy", "supported_files": ["txt", "pdf", "docx"]}


@app.post("/api/detect")
async def detect_from_form(
    text: Annotated[str | None, Form()] = None,
    source_name: Annotated[str | None, Form()] = None,
    file: Annotated[UploadFile | None, File()] = None,
) -> dict:
    try:
        content = text or ""
        final_source = (source_name or "Pasted text").strip() or "Pasted text"

        if file is not None and file.filename:
            uploaded = await file.read(MAX_FILE_BYTES + 1)
            content = extract_document(file.filename, uploaded)
            final_source = file.filename

        if not content.strip():
            raise ValueError("No readable text was provided.")
        return analyze_text(content, final_source)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="The document could not be read. Check that it is a valid, unprotected file.",
        ) from error


@app.post("/api/detect-json")
def detect_from_json(payload: TextRequest) -> dict:
    try:
        return analyze_text(payload.text, payload.source_name)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
