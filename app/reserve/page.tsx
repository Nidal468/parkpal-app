"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Car, Star } from "lucide-react"
import { CommerceLayerCheckout } from "@/components/commerce-layer-checkout"

// Mock parking space for testing
const mockParkingSpace = {
  id: "test-space-001",
  name: "Downtown Premium Parking",
  address: "123 Main Street, Downtown",
  description: "Secure covered parking space in the heart of downtown. Perfect for business meetings or shopping.",
  hourlyRate: 8.5,
  dailyRate: 45.0,
  monthlyRate: 280.0,
  rating: 4.8,
  reviews: 127,
  features: ["Covered", "Security Camera", "24/7 Access", "EV Charging"],
  images: ["/placeholder.svg?height=300&width=400&text=Parking+Space"],
}

type DurationType = "hour" | "day" | "month"

const durationOptions = [
  { type: "hour" as DurationType, label: "Hourly", price: mockParkingSpace.hourlyRate, sku: "parking-hour" },
  { type: "day" as DurationType, label: "Daily", price: mockParkingSpace.dailyRate, sku: "parking-day" },
  { type: "month" as DurationType, label: "Monthly", price: mockParkingSpace.monthlyRate, sku: "parking-month" },
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
        price={selectedOption.price}
        sku={selectedOption.sku}
        onBack={() => setShowCheckout(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reserve Your Space</h1>
          <p className="text-lg text-gray-600">Test our Commerce Layer integration</p>
        </div>

        {/* Parking Space Card */}
        <Card className="mb-8">
          <div className="md:flex">
            <div className="md:w-1/2">
              <img
                src={mockParkingSpace.images[0] || "/placeholder.svg"}
                alt={mockParkingSpace.name}
                className="w-full h-64 md:h-full object-cover rounded-l-lg"
              />
            </div>
            <div className="md:w-1/2 p-6">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl">{mockParkingSpace.name}</CardTitle>
                <CardDescription className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {mockParkingSpace.address}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <p className="text-gray-700 mb-4">{mockParkingSpace.description}</p>

                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="ml-1 font-semibold">{mockParkingSpace.rating}</span>
                  <span className="ml-1 text-gray-600">({mockParkingSpace.reviews} reviews)</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {mockParkingSpace.features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        {/* Duration Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Select Duration
            </CardTitle>
            <CardDescription>Choose how long you need the parking space</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {durationOptions.map((option) => (
                <div
                  key={option.type}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDuration === option.type
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedDuration(option.type)}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-2xl font-bold text-blue-600">${option.price}</p>
                    <p className="text-sm text-gray-600">SKU: {option.sku}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reserve Button */}
        <div className="text-center">
          <Button
            size="lg"
            className="px-12 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowCheckout(true)}
          >
            <Car className="w-5 h-5 mr-2" />
            Reserve Space - ${selectedOption.price} {selectedOption.label}
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            Testing Commerce Layer integration with SKU: {selectedOption.sku}
          </p>
        </div>
      </div>
    </div>
  )
}
