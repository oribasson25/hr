"use client";

import { useState, useEffect } from "react";
import mammoth from "mammoth";

interface Props {
  filePath: string;
}

export default function DocxViewer({ filePath }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(filePath)
      .then((r) => r.arrayBuffer())
      .then((buffer) => mammoth.convertToHtml({ arrayBuffer: buffer }))
      .then((result) => setHtml(result.value))
      .catch(() => setError(true));
  }, [filePath]);

  if (error) return <div className="text-center text-red-500 py-8">שגיאה בטעינת המסמך</div>;
  if (!html) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex-1 overflow-auto p-8">
      <div
        className="prose prose-sm max-w-none bg-white rounded-xl p-8 shadow-sm"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ fontFamily: "var(--font-heebo), sans-serif" }}
      />
    </div>
  );
}
