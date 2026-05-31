import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalCandidates,
      totalJobs,
      openJobs,
      filledJobs,
      totalAssignments,
      hirings,
      rejections,
      candidatesWithCV,
      sourceStats,
      hrStaffStats,
      recentActivity,
      monthlyHires,
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: "open" } }),
      prisma.job.count({ where: { status: "filled" } }),
      prisma.jobAssignment.count(),
      prisma.jobAssignment.count({ where: { recruitmentStage: "hired" } }),
      prisma.jobAssignment.count({ where: { recruitmentStage: "rejected" } }),
      prisma.candidate.count({ where: { cvFilePath: { not: null } } }),
      prisma.candidate.groupBy({ by: ["source"], _count: { _all: true }, where: { source: { not: null } } }),
      prisma.hrStaff.findMany({
        include: { _count: { select: { candidates: true } } },
        orderBy: { candidates: { _count: "desc" } },
        take: 5,
      }),
      prisma.jobAssignment.findMany({
        where: { recruitmentStage: { in: ["hired", "interview", "offer"] } },
        include: {
          candidate: { select: { id: true, fullName: true } },
          job: { select: { id: true, title: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR(DATE_TRUNC('month', "updatedAt"), 'MM/YY') as month, COUNT(*) as count
        FROM "JobAssignment"
        WHERE "recruitmentStage" = 'hired'
          AND "updatedAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "updatedAt")
        ORDER BY DATE_TRUNC('month', "updatedAt") ASC
      `,
    ]);

    const activeProcesses = await prisma.jobAssignment.count({
      where: { recruitmentStage: { in: ["cv_received", "interview", "offer"] } },
    });

    const stageBreakdown = await prisma.jobAssignment.groupBy({
      by: ["recruitmentStage"],
      _count: { _all: true },
    });

    return NextResponse.json({
      overview: {
        totalCandidates,
        totalJobs,
        openJobs,
        filledJobs,
        totalAssignments,
        hirings,
        rejections,
        activeProcesses,
        candidatesWithCV,
        conversionRate: totalAssignments > 0 ? Math.round((hirings / totalAssignments) * 100) : 0,
      },
      sourceStats: sourceStats.map((s) => ({ source: s.source, count: Number(s._count._all) })),
      stageBreakdown: stageBreakdown.map((s) => ({ stage: s.recruitmentStage, count: Number(s._count._all) })),
      hrStaffStats: hrStaffStats.map((s) => ({ id: s.id, name: s.name, role: s.role, candidateCount: s._count.candidates })),
      recentActivity,
      monthlyHires: monthlyHires.map((r) => ({ month: r.month, count: Number(r.count) })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת נתוני דשבורד" }, { status: 500 });
  }
}
