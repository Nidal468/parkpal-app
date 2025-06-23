"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Car, MapPin, PoundSterlingIcon as Pound, User } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ParkingSpaceDisplay, Vehicle } from "@/lib/supabase-types"

interface BookingModalProps {
  space: ParkingSpaceDisplay | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (bookingData: BookingData) => void
}

export interface BookingData {
  spaceId: string
  startDate: Date
  endDate: Date
  vehicleReg: string
  vehicleMake: string
  vehicleModel: string
  vehicleColour: string
  contactEmail: string
  contactPhone: string
  specialRequests?: string
  totalPrice: number
}

// Mock vehicles for demo - in production, fetch from user's vehicles
const mockVehicles: Vehicle[] = [
  {
    id: "1",
    created_at: "2024-01-01T00:00:00Z",
    user_id: "user-1",
    reg: "AB12 CDE",
    make: "Toyota",
    model: "Camry",
    colour: "Blue",
  },
  {
    id: "2",
    created_at: "2024-01-02T00:00:00Z",
    user_id: "user-1",
    reg: "XY98 ZAB",
    make: "Honda",
    model: "Civic",
    colour: "Red",
  },
]

export function BookingModal({ space, isOpen, onClose, onConfirm }: BookingModalProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!space) return null

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!startDate || !endDate || !space.price_per_day) return 0
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, days) * space.price_per_day
  }

  const totalPrice = calculateTotalPrice()

  const handleSubmit = async () => {
    if (!startDate || !endDate || !selectedVehicle || !contactEmail) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    const bookingData: BookingData = {
      spaceId: space.id,
      startDate,
      endDate,
      vehicleReg: selectedVehicle.reg || "",
      vehicleMake: selectedVehicle.make || "",
      vehicleModel: selectedVehicle.model || "",
      vehicleColour: selectedVehicle.colour || "",
      contactEmail,
      contactPhone,
      specialRequests,
      totalPrice,
    }

    try {
      await onConfirm(bookingData)
      onClose()
    } catch (error) {
      console.error("Booking error:", error)
      alert("Failed to create booking. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setSelectedVehicle(null)
    setContactEmail("")
    setContactPhone("")
    setSpecialRequests("")
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          resetForm()
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Book Parking Space
          </DialogTitle>
          <DialogDescription>Complete your booking for {space.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Space Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{space.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{space.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Pound className="w-4 h-4" />
                <span>£{space.price_per_day}/day</span>
              </div>
              {space.host && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>Hosted by {space.host.name}</span>
                </div>
              )}
            </div>
            {space.features && space.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {space.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Booking Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">Select Vehicle *</Label>
            <Select onValueChange={(value) => setSelectedVehicle(mockVehicles.find((v) => v.id === value) || null)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your vehicle" />
              </SelectTrigger>
              <SelectContent>
                {mockVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      <span>
                        {vehicle.reg} - {vehicle.make} {vehicle.model} ({vehicle.colour})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7XXX XXXXXX"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="requests">Special Requests</Label>
            <Textarea
              id="requests"
              placeholder="Any special requirements or notes..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          {/* Price Summary */}
          {totalPrice > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Total Price</p>
                  <p className="text-sm text-muted-foreground">
                    {startDate && endDate
                      ? `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} day(s) × £${
                          space.price_per_day
                        }`
                      : "Select dates to see price"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">£{totalPrice}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !startDate || !endDate || !selectedVehicle}>
            {isSubmitting ? "Creating Booking..." : `Confirm Booking - £${totalPrice}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
