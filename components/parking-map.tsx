"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, PoundSterlingIcon as Pound } from "lucide-react"
import { ISpaces } from "@/model/spaces"

interface ParkingMapProps {
  spaces: ISpaces[]
  onSelectSpace?: (space: ISpaces) => void
  selectedSpaceId?: string
}

export function ParkingMap({ spaces, onSelectSpace, selectedSpaceId }: ParkingMapProps) {
  const [selectedSpace, setSelectedSpace] = useState<ISpaces | null>(null)

  // Center map on first space or default to London
  const centerLat = spaces.length > 0 && spaces[0].latitude ? spaces[0].latitude : 51.5074
  const centerLng = spaces.length > 0 && spaces[0].longitude ? spaces[0].longitude : -0.1278

  const handleSpaceClick = (space: ISpaces) => {
    setSelectedSpace(space)
    onSelectSpace?.(space)
  }

  return (
    <div className="w-full h-[500px] relative bg-gray-100 rounded-lg overflow-hidden">
      {/* Map placeholder - In production, replace with actual map component */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 mb-4">Interactive Map View</p>
          <p className="text-sm text-gray-500">In production, this would be a real map (Google Maps, Mapbox, etc.)</p>
        </div>
      </div>

      {/* Map markers for each parking space */}
      {spaces.map((space, index) => {
        if (!space.latitude || !space.longitude) return null

        // Calculate position relative to map bounds (simplified)
        const x = 20 + (index % 3) * 30 // Distribute horizontally
        const y = 20 + Math.floor(index / 3) * 25 // Distribute vertically

        return (
          <div
            key={space.id}
            className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
              selectedSpaceId === space.id ? "z-20" : "z-10"
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => handleSpaceClick(space)}
          >
            {/* Map marker */}
            <div
              className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                selectedSpaceId === space.id
                  ? "bg-purple-600 scale-125"
                  : "bg-blue-600 hover:bg-blue-700 hover:scale-110"
              } transition-all duration-200`}
            >
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                {space.title} - £{space.price_per_day}/day
              </div>
            </div>
          </div>
        )
      })}

      {/* Selected space info card */}
      {selectedSpace && (
        <div className="absolute bottom-4 left-4 right-4 z-30">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{selectedSpace.title}</span>
                <Badge variant="secondary">£{selectedSpace.price_per_day}/day</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span>{selectedSpace.location}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{selectedSpace.description}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Open in maps app
                    const url = `https://maps.google.com/?q=${selectedSpace.latitude},${selectedSpace.longitude}`
                    window.open(url, "_blank")
                  }}
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Directions
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => onSelectSpace?.(selectedSpace)}
                >
                  <Pound className="w-4 h-4 mr-1" />
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
