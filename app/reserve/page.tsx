"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Car, Star } from "lucide-react"
import { CommerceLayerCheckout } from "@/components/commerce-layer-checkout"

// Mock parking space for testing
const mockParkingSpace = {
  id: "test-space-1",
  title: "Premium City Center Parking",
  description: "Secure covered parking space in the heart of London. Perfect for business meetings or shopping trips.",
  address: "123 Business District, London SE17 1AA",
  price_per_hour: 8.5,
  price_per_day: 25.0,
  price_per_month: 450.0,
  latitude: 51.4948,
  longitude: -0.0877,
  features: ["Covered", "CCTV", "24/7 Access", "EV Charging"],
  rating: 4.8,
  reviews: 127,
  host_name: "Premium Parking Ltd",
  images: ["/placeholder.svg?height=300&width=400&text=Parking+Space"],
}

type DurationType = "hour" | "day" | "month"

const durationOptions = [
  {
    type: "hour" as DurationType,
    label: "Hourly",
    price: mockParkingSpace.price_per_hour,
    sku: "parking-hour",
    description: "Perfect for short visits",
  },
  {
    type: "day" as DurationType,
    label: "Daily",
    price: mockParkingSpace.price_per_day,
    sku: "parking-day",
    description: "Great for day trips",
  },
  {
    type: "month" as DurationType,
    label: "Monthly",
    price: mockParkingSpace.price_per_month,
    sku: "parking-month",
    description: "Best value for regular parking",
  },
]

export default function ReserveSpacePage() {
  const [selectedDuration, setSelectedDuration] = useState<DurationType>("day")
  const [showCheckout, setShowCheckout] = useState(false)

  const selectedOption = durationOptions.find((opt) => opt.type === selectedDuration)!

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CommerceLayerCheckout
          space={mockParkingSpace}
          duration={selectedDuration}
          sku={selectedOption.sku}
          price={selectedOption.price}
          onBack={() => setShowCheckout(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reserve Your Parking Space</h1>
          <p className="text-gray-600">Test our Commerce Layer integration with Stripe checkout</p>
        </div>

        {/* Parking Space Card */}
        <Card className="mb-8">
          <div className="md:flex">
            {/* Image */}
            <div className="md:w-1/2">
              <img
                src={mockParkingSpace.images[0] || "/placeholder.svg"}
                alt={mockParkingSpace.title}
                className="w-full h-64 md:h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
            </div>

            {/* Details */}
            <div className="md:w-1/2 p-6">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2">{mockParkingSpace.title}</CardTitle>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{mockParkingSpace.address}</span>
                    </div>
                    <div className="flex items-center mb-3">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{mockParkingSpace.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({mockParkingSpace.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <CardDescription>{mockParkingSpace.description}</CardDescription>
              </CardHeader>

              {/* Features */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Features:</h4>
                <div className="flex flex-wrap gap-2">
                  {mockParkingSpace.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Host */}
              <div className="text-sm text-gray-600">
                <span className="font-medium">Hosted by:</span> {mockParkingSpace.host_name}
              </div>
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
            <div className="grid md:grid-cols-3 gap-4">
              {durationOptions.map((option) => (
                <div
                  key={option.type}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDuration === option.type
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedDuration(option.type)}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">{option.label}</h3>
                    <p className="text-2xl font-bold text-blue-600 my-2">£{option.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      SKU: {option.sku}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reserve Button */}
        <div className="text-center">
          <Button size="lg" className="px-12 py-4 text-lg" onClick={() => setShowCheckout(true)}>
            <Car className="w-5 h-5 mr-2" />
            Reserve Space - £{selectedOption.price.toFixed(2)} {selectedOption.label}
          </Button>
          <p className="text-sm text-gray-500 mt-2">You'll be able to review all details before payment</p>
        </div>

        {/* Test Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-2">🧪 Test Mode Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• This is a test integration with Commerce Layer and Stripe</p>
              <p>
                • Use test card: <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code>
              </p>
              <p>• Any expiry date in the future and any 3-digit CVC</p>
              <p>• SKUs map to your Commerce Layer configuration</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
