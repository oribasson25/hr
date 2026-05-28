import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignSchema = z.object({
  jobId: z.string().min(1),
  candidateId: z.string().min(1),
  status: z.enum(["leading", "candidate", "not_relevant", "future"]).default("candidate"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = assignSchema.parse(body);

    const existing = await prisma.jobAssignment.findUnique({
      where: { jobId_candidateId: { jobId: data.jobId, candidateId: data.candidateId } },
    });

    if (existing) {
      return NextResponse.json({ error: "המועמד כבר משויך למשרה זו" }, { status: 409 });
    }

    const maxPos = await prisma.jobAssignment.aggregate({
      where: { jobId: data.jobId, status: data.status },
      _max: { position: true },
    });

    const assignment = await prisma.jobAssignment.create({
      data: { ...data, position: (maxPos._max.position ?? -1) + 1 },
      include: { candidate: true, job: true },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בשיוך מועמד" }, { status: 500 });
  }
}
