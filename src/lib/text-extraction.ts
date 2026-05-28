export type ExtractionStatus = "pending" | "extracting" | "done" | "error";

export interface ExtractionResult {
  file: File;
  text: string;
  status: ExtractionStatus;
  error?: string;
}

let workerConfigured = false;

function detectFileType(file: File): "pdf" | "docx" | "unknown" {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return "docx";
  return "unknown";
}

async function extractPdfText(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  if (!workerConfigured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is (typeof content.items)[0] & { str: string } => "str" in item)
      .map((item) => (item as { str: string }).str)
      .join(" ");
    texts.push(pageText);
    onProgress?.(i / pdf.numPages);
  }

  return texts.join("\n");
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractFileText(
  file: File,
  onProgress?: (ratio: number) => void
): Promise<ExtractionResult> {
  const type = detectFileType(file);
  if (type === "unknown") {
    return { file, text: "", status: "error", error: "סוג קובץ לא נתמך" };
  }

  try {
    const text =
      type === "pdf"
        ? await extractPdfText(file, onProgress)
        : await extractDocxText(file);

    if (!text.trim()) {
      return {
        file,
        text: "",
        status: "error",
        error: "לא ניתן לחלץ טקסט מקובץ זה (ייתכן שמדובר בסריקה)",
      };
    }

    return { file, text, status: "done" };
  } catch {
    return { file, text: "", status: "error", error: "שגיאה בקריאת הקובץ" };
  }
}

export async function extractAllFiles(
  files: File[],
  onUpdate: (results: ExtractionResult[]) => void
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = files.map((file) => ({
    file,
    text: "",
    status: "pending" as ExtractionStatus,
  }));

  for (let i = 0; i < files.length; i++) {
    results[i] = { ...results[i], status: "extracting" };
    onUpdate([...results]);

    const result = await extractFileText(files[i], (ratio) => {
      results[i] = { ...results[i], status: "extracting" };
      onUpdate([...results]);
      void ratio;
    });

    results[i] = result;
    onUpdate([...results]);
  }

  return results;
}
