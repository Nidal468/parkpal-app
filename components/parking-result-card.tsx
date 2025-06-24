"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { ParkingSpace } from "@/lib/supabase-types"

interface ParkingResultCardProps {
  space: ParkingSpace
  onSelect: (space: ParkingSpace) => void
}

export function ParkingResultCard({ space, onSelect }: ParkingResultCardProps) {
  return (
    <Card className="border border-gray-200 rounded-lg">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-sm text-gray-900">{space.title}</h3>
            <p className="text-xs text-gray-600">{space.location}</p>
          </div>

          <div className="text-xs text-gray-500">[{space.available_spaces || "X"} SPACES AVAILABLE]</div>

          <Button
            onClick={() => onSelect(space)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium h-8"
            variant="secondary"
          >
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
