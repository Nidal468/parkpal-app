"use client"

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

  return (
    <Card className="w-full max-w-sm">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={space.image_url || "/placeholder.svg?height=200&width=300"}
          alt={space.title}
          className="object-cover w-full h-full"
        />
        {/* Distance badge */}
        {space.distance && (
          <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
            <Navigation className="w-3 h-3 mr-1" />
            {space.distance} mi
          </Badge>
        )}
        {/* Availability badge */}
        <Badge className={`absolute top-2 left-2 text-white ${getAvailabilityColor()}`}>
          <Users className="w-3 h-3 mr-1" />
          {getAvailabilityText()}
        </Badge>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{space.title}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{space.location}</span>
          </div>
          {space.postcode && <div className="text-xs text-muted-foreground">{space.postcode}</div>}

          {/* Host Information */}
          {space.host && (
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src="/placeholder.svg" alt={space.host.name || "Host"} />
                <AvatarFallback className="text-xs">{getHostInitials(space.host.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">Hosted by {space.host.name || "Host"}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>

        {/* Availability Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatAvailableHours(space.available_hours)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatAvailableDays(space.available_days)}</span>
          </div>
        </div>

        {space.features && space.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {space.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {space.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{space.features.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Pound className="w-4 h-4 text-green-600" />
            <span className="font-semibold text-green-600">£{space.price_per_day || 0}</span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
          <Button
            size="sm"
            onClick={() => onBook?.(space.id)}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={availableSpaces === 0}
          >
            {availableSpaces === 0 ? "Fully Booked" : "Book Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
