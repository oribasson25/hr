import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { cuid } from "@/lib/cuid";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const cvFile = formData.get("cv") as File | null;

    if (!cvFile || cvFile.size === 0) {
      return NextResponse.json({ error: "לא סופק קובץ" }, { status: 400 });
    }

    const ext = cvFile.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext || "")) {
      return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
    }
    if (cvFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 10MB)" }, { status: 400 });
    }

    const uniqueName = `cvs/${cuid()}.${ext}`;
    const blob = await put(uniqueName, cvFile, { access: "private" });

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        cvFileName: cvFile.name,
        cvFilePath: `/api/cv-file?url=${encodeURIComponent(blob.url)}`,
        cvFileType: ext,
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("CV upload error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
