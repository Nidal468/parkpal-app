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
import { CalendarIcon, MapPin, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { ParkingSpace } from "@/lib/supabase-types"
import { useRouter } from "next/navigation"

export interface BookingData {
  spaceId: string
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  vehicleReg: string
  vehicleType: string
  contactEmail: string
  contactPhone: string
  totalPrice: number
}

interface BookingModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (bookingData: BookingData) => Promise<void>
  selectedDates?: {
    from: Date | undefined
    to: Date | undefined
  }
}

// Generate 30-minute time slots
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
  const router = useRouter()
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Set dates from selectedDates prop when modal opens
  useEffect(() => {
    if (selectedDates?.from && selectedDates?.to) {
      setStartDate(selectedDates.from)
      setEndDate(selectedDates.to)
    }
  }, [selectedDates, isOpen])

  const calculateTotalPrice = () => {
    if (!startDate || !endDate || !space) return 0

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return days * (space.price_per_day || 0)
  }

  const handleReserve = () => {
    if (!space) return

    // Navigate to booking page with space and date data
    const searchParams = new URLSearchParams({
      spaceId: space.id,
      ...(startDate && { startDate: startDate.toISOString() }),
      ...(endDate && { endDate: endDate.toISOString() }),
      startTime,
      endTime,
    })

    router.push(`/booking?${searchParams.toString()}`)
    onClose()
  }

  const handleQuickBook = async () => {
    if (!space || !startDate || !endDate) return

    setIsLoading(true)
    try {
      const bookingData: BookingData = {
        spaceId: space.id,
        startDate,
        endDate,
        startTime,
        endTime,
        vehicleReg,
        vehicleType,
        contactEmail,
        contactPhone,
        totalPrice: calculateTotalPrice(),
      }

      await onConfirm(bookingData)
      onClose()
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!space) return null

  const totalPrice = calculateTotalPrice()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {space.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Space Details */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{space.address}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">£{space.price_per_day}/day</Badge>
              {space.features && space.features.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {Array.isArray(space.features) ? space.features[0] : space.features.split(",")[0]}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                    {endDate ? format(endDate, "MMM dd") : "Select"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < new Date() || (startDate && date < startDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Time</Label>
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
              <Label>End Time</Label>
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

          {/* Quick Vehicle Details */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="vehicleReg">Vehicle Registration (Optional)</Label>
              <Input
                id="vehicleReg"
                placeholder="e.g., AB12 CDE"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle Type (Optional)</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="electric">Electric Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Total Price */}
          {startDate && endDate && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="text-lg font-bold">£{totalPrice}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} day(s) × £
                {space.price_per_day}/day
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleReserve} className="flex-1" disabled={!startDate || !endDate}>
              Reserve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
