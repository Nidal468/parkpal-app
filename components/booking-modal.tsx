"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, MapPin, Star, Shield, Wifi, Camera, Car } from "lucide-react"
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

export function BookingModal({ space, isOpen, onClose, onConfirm, selectedDates, selectedTime }: BookingModalProps) {
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Generate time slots (30-minute intervals)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const min = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${min}`
  })

  // Pre-fill dates and time from chat selections
  useEffect(() => {
    if (selectedDates?.from && selectedDates?.to) {
      setDateRange({
        from: selectedDates.from,
        to: selectedDates.to,
      })
      setBookingData((prev) => ({
        ...prev,
        startDate: selectedDates.from,
        endDate: selectedDates.to,
      }))
    }

    if (selectedTime) {
      setBookingData((prev) => ({
        ...prev,
        startTime: selectedTime,
      }))
    }
  }, [selectedDates, selectedTime])

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!dateRange.from || !dateRange.to || !space) return 0

    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    return days * (space.price_per_day || space.price || 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!space || !dateRange.from || !dateRange.to) return

    setIsSubmitting(true)
    try {
      const finalBookingData: BookingData = {
        startDate: dateRange.from,
        endDate: dateRange.to,
        startTime: bookingData.startTime || "09:00",
        endTime: bookingData.endTime || "17:00",
        vehicleReg: bookingData.vehicleReg || "",
        vehicleType: bookingData.vehicleType || "car",
        contactEmail: bookingData.contactEmail || "",
        contactPhone: bookingData.contactPhone || "",
        specialRequests: bookingData.specialRequests || "",
        totalPrice: calculateTotalPrice(),
      }

      await onConfirm(finalBookingData)
      onClose()
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      setDateRange(range)
      setBookingData((prev) => ({
        ...prev,
        startDate: range.from,
        endDate: range.to,
      }))
    }
  }

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
          {/* Left Column - Space Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Space Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{space.title}</h4>
                  <p className="text-sm text-muted-foreground">{space.address}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.8 (124 reviews)</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {space.features?.includes("CCTV") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      CCTV
                    </Badge>
                  )}
                  {space.features?.includes("Secure") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Secure
                    </Badge>
                  )}
                  {space.features?.includes("WiFi") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Wifi className="w-3 h-3" />
                      WiFi
                    </Badge>
                  )}
                  {space.features?.includes("EV Charging") && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      EV Charging
                    </Badge>
                  )}
                </div>

                <div className="text-2xl font-bold">
                  £{space.price_per_day || space.price || 10}
                  <span className="text-sm font-normal text-muted-foreground">/day</span>
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Select Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={1}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
                {dateRange.from && dateRange.to && (
                  <div className="mt-3 p-2 bg-muted rounded-lg text-sm">
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Time Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Arrival Time</Label>
                      <Select
                        value={bookingData.startTime || selectedTime || ""}
                        onValueChange={(value) => setBookingData((prev) => ({ ...prev, startTime: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
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
                      <Label htmlFor="endTime">Departure Time</Label>
                      <Select
                        value={bookingData.endTime || ""}
                        onValueChange={(value) => setBookingData((prev) => ({ ...prev, endTime: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
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
                <CardHeader>
                  <CardTitle>Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="vehicleReg">Vehicle Registration</Label>
                    <Input
                      id="vehicleReg"
                      placeholder="e.g. AB12 CDE"
                      value={bookingData.vehicleReg || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, vehicleReg: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select
                      value={bookingData.vehicleType || "car"}
                      onValueChange={(value) => setBookingData((prev) => ({ ...prev, vehicleType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="car">Car</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={bookingData.contactEmail || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      value={bookingData.contactPhone || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special requirements or notes..."
                      value={bookingData.specialRequests || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Price Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dateRange.from && dateRange.to && (
                      <>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>
                            {Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))}{" "}
                            day(s)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Rate:</span>
                          <span>£{space.price_per_day || space.price || 10}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>£{calculateTotalPrice()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button type="submit" disabled={!dateRange.from || !dateRange.to || isSubmitting} className="flex-1">
                  {isSubmitting ? "Booking..." : `Book for £${calculateTotalPrice()}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
