import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { redirectPathForRole } from "@/lib/auth-redirect";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/plants",
  "/scan",
  "/calendar",
  "/settings",
  "/admin",
  "/expert",
  "/catalog/add",
  "/consultations",
  "/assistant",
] as const;

const AUTH_PAGES = ["/auth/login", "/auth/register", "/auth"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    if (token && isAuthPage(pathname)) {
      return NextResponse.redirect(
        new URL(redirectPathForRole(token.role as string), req.url)
      );
    }

    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (
      pathname.startsWith("/expert") &&
      token?.role !== "EXPERT" &&
      token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (isAuthPage(pathname)) {
          return true;
        }

        if (isProtectedPath(pathname)) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/plants/:path*",
    "/scan/:path*",
    "/calendar/:path*",
    "/settings",
    "/settings/:path*",
    "/admin/:path*",
    "/expert/:path*",
    "/consultations",
    "/consultations/:path*",
    "/assistant",
    "/assistant/:path*",
    "/catalog/add",
    "/catalog/add/:path*",
    "/auth/login",
    "/auth/register",
    "/auth",
  ],
};
