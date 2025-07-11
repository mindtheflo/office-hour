"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { TimezoneSelector } from "@/components/timezone-selector"
import { format, toZonedTime, fromZonedTime } from "date-fns-tz"

interface OfficeHourConfig {
  defaultZoomLink: string
  weeklySchedule: Record<string, { enabled: boolean; time: string }>
}

interface DateOverride {
  date: string
  time?: string
  isAvailable: boolean
  calendarAdditions?: number
}

export default function AdminDashboard() {
  const { toast } = useToast()

  /* ──────────────────────────────────
     • STATE
  ────────────────────────────────── */
  const [config, setConfig] = useState<OfficeHourConfig>({
    defaultZoomLink: "",
    weeklySchedule: {},
  })
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dateOverrides, setDateOverrides] = useState<Record<string, DateOverride>>({})
  const [calendarStats, setCalendarStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [timezone, setTimezone] = useState<string>(() => {
    // Try to get from localStorage first, otherwise use browser timezone
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    }
    return 'UTC'
  })
  
  // Modal state for unsaved changes
  const [modalOverride, setModalOverride] = useState<{
    isAvailable: boolean
    time: string
  }>({
    isAvailable: true,
    time: ""
  })
  const [modalSaving, setModalSaving] = useState(false)

  /* ──────────────────────────────────
     • TIMEZONE HELPERS
  ────────────────────────────────── */
  // Convert UTC time string (HH:mm:ss) to local time string (HH:mm)
  const utcTimeToLocal = (utcTime: string): string => {
    if (!utcTime || !timezone) return utcTime?.slice(0, 5) || "15:00"
    
    try {
      // Create a date object for today with the UTC time
      const today = new Date()
      const [hours, minutes] = utcTime.split(':').map(Number)
      const utcDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes))
      
      // Convert to the selected timezone
      const zonedDate = toZonedTime(utcDate, timezone)
      
      // Format as HH:mm
      return format(zonedDate, 'HH:mm', { timeZone: timezone })
    } catch (error) {
      console.error('Error converting UTC to local time:', error)
      return utcTime?.slice(0, 5) || "15:00"
    }
  }

  // Convert local time string (HH:mm) to UTC time string (HH:mm:ss)
  const localTimeToUtc = (localTime: string): string => {
    if (!localTime || !timezone) return `${localTime}:00`
    
    try {
      // Create a date object for today with the local time
      const today = new Date()
      const [hours, minutes] = localTime.split(':').map(Number)
      const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes)
      
      // Convert from the selected timezone to UTC
      const utcDate = fromZonedTime(localDate, timezone)
      
      // Format as HH:mm:ss
      return format(utcDate, 'HH:mm:ss', { timeZone: 'UTC' })
    } catch (error) {
      console.error('Error converting local to UTC time:', error)
      return `${localTime}:00`
    }
  }

  /* ──────────────────────────────────
     • CONSTANTS
  ────────────────────────────────── */
  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday"]
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`

  /* ──────────────────────────────────
     • EFFECTS
  ────────────────────────────────── */
  // Save timezone preference to localStorage
  useEffect(() => {
    if (timezone) {
      localStorage.setItem('adminTimezone', timezone)
    }
  }, [timezone])

  useEffect(() => {
    fetchConfig()
    fetchDateOverrides()
    fetchCalendarStats()
  }, [currentDate, timezone])

  /* ──────────────────────────────────
     • DATA FETCHING
  ────────────────────────────────── */
  const fetchConfig = async () => {
    try {
      console.log('Fetching config...')
      const { data: configData, error: configError } = await supabase.from("office_hours_config").select("*").single()

      if (configError) {
        console.error('Config fetch error:', configError)
        throw configError
      }

      const { data: weeklyData, error: weeklyError } = await supabase.from("weekly_schedule").select("*").order("day_of_week")

      if (weeklyError) {
        console.error('Weekly schedule fetch error:', weeklyError)
        throw weeklyError
      }

      if (configData && weeklyData) {
        const weeklySchedule: Record<string, any> = {}
        const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

        weeklyData.forEach((day) => {
          const dayName = dayNames[day.day_of_week - 1]
          weeklySchedule[dayName] = {
            enabled: day.enabled,
            time: utcTimeToLocal(day.custom_time),
          }
        })

        setConfig({
          defaultZoomLink: configData.default_zoom_link,
          weeklySchedule,
        })
      }
    } catch (error) {
      console.error("Failed to fetch config:", error)
      toast({
        variant: "destructive",
        title: "Error loading configuration",
        description: "Please check your database connection and try refreshing the page.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDateOverrides = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    try {
      const { data } = await supabase
        .from("office_hours_overrides")
        .select("date, time, is_available")
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0])

      const overrides: Record<string, DateOverride> = {}
      data?.forEach((override) => {
        overrides[override.date] = {
          date: override.date,
          time: override.time ? utcTimeToLocal(override.time) : undefined,
          isAvailable: override.is_available,
        }
      })

      setDateOverrides(overrides)
    } catch (error) {
      console.error("Failed to fetch date overrides:", error)
    }
  }

  const fetchCalendarStats = async () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    try {
      const { data } = await supabase
        .from("calendar_additions")
        .select("date")
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0])

      const stats: Record<string, number> = {}
      data?.forEach((addition) => {
        stats[addition.date] = (stats[addition.date] || 0) + 1
      })

      setCalendarStats(stats)
    } catch (error) {
      console.error("Failed to fetch calendar stats:", error)
    }
  }

  /* ──────────────────────────────────
     • SAVE / DELETE HELPERS
  ────────────────────────────────── */
  const saveConfig = async () => {
    setSaving(true)
    try {
      await supabase
        .from("office_hours_config")
        .update({
          default_zoom_link: config.defaultZoomLink,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)

      const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

      for (let i = 0; i < dayNames.length; i++) {
        const dayName = dayNames[i]
        const dayConfig = config.weeklySchedule[dayName]
        if (dayConfig) {
          await supabase
            .from("weekly_schedule")
            .update({
              enabled: dayConfig.enabled,
              custom_time: dayConfig.time ? localTimeToUtc(dayConfig.time) : "15:00:00",
              updated_at: new Date().toISOString(),
            })
            .eq("day_of_week", i + 1)
        }
      }

      toast({
        title: "Configuration Saved",
        description: "Your default settings have been updated.",
      })
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save configuration.",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveDateOverride = async (date: string, override: Partial<DateOverride>) => {
    setModalSaving(true)
    try {
      const { error } = await supabase.from("office_hours_overrides").upsert(
        {
          date,
          time: override.time ? localTimeToUtc(override.time) : null,
          is_available: override.isAvailable ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" },
      )

      if (error) throw error

      setDateOverrides((prev) => ({
        ...prev,
        [date]: { ...prev[date], ...override, date },
      }))

      setDialogOpen(false)
      toast({
        title: "Override Saved",
        description: `Changes for ${formatDateForDisplay(date)} have been saved.`,
      })
    } catch (error) {
      console.error("Failed to save date override:", error)
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save date override.",
      })
    } finally {
      setModalSaving(false)
    }
  }

  const deleteDateOverride = async (date: string) => {
    try {
      await supabase.from("office_hours_overrides").delete().eq("date", date)

      setDateOverrides((prev) => {
        const newOverrides = { ...prev }
        delete newOverrides[date]
        return newOverrides
      })

      setDialogOpen(false)
      toast({
        title: "Override Removed",
        description: `The override for ${formatDateForDisplay(date)} has been removed.`,
      })
    } catch (error) {
      console.error("Failed to delete date override:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove date override.",
      })
    }
  }

  /* ──────────────────────────────────
     • CALENDAR UTILITIES
  ────────────────────────────────── */
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: Array<number | null> = []

    let startPadding = firstDayOfMonth.getDay() - 1
    if (startPadding < 0) startPadding = 0
    if (startPadding > 4) startPadding = 0

    for (let i = 0; i < startPadding; i++) days.push(null)

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) days.push(day)
    }

    return days
  }

  const formatDateKey = (day: number) => {
    const year = currentDate.getFullYear()
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0")
    const dayStr = String(day).padStart(2, "0")
    return `${year}-${monthStr}-${dayStr}`
  }

  const formatDateForDisplay = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(direction === "prev" ? prev.getMonth() - 1 : prev.getMonth() + 1)
      return newDate
    })
  }

  /* ──────────────────────────────────
     • RENDER
  ────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="mt-2 text-gray-600">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Office Hours Admin Dashboard</h1>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Calendar */}
          <div className="lg:order-1">
            <div className="bg-white rounded-lg shadow p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Calendar Overrides</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    ←
                  </button>
                  <span className="font-medium">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </span>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-5 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
                  <div key={day} className="text-center font-medium text-gray-600 p-2">
                    {day}
                  </div>
                ))}
                
                {getDaysInMonth().map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="p-2" />
                  }
                  
                  const dateKey = formatDateKey(day)
                  const isToday = dateKey === todayKey
                  const override = dateOverrides[dateKey]
                  const additions = calendarStats[dateKey] || 0
                  
                  return (
                    <button
                      key={dateKey}
                      onClick={() => {
                        setSelectedDate(dateKey)
                        const override = dateOverrides[dateKey]
                        setModalOverride({
                          isAvailable: override?.isAvailable !== false,
                          time: override?.time || ""
                        })
                        setDialogOpen(true)
                      }}
                      className={`
                        p-2 rounded-md border relative
                        ${isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"}
                        ${override?.isAvailable === false ? "bg-red-50" : ""}
                        ${override?.time ? "bg-yellow-50" : ""}
                        hover:bg-gray-50 transition-colors
                      `}
                    >
                      <div className="text-sm font-medium">{day}</div>
                      {override && (
                        <div className="text-xs mt-1">
                          {override.isAvailable === false ? (
                            <span className="text-red-600">Unavailable</span>
                          ) : override.time ? (
                            <span className="text-yellow-600">{override.time}</span>
                          ) : null}
                        </div>
                      )}
                      {additions > 0 && (
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {additions}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Calendar Legend */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Legend</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-500 rounded"></div>
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-50 rounded"></div>
                    <span>Custom Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-[8px]">5</div>
                    <span>Calendar Additions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Default Settings */}
          <div className="lg:order-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Default Configuration</h2>
              
              <div className="mb-4">
                <TimezoneSelector value={timezone} onChange={setTimezone} />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Zoom Link
                </label>
                <input
                  type="text"
                  value={config.defaultZoomLink}
                  onChange={(e) => setConfig({ ...config, defaultZoomLink: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Weekly Schedule</h3>
                {timezone && (
                  <p className="text-xs text-gray-500 mb-3">
                    All times are displayed in {timezone.replace(/_/g, ' ')} timezone
                  </p>
                )}
                <div className="space-y-3">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={day}
                        checked={config.weeklySchedule[day]?.enabled || false}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            weeklySchedule: {
                              ...config.weeklySchedule,
                              [day]: {
                                ...config.weeklySchedule[day],
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={day} className="capitalize flex-1 text-sm">
                        {day}
                      </label>
                      <input
                        type="time"
                        value={config.weeklySchedule[day]?.time || utcTimeToLocal("15:00:00")}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            weeklySchedule: {
                              ...config.weeklySchedule,
                              [day]: {
                                ...config.weeklySchedule[day],
                                time: e.target.value,
                              },
                            },
                          })
                        }
                        disabled={!config.weeklySchedule[day]?.enabled}
                        className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={saveConfig}
                disabled={saving}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Default Configuration"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date Override Dialog */}
      {dialogOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Edit Date: {formatDateForDisplay(selectedDate)}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={modalOverride.isAvailable}
                    onChange={(e) => {
                      setModalOverride({
                        ...modalOverride,
                        isAvailable: e.target.checked,
                        time: e.target.checked ? modalOverride.time : ""
                      })
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Available for office hours</span>
                </label>
              </div>
              
              {modalOverride.isAvailable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Time (leave empty for default)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Time in {timezone.replace(/_/g, ' ')} timezone
                  </p>
                  <input
                    type="time"
                    value={modalOverride.time}
                    onChange={(e) => {
                      setModalOverride({
                        ...modalOverride,
                        time: e.target.value
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => deleteDateOverride(selectedDate)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Remove Override
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDialogOpen(false)
                      // Reset modal state to prevent stale data
                      setModalOverride({ isAvailable: true, time: "" })
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveDateOverride(selectedDate, {
                      isAvailable: modalOverride.isAvailable,
                      time: modalOverride.time
                    })}
                    disabled={modalSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {modalSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
