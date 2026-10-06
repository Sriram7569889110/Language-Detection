import { strFromU8, unzipSync } from "fflate";
import { detectLanguages } from "../../../lib/language-detection";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function decodeXmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

async function extractPdf(file: File) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const extracted = await extractText(pdf, { mergePages: true });
  return extracted.text;
}

async function extractDocx(file: File) {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const documentXml = archive["word/document.xml"];
  if (!documentXml) throw new Error("This DOCX file does not contain readable document text.");

  const xml = strFromU8(documentXml)
    .replace(/<w:tab\s*\/>/gi, "\t")
    .replace(/<w:br\s*\/>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeXmlEntities(xml).replace(/\n{3,}/g, "\n\n").trim();
}

async function extractFileText(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("The file is larger than the 10 MB limit.");
  }

  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "txt") return file.text();
  if (extension === "pdf") return extractPdf(file);
  if (extension === "docx") return extractDocx(file);
  throw new Error("Unsupported file type. Upload a TXT, PDF, or DOCX file.");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const suppliedText = formData.get("text");
    const suppliedSource = formData.get("source_name");

    let text = typeof suppliedText === "string" ? suppliedText : "";
    let sourceName =
      typeof suppliedSource === "string" && suppliedSource.trim()
        ? suppliedSource.trim()
        : "Pasted text";

    if (file instanceof File && file.size > 0) {
      text = await extractFileText(file);
      sourceName = file.name;
    }

    if (!text.trim()) {
      return Response.json(
        { detail: "No readable text was provided." },
        { status: 400 },
      );
    }

    return Response.json(detectLanguages(text, sourceName));
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "Unable to analyze this content.";
    return Response.json({ detail }, { status: 400 });
  }
}

export async function GET() {
  return Response.json({
    service: "Detection Lens language API",
    status: "ready",
    supported_files: ["txt", "pdf", "docx"],
  });
}
