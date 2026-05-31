import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const hrStaffSchema = z.object({
  name: z.string().min(1, "נדרש שם"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
});

export async function GET() {
  try {
    const staff = await prisma.hrStaff.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { candidates: true } } },
    });
    return NextResponse.json(staff);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת עובדי HR" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = hrStaffSchema.parse(body);
    const staff = await prisma.hrStaff.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        role: data.role || null,
      },
    });
    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "שגיאה ביצירת עובד HR" }, { status: 500 });
  }
}
