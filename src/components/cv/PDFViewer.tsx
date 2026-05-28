"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  filePath: string;
}

export default function PDFViewer({ filePath }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-brand-gray-light border-b border-brand-gray-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
            aria-label="עמוד קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm text-brand-gray font-medium">{page} / {numPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(numPages, p + 1))}
            disabled={page >= numPages}
            className="p-1.5 rounded-lg hover:bg-white disabled:opacity-40 transition-colors"
            aria-label="עמוד הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="p-1.5 rounded-lg hover:bg-white transition-colors"
            aria-label="הקטן"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-brand-gray w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="p-1.5 rounded-lg hover:bg-white transition-colors"
            aria-label="הגדל"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        <Document
          file={filePath}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<div className="animate-pulse bg-white rounded w-full max-w-lg h-96" />}
          error={<div className="text-center text-red-500 py-8">שגיאה בטעינת ה-PDF</div>}
        >
          <Page
            pageNumber={page}
            scale={scale}
            className="shadow-lg"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
    </div>
  );
}
