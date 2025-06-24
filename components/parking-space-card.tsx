"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, PoundSterlingIcon as Pound, Clock, Calendar, Navigation, Users } from "lucide-react"
import type { ParkingSpaceDisplay } from "@/lib/supabase-types"

interface ParkingSpaceCardProps {
  space: ParkingSpaceDisplay & { distance?: number | null; available_spaces?: number }
  onBook?: (spaceId: string) => void
}

export function ParkingSpaceCard({ space, onBook }: ParkingSpaceCardProps) {
  const [pricingMode, setPricingMode] = useState<"daily" | "monthly">("daily")

  // Parse available hours for display
  const formatAvailableHours = (hours: string | null) => {
    if (!hours || hours === "00:00-23:59") return "24/7"
    return hours.replace("-", " - ")
  }

  // Parse available days for display
  const formatAvailableDays = (days: string | null) => {
    if (!days || days === "Mon,Tue,Wed,Thu,Fri,Sat,Sun") return "Every day"
    const dayMap: { [key: string]: string } = {
      Mon: "Mon",
      Tue: "Tue",
      Wed: "Wed",
      Thu: "Thu",
      Fri: "Fri",
      Sat: "Sat",
      Sun: "Sun",
    }
    return days
      .split(",")
      .map((d) => dayMap[d.trim()] || d)
      .join(", ")
  }

  // Get host initials for avatar fallback
  const getHostInitials = (name: string | null) => {
    if (!name) return "H"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate availability status
  const totalSpaces = space.total_spaces || 1
  const bookedSpaces = space.booked_spaces || 0
  const availableSpaces = space.available_spaces || totalSpaces - bookedSpaces

  const getAvailabilityColor = () => {
    if (availableSpaces === 0) return "bg-red-600"
    if (availableSpaces <= 2) return "bg-orange-600"
    return "bg-green-600"
  }

  const getAvailabilityText = () => {
    if (availableSpaces === 0) return "Fully Booked"
    if (availableSpaces === 1) return "1 spot left"
    if (availableSpaces <= 3) return `${availableSpaces} spots left`
    return `${availableSpaces} available`
  }

  // Get current price and period
  const getCurrentPrice = () => {
    if (pricingMode === "monthly") {
      return {
        price: space.price_per_month || 0,
        period: "/month",
      }
    }
    return {
      price: space.price_per_day || 0,
      period: "/day",
    }
  }

  const { price, period } = getCurrentPrice()

  return (
    <Card className="w-full max-w-sm mx-auto">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={space.image_url || "/placeholder.svg?height=200&width=300"}
          alt={space.title}
          className="object-cover w-full h-full"
        />
        {/* Distance badge */}
        {space.distance && (
          <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
            <Navigation className="w-3 h-3 mr-1" />
            {space.distance} mi
          </Badge>
        )}
        {/* Availability badge */}
        <Badge className={`absolute top-2 left-2 text-white text-xs ${getAvailabilityColor()}`}>
          <Users className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">{getAvailabilityText()}</span>
          <span className="sm:hidden">{availableSpaces === 0 ? "Full" : `${availableSpaces} left`}</span>
        </Badge>
      </div>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg leading-tight">{space.title}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{space.location}</span>
          </div>
          {space.postcode && <div className="text-xs text-muted-foreground">{space.postcode}</div>}

          {/* Host Information */}
          {space.host && (
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                <AvatarImage src="/placeholder.svg" alt={space.host.name || "Host"} />
                <AvatarFallback className="text-xs">{getHostInitials(space.host.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">Hosted by {space.host.name || "Host"}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{space.description}</p>

        {/* Availability Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{formatAvailableHours(space.available_hours)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{formatAvailableDays(space.available_days)}</span>
          </div>
        </div>

        {space.features && space.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {space.features.slice(0, 2).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {space.features.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{space.features.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Pricing Toggle and Price Display - Mobile Optimized */}
        <div className="space-y-3 pt-2">
          {/* Toggle Switch */}
          <div className="flex items-center justify-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPricingMode("daily")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  pricingMode === "daily" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPricingMode("monthly")}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                  pricingMode === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Price Display with Animation - Mobile Optimized */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Pound className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="transition-all duration-300 ease-in-out">
                <span className="font-semibold text-green-600 text-base sm:text-lg">£{price}</span>
                <span className="text-xs sm:text-sm text-muted-foreground ml-1">{period}</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onBook?.(space.id)}
              className="bg-purple-600 hover:bg-purple-700 transition-colors duration-200 text-xs sm:text-sm px-3 sm:px-4 py-2"
              disabled={availableSpaces === 0}
            >
              {availableSpaces === 0 ? "Full" : "Book"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
