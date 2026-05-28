import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const safeName = path.basename(filename);
    const filePath = path.join(process.cwd(), "public", "uploads", safeName);
    const buffer = await readFile(filePath);

    const ext = safeName.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "pdf" ? "application/pdf" :
      ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" :
      "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "קובץ לא נמצא" }, { status: 404 });
  }
}
