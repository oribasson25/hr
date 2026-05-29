import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { cuid } from "@/lib/cuid";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "לא סופק קובץ" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx"].includes(ext || "")) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
  }

  const uniqueName = `matcher/${cuid()}.${ext}`;
  const blob = await put(uniqueName, file, { access: "private" });

  return NextResponse.json({
    filePath: `/api/cv-file?url=${encodeURIComponent(blob.url)}`,
    fileType: ext,
  });
}
