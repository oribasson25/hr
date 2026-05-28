import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  isDone: z.boolean().optional(),
  dueDate: z.string().optional().nullable(),
  jobId: z.string().optional().nullable(),
  candidateId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isDone !== undefined && { isDone: data.isDone }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.jobId !== undefined && { jobId: data.jobId || null }),
        ...(data.candidateId !== undefined && { candidateId: data.candidateId || null }),
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(reminder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
