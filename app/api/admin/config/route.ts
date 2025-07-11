import { type NextRequest, NextResponse } from "next/server"

// In a real application, you would store this in a database
// For this demo, we'll use a simple in-memory store
let officeHourConfig = {
  defaultTime: "15:00",
  defaultZoomLink: "https://zoom.us/j/example",
  weeklySchedule: {
    monday: { enabled: true },
    tuesday: { enabled: true },
    wednesday: { enabled: true },
    thursday: { enabled: true },
    friday: { enabled: true },
  },
}

function isAuthenticated(request: NextRequest) {
  // Skip authentication in development mode or v0 preview
  const isDevMode = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_V0_PREVIEW_MODE === "true"

  if (isDevMode) {
    return true
  }

  const authCookie = request.cookies.get("admin-auth")
  return authCookie?.value === "authenticated"
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(officeHourConfig)
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const newConfig = await request.json()
    officeHourConfig = { ...officeHourConfig, ...newConfig }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
