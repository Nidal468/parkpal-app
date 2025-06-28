"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { VehicleSelector } from "@/components/vehicle-selector"
import { ArrowLeft, MapPin, Calendar, Clock, User, Mail, Phone, Car } from "lucide-react"
import Image from "next/image"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get booking details from URL params
  const spaceId = searchParams.get("spaceId")
  const spaceTitle = searchParams.get("spaceTitle")
  const spaceLocation = searchParams.get("spaceLocation")
  const price = searchParams.get("price")
  const priceType = searchParams.get("priceType")
  const discountType = searchParams.get("discountType")

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    vehicleReg: "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
  })

  // Set default dates
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    setBookingForm((prev) => ({
      ...prev,
      startDate: today.toISOString().split("T")[0],
      endDate: tomorrow.toISOString().split("T")[0],
    }))
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setBookingForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const calculateTotal = () => {
    const basePrice = Number.parseFloat(price || "0")
    const discountMultiplier = discountType === "weekly" ? 0.9 : discountType === "monthly" ? 0.8 : 1
    return (basePrice * discountMultiplier).toFixed(2)
  }

  const getDiscountLabel = () => {
    switch (discountType) {
      case "weekly":
        return "Weekly Discount (10% off)"
      case "monthly":
        return "Monthly Discount (20% off)"
      default:
        return "Standard Rate"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <Image src="/parkpal-logo-chat.png" alt="Parkpal" width={100} height={32} />
            </div>
            <div className="text-sm text-gray-600">Secure Booking</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={bookingForm.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="John"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={bookingForm.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Doe"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="john@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={bookingForm.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+44 7123 456789"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <VehicleSelector selectedVehicle={selectedVehicle} onVehicleSelect={setSelectedVehicle} />

                <div>
                  <Label htmlFor="vehicleReg">Vehicle Registration</Label>
                  <div className="relative mt-1">
                    <Car className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="vehicleReg"
                      value={bookingForm.vehicleReg}
                      onChange={(e) => handleInputChange("vehicleReg", e.target.value.toUpperCase())}
                      placeholder="AB12 CDE"
                      className="pl-10 font-mono"
                      maxLength={8}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Dates & Times */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking Period
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={bookingForm.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="mt-1"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={bookingForm.endDate}
                      onChange={(e) => handleInputChange("endDate", e.target.value)}
                      className="mt-1"
                      min={bookingForm.startDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <div className="relative mt-1">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="startTime"
                        type="time"
                        value={bookingForm.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <div className="relative mt-1">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="endTime"
                        type="time"
                        value={bookingForm.endTime}
                        onChange={(e) => handleInputChange("endTime", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Space Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{spaceTitle || "Parking Space"}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      {spaceLocation}
                    </div>
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Base Price</span>
                      <span className="font-medium">
                        £{price}/{priceType}
                      </span>
                    </div>

                    {discountType && discountType !== "standard" && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">{getDiscountLabel()}</span>
                        <span className="text-green-600 font-medium">-{discountType === "weekly" ? "10%" : "20%"}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>£{calculateTotal()}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Included</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        24/7 Access
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Secure Parking
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        CCTV Monitoring
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button className="w-full bg-[#9ef01a] hover:bg-[#8ed617] text-black font-semibold" size="lg">
                      Complete Booking
                    </Button>
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => router.back()}>
                      Back to Space Details
                    </Button>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-800">🔒 Your payment is secured with 256-bit SSL encryption</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
