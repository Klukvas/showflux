import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function isAuthRoute(pathname: string): boolean {
  return authRoutes.includes(pathname) || pathname.startsWith("/invite/");
}

function isOpenRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname === "/features" ||
    pathname.startsWith("/features/") ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  // Landing page and blog are accessible to everyone
  if (isOpenRoute(pathname)) {
    return NextResponse.next();
  }

  // Auth routes redirect to dashboard if already logged in
  if (isAuthRoute(pathname)) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
