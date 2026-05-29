"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, File, X, CheckCircle, AlertCircle,
  Loader2, ScanSearch, RotateCcw, ChevronDown, ChevronUp, History, Trash2,
  Eye, Download, ExternalLink,
} from "lucide-react";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("@/components/cv/PDFViewer"), { ssr: false });
const DocxViewer = dynamic(() => import("@/components/cv/DocxViewer"), { ssr: false });
import { Button } from "@/components/ui/button";
import AppShell from "@/components/layout/AppShell";
import { useJobs } from "@/lib/api/jobs";
import {
  extractAllFiles,
  type ExtractionResult,
} from "@/lib/text-extraction";
import {
  matchCVAgainstAllJobs,
  SYNONYM_MAP,
  type CVMatchResult,
  type MatchedKeyword,
} from "@/lib/cv-matcher";

type Phase = "idle" | "files_selected" | "extracting" | "scoring" | "results";
type ScoreFilter = 0 | 40 | 70;

interface HistoryJobMatch {
  jobId: string;
  jobTitle: string;
  score: number;
  matchedKeywords?: { keyword: string; matchType: string }[];
}

interface HistoryEntry {
  fileName: string;
  jobMatches: HistoryJobMatch[];
  cvFilePath?: string | null;
  cvFileType?: string | null;
}

interface HistoryRecord {
  id: string;
  createdAt: string;
  entries: HistoryEntry[];
}

export default function MatcherPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [extractionResults, setExtractionResults] = useState<ExtractionResult[]>([]);
  const [cvResults, setCvResults] = useState<CVMatchResult[]>([]);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>(0);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<HistoryEntry | null>(null);

  const { data: jobs = [] } = useJobs();

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/cv-match-history");
    if (res.ok) setHistory(await res.json());
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...accepted.filter((f) => !existing.has(f.name))];
    });
    setPhase("files_selected");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    multiple: true,
  });

  const removeFile = (name: string) => {
    const next = files.filter((f) => f.name !== name);
    setFiles(next);
    if (next.length === 0) setPhase("idle");
  };

  const handleAnalyze = async () => {
    if (!files.length || !jobs.length) return;
    setPhase("extracting");
    setExtractionResults(files.map((f) => ({ file: f, text: "", status: "pending" })));

    const extracted = await extractAllFiles(files, (results) => {
      setExtractionResults([...results]);
    });

    setPhase("scoring");

    const results = extracted
      .filter((r) => r.status === "done")
      .map((r) => matchCVAgainstAllJobs(r.file, r.text, jobs, SYNONYM_MAP));

    const errors = extracted
      .filter((r) => r.status === "error")
      .map((r): CVMatchResult => ({ file: r.file, cvText: "", jobResults: [] }));

    setCvResults([...results, ...errors]);
    setPhase("results");

    // Upload each file to Blob and save history
    if (results.length > 0) {
      const uploadResults = await Promise.all(
        results.map(async (r) => {
          try {
            const fd = new FormData();
            fd.append("file", r.file);
            const res = await fetch("/api/matcher-upload", { method: "POST", body: fd });
            if (res.ok) return await res.json() as { filePath: string; fileType: string };
          } catch { /* upload failed — preview unavailable */ }
          return null;
        })
      );

      const entries: HistoryEntry[] = results.map((r, i) => ({
        fileName: r.file.name,
        jobMatches: r.jobResults.map((jr) => ({
          jobId: jr.job.id,
          jobTitle: jr.job.title,
          score: jr.score,
          matchedKeywords: jr.matchedKeywords.map((kw) => ({
            keyword: kw.keyword,
            matchType: kw.matchType,
          })),
        })),
        cvFilePath: uploadResults[i]?.filePath ?? null,
        cvFileType: uploadResults[i]?.fileType ?? null,
      }));

      await fetch("/api/cv-match-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      loadHistory();
    }
  };

  const handleDeleteHistory = async (id: string) => {
    await fetch(`/api/cv-match-history?id=${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReset = () => {
    setPhase("idle");
    setFiles([]);
    setExtractionResults([]);
    setCvResults([]);
    setScoreFilter(0);
  };

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">התאמת קורות חיים</h1>
            <p className="text-brand-gray mt-1">
              גרור קבצי PDF/DOCX — המערכת תתאים אותם לכל המשרות הקיימות
            </p>
          </div>
          {phase === "results" && (
            <Button onClick={handleReset} variant="outline" className="rounded-xl gap-2">
              <RotateCcw className="w-4 h-4" />
              ניתוח חדש
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(phase === "idle" || phase === "files_selected") && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <DropZoneArea
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                files={files}
                onRemove={removeFile}
                onAnalyze={handleAnalyze}
                jobCount={jobs.length}
              />

              {history.length > 0 && (
                <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
                  <button
                    onClick={() => setHistoryOpen((v) => !v)}
                    className="w-full flex items-center gap-3 px-6 py-4 text-right hover:bg-brand-gray-light transition-colors"
                  >
                    <History className="w-5 h-5 text-brand-gray flex-shrink-0" />
                    <span className="flex-1 font-semibold text-brand-black">
                      היסטוריית ניתוחים
                    </span>
                    <span className="text-xs text-brand-gray bg-brand-gray-light px-2 py-0.5 rounded-full">
                      {history.length}
                    </span>
                    {historyOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-gray flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-brand-gray flex-shrink-0" />
                    )}
                  </button>

                  {historyOpen && (
                    <div className="border-t border-brand-gray-border divide-y divide-brand-gray-border">
                      {history.map((record) => (
                        <HistoryRow
                          key={record.id}
                          record={record}
                          onDelete={() => handleDeleteHistory(record.id)}
                          onPreview={(entry) => setPreviewEntry(entry)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {phase === "extracting" && (
            <motion.div
              key="extracting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <ExtractionProgress results={extractionResults} />
            </motion.div>
          )}

          {phase === "scoring" && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-4"
            >
              <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
              <p className="text-brand-gray font-medium">מנתח התאמות...</p>
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              <ResultsView
                results={cvResults}
                scoreFilter={scoreFilter}
                onFilterChange={setScoreFilter}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {previewEntry && (
        <CVPreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      )}
    </AppShell>
  );
}

const HISTORY_CHIP_STYLE: Record<string, string> = {
  exact: "bg-green-50 text-green-700 border-green-200",
  synonym: "bg-blue-50 text-blue-700 border-blue-200",
  stem: "bg-purple-50 text-purple-700 border-purple-200",
  fuzzy: "bg-orange-50 text-orange-700 border-orange-200",
};

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({
  record,
  onDelete,
  onPreview,
}: {
  record: HistoryRecord;
  onDelete: () => void;
  onPreview: (entry: HistoryEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(record.createdAt).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const topScores = record.entries.flatMap((e) =>
    e.jobMatches.slice(0, 1).map((m) => ({ fileName: e.fileName, ...m }))
  );

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 flex-1 text-right"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-brand-black">
                {record.entries.length} קורות חיים
              </span>
              <span className="text-xs text-brand-gray">{date}</span>
            </div>
            {!expanded && topScores.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {topScores.slice(0, 3).map((s, i) => (
                  <span key={i} className="text-xs text-brand-gray">
                    <span className="font-medium text-brand-black truncate">{s.fileName}</span>
                    {" → "}
                    <ScoreBadge score={s.score} small />
                  </span>
                ))}
                {topScores.length > 3 && (
                  <span className="text-xs text-brand-gray">+{topScores.length - 3} עוד</span>
                )}
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-brand-gray flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-brand-gray flex-shrink-0" />
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-brand-gray hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          title="מחק"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-6 pb-4 space-y-3">
          {record.entries.map((entry, i) => (
            <div key={i} className="bg-brand-gray-light rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-brand-black flex items-center gap-1.5 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-brand-gray flex-shrink-0" />
                  <span className="truncate">{entry.fileName}</span>
                </p>
                {entry.cvFilePath && (
                  <button
                    onClick={() => onPreview(entry)}
                    className="flex items-center gap-1 text-xs text-brand-yellow font-medium hover:underline flex-shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    תצוגה מקדימה
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {entry.jobMatches.slice(0, 5).map((m, j) => (
                  <div key={j} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="text-brand-gray truncate font-medium">{m.jobTitle}</span>
                      <ScoreBadge score={m.score} small />
                    </div>
                    {m.matchedKeywords && m.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {m.matchedKeywords.map((kw, k) => (
                          <span
                            key={k}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border ${HISTORY_CHIP_STYLE[kw.matchType] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                          >
                            {kw.keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {entry.jobMatches.length > 5 && (
                  <p className="text-xs text-brand-gray">
                    +{entry.jobMatches.length - 5} משרות נוספות
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CV Preview Modal ─────────────────────────────────────────────────────────

function CVPreviewModal({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const isPdf = entry.cvFileType === "pdf" || entry.fileName.toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[60vw] max-w-3xl bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-bold text-brand-black text-lg truncate">{entry.fileName}</h2>
            <p className="text-sm text-brand-gray">
              {entry.jobMatches.length} משרות נותחו
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={entry.cvFilePath!}
              download={entry.fileName}
              className="p-2 rounded-xl hover:bg-brand-gray-light transition-colors text-brand-gray hover:text-brand-black"
              title="הורדה"
            >
              <Download className="w-5 h-5" />
            </a>
            <a
              href={entry.cvFilePath!}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl hover:bg-brand-gray-light transition-colors text-brand-gray hover:text-brand-black"
              title="פתח בטאב חדש"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-brand-gray-light transition-colors text-brand-gray hover:text-brand-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {isPdf ? (
            <PDFViewer filePath={entry.cvFilePath!} />
          ) : (
            <DocxViewer filePath={entry.cvFilePath!} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZoneArea({
  getRootProps,
  getInputProps,
  isDragActive,
  files,
  onRemove,
  onAnalyze,
  jobCount,
}: {
  getRootProps: () => React.HTMLAttributes<HTMLDivElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  isDragActive: boolean;
  files: File[];
  onRemove: (name: string) => void;
  onAnalyze: () => void;
  jobCount: number;
}) {
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-brand-yellow bg-brand-yellow-soft"
            : "border-brand-gray-border bg-white hover:border-brand-yellow hover:bg-brand-yellow-soft"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto mb-4 text-brand-gray" />
        <p className="text-lg font-semibold text-brand-black mb-1">
          {isDragActive ? "שחרר את הקבצים כאן" : "גרור קבצי קורות חיים לכאן"}
        </p>
        <p className="text-sm text-brand-gray">PDF או DOCX · ניתן לגרור מספר קבצים בו-זמנית</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-2xl border border-brand-gray-border p-4 space-y-2">
          <p className="text-sm font-semibold text-brand-black mb-3">
            {files.length} קבצים נבחרו
          </p>
          {files.map((f) => (
            <div
              key={f.name}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-brand-gray-light"
            >
              {f.name.endsWith(".pdf") ? (
                <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
              ) : (
                <File className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
              <span className="flex-1 text-sm text-brand-black truncate">{f.name}</span>
              <span className="text-xs text-brand-gray">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(f.name); }}
                className="p-1 rounded-lg hover:bg-brand-gray-border text-brand-gray hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {jobCount === 0 ? (
            <div className="flex items-center gap-2 text-orange-600 text-sm mt-2 p-3 bg-orange-50 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>אין משרות במערכת — הוסיפו משרות תחילה כדי לבצע התאמה</span>
            </div>
          ) : (
            <Button
              onClick={onAnalyze}
              className="w-full mt-2 rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
            >
              <ScanSearch className="w-4 h-4" />
              התחל ניתוח מול {jobCount} משרות
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Extraction Progress ──────────────────────────────────────────────────────

function ExtractionProgress({ results }: { results: ExtractionResult[] }) {
  const done = results.filter((r) => r.status === "done" || r.status === "error").length;
  const total = results.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-brand-gray-border p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-brand-black">מחלץ טקסט מהקבצים...</p>
        <span className="text-sm text-brand-gray">{done} / {total}</span>
      </div>
      <div className="h-2 bg-brand-gray-light rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-yellow rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>
      <div className="space-y-2">
        {results.map((r) => (
          <div key={r.file.name} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-brand-gray-light">
            {r.status === "pending" && (
              <div className="w-4 h-4 rounded-full border-2 border-brand-gray-border flex-shrink-0" />
            )}
            {r.status === "extracting" && (
              <Loader2 className="w-4 h-4 text-brand-yellow animate-spin flex-shrink-0" />
            )}
            {r.status === "done" && (
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
            {r.status === "error" && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span className="flex-1 text-sm text-brand-black truncate">{r.file.name}</span>
            {r.status === "error" && (
              <span className="text-xs text-red-500">{r.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Results View ─────────────────────────────────────────────────────────────

function ResultsView({
  results,
  scoreFilter,
  onFilterChange,
}: {
  results: CVMatchResult[];
  scoreFilter: ScoreFilter;
  onFilterChange: (v: ScoreFilter) => void;
}) {
  const filters: { label: string; value: ScoreFilter }[] = [
    { label: "הכל", value: 0 },
    { label: "התאמה גבוהה ≥70%", value: 70 },
    { label: "התאמה בינונית ≥40%", value: 40 },
  ];

  const successful = results.filter((r) => r.jobResults.length > 0);
  const failed = results.filter((r) => r.jobResults.length === 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-brand-gray">הצג:</span>
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              scoreFilter === f.value
                ? "bg-brand-yellow text-brand-black"
                : "bg-white border border-brand-gray-border text-brand-gray hover:bg-brand-gray-light"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-sm text-brand-gray mr-auto">
          {successful.length} קורות חיים נותחו
        </span>
      </div>

      {failed.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
          <p className="text-sm font-semibold text-red-700 mb-2">קבצים שלא ניתן לחלץ מהם טקסט:</p>
          {failed.map((r) => (
            <div key={r.file.name} className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {r.file.name}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {successful.map((result, i) => (
          <motion.div
            key={result.file.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <CVResultCard result={result} scoreFilter={scoreFilter} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── CV Result Card ───────────────────────────────────────────────────────────

function CVResultCard({ result, scoreFilter }: { result: CVMatchResult; scoreFilter: number }) {
  const [expanded, setExpanded] = useState(true);

  const filteredJobs = result.jobResults.filter((r) => r.score >= scoreFilter);
  const topScore = result.jobResults[0]?.score ?? 0;
  const isPdf = result.file.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="bg-white rounded-2xl border border-brand-gray-border overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-6 py-4 text-right hover:bg-brand-gray-light transition-colors"
      >
        {isPdf ? (
          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
        ) : (
          <File className="w-5 h-5 text-blue-500 flex-shrink-0" />
        )}
        <span className="flex-1 font-semibold text-brand-black">{result.file.name}</span>
        <ScoreBadge score={topScore} label="התאמה הטובה ביותר" />
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-brand-gray flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-brand-gray flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-brand-gray-border divide-y divide-brand-gray-border">
          {filteredJobs.length === 0 ? (
            <p className="px-6 py-4 text-sm text-brand-gray text-center">
              אין משרות מעל הסף הנבחר
            </p>
          ) : (
            filteredJobs.map((jobResult) => (
              <div key={jobResult.job.id} className="px-6 py-4 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-semibold text-brand-black truncate">
                      {jobResult.job.title}
                    </span>
                    {jobResult.job.status === "filled" && (
                      <span className="text-xs bg-brand-black text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        נסגרה
                      </span>
                    )}
                  </div>
                  <ScoreBadge score={jobResult.score} />
                </div>

                {jobResult.totalKeywords === 0 ? (
                  <p className="text-xs text-brand-gray">אין דרישות מוגדרות למשרה זו</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {jobResult.matchedKeywords.map((kw, i) => (
                      <KeywordChip key={i} kw={kw} />
                    ))}
                    {jobResult.totalKeywords - jobResult.matchedKeywords.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        +{jobResult.totalKeywords - jobResult.matchedKeywords.length} לא נמצאו
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score, label, small }: { score: number; label?: string; small?: boolean }) {
  const colorClass =
    score >= 70
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 40
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";

  return (
    <span
      className={`font-bold rounded-full border flex-shrink-0 ${colorClass} ${
        small ? "text-xs px-1.5 py-0.5" : "text-sm px-3 py-1"
      }`}
    >
      {label && <span className="font-normal text-xs mr-1">{label}:</span>}
      {score}%
    </span>
  );
}

// ─── Keyword Chip ─────────────────────────────────────────────────────────────

const MATCH_TYPE_STYLE: Record<MatchedKeyword["matchType"], string> = {
  exact: "bg-green-50 text-green-700 border-green-200",
  synonym: "bg-blue-50 text-blue-700 border-blue-200",
  stem: "bg-purple-50 text-purple-700 border-purple-200",
  fuzzy: "bg-orange-50 text-orange-700 border-orange-200",
};

const MATCH_TYPE_LABEL: Record<MatchedKeyword["matchType"], string> = {
  exact: "מדויק",
  synonym: "נרדף",
  stem: "גזרה",
  fuzzy: "דומה",
};

function KeywordChip({ kw }: { kw: MatchedKeyword }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${MATCH_TYPE_STYLE[kw.matchType]}`}
      title={`נמצא: "${kw.cvToken}" — סוג: ${MATCH_TYPE_LABEL[kw.matchType]}`}
    >
      {kw.keyword}
      <span className="opacity-60 text-[10px]">({MATCH_TYPE_LABEL[kw.matchType]})</span>
    </span>
  );
}
