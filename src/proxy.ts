import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role

    // Admin-only paths
    const adminOnlyPatterns = [
      /^\/professors\/new/,
      /^\/professors\/[^/]+\/edit/,
      /^\/students\/new/,
      /^\/students\/[^/]+\/edit/,
      /^\/courses\/new/,
      /^\/courses\/[^/]+\/edit/,
      /^\/payments\/new/,
      /^\/timetable\/manage/,
    ]

    if (adminOnlyPatterns.some((p) => p.test(pathname)) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Professors cannot access payments module
    if (pathname.startsWith("/payments") && role === "PROFESSOR") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Students cannot access professors or students modules
    if (
      role === "STUDENT" &&
      (pathname.startsWith("/professors") || pathname.startsWith("/students"))
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/professors/:path*",
    "/courses/:path*",
    "/timetable/:path*",
    "/payments/:path*",
    "/students/:path*",
  ],
}
