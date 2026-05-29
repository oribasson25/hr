import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["leading", "candidate", "not_relevant", "future"]).optional(),
  position: z.number().int().optional(),
  recruitmentStage: z.enum(["cv_received", "interview", "offer", "hired", "rejected"]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  interviewDate: z.string().datetime().nullable().optional(),
  interviewSummary: z.string().nullable().optional(),
  interviewRating: z.number().int().min(1).max(10).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const assignment = await prisma.jobAssignment.update({ where: { id }, data });
    return NextResponse.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בעדכון שיוך" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.jobAssignment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה במחיקת שיוך" }, { status: 500 });
  }
}
