import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Basic authentication check (replace with your actual authentication logic)
    if (username === "admin" && password === "password") {
      const response = NextResponse.json({ success: true })

      // Set the auth cookie with proper settings
      response.cookies.set("admin-auth", "authenticated", {
        httpOnly: true,
        secure: process.env.VERCEL_ENV === "production", // Use VERCEL_ENV for consistency
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      })

      return response
    } else {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
