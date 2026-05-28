import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cuid } from "@/lib/cuid";

const createSchema = z.object({
  title: z.string().min(1, "נדרש כותרת"),
  dueDate: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
  candidateId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDone = searchParams.get("isDone");
    const jobId = searchParams.get("jobId");
    const candidateId = searchParams.get("candidateId");

    const where: Record<string, unknown> = {};
    if (isDone === "true") where.isDone = true;
    if (isDone === "false") where.isDone = false;
    if (jobId) where.jobId = jobId;
    if (candidateId) where.candidateId = candidateId;

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: [{ isDone: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת תזכורות" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const reminder = await prisma.reminder.create({
      data: {
        id: cuid(),
        title: data.title,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        jobId: data.jobId || null,
        candidateId: data.candidateId || null,
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Create reminder error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
