"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Clock, MapPin, Shield, Star, Car, CreditCard } from "lucide-react"
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
  totalPrice: number
  totalDays: number
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

export function BookingModal({ space, isOpen, onClose, onConfirm, selectedDates, selectedTime }: BookingModalProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: selectedDates?.from || undefined,
    to: selectedDates?.to || undefined,
  })

  const [startTime, setStartTime] = useState(selectedTime || "09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate time slots (30-minute intervals)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const min = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${min}`
  })

  // Update dates when selectedDates prop changes
  useEffect(() => {
    if (selectedDates?.from && selectedDates?.to) {
      setDateRange({
        from: selectedDates.from,
        to: selectedDates.to,
      })
    }
  }, [selectedDates])

  // Update time when selectedTime prop changes
  useEffect(() => {
    if (selectedTime) {
      setStartTime(selectedTime)
    }
  }, [selectedTime])

  // Calculate total days and price
  const totalDays =
    dateRange.from && dateRange.to
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 1

  const dailyRate = space?.hourly_rate || space?.daily_rate || 10
  const totalPrice = totalDays * dailyRate

  const handleSubmit = async () => {
    if (!space || !dateRange.from || !dateRange.to) return

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
        totalPrice,
        totalDays,
      }

      await onConfirm(bookingData)
      onClose()

      // Reset form
      setDateRange({ from: undefined, to: undefined })
      setStartTime("09:00")
      setEndTime("17:00")
      setVehicleReg("")
      setVehicleType("")
      setContactEmail("")
      setContactPhone("")
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = dateRange.from && dateRange.to && vehicleReg && vehicleType && contactEmail

  if (!space) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Book {space.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Booking Details */}
          <div className="space-y-6">
            {/* Date Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="w-4 h-4" />
                  <Label className="text-sm font-medium">Select Dates</Label>
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
                {dateRange.from && dateRange.to && (
                  <div className="mt-3 p-2 bg-muted rounded-md text-sm">
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    <span className="text-muted-foreground ml-2">({totalDays} days)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4" />
                  <Label className="text-sm font-medium">Arrival & Departure Times</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="start-time" className="text-xs text-muted-foreground">
                      Arrival Time
                    </Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-xs text-muted-foreground">
                      Departure Time
                    </Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {slot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4" />
                  <Label className="text-sm font-medium">Vehicle Details</Label>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="vehicle-reg" className="text-xs text-muted-foreground">
                      Registration Number *
                    </Label>
                    <Input
                      id="vehicle-reg"
                      placeholder="e.g. AB12 CDE"
                      value={vehicleReg}
                      onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicle-type" className="text-xs text-muted-foreground">
                      Vehicle Type *
                    </Label>
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
              </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-4 h-4" />
                  <Label className="text-sm font-medium">Contact Details</Label>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-xs text-muted-foreground">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs text-muted-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 7XXX XXXXXX"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Space Details & Summary */}
          <div className="space-y-6">
            {/* Space Details */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{space.title}</h3>
                    <p className="text-sm text-muted-foreground">{space.address}</p>
                  </div>

                  {space.image_url && (
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={space.image_url || "/placeholder.svg"}
                        alt={space.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">4.8</span>
                    <span className="text-sm text-muted-foreground">(24 reviews)</span>
                  </div>

                  {space.features && (
                    <div className="flex flex-wrap gap-2">
                      {space.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {space.description && <p className="text-sm text-muted-foreground">{space.description}</p>}

                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Shield className="w-4 h-4" />
                    <span>Secure & Protected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Daily Rate</span>
                    <span>£{dailyRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span>
                      {totalDays} day{totalDays !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>£{totalPrice}</span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isSubmitting ? "Processing..." : `Confirm Booking - £${totalPrice}`}
                </Button>

                <p className="text-xs text-muted-foreground mt-2 text-center">
                  You'll receive a confirmation email with access instructions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
