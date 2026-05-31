import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(9).optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  address: z.string().nullable().optional(),
  appliedForCustom: z.string().nullable().optional(),
  source: z.enum(["referral", "linkedin", "facebook", "job_board"]).nullable().optional(),
  referredById: z.string().nullable().optional(),
  salaryExpectation: z.string().nullable().optional(),
  hrStaffId: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        hrStaff: true,
        referredBy: { select: { id: true, fullName: true } },
        assignments: {
          include: { job: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!candidate) return NextResponse.json({ error: "מועמד לא נמצא" }, { status: 404 });
    return NextResponse.json(candidate);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת מועמד" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.appliedForCustom !== undefined && { appliedForCustom: data.appliedForCustom }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.referredById !== undefined && { referredById: data.referredById }),
        ...(data.salaryExpectation !== undefined && { salaryExpectation: data.salaryExpectation }),
        ...(data.hrStaffId !== undefined && { hrStaffId: data.hrStaffId }),
      },
    });
    return NextResponse.json(candidate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בעדכון מועמד" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.candidate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה במחיקת מועמד" }, { status: 500 });
  }
}
