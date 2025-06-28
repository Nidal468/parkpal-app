"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Clock, MapPin, Shield, Car, Wifi, Camera, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, differenceInDays, addDays } from "date-fns"
import type { ParkingSpace } from "@/lib/supabase-types"
import { VehicleSelector } from "./vehicle-selector"

export interface BookingData {
  spaceId: string
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  vehicleType: string
  vehicleReg: string
  contactEmail: string
  contactPhone: string
  totalPrice: number
}

interface BookingModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: BookingData) => Promise<void>
  selectedDates?: {
    from: Date | undefined
    to: Date | undefined
  }
}

// Generate time slots in 30-minute increments
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push(timeString)
    }
  }
  return slots
}

const timeSlots = generateTimeSlots()

export function BookingModal({ space, isOpen, onClose, onConfirm, selectedDates }: BookingModalProps) {
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [vehicleType, setVehicleType] = useState("")
  const [vehicleReg, setVehicleReg] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set dates from chat selection when modal opens
  useEffect(() => {
    if (selectedDates?.from && selectedDates?.to) {
      setStartDate(selectedDates.from)
      setEndDate(selectedDates.to)
    } else if (!startDate && !endDate) {
      // Default to today and tomorrow if no dates selected
      const today = new Date()
      setStartDate(today)
      setEndDate(addDays(today, 1))
    }
  }, [selectedDates, startDate, endDate])

  const calculateTotalPrice = () => {
    if (!startDate || !endDate || !space) return 0

    const days = Math.max(1, differenceInDays(endDate, startDate))
    const dailyRate = space.price_per_day || space.price || 0
    return days * dailyRate
  }

  const handleSubmit = async () => {
    if (!space || !startDate || !endDate || !vehicleType || !vehicleReg || !contactEmail) {
      return
    }

    setIsSubmitting(true)
    try {
      await onConfirm({
        spaceId: space.id,
        startDate,
        endDate,
        startTime,
        endTime,
        vehicleType,
        vehicleReg,
        contactEmail,
        contactPhone,
        totalPrice: calculateTotalPrice(),
      })
      onClose()
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase()
    if (lowerFeature.includes("security") || lowerFeature.includes("secure")) return Shield
    if (lowerFeature.includes("cctv") || lowerFeature.includes("camera")) return Camera
    if (lowerFeature.includes("electric") || lowerFeature.includes("ev")) return Zap
    if (lowerFeature.includes("wifi")) return Wifi
    return Car
  }

  if (!space) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Book {space.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Space Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{space.address}</span>
            </div>

            {space.features && space.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {space.features.map((feature, index) => {
                  const IconComponent = getFeatureIcon(feature)
                  return (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <IconComponent className="w-3 h-3" />
                      {feature}
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
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
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
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
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Vehicle Details</h3>

            <VehicleSelector value={vehicleType} onValueChange={setVehicleType} />

            <div className="space-y-2">
              <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
              <Input
                id="vehicleReg"
                placeholder="e.g., AB12 CDE"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Contact Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
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
          </div>

          <Separator />

          {/* Pricing Summary */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium">Booking Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Daily Rate:</span>
                <span>£{space.price_per_day || space.price}/day</span>
              </div>

              {startDate && endDate && (
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{Math.max(1, differenceInDays(endDate, startDate))} day(s)</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>£{calculateTotalPrice()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!vehicleType || !vehicleReg || !contactEmail || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Confirming..." : `Confirm Booking - £${calculateTotalPrice()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
