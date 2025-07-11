"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Get all available IANA timezones
const timezones = Intl.supportedValuesOf('timeZone').map(zone => {
  // Format the timezone label to be more readable
  const label = zone.replace(/_/g, ' ').replace(/\//g, ' / ')
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  const time = formatter.format(now)
  return {
    value: zone,
    label: `${label} (${time})`
  }
})

interface TimezoneSelectorProps {
  value: string
  onChange: (timezone: string) => void
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)

  // Automatically detect user's timezone on mount
  useEffect(() => {
    if (!value) {
      try {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
        onChange(userTimeZone)
      } catch (error) {
        console.error('Failed to detect timezone:', error)
        onChange('UTC')
      }
    }
  }, [])

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="timezone">Timezone</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {value ? timezones.find((tz) => tz.value === value)?.label : "Select timezone..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Search timezone..." />
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {timezones.map((timezone) => (
                <CommandItem
                  key={timezone.value}
                  value={timezone.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === timezone.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {timezone.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
