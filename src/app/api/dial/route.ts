import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const extension = searchParams.get("extension");

  if (!phone || !extension) {
    return NextResponse.json({ error: "חסרים פרמטרים" }, { status: 400 });
  }

  const url = `https://bylibra-ace.libra-ins.co.il:5260/LibraWS/Services.asmx/Click2dialByExt?PhoneNumber=${encodeURIComponent(phone)}&Extention=${encodeURIComponent(extension)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return NextResponse.json({ success: true, response: text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
