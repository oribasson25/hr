import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.jobAssignment.findMany({
      where: {
        OR: [
          { recruitmentStage: { in: ["interview", "offer", "hired", "rejected"] } },
          { interviewDate: { not: null } },
          { interviewRating: { not: null } },
        ],
      },
      include: {
        candidate: { select: { id: true, fullName: true, phone: true } },
        job: { select: { id: true, title: true, status: true } },
      },
      orderBy: { interviewDate: "desc" },
    });

    const now = new Date();
    const upcoming = assignments.filter(
      (a) => a.interviewDate && new Date(a.interviewDate) >= now
    );
    const past = assignments.filter(
      (a) => !a.interviewDate || new Date(a.interviewDate) < now
    );

    // Upcoming interview reminders (title contains "ראיון", not done, has due date)
    const reminders = await prisma.reminder.findMany({
      where: {
        isDone: false,
        dueDate: { gte: now },
        title: { contains: "ראיון" },
      },
      include: {
        candidate: { select: { id: true, fullName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    return NextResponse.json({ upcoming, past, reminders });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת ראיונות" }, { status: 500 });
  }
}
