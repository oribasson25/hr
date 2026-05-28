import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().min(1, "תוכן ההערה לא יכול להיות ריק"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { content } = noteSchema.parse(body);
    const note = await prisma.note.create({ data: { candidateId: id, content } });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה ביצירת הערה" }, { status: 500 });
  }
}
