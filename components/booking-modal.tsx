"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Car, Shield, Wifi, Camera, Zap } from "lucide-react"
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

const getFeatureIcon = (feature: string) => {
  const lowerFeature = feature.toLowerCase()
  if (lowerFeature.includes("cctv") || lowerFeature.includes("camera")) return <Camera className="w-4 h-4" />
  if (lowerFeature.includes("security") || lowerFeature.includes("secure")) return <Shield className="w-4 h-4" />
  if (lowerFeature.includes("wifi")) return <Wifi className="w-4 h-4" />
  if (lowerFeature.includes("electric") || lowerFeature.includes("ev")) return <Zap className="w-4 h-4" />
  return <Car className="w-4 h-4" />
}

export function BookingModal({ space, isOpen, onClose, onConfirm, selectedDates }: BookingModalProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [vehicleReg, setVehicleReg] = useState("")
  const [vehicleType, setVehicleType] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill dates if provided from chat
  useEffect(() => {
    if (selectedDates?.from && selectedDates?.to) {
      setStartDate(selectedDates.from.toISOString().split("T")[0])
      setEndDate(selectedDates.to.toISOString().split("T")[0])
    }
  }, [selectedDates])

  const calculateTotalPrice = () => {
    if (!space || !startDate || !endDate) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return days * (space.price_per_day || 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!space) return

    setIsSubmitting(true)

    try {
      const bookingData: BookingData = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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

      // Reset form
      setStartDate("")
      setEndDate("")
      setStartTime("09:00")
      setEndTime("17:00")
      setVehicleReg("")
      setVehicleType("")
      setContactEmail("")
      setContactPhone("")
      setSpecialRequests("")
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsSubmitting(false)
    }
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
          {/* Space Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{space.title}</h3>
                  <p className="text-sm text-muted-foreground">{space.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">£{space.price_per_day}</div>
                  <div className="text-sm text-muted-foreground">per day</div>
                </div>
              </div>

              {space.features && space.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {space.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {getFeatureIcon(feature)}
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Booking Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={startDate || new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>

            {/* Booking Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
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
                <Label htmlFor="endTime" className="flex items-center gap-2">
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

            {/* Vehicle Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleReg" className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Vehicle Registration
                </Label>
                <Input
                  id="vehicleReg"
                  placeholder="e.g., AB12 CDE"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleType">Vehicle Type</Label>
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

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email Address</Label>
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
                  required
                />
              </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
              <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any special requirements or requests..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            {/* Price Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span>
                  {startDate && endDate
                    ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)`
                    : "Select dates"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Rate per day:</span>
                <span>£{space.price_per_day}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>£{calculateTotalPrice()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Booking..." : `Confirm Booking - £${calculateTotalPrice()}`}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
