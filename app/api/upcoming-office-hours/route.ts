import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Get current date in UTC
    const now = new Date()
    const currentDate = new Date(now)
    
    // Calculate date range for the next 30 days
    const startDate = new Date(currentDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(currentDate)
    endDate.setDate(currentDate.getDate() + 30)
    
    const startDateString = startDate.toISOString().split("T")[0]
    const endDateString = endDate.toISOString().split("T")[0]

    // Fetch all data in parallel
    const [overridesResult, weeklyScheduleResult, configResult] = await Promise.all([
      // Get all overrides for the next 30 days
      supabase
        .from("office_hours_overrides")
        .select("*")
        .gte("date", startDateString)
        .lte("date", endDateString),
      
      // Get all enabled weekly schedules
      supabase
        .from("weekly_schedule")
        .select("*")
        .eq("enabled", true),
      
      // Get default zoom link
      supabase
        .from("office_hours_config")
        .select("default_zoom_link")
        .single()
    ])

    if (overridesResult.error) throw overridesResult.error
    if (weeklyScheduleResult.error) throw weeklyScheduleResult.error

    const overrides = overridesResult.data || []
    const weeklySchedules = weeklyScheduleResult.data || []
    const config = configResult.data

    // Create a map of overrides by date for O(1) lookup
    const overrideMap = new Map(
      overrides.map(override => [override.date, override])
    )

    // Create a map of weekly schedules by day of week
    const weeklyScheduleMap = new Map(
      weeklySchedules.map(schedule => [schedule.day_of_week, schedule])
    )

    // Generate upcoming office hours
    const allOfficeHours = []
    const maxDays = 30

    for (let i = 0; i < maxDays; i++) {
      const checkDate = new Date(currentDate)
      checkDate.setDate(currentDate.getDate() + i)

      const dayOfWeek = checkDate.getDay()
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek
      const dateString = checkDate.toISOString().split("T")[0]

      // Check for date-specific override first
      const override = overrideMap.get(dateString)

      if (override) {
        if (override.is_available && override.time) {
          allOfficeHours.push({
            date: dateString,
            time: override.time, // Keep full UTC time string
            isOverride: true,
          })
        }
        continue
      }

      // Check weekly schedule
      const weeklySchedule = weeklyScheduleMap.get(adjustedDayOfWeek)

      if (weeklySchedule) {
        // Check if this time hasn't passed today
        if (i === 0) {
          const officeHourTime = new Date(checkDate)
          const [hours, minutes] = weeklySchedule.custom_time.split(":")
          officeHourTime.setUTCHours(Number.parseInt(hours), Number.parseInt(minutes), 0, 0)

          if (officeHourTime <= now) {
            continue // Skip if time has passed today
          }
        }

        allOfficeHours.push({
          date: dateString,
          time: weeklySchedule.custom_time, // Keep full UTC time string
          isOverride: false,
        })
      }
    }

    // Apply offset and limit
    const upcomingOfficeHours = allOfficeHours.slice(offset, offset + limit)
    const hasMore = offset + limit < allOfficeHours.length

    return NextResponse.json({
      upcomingOfficeHours,
      zoomLink: config?.default_zoom_link || "https://zoom.us/j/example",
      total: allOfficeHours.length,
      hasMore,
      offset,
      limit
    })
  } catch (error) {
    console.error("Error fetching upcoming office hours:", error)
    return NextResponse.json({ error: "Failed to fetch upcoming office hours" }, { status: 500 })
  }
}

// Add cache control for better performance
export const revalidate = 300 // Revalidate every 5 minutes
