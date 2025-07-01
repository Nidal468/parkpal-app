"use client"

import { useState } from "react"
import { CommerceLayerCheckout } from "@/components/commerce-layer-checkout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Wifi, Car, Shield, Clock } from "lucide-react"

// Mock parking space data with Commerce Layer SKUs
const mockParkingSpace = {
  id: "space-001",
  name: "Downtown Premium Parking",
  address: "123 Main Street, Downtown",
  description: "Secure covered parking in the heart of downtown. Perfect for business meetings and shopping.",
  hourlyRate: 8,
  dailyRate: 45,
  monthlyRate: 180,
  rating: 4.8,
  reviews: 127,
  features: ["Covered", "Security Cameras", "EV Charging", "24/7 Access"],
  coordinates: { lat: 40.7128, lng: -74.006 },
  skus: {
    hour: "parking_hour_downtown_001",
    day: "parking_day_downtown_001",
    month: "parking_month_downtown_001",
  },
}

type Duration = "hour" | "day" | "month"

export default function ReservePage() {
  const [selectedDuration, setSelectedDuration] = useState<Duration>("hour")
  const [showCheckout, setShowCheckout] = useState(false)

  const getCurrentRate = () => {
    switch (selectedDuration) {
      case "hour":
        return mockParkingSpace.hourlyRate
      case "day":
        return mockParkingSpace.dailyRate
      case "month":
        return mockParkingSpace.monthlyRate
      default:
        return mockParkingSpace.hourlyRate
    }
  }

  const getCurrentSku = () => {
    return mockParkingSpace.skus[selectedDuration]
  }

  if (showCheckout) {
    return (
      <CommerceLayerCheckout
        parkingSpace={mockParkingSpace}
        duration={selectedDuration}
        rate={getCurrentRate()}
        sku={getCurrentSku()}
        onBack={() => setShowCheckout(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reserve Your Parking Space</h1>
          <p className="text-gray-600">Choose your duration and complete your booking</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Space Details */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{mockParkingSpace.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {mockParkingSpace.address}
                    </CardDescription>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="font-medium">{mockParkingSpace.rating}</span>
                    <span className="text-gray-500 text-sm ml-1">({mockParkingSpace.reviews})</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{mockParkingSpace.description}</p>

                {/* Features */}
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockParkingSpace.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Amenities Icons */}
                <div className="flex items-center space-x-4 pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-600">
                    <Wifi className="h-4 w-4 mr-1" />
                    WiFi
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Car className="h-4 w-4 mr-1" />
                    EV Charging
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-1" />
                    Secure
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    24/7
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p>Interactive map would go here</p>
                    <p className="text-sm">
                      Lat: {mockParkingSpace.coordinates.lat}, Lng: {mockParkingSpace.coordinates.lng}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Select Duration</CardTitle>
                <CardDescription>Choose how long you need the parking space</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Duration Options */}
                <div className="space-y-3">
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDuration === "hour"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDuration("hour")}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Hourly</h4>
                        <p className="text-sm text-gray-600">Perfect for short visits</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {mockParkingSpace.skus.hour}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${mockParkingSpace.hourlyRate}</p>
                        <p className="text-sm text-gray-500">per hour</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDuration === "day"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDuration("day")}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Daily</h4>
                        <p className="text-sm text-gray-600">Great for full day events</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {mockParkingSpace.skus.day}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${mockParkingSpace.dailyRate}</p>
                        <p className="text-sm text-gray-500">per day</p>
                        <p className="text-xs text-green-600">
                          Save ${mockParkingSpace.hourlyRate * 8 - mockParkingSpace.dailyRate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDuration === "month"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedDuration("month")}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Monthly</h4>
                        <p className="text-sm text-gray-600">Best value for regular use</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {mockParkingSpace.skus.month}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${mockParkingSpace.monthlyRate}</p>
                        <p className="text-sm text-gray-500">per month</p>
                        <p className="text-xs text-green-600">
                          Save ${mockParkingSpace.dailyRate * 30 - mockParkingSpace.monthlyRate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Selected:</span>
                    <Badge>{selectedDuration}ly parking</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Rate:</span>
                    <span className="font-medium">${getCurrentRate()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SKU:</span>
                    <span className="text-sm text-gray-500">{getCurrentSku()}</span>
                  </div>
                </div>

                {/* Reserve Button */}
                <Button onClick={() => setShowCheckout(true)} className="w-full" size="lg">
                  Reserve for ${getCurrentRate()}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  You'll be redirected to our secure checkout powered by Commerce Layer
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
