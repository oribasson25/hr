"use client";

import { useState, useEffect } from "react";
import { X, Download, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadCV } from "@/lib/api/candidates";
import { toast } from "sonner";
import type { Candidate } from "@/types/api";
import dynamic from "next/dynamic";

const PDFViewer = dynamic(() => import("./PDFViewer"), { ssr: false });
const DocxViewer = dynamic(() => import("./DocxViewer"), { ssr: false });

interface Props {
  candidate: Candidate;
  open: boolean;
  onClose: () => void;
}

export default function CVPreview({ candidate, open, onClose }: Props) {
  const uploadCV = useUploadCV(candidate.id);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("cv", file);
    try {
      await uploadCV.mutateAsync(fd);
      toast.success("הקובץ הועלה בהצלחה");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה בהעלאת הקובץ";
      toast.error(msg);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-[60vw] max-w-3xl bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-brand-black text-lg">{candidate.fullName}</h2>
            <p className="text-sm text-brand-gray">{candidate.phone}</p>
            {candidate.cvFileName && (
              <p className="text-sm text-brand-gray">{candidate.cvFileName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {candidate.cvFilePath && (
              <>
                <a
                  href={candidate.cvFilePath}
                  download={candidate.cvFileName || "cv"}
                  className="p-2 rounded-xl hover:bg-brand-gray-light transition-colors text-brand-gray hover:text-brand-black"
                  aria-label="הורדה"
                >
                  <Download className="w-5 h-5" />
                </a>
                <a
                  href={candidate.cvFilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl hover:bg-brand-gray-light transition-colors text-brand-gray hover:text-brand-black"
                  aria-label="פתח בטאב חדש"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-brand-gray-light transition-colors text-brand-gray hover:text-brand-black"
              aria-label="סגור"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {!candidate.cvFilePath ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <div className="w-16 h-16 bg-brand-gray-light rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-brand-gray" />
              </div>
              <h3 className="text-lg font-semibold text-brand-black">טרם הועלה קובץ קורות חיים</h3>
              <p className="text-brand-gray text-sm">העלי קובץ PDF או DOCX</p>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} className="hidden" />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-yellow text-brand-black font-semibold hover:bg-brand-yellow-hover transition-colors">
                  <Upload className="w-4 h-4" />
                  העלאת קובץ
                </span>
              </label>
            </div>
          ) : candidate.cvFileType === "pdf" ? (
            <PDFViewer filePath={candidate.cvFilePath} />
          ) : (
            <DocxViewer filePath={candidate.cvFilePath} />
          )}
        </div>
      </div>
    </div>
  );
}
