import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.jobAssignment.findMany({
      include: {
        candidate: { select: { id: true, fullName: true, phone: true, email: true } },
        job: { select: { id: true, title: true, status: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    const stages = {
      cv_received: assignments.filter((a) => a.recruitmentStage === "cv_received"),
      interview: assignments.filter((a) => a.recruitmentStage === "interview"),
      offer: assignments.filter((a) => a.recruitmentStage === "offer"),
      hired: assignments.filter((a) => a.recruitmentStage === "hired"),
      rejected: assignments.filter((a) => a.recruitmentStage === "rejected"),
    };

    const recentHires = assignments
      .filter((a) => a.recruitmentStage === "hired")
      .slice(0, 10);

    return NextResponse.json({ stages, recentHires });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת נתוני גיוס" }, { status: 500 });
  }
}
