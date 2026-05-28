import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reorderSchema = z.object({
  updates: z.array(z.object({
    id: z.string(),
    status: z.enum(["leading", "candidate", "not_relevant", "future"]),
    position: z.number().int(),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates } = reorderSchema.parse(body);

    await prisma.$transaction(
      updates.map((u) =>
        prisma.jobAssignment.update({
          where: { id: u.id },
          data: { status: u.status, position: u.position },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה בעדכון סדר" }, { status: 500 });
  }
}
