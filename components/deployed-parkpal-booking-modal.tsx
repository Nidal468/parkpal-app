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
import { CalendarIcon, Clock, MapPin, Star, Shield, Wifi, Camera, Car, Loader2, Globe } from "lucide-react"
import { PARKPAL_SKUS, DEMO_STORE_CONFIG } from "@/lib/commerce-layer-config"
import type { ParkingSpace } from "@/lib/supabase-types"
import { toast } from "@/hooks/use-toast"

export interface DeployedParkpalBookingData {
  sku: keyof typeof PARKPAL_SKUS
  startDate: Date
  endDate: Date
  startTime: string
  endTime: string
  vehicleRegistration: string
  vehicleType: string
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests: string
  quantity: number
  spaceId?: string
  location?: string
}

interface DeployedParkpalBookingModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
  selectedDates?: {
    from: Date | undefined
    to: Date | undefined
  }
  selectedTime?: string
  defaultSku?: keyof typeof PARKPAL_SKUS
}

export function DeployedParkpalBookingModal({
  space,
  isOpen,
  onClose,
  selectedDates,
  selectedTime,
  defaultSku = "DAY",
}: DeployedParkpalBookingModalProps) {
  const [bookingData, setBookingData] = useState<Partial<DeployedParkpalBookingData>>({
    sku: defaultSku,
    quantity: 1,
  })
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

    if (space) {
      setBookingData((prev) => ({
        ...prev,
        spaceId: space.id?.toString(),
        location: space.location,
      }))
    }
  }, [selectedDates, selectedTime, space])

  // Calculate total price and duration
  const calculateBookingDetails = () => {
    if (!dateRange.from || !dateRange.to || !bookingData.sku) {
      return { duration: 0, totalPrice: 0, unit: "day" }
    }

    const skuData = PARKPAL_SKUS[bookingData.sku]
    const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))

    let duration = days
    let unit = "day"
    const pricePerUnit = skuData.price

    if (bookingData.sku === "HOUR") {
      // For hourly, calculate hours between start and end time
      const startTime = bookingData.startTime || "09:00"
      const endTime = bookingData.endTime || "17:00"
      const [startHour, startMin] = startTime.split(":").map(Number)
      const [endHour, endMin] = endTime.split(":").map(Number)
      const hours = endHour + endMin / 60 - (startHour + startMin / 60)
      duration = Math.max(1, Math.ceil(hours * days))
      unit = "hour"
    } else if (bookingData.sku === "MONTH") {
      duration = Math.max(1, Math.ceil(days / 30))
      unit = "month"
    }

    return {
      duration,
      totalPrice: duration * pricePerUnit * (bookingData.quantity || 1),
      unit,
      pricePerUnit,
    }
  }

  const { duration, totalPrice, unit, pricePerUnit } = calculateBookingDetails()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!space || !dateRange.from || !dateRange.to) return

    setIsSubmitting(true)
    try {
      const finalBookingData: DeployedParkpalBookingData = {
        sku: bookingData.sku || "DAY",
        startDate: dateRange.from,
        endDate: dateRange.to,
        startTime: bookingData.startTime || "09:00",
        endTime: bookingData.endTime || "17:00",
        vehicleRegistration: bookingData.vehicleRegistration || "",
        vehicleType: bookingData.vehicleType || "car",
        customerName: bookingData.customerName || "",
        customerEmail: bookingData.customerEmail || "",
        customerPhone: bookingData.customerPhone || "",
        specialRequests: bookingData.specialRequests || "",
        quantity: bookingData.quantity || 1,
        spaceId: space.id?.toString(),
        location: space.location,
      }

      console.log("🚗 Submitting Parkpal booking via deployed demo-store-core...")
      console.log("🌐 Backend:", DEMO_STORE_CONFIG.BASE_URL)

      // Call the deployed demo-store integration endpoint
      const response = await fetch("/api/parkpal/deployed-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalBookingData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Booking failed")
      }

      console.log("✅ Booking created successfully via deployed backend:", result.booking)

      toast({
        title: "🎉 Booking Created!",
        description: `Your parking space has been reserved via your deployed backend. Order ID: ${result.booking.deployedDemoStoreOrderId}`,
      })

      // Show backend info
      if (result.backend?.connected) {
        toast({
          title: "🌐 Backend Connected",
          description: `Successfully connected to ${result.backend.url}`,
        })
      }

      // Redirect to checkout if URL is available
      if (result.booking.checkoutUrl) {
        toast({
          title: "🔗 Redirecting to Checkout",
          description: "You'll be redirected to complete your payment via your deployed backend...",
        })

        setTimeout(() => {
          window.open(result.booking.checkoutUrl, "_blank")
        }, 2000)
      }

      onClose()
    } catch (error) {
      console.error("❌ Booking failed:", error)
      toast({
        title: "❌ Booking Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Book {space.title}
            <Badge variant="outline" className="ml-2 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Deployed Backend
            </Badge>
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
                  <p className="text-sm text-muted-foreground">{space.location}</p>
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

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">Deployed Backend Integration</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">Connected to: park-pal-core-website-prnz.vercel.app</p>
                  <p className="text-xs text-green-600">Powered by your forked demo-store-core</p>
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
              {/* Booking Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={bookingData.sku || "DAY"}
                    onValueChange={(value) =>
                      setBookingData((prev) => ({ ...prev, sku: value as keyof typeof PARKPAL_SKUS }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOUR">
                        <div className="flex items-center justify-between w-full">
                          <span>Hourly - ${PARKPAL_SKUS.HOUR.price}/hour</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {PARKPAL_SKUS.HOUR.id}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="DAY">
                        <div className="flex items-center justify-between w-full">
                          <span>Daily - ${PARKPAL_SKUS.DAY.price}/day</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {PARKPAL_SKUS.DAY.id}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="MONTH">
                        <div className="flex items-center justify-between w-full">
                          <span>Monthly - ${PARKPAL_SKUS.MONTH.price}/month</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {PARKPAL_SKUS.MONTH.id}
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

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
                      value={bookingData.vehicleRegistration || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, vehicleRegistration: e.target.value }))}
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
                    <Label htmlFor="customerName">Full Name</Label>
                    <Input
                      id="customerName"
                      placeholder="John Doe"
                      value={bookingData.customerName || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, customerName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="your.email@example.com"
                      value={bookingData.customerEmail || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      value={bookingData.customerPhone || ""}
                      onChange={(e) => setBookingData((prev) => ({ ...prev, customerPhone: e.target.value }))}
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
                            {duration} {unit}(s)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span>
                            ${pricePerUnit}/{unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span>{bookingData.quantity || 1}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>SKU:</span>
                          <span>{bookingData.sku ? PARKPAL_SKUS[bookingData.sku].code : "N/A"}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Backend:</span>
                          <span>park-pal-core-website-prnz.vercel.app</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${totalPrice.toFixed(2)}</span>
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
                <Button
                  type="submit"
                  disabled={!dateRange.from || !dateRange.to || isSubmitting}
                  className="flex-1 bg-[#9ef01a] hover:bg-[#8ed617] text-black"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating via Backend...
                    </>
                  ) : (
                    <>
                      <Globe className="mr-2 h-4 w-4" />
                      Book via Deployed Backend - ${totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
