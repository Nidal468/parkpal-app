"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Star, MapPin, Clock, Shield, Car, Zap } from "lucide-react"
import type { ParkingSpace } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<"hourly" | "daily" | "monthly">("daily")

  if (!space) return null

  // Mock reviews data - replace with real data from your reviews API
  const mockReviews = [
    {
      id: "1",
      rating: 5,
      comment: "Excellent parking space! Very secure and convenient location.",
      created_at: "2024-01-20T10:30:00Z",
    },
    {
      id: "2",
      rating: 4,
      comment: "Good value for money. Easy access and well-lit area.",
      created_at: "2024-01-18T14:20:00Z",
    },
    {
      id: "3",
      rating: 5,
      comment: "Perfect for daily commuting. Highly recommend!",
      created_at: "2024-01-15T09:15:00Z",
    },
  ]

  const averageRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length

  const getPricing = () => {
    switch (selectedDuration) {
      case "hourly":
        return { price: 3, unit: "hour" }
      case "daily":
        return { price: space.price_per_day || 15, unit: "day" }
      case "monthly":
        return { price: space.price_per_month || 300, unit: "month" }
      default:
        return { price: space.price_per_day || 15, unit: "day" }
    }
  }

  const pricing = getPricing()

  const getFeatureIcon = (feature: string) => {
    const lowerFeature = feature.toLowerCase()
    if (lowerFeature.includes("cctv") || lowerFeature.includes("security")) return <Shield className="w-4 h-4" />
    if (lowerFeature.includes("electric") || lowerFeature.includes("charging")) return <Zap className="w-4 h-4" />
    if (lowerFeature.includes("covered") || lowerFeature.includes("garage")) return <Car className="w-4 h-4" />
    return <MapPin className="w-4 h-4" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{space.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location & Rating */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{space.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">({mockReviews.length} reviews)</span>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="space-y-3">
            <h3 className="font-semibold">Select Duration</h3>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={selectedDuration === "hourly" ? "default" : "outline"}
                onClick={() => setSelectedDuration("hourly")}
                className="flex flex-col h-auto p-4"
              >
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-sm">Hourly</span>
                <span className="font-bold">£3/hr</span>
              </Button>
              <Button
                variant={selectedDuration === "daily" ? "default" : "outline"}
                onClick={() => setSelectedDuration("daily")}
                className="flex flex-col h-auto p-4"
              >
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-sm">Daily</span>
                <span className="font-bold">£{space.price_per_day || 15}/day</span>
              </Button>
              <Button
                variant={selectedDuration === "monthly" ? "default" : "outline"}
                onClick={() => setSelectedDuration("monthly")}
                className="flex flex-col h-auto p-4"
              >
                <Clock className="w-4 h-4 mb-1" />
                <span className="text-sm">Monthly</span>
                <span className="font-bold">£{space.price_per_month || 300}/month</span>
              </Button>
            </div>
          </div>

          {/* Current Selection */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Selected: {selectedDuration.charAt(0).toUpperCase() + selectedDuration.slice(1)} Parking
                  </p>
                  <p className="text-sm text-gray-600">
                    £{pricing.price} per {pricing.unit}
                  </p>
                </div>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Reserve Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          {space.features && space.features.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Features</h3>
              <div className="flex flex-wrap gap-2">
                {space.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {getFeatureIcon(feature)}
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {space.description && (
            <div className="space-y-3">
              <h3 className="font-semibold">Description</h3>
              <p className="text-gray-600">{space.description}</p>
            </div>
          )}

          {/* Availability */}
          <div className="space-y-3">
            <h3 className="font-semibold">Availability</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Available Now</span>
              </div>
              <div className="text-sm text-gray-600">
                {(space.total_spaces || 1) - (space.booked_spaces || 0)} of {space.total_spaces || 1} spaces available
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-3">
            <h3 className="font-semibold">Recent Reviews</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {mockReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
