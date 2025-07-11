import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()

    const { data: config } = await supabase.from("office_hours_config").select("default_zoom_link").single()
    const { data: weeklySchedule } = await supabase
      .from("weekly_schedule")
      .select("day_of_week, enabled, custom_time")
      .order("day_of_week")

    if (!config || !weeklySchedule) {
      return NextResponse.json(null)
    }

    const now = new Date()

    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() + i)
      const dateKey = checkDate.toISOString().split("T")[0]

      const { data: override } = await supabase
        .from("office_hours_overrides")
        .select("is_available, time")
        .eq("date", dateKey)
        .single()

      if (override && !override.is_available) {
        continue
      }

      const dayOfWeek = checkDate.getDay()
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
      const weeklyConfig = weeklySchedule.find((w) => w.day_of_week === adjustedDayOfWeek)

      if (!weeklyConfig?.enabled && !override) {
        continue
      }

      if (override === null && !weeklyConfig?.enabled) {
        continue
      }

      // Time precedence: Daily override > Weekly schedule
      const officeHourTime = override?.time || weeklyConfig.custom_time

      const [hours, minutes] = officeHourTime.split(":")
      const officeHourDate = new Date(checkDate)
      officeHourDate.setHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

      const cetOffset = 1 * 60 * 60 * 1000
      const cetDate = new Date(officeHourDate.getTime() + cetOffset)

      if (cetDate > now) {
        return NextResponse.json({
          id: `${dateKey}-${officeHourTime}`,
          date: dateKey,
          time: officeHourTime.slice(0, 5),
          zoomLink: config.default_zoom_link,
          enabled: true,
        })
      }
    }

    return NextResponse.json(null)
  } catch (error) {
    console.error("Error fetching next office hour:", error)
    return NextResponse.json({ error: "Failed to fetch next office hour" }, { status: 500 })
  }
}
