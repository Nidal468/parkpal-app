"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, MapPin, Shield, Star, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { ParkingSpace } from "@/lib/supabase-types"

export interface BookingData {
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  vehicleReg: string
  vehicleType: string
  contactEmail: string
  contactPhone: string
  specialRequests: string
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
  selectedTime?: string
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

export function BookingModal({ space, isOpen, onClose, onConfirm, selectedDates, selectedTime }: BookingModalProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set dates and time from chat selection when modal opens
  useEffect(() => {
    if (selectedDates?.from && selectedDates?.to) {
      setDateRange({
        from: selectedDates.from,
        to: selectedDates.to,
      })
    }
    if (selectedTime) {
      setStartTime(selectedTime)
    }
  }, [selectedDates, selectedTime, isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDateRange({ from: undefined, to: undefined })
      setStartTime("09:00")
      setEndTime("17:00")
      setVehicleReg("")
      setVehicleType("")
      setContactEmail("")
      setContactPhone("")
      setSpecialRequests("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  const calculateTotalPrice = () => {
    if (!dateRange.from || !dateRange.to || !space) return 0

    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    const basePrice = space.price_per_day || 0
    return days * basePrice
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateRange.from || !dateRange.to || !space) return

    setIsSubmitting(true)
    try {
      const bookingData: BookingData = {
        startDate: dateRange.from,
        endDate: dateRange.to,
        startTime,
        endTime,
        vehicleReg,
        vehicleType,
        contactEmail,
        contactPhone,
        specialRequests,
        totalPrice: calculateTotalPrice(),
      }

      await onConfirm(bookingData)
      onClose()
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!space) return null

  const totalPrice = calculateTotalPrice()
  const isFormValid = dateRange.from && dateRange.to && vehicleReg && vehicleType && contactEmail

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Book {space.title}
          </DialogTitle>
          <DialogDescription>
            Complete your booking details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Space Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{space.title}</h3>
                <p className="text-sm text-muted-foreground">{space.address}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">£{space.price_per_day}/day</div>
                {space.rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{space.rating}</span>
                  </div>
                )}
              </div>
            </div>

            {space.features && space.features.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {space.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Pre-filled dates notification */}
          {selectedDates?.from && selectedDates?.to && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-400">
                ✅ Dates pre-filled from your chat selection: {selectedDates.from.toLocaleDateString()} -{" "}
                {selectedDates.to.toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Booking Dates *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick your dates</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection with pre-filled notification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              {selectedTime && (
                <p className="text-xs text-green-600 dark:text-green-400">Pre-filled from chat: {selectedTime}</p>
              )}
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select start time" />
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
              <Label htmlFor="endTime">End Time *</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select end time" />
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

          {/* Vehicle Details */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Vehicle Details</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleReg">Registration Number *</Label>
                <Input
                  id="vehicleReg"
                  placeholder="e.g. AB12 CDE"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select value={vehicleType} onValueChange={setVehicleType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="electric">Electric Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Contact Details</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email Address *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone Number</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+44 7XXX XXXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              placeholder="Any special requirements or notes..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Price Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Total Cost</span>
              <span className="text-2xl font-bold">£{totalPrice}</span>
            </div>
            {dateRange.from && dateRange.to && (
              <p className="text-sm text-muted-foreground">
                {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} day(s) × £
                {space.price_per_day}/day
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
