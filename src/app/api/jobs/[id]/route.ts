import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  requirements: z.string().min(1).optional(),
  status: z.enum(["open", "filled"]).optional(),
  filledAt: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { candidate: true },
          orderBy: { position: "asc" },
        },
      },
    });
    if (!job) return NextResponse.json({ error: "משרה לא נמצאה" }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת משרה" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === "filled" && !data.filledAt) {
      updateData.filledAt = new Date();
    }
    if (data.status === "open") {
      updateData.filledAt = null;
    }

    const job = await prisma.job.update({ where: { id }, data: updateData });
    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בעדכון משרה" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה במחיקת משרה" }, { status: 500 });
  }
}
