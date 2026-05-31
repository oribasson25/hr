import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { put } from "@vercel/blob";
import { cuid } from "@/lib/cuid";

const candidateSchema = z.object({
  fullName: z.string().min(1, "נדרש שם מלא"),
  phone: z.string().min(9, "מספר טלפון לא תקין"),
  email: z.string().email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
  address: z.string().optional(),
  appliedForJobId: z.string().optional(),
  appliedForCustom: z.string().optional(),
  source: z.enum(["referral", "linkedin", "facebook", "job_board"]).optional(),
  referredById: z.string().optional(),
  salaryExpectation: z.string().optional(),
  hrStaffId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const hasCv = searchParams.get("hasCv");
    const statusFilter = searchParams.get("status");
    const assigned = searchParams.get("assigned");
    const jobId = searchParams.get("jobId");
    const kanbanStatus = searchParams.get("kanbanStatus");
    const hrStaffId = searchParams.get("hrStaffId");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (hasCv === "true") where.cvFilePath = { not: null };
    if (hasCv === "false") where.cvFilePath = null;
    if (hrStaffId) where.hrStaffId = hrStaffId;

    if (jobId) {
      where.assignments = { some: { jobId } };
    } else if (kanbanStatus) {
      where.assignments = { some: { status: kanbanStatus } };
    } else if (assigned === "true") {
      where.assignments = { some: {} };
    } else if (assigned === "false") {
      where.assignments = { none: {} };
    }

    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          include: { job: { select: { id: true, title: true, status: true } } },
          where: statusFilter ? { status: statusFilter } : undefined,
        },
        hrStaff: { select: { id: true, name: true } },
        _count: { select: { assignments: true } },
      },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת מועמדים" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const fields = {
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      appliedForJobId: (formData.get("appliedForJobId") as string) || undefined,
      appliedForCustom: (formData.get("appliedForCustom") as string) || undefined,
      source: (formData.get("source") as string) || undefined,
      referredById: (formData.get("referredById") as string) || undefined,
      salaryExpectation: (formData.get("salaryExpectation") as string) || undefined,
      hrStaffId: (formData.get("hrStaffId") as string) || undefined,
    };

    const data = candidateSchema.parse(fields);

    const existingByPhone = await prisma.candidate.findFirst({ where: { phone: data.phone } });
    if (existingByPhone) {
      return NextResponse.json(
        { error: `מועמד עם מספר טלפון זה כבר קיים במערכת (${existingByPhone.fullName})` },
        { status: 409 }
      );
    }

    const cvFile = formData.get("cv") as File | null;
    let cvFileName: string | undefined;
    let cvFilePath: string | undefined;
    let cvFileType: string | undefined;

    if (cvFile && cvFile.size > 0) {
      const ext = cvFile.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "docx"].includes(ext || "")) {
        return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
      }
      if (cvFile.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "הקובץ גדול מדי (מקסימום 10MB)" }, { status: 400 });
      }

      const uniqueName = `cvs/${cuid()}.${ext}`;
      const blob = await put(uniqueName, cvFile, { access: "private" });

      cvFileName = cvFile.name;
      cvFilePath = `/api/cv-file?url=${encodeURIComponent(blob.url)}`;
      cvFileType = ext;
    }

    const candidate = await prisma.candidate.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        appliedForCustom: data.appliedForCustom || null,
        source: data.source || null,
        referredById: data.referredById || null,
        salaryExpectation: data.salaryExpectation || null,
        hrStaffId: data.hrStaffId || null,
        cvFileName: cvFileName || null,
        cvFilePath: cvFilePath || null,
        cvFileType: cvFileType || null,
      },
    });

    if (data.appliedForJobId) {
      const jobExists = await prisma.job.findUnique({ where: { id: data.appliedForJobId } });
      if (jobExists) {
        await prisma.jobAssignment.create({
          data: { jobId: data.appliedForJobId, candidateId: candidate.id, status: "candidate" },
        });
      }
    }

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Create candidate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
