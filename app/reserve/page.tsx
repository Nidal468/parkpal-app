"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Car, Star } from "lucide-react"
import { CommerceLayerCheckout } from "@/components/commerce-layer-checkout"

const mockParkingSpace = {
  id: "mock-space-1",
  name: "Downtown Premium Parking",
  address: "123 Main Street, Downtown",
  description: "Secure covered parking space in the heart of downtown. Perfect for business meetings and shopping.",
  hourlyRate: 8.5,
  dailyRate: 45.0,
  monthlyRate: 280.0,
  rating: 4.8,
  reviews: 127,
  features: ["Covered", "Security Camera", "24/7 Access", "EV Charging"],
  coordinates: { lat: 40.7128, lng: -74.006 },
}

type DurationType = "hour" | "day" | "month"

const durationOptions = [
  { type: "hour" as DurationType, label: "Hourly", rate: mockParkingSpace.hourlyRate, sku: "parking-hour" },
  { type: "day" as DurationType, label: "Daily", rate: mockParkingSpace.dailyRate, sku: "parking-day" },
  { type: "month" as DurationType, label: "Monthly", rate: mockParkingSpace.monthlyRate, sku: "parking-month" },
]

export default function ReservePage() {
  const [selectedDuration, setSelectedDuration] = useState<DurationType>("hour")
  const [showCheckout, setShowCheckout] = useState(false)

  const selectedOption = durationOptions.find((option) => option.type === selectedDuration)!

  if (showCheckout) {
    return (
      <CommerceLayerCheckout
        parkingSpace={mockParkingSpace}
        duration={selectedDuration}
        rate={selectedOption.rate}
        sku={selectedOption.sku}
        onBack={() => setShowCheckout(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reserve Parking Space</h1>
          <p className="text-gray-600">Test our Commerce Layer integration with Stripe checkout</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Parking Space Details */}
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
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm font-medium">{mockParkingSpace.rating}</span>
                  <span className="ml-1 text-sm text-gray-500">({mockParkingSpace.reviews})</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{mockParkingSpace.description}</p>

              <div className="mb-4">
                <h4 className="font-medium mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {mockParkingSpace.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Pricing Options</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Hourly:</span>
                    <span className="font-medium">${mockParkingSpace.hourlyRate}/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily:</span>
                    <span className="font-medium">${mockParkingSpace.dailyRate}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly:</span>
                    <span className="font-medium">${mockParkingSpace.monthlyRate}/month</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Car className="h-5 w-5 mr-2" />
                Reserve This Space
              </CardTitle>
              <CardDescription>Select your preferred duration and complete the booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">Duration Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {durationOptions.map((option) => (
                      <Button
                        key={option.type}
                        variant={selectedDuration === option.type ? "default" : "outline"}
                        onClick={() => setSelectedDuration(option.type)}
                        className="flex flex-col h-auto py-3"
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs opacity-75">${option.rate}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Selected Option:</span>
                    <Badge>{selectedOption.label}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rate:</span>
                    <span className="font-bold text-lg">${selectedOption.rate}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">SKU: {selectedOption.sku}</div>
                </div>

                <Button onClick={() => setShowCheckout(true)} className="w-full" size="lg">
                  Reserve Space - ${selectedOption.rate}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  This is a test integration. Use card 4242 4242 4242 4242 for testing.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
