import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get("url");
  if (!blobUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("cv-file: BLOB_READ_WRITE_TOKEN not set");
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(blobUrl, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.error(`cv-file: blob returned ${response.status} for ${blobUrl}`);
      return NextResponse.json({ error: `Storage error ${response.status}` }, { status: 500 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
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
