"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, PoundSterlingIcon as Pound } from "lucide-react"
import type { ParkingSpace } from "@/lib/supabase-types"

interface ParkingSpaceCardProps {
  space: ParkingSpace
  onBook?: (spaceId: string) => void
}

export function ParkingSpaceCard({ space, onBook }: ParkingSpaceCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img
          src={space.image_url || "/placeholder.svg?height=200&width=300"}
          alt={space.title}
          className="object-cover w-full h-full"
        />
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{space.title}</CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{space.location}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>

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
            <span className="font-semibold text-green-600">£{space.price_per_day}</span>
            <span className="text-sm text-muted-foreground">/day</span>
          </div>
          <Button size="sm" onClick={() => onBook?.(space.id)} className="bg-purple-600 hover:bg-purple-700">
            Book Now
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
