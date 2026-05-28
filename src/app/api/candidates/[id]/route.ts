import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(9).optional(),
  email: z.string().email().optional(),
  address: z.string().nullable().optional(),
  appliedForCustom: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
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
    const candidate = await prisma.candidate.update({ where: { id }, data });
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
