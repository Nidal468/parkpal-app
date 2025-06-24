"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Car, Truck } from "lucide-react"
import { cn } from "@/lib/utils"

interface VehicleSelectorProps {
  selectedVehicle: string | null
  onVehicleSelect: (vehicle: string) => void
}

export function VehicleSelector({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) {
  const vehicles = [
    { id: "car", name: "Car", icon: Car, description: "Standard car parking" },
    { id: "suv", name: "SUV", icon: Car, description: "Larger vehicle parking" },
    { id: "van", name: "Van", icon: Truck, description: "Commercial vehicle parking" },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Select your vehicle type:</h3>
      <div className="grid grid-cols-3 gap-3">
        {vehicles.map((vehicle) => {
          const Icon = vehicle.icon
          return (
            <Card
              key={vehicle.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedVehicle === vehicle.id ? "ring-2 ring-[#021e34] bg-[#021e34]/5" : "hover:bg-muted/50",
              )}
              onClick={() => onVehicleSelect(vehicle.id)}
            >
              <CardContent className="p-4 text-center">
                <Icon
                  className={cn(
                    "w-8 h-8 mx-auto mb-2",
                    selectedVehicle === vehicle.id ? "text-[#021e34]" : "text-muted-foreground",
                  )}
                />
                <div
                  className={cn(
                    "font-medium text-sm",
                    selectedVehicle === vehicle.id ? "text-[#021e34]" : "text-foreground",
                  )}
                >
                  {vehicle.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{vehicle.description}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
