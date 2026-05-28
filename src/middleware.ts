import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, computeToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const expected = await computeToken();
  if (sessionCookie !== expected) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
