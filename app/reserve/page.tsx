"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Shield, Camera, Wifi, Car } from "lucide-react"
import { CommerceLayerCheckout } from "@/components/commerce-layer-checkout"
import Image from "next/image"

// Mock parking space for testing
const mockParkingSpace = {
  id: "test-space-1",
  title: "Premium City Centre Parking",
  address: "123 High Street, London, SW1A 1AA",
  price: 15,
  price_per_day: 15,
  price_per_hour: 3,
  price_per_month: 300,
  features: ["CCTV", "Secure", "WiFi", "EV Charging"],
  rating: 4.8,
  reviews: 124,
  image: "/placeholder.svg?height=300&width=400",
}

export default function ReserveSpacePage() {
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<"hour" | "day" | "month">("day")

  const handleReserveClick = () => {
    setShowCheckout(true)
  }

  const getPriceForDuration = () => {
    switch (selectedDuration) {
      case "hour":
        return mockParkingSpace.price_per_hour
      case "day":
        return mockParkingSpace.price_per_day
      case "month":
        return mockParkingSpace.price_per_month
      default:
        return mockParkingSpace.price_per_day
    }
  }

  const getSKU = () => {
    return `parking-${selectedDuration}`
  }

  if (showCheckout) {
    return (
      <CommerceLayerCheckout
        space={mockParkingSpace}
        sku={getSKU()}
        duration={selectedDuration}
        price={getPriceForDuration()}
        onBack={() => setShowCheckout(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Reserve Parking Space</h1>
          <p className="text-gray-600">Test Commerce Layer Integration</p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Image
                  src={mockParkingSpace.image || "/placeholder.svg"}
                  alt={mockParkingSpace.title}
                  width={120}
                  height={90}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{mockParkingSpace.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{mockParkingSpace.address}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {mockParkingSpace.rating} ({mockParkingSpace.reviews} reviews)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mockParkingSpace.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        {feature === "CCTV" && <Camera className="w-3 h-3" />}
                        {feature === "Secure" && <Shield className="w-3 h-3" />}
                        {feature === "WiFi" && <Wifi className="w-3 h-3" />}
                        {feature === "EV Charging" && <Car className="w-3 h-3" />}
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Duration Selection */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Select Duration</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={selectedDuration === "hour" ? "default" : "outline"}
                    onClick={() => setSelectedDuration("hour")}
                    className="flex flex-col p-4 h-auto"
                  >
                    <span className="font-semibold">Hourly</span>
                    <span className="text-sm">£{mockParkingSpace.price_per_hour}/hour</span>
                  </Button>
                  <Button
                    variant={selectedDuration === "day" ? "default" : "outline"}
                    onClick={() => setSelectedDuration("day")}
                    className="flex flex-col p-4 h-auto"
                  >
                    <span className="font-semibold">Daily</span>
                    <span className="text-sm">£{mockParkingSpace.price_per_day}/day</span>
                  </Button>
                  <Button
                    variant={selectedDuration === "month" ? "default" : "outline"}
                    onClick={() => setSelectedDuration("month")}
                    className="flex flex-col p-4 h-auto"
                  >
                    <span className="font-semibold">Monthly</span>
                    <span className="text-sm">£{mockParkingSpace.price_per_month}/month</span>
                  </Button>
                </div>
              </div>

              {/* Price Display */}
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-green-600">
                  £{getPriceForDuration()}
                  <span className="text-lg font-normal text-gray-500">/{selectedDuration}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">SKU: {getSKU()}</p>
              </div>

              {/* Reserve Button */}
              <div className="text-center">
                <Button
                  onClick={handleReserveClick}
                  size="lg"
                  className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg"
                >
                  Reserve Space - £{getPriceForDuration()}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-800 mb-2">Test Information</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• This is a test page for Commerce Layer integration</li>
                <li>• SKUs configured: parking-hour, parking-day, parking-month</li>
                <li>• Stripe payment processing enabled</li>
                <li>• Use test card: 4242 4242 4242 4242</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
