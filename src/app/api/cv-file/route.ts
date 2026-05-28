import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");
  if (!blobUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const result = await get(blobUrl, { access: "private" });
  if (!result) return NextResponse.json({ error: "קובץ לא נמצא" }, { status: 404 });

  return new NextResponse(result.stream as ReadableStream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
