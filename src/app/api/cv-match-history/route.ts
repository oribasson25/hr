import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const records = await prisma.cvMatchHistory.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const { entries } = await req.json();
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "entries required" }, { status: 400 });
  }

  // Resolve cvFilePath for each entry by matching cvFileName in candidates
  const fileNames = entries.map((e: { fileName: string }) => e.fileName);
  const candidates = await prisma.candidate.findMany({
    where: { cvFileName: { in: fileNames } },
    select: { cvFileName: true, cvFilePath: true, cvFileType: true },
  });
  const candidateMap = new Map(candidates.map((c) => [c.cvFileName, c]));

  const enrichedEntries = entries.map((entry: { fileName: string; jobMatches: unknown[] }) => {
    const candidate = candidateMap.get(entry.fileName);
    return {
      ...entry,
      cvFilePath: candidate?.cvFilePath ?? null,
      cvFileType: candidate?.cvFileType ?? null,
    };
  });

  const record = await prisma.cvMatchHistory.create({
    data: { entries: enrichedEntries as object[] },
  });
  return NextResponse.json(record, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.cvMatchHistory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
