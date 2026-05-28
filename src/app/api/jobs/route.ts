import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(1, "נדרשת כותרת"),
  description: z.string().min(1, "נדרש תיאור"),
  requirements: z.string().min(1, "נדרשות דרישות"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const where = statusFilter && statusFilter !== "all" ? { status: statusFilter } : {};

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { assignments: true } },
        assignments: { select: { status: true } },
      },
    });

    const jobsWithCounts = jobs.map((job) => {
      const counts = { leading: 0, candidate: 0, not_relevant: 0, future: 0 };
      job.assignments.forEach((a) => {
        if (a.status in counts) counts[a.status as keyof typeof counts]++;
      });
      return { ...job, assignments: undefined, _count: counts };
    });

    return NextResponse.json(jobsWithCounts);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת משרות" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = jobSchema.parse(body);
    const job = await prisma.job.create({ data });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה ביצירת משרה" }, { status: 500 });
  }
}
