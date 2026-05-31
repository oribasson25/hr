import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");
  if (!blobUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const result = await get(blobUrl, { access: "private" });
    if (!result) return NextResponse.json({ error: "קובץ לא נמצא" }, { status: 404 });

    const contentType = result.blob.contentType || "application/octet-stream";

    return new NextResponse(result.stream as ReadableStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("cv-file error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
