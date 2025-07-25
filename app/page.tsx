"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Video, ChevronLeft, ChevronRight } from "lucide-react"
import { TimezoneSelector } from "@/components/timezone-selector"
import { LoadingSkeleton } from "@/components/loading-skeleton"
import { useToast } from "@/hooks/use-toast"

interface OfficeHour {
  date: string
  time: string
  isOverride: boolean
}

interface OfficeHourData {
  upcomingOfficeHours: OfficeHour[]
  zoomLink: string
  total: number
  hasMore: boolean
  offset: number
  limit: number
}

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export default function Home() {
  const [officeHours, setOfficeHours] = useState<OfficeHour[]>([])
  const [zoomLink, setZoomLink] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [timezone, setTimezone] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [countdown, setCountdown] = useState<Countdown | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isInOfficeHourWindow, setIsInOfficeHourWindow] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load just the first office hour initially
    fetchOfficeHours(0, 1, true)
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!officeHours[selectedIndex]) return

    const timer = setInterval(() => {
      const selectedOfficeHour = officeHours[selectedIndex]
      const now = new Date()

      // Parse the UTC time from the database
      const [year, month, day] = selectedOfficeHour.date.split("-").map(Number)
      const [hours, minutes] = selectedOfficeHour.time.split(":").map(Number)

      // Create the office hour date in UTC
      const officeHourDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
      const oneHourAfter = officeHourDate.getTime() + 60 * 60 * 1000

      const diff = officeHourDate.getTime() - now.getTime()
      const nowTime = now.getTime()

      // Check if we're within the office hour window
      const inWindow = (nowTime >= officeHourDate.getTime() && nowTime <= oneHourAfter)
      
      setIsInOfficeHourWindow(inWindow)

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setCountdown({ days, hours, minutes, seconds })
      } else {
        setCountdown(null)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [officeHours, selectedIndex])

  const fetchOfficeHours = async (offset: number, limit: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const response = await fetch(`/api/upcoming-office-hours?offset=${offset}&limit=${limit}`)
      const data: OfficeHourData = await response.json()
      
      if (isInitial) {
        setOfficeHours(data.upcomingOfficeHours)
        setZoomLink(data.zoomLink)
        
        // Try to load from cache for better UX
        const cachedData = localStorage.getItem('officeHourData')
        if (cachedData) {
          try {
            const cached = JSON.parse(cachedData)
            if (cached.upcomingOfficeHours && cached.upcomingOfficeHours.length > 1) {
              setOfficeHours(cached.upcomingOfficeHours)
            }
          } catch (e) {
            // Ignore cache errors
          }
        }
      } else {
        // Append new office hours
        setOfficeHours((prev: OfficeHour[]) => [...prev, ...data.upcomingOfficeHours])
      }
      
      setHasMore(data.hasMore)
      
      // Cache the data
      const cacheData = {
        upcomingOfficeHours: isInitial ? data.upcomingOfficeHours : officeHours.concat(data.upcomingOfficeHours),
        zoomLink: data.zoomLink
      }
      localStorage.setItem('officeHourData', JSON.stringify(cacheData))
      
    } catch (error) {
      console.error("Failed to fetch office hours:", error)
      toast({
        title: "Connection Error",
        description: "Failed to load office hours. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const selectedOfficeHour = officeHours[selectedIndex]

  const formatDate = (dateString: string, targetTimezone: string) => {
    const [year, month, day] = dateString.split("-").map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: targetTimezone,
    })
  }

  const formatTime = (timeString: string, dateString: string, targetTimezone: string) => {
    if (!timeString || !dateString) return ""

    const [year, month, day] = dateString.split("-").map(Number)
    const [hours, minutes] = timeString.split(":").map(Number)
    
    // Create date in UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
    
    // Format in target timezone
    return utcDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: targetTimezone,
      timeZoneName: "short",
    })
  }



  const generateCalendarEvent = () => {
    if (!selectedOfficeHour) return ""

    const [year, month, day] = selectedOfficeHour.date.split("-").map(Number)
    const [hours, minutes] = selectedOfficeHour.time.split(":").map(Number)

    // Create the office hour date in UTC
    const officeHourDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
    const endDate = new Date(officeHourDate.getTime() + 60 * 60 * 1000)

    const formatDateForCalendar = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    }

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "Office Hours with Flo",
      dates: `${formatDateForCalendar(officeHourDate)}/${formatDateForCalendar(endDate)}`,
      details: `Join the office hours session.\n\ Link: ${zoomLink}`,
      location: zoomLink || "",
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const trackCalendarAddition = async () => {
    if (!selectedOfficeHour) return

    try {
      await fetch("/api/track-calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedOfficeHour.date,
        }),
      })
    } catch (error) {
      console.error("Failed to track calendar addition:", error)
    }
  }

  const handleAddToCalendar = () => {
    trackCalendarAddition()
    window.open(generateCalendarEvent(), "_blank")
  }

  const handleJoinZoom = () => {
    if (zoomLink) {
      window.open(zoomLink, "_blank")
    }
  }

  const navigateOfficeHour = async (direction: "prev" | "next") => {
    if (direction === "prev" && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    } else if (direction === "next") {
      if (selectedIndex < officeHours.length - 1) {
        setSelectedIndex(selectedIndex + 1)
      } else if (hasMore && !loadingMore) {
        // Load more office hours
        await fetchOfficeHours(officeHours.length, 3, false)
        // Move to the next item after loading
        setSelectedIndex(selectedIndex + 1)
      }
    }
  }

  const getOfficeHourLabel = () => {
    if (selectedIndex === 0) return "Next office hour"
    const ordinals = ["", "", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]
    return `${ordinals[selectedIndex + 1] || `${selectedIndex + 1}th`} upcoming office hour`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <LoadingSkeleton />
      </div>
    )
  }

  if (!officeHours || officeHours.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Office Hours</CardTitle>
            <CardDescription>No upcoming office hours scheduled</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">Check back later for upcoming sessions.</p>
          </CardContent>
        </Card>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">Office Hours with Flo</h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Join Flo for daily office hours to help you onboard Notis and answer your questions.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              {selectedOfficeHour?.isOverride && (
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    Special Schedule
                  </Badge>
                </div>
              )}

              <Badge variant="secondary" className="text-sm">
                {getOfficeHourLabel()}
              </Badge>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateOfficeHour("prev")}
                  disabled={selectedIndex === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {selectedOfficeHour ? (
                        <>
                          {formatDate(selectedOfficeHour.date, timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)} at{" "}
                          {formatTime(selectedOfficeHour.time, selectedOfficeHour.date, timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)}
                        </>
                      ) : (
                        "No date available"
                      )}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateOfficeHour("next")}
                  disabled={!hasMore && selectedIndex >= officeHours.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {countdown && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900">{countdown.days}</div>
                  <div className="text-sm text-gray-600">Days</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900">{countdown.hours}</div>
                  <div className="text-sm text-gray-600">Hours</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900">{countdown.minutes}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-3xl md:text-4xl font-bold text-gray-900">{countdown.seconds}</div>
                  <div className="text-sm text-gray-600">Seconds</div>
                </div>
              </div>
            )}

            <TimezoneSelector value={timezone} onChange={setTimezone} />

            <div className="space-y-3">
              <Button 
                onClick={handleAddToCalendar} 
                className="w-full" 
                size="lg"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Add to Calendar
              </Button>



              {isInOfficeHourWindow && zoomLink && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  size="lg"
                  onClick={handleJoinZoom}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Join Live Stream
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>Questions? Feel free to join the office hour session!</p>
        </div>
      </div>
    </div>
  )
}
