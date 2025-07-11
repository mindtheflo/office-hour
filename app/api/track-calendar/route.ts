import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json()
    const supabase = createServerClient()

    // Get user info for tracking
    const userIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Insert calendar addition record
    const { error } = await supabase.from("calendar_additions").insert({
      date,
      user_ip: userIP,
      user_agent: userAgent,
    })

    if (error) {
      console.error("Error tracking calendar addition:", error)
      return NextResponse.json({ error: "Failed to track calendar addition" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in track-calendar API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
