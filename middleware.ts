import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Protect admin dashboard routes
  if (request.nextUrl.pathname.startsWith("/admin/dashboard")) {
    const authCookie = request.cookies.get("admin-auth")

    if (!authCookie || authCookie.value !== "authenticated") {
      // If no valid auth cookie, redirect to the admin login page
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/admin/dashboard/:path*",
}
