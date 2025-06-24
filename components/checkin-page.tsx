"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPin, Navigation } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CheckInPageProps {
  selectedSpace?: any
}

export function CheckInPage({ selectedSpace }: CheckInPageProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState("10:15")
  const [endTime, setEndTime] = useState("17:30")
  const [userLocation, setUserLocation] = useState<string>("MY LOCATION")
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Mock selected space data
  const mockSpace = selectedSpace || {
    title: "Car park on Ambergate Street",
    location: "LONDON, SE17",
    price_per_day: 10,
    abbreviation: "AMB",
  }

  const getUserLocation = async () => {
    setIsGettingLocation(true)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setUserLocation("CURRENT LOCATION")
            setIsGettingLocation(false)
          },
          (error) => {
            console.error("Error getting location:", error)
            setUserLocation("MY LOCATION")
            setIsGettingLocation(false)
          },
        )
      }
    } catch (error) {
      console.error("Geolocation error:", error)
      setUserLocation("MY LOCATION")
      setIsGettingLocation(false)
    }
  }

  const calculateTotal = () => {
    if (!startDate || !endDate) return 10
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, days) * (mockSpace.price_per_day || 10)
  }

  return (
    <div className="flex-1 bg-white">
      <div className="flex h-full">
        {/* Left Side - Booking Form */}
        <div className="flex-1 p-8 space-y-8">
          {/* Journey Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">I WANT TO PARK FROM</h2>

              <div className="space-y-4">
                {/* Starting Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">STARTING</label>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 justify-start h-12 text-left"
                      onClick={getUserLocation}
                      disabled={isGettingLocation}
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      {isGettingLocation ? "Getting location..." : userLocation}
                    </Button>
                    <Badge variant="secondary" className="px-4 py-3 text-sm font-medium">
                      MYL
                    </Badge>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TO</label>
                  <div className="flex gap-3">
                    <div className="flex-1 p-3 border rounded-md bg-gray-50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{mockSpace.location}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="px-4 py-3 text-sm font-medium">
                      {mockSpace.abbreviation}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">[DATE:TIME]</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd.MM.yyyy") : "[DATE:TIME]"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">[DATE:TIME]</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd.MM.yyyy") : "[DATE:TIME]"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Boarding Pass */}
        <div className="w-80 bg-gray-50 p-8">
          <div className="space-y-6">
            {/* Boarding Pass */}
            <Card className="bg-white border-2 border-dashed border-gray-300">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {/* Route */}
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-2xl font-bold">MYL</div>
                      <div className="text-xs text-gray-500">MY LOCATION</div>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mockSpace.abbreviation}</div>
                      <div className="text-xs text-gray-500">{mockSpace.location}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="py-4 border-y border-dashed border-gray-200">
                    <div className="text-lg font-bold">
                      {startDate ? format(startDate, "dd.MM.yyyy") : "03.07.2025"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {startTime} am - {endTime} pm
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500">GATE</div>
                      <div className="font-bold">27A</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">SEAT</div>
                      <div className="font-bold">13E</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total & Book */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">£{calculateTotal()}</span>
              </div>

              <Button
                className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white h-12 text-lg font-medium"
                disabled={!startDate || !endDate}
              >
                BOOK
              </Button>

              <Button variant="link" className="w-full text-sm text-gray-600">
                Show details &gt;
              </Button>

              <Button variant="outline" className="w-full text-sm">
                Add a follow up booking
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
