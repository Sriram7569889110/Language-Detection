"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  File,
  FileText,
  Languages,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

type LanguageResult = {
  name: string;
  code: string;
  percentage: number;
  confidence: number;
  character_count: number;
  word_count: number;
};

type SegmentResult = {
  text: string;
  language: string;
  code: string;
  confidence: number;
};

type DetectionResult = {
  source_name: string;
  total_languages: number;
  character_count: number;
  word_count: number;
  languages: LanguageResult[];
  segments: SegmentResult[];
  analyzed_at: string;
};

type HistoryItem = {
  id: string;
  source: string;
  createdAt: string;
  result: DetectionResult;
};

const SAMPLE_TEXT =
  "Welcome to our campus. మా కళాశాలకు స్వాగతం. हमारे परिसर में आपका स्वागत है।";

const SAMPLE_RESULT: DetectionResult = {
  source_name: "Sample text",
  total_languages: 3,
  character_count: 79,
  word_count: 13,
  analyzed_at: new Date().toISOString(),
  languages: [
    {
      name: "English",
      code: "en",
      percentage: 43,
      confidence: 98,
      character_count: 22,
      word_count: 4,
    },
    {
      name: "Telugu",
      code: "te",
      percentage: 31,
      confidence: 97,
      character_count: 18,
      word_count: 3,
    },
    {
      name: "Hindi",
      code: "hi",
      percentage: 26,
      confidence: 96,
      character_count: 19,
      word_count: 6,
    },
  ],
  segments: [
    {
      text: "Welcome to our campus.",
      language: "English",
      code: "en",
      confidence: 98,
    },
    {
      text: "మా కళాశాలకు స్వాగతం.",
      language: "Telugu",
      code: "te",
      confidence: 97,
    },
    {
      text: "हमारे परिसर में आपका स्वागत है।",
      language: "Hindi",
      code: "hi",
      confidence: 96,
    },
  ],
};

const RESULT_COLORS = [
  "#4f46e5",
  "#0f9f8f",
  "#f59e0b",
  "#e0567b",
  "#6d5bd0",
  "#0ea5e9",
];

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const HISTORY_KEY = "detection-lens-history-v1";

function resultColor(index: number) {
  return RESULT_COLORS[index % RESULT_COLORS.length];
}

function formatRelativeTime(iso: string) {
  const elapsed = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function fileLabel(name: string) {
  const extension = name.split(".").pop()?.toUpperCase();
  return extension && extension !== name.toUpperCase() ? extension : "TEXT";
}

export default function Home() {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DetectionResult>(SAMPLE_RESULT);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showSegments, setShowSegments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(HISTORY_KEY);
        if (saved) setHistory(JSON.parse(saved));
      } catch {
        // History is a convenience feature; detection still works if storage is blocked.
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const donutBackground = useMemo(() => {
    const { stops } = result.languages.reduce(
      (current, language, index) => {
        const end = current.cursor + language.percentage;
        return {
          cursor: end,
          stops: [
            ...current.stops,
            `${resultColor(index)} ${current.cursor}% ${end}%`,
          ],
        };
      },
      { cursor: 0, stops: [] as string[] },
    );
    return `conic-gradient(${stops.join(", ")})`;
  }, [result]);

  const visibleHistory = showAllHistory ? history : history.slice(0, 3);

  function saveHistory(nextHistory: HistoryItem[]) {
    const limited = nextHistory.slice(0, 12);
    setHistory(limited);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
    } catch {
      // Ignore unavailable browser storage.
    }
  }

  function validateFile(file: File) {
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !["txt", "pdf", "docx"].includes(extension)) {
      setError("Choose a TXT, PDF, or DOCX file.");
      return false;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("The file is larger than 10 MB. Choose a smaller document.");
      return false;
    }
    setError("");
    return true;
  }

  function chooseFile(file: File | undefined) {
    if (!file || !validateFile(file)) return;
    setSelectedFile(file);
    setMode("file");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  function clearInput() {
    setText("");
    setSelectedFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function detectLanguages() {
    if (mode === "text" && !text.trim()) {
      setError("Enter or paste some text before starting detection.");
      return;
    }
    if (mode === "file" && !selectedFile) {
      setError("Upload a TXT, PDF, or DOCX file before starting detection.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      if (mode === "text") {
        formData.append("text", text.trim());
        formData.append("source_name", "Pasted text");
      } else if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch(`${API_BASE}/api/detect`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail ?? payload.error ?? "Detection failed.");
      }

      const nextResult = payload as DetectionResult;
      setResult(nextResult);
      setShowSegments(false);
      const nextItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        source: nextResult.source_name,
        createdAt: nextResult.analyzed_at,
        result: nextResult,
      };
      saveHistory([nextItem, ...history]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The detector could not analyze this content.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function restoreHistory(item: HistoryItem) {
    setResult(item.result);
    setShowSegments(false);
    document.getElementById("detect")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#detect" aria-label="Detection Lens home">
          <span className="brand-mark" aria-hidden="true">
            <Languages size={24} strokeWidth={2.1} />
          </span>
          <span>Detection Lens</span>
        </a>

        <nav className="main-nav" aria-label="Primary navigation">
          <a className="nav-link active" href="#detect">
            Detect
          </a>
          <a className="nav-link" href="#history">
            History
          </a>
          <a className="nav-link" href="#about">
            About
          </a>
        </nav>

        <a className="help-link" href="#about" aria-label="How Detection Lens works">
          <CircleHelp size={22} />
          <span>How it works</span>
        </a>
      </header>

      <div className="page-shell">
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">
              <ScanText size={15} /> Multilingual document intelligence
            </p>
            <h1 id="page-title">Identify every language in your content</h1>
            <p className="hero-copy">
              Paste text or upload a TXT, PDF, or DOCX file to detect every
              language, its proportion, and confidence score.
            </p>
          </div>
          <div className="privacy-pill">
            <LockKeyhole size={17} />
            <span>Private</span>
            <span className="privacy-dot">•</span>
            Files processed securely
          </div>
        </section>

        <section className="workspace-grid" id="detect" aria-label="Language detector">
          <article className="panel input-panel">
            <div className="input-tabs" role="tablist" aria-label="Input method">
              <button
                className={`input-tab ${mode === "text" ? "selected" : ""}`}
                onClick={() => {
                  setMode("text");
                  setError("");
                }}
                role="tab"
                aria-selected={mode === "text"}
              >
                <FileText size={20} /> Paste text
              </button>
              <button
                className={`input-tab ${mode === "file" ? "selected" : ""}`}
                onClick={() => {
                  setMode("file");
                  setError("");
                }}
                role="tab"
                aria-selected={mode === "file"}
              >
                <UploadCloud size={20} /> Upload file
              </button>
            </div>

            <div className="input-body">
              {mode === "text" ? (
                <div className="textarea-wrap">
                  <textarea
                    value={text}
                    onChange={(event) => {
                      setText(event.target.value.slice(0, 20_000));
                      setError("");
                    }}
                    aria-label="Text to analyze"
                    placeholder="Enter or paste text in one or more languages…"
                    maxLength={20_000}
                  />
                  <span className="character-count">
                    {text.length.toLocaleString()} / 20,000
                  </span>
                </div>
              ) : (
                <div
                  className={`drop-zone ${isDragging ? "dragging" : ""} ${
                    selectedFile ? "has-file" : ""
                  }`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => chooseFile(event.target.files?.[0])}
                    hidden
                  />
                  {selectedFile ? (
                    <>
                      <span className="file-icon-box">
                        <File size={25} />
                      </span>
                      <div>
                        <strong>{selectedFile.name}</strong>
                        <p>
                          {fileLabel(selectedFile.name)} • {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        className="remove-file"
                        aria-label="Remove selected file"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="upload-icon">
                        <UploadCloud size={29} />
                      </span>
                      <strong>Drop a document here or <span>browse</span></strong>
                      <p>TXT, PDF or DOCX • Maximum 10 MB</p>
                    </>
                  )}
                </div>
              )}

              {error ? (
                <div className="error-message" role="alert">
                  <CircleHelp size={17} /> {error}
                </div>
              ) : (
                <p className="input-hint">
                  <ShieldCheck size={16} /> Mixed-language content is analyzed phrase by phrase—even when scripts match.
                </p>
              )}
            </div>

            <div className="input-actions">
              <button className="secondary-button" onClick={clearInput}>
                <RotateCcw size={17} /> Clear
              </button>
              <button
                className="primary-button"
                onClick={detectLanguages}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="spin" size={19} /> Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles size={19} /> Detect languages
                  </>
                )}
              </button>
            </div>
          </article>

          <article className="panel results-panel" aria-live="polite">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Analysis result</p>
                <h2>Language breakdown</h2>
              </div>
              <span className="language-count">
                {result.total_languages} {result.total_languages === 1 ? "language" : "languages"}
              </span>
            </div>

            <div className="result-summary">
              <div className="donut" style={{ background: donutBackground }}>
                <div className="donut-center">
                  <strong>{result.total_languages}</strong>
                  <span>detected</span>
                </div>
              </div>
              <div className="summary-copy">
                <CheckCircle2 size={19} />
                <div>
                  <strong>Analysis complete</strong>
                  <p>{result.source_name}</p>
                </div>
              </div>
            </div>

            <div className="language-list">
              {result.languages.map((language, index) => (
                <div className="language-row" key={`${language.code}-${index}`}>
                  <div className="language-meta">
                    <span
                      className="language-dot"
                      style={{ backgroundColor: resultColor(index) }}
                      aria-hidden="true"
                    />
                    <strong>{language.name}</strong>
                    <span
                      className="code-badge"
                      style={{
                        color: resultColor(index),
                        backgroundColor: `${resultColor(index)}14`,
                      }}
                    >
                      {language.code.toUpperCase()}
                    </span>
                  </div>
                  <div className="language-stats">
                    <strong>{language.percentage}%</strong>
                    <div className="progress-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${language.percentage}%`,
                          backgroundColor: resultColor(index),
                        }}
                      />
                    </div>
                    <span>{language.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="analysis-meta">
              <FileText size={17} />
              <span>{result.character_count.toLocaleString()} characters</span>
              <span className="meta-separator">•</span>
              <span>{result.word_count.toLocaleString()} words</span>
            </div>
          </article>
        </section>

        {result.segments.length > 0 && (
          <section className="segments-panel" aria-labelledby="segments-title">
            <button
              className="segments-toggle"
              onClick={() => setShowSegments((current) => !current)}
              aria-expanded={showSegments}
            >
              <span>
                <ScanText size={20} />
                <span>
                  <strong id="segments-title">Detected passages</strong>
                  <small>See which language was found in each part of the content</small>
                </span>
              </span>
              <ChevronRight className={showSegments ? "turned" : ""} size={20} />
            </button>
            {showSegments && (
              <div className="segments-list">
                {result.segments.slice(0, 12).map((segment, index) => (
                  <article className="segment-row" key={`${segment.code}-${index}`}>
                    <span
                      className="segment-number"
                      style={{ color: resultColor(index) }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <p>{segment.text}</p>
                    <span className="segment-language">
                      {segment.language} · {segment.confidence}%
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="history-panel" id="history" aria-labelledby="history-title">
          <div className="section-heading">
            <div>
              <p className="panel-kicker">Stored on this browser</p>
              <h2 id="history-title">Recent detections</h2>
            </div>
            {history.length > 3 && (
              <button className="text-button" onClick={() => setShowAllHistory((value) => !value)}>
                {showAllHistory ? "Show less" : "View all history"}
                <ArrowRight size={17} />
              </button>
            )}
          </div>

          {visibleHistory.length > 0 ? (
            <div className="history-grid">
              {visibleHistory.map((item) => (
                <button
                  className="history-card"
                  key={item.id}
                  onClick={() => restoreHistory(item)}
                >
                  <span className="history-file-icon">
                    <FileText size={21} />
                  </span>
                  <span className="history-copy">
                    <strong>{item.source}</strong>
                    <small>
                      {item.result.total_languages} {item.result.total_languages === 1 ? "language" : "languages"}
                      {item.result.languages[0] ? ` • ${item.result.languages[0].name} dominant` : ""}
                    </small>
                  </span>
                  <span className="history-time">
                    <Clock3 size={14} /> {formatRelativeTime(item.createdAt)}
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-history">
              <Clock3 size={22} />
              <div>
                <strong>No saved detections yet</strong>
                <p>Your completed analyses will appear here.</p>
              </div>
            </div>
          )}
        </section>

        <section className="about-section" id="about" aria-labelledby="about-title">
          <div className="about-intro">
            <p className="eyebrow">Built for multilingual content</p>
            <h2 id="about-title">From document to clear language insights</h2>
            <p>
              Detection Lens extracts text, separates mixed-language passages,
              and combines the results into an easy-to-read document summary.
            </p>
          </div>
          <div className="about-grid">
            <article>
              <span>01</span>
              <h3>Add your content</h3>
              <p>Paste text or upload a supported document up to 10 MB.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Analyze every passage</h3>
              <p>Different scripts, sentences, and same-script phrases are identified independently.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Review the breakdown</h3>
              <p>Compare proportions, confidence, language codes, and passages.</p>
            </article>
          </div>
        </section>
      </div>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark small" aria-hidden="true">
            <Languages size={17} />
          </span>
          <strong>Detection Lens</strong>
        </div>
        <span>Language identification for text and documents</span>
      </footer>
    </main>
  );
}
