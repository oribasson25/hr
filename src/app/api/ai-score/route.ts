import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const { cvText, requirements, jobTitle } = await req.json();

  if (!cvText || !requirements || !jobTitle) {
    return NextResponse.json({ error: "נתונים חסרים" }, { status: 400 });
  }

  const setting = await prisma.setting.findUnique({ where: { key: "ANTHROPIC_API_KEY" } });
  const apiKey = setting?.value;

  if (!apiKey) {
    return NextResponse.json({ error: "מפתח API לא מוגדר" }, { status: 503 });
  }

  const client = new Anthropic({ apiKey });

  const prompt = `אתה מומחה משאבי אנוש. הערך את ההתאמה של קורות החיים הבאים למשרה.

משרה: ${jobTitle}

דרישות המשרה:
${requirements}

קורות חיים:
${cvText.slice(0, 4000)}

החזר תשובה בפורמט JSON בלבד (ללא markdown, ללא קוד בלוק):
{
  "score": <מספר בין 0 ל-100>,
  "reasoning": "<משפט קצר אחד בעברית המסביר את הניקוד>"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.trim());

    return NextResponse.json({
      score: Math.min(100, Math.max(0, Math.round(parsed.score))),
      reasoning: parsed.reasoning ?? "",
    });
  } catch (err) {
    console.error("AI score error:", err);
    return NextResponse.json({ error: "שגיאה בניתוח AI" }, { status: 500 });
  }
}
