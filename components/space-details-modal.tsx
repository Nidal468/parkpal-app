"use client"

import { useState, useEffect } from "react"
import { X, Star, MapPin, Clock, Shield, Eye } from "lucide-react"
import type { ParkingSpace, Review } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [pricingMode, setPricingMode] = useState<"daily" | "monthly">("daily")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && space.id) {
      fetchReviews()
    }
  }, [isOpen, space.id])

  const fetchReviews = async () => {
    try {
      setLoading(true)

      // Only run in browser to avoid SSR issues
      if (typeof window !== "undefined") {
        try {
          // Dynamic import to avoid SSR issues
          const { supabase } = await import("@/lib/supabase")
          const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .eq("space_id", space.id)
            .order("created_at", { ascending: false })

          if (error) {
            console.error("Error fetching reviews:", error)
            // Use mock data for preview
            const mockReviews: Review[] = [
              {
                id: "1",
                space_id: space.id,
                user_id: "user1",
                rating: 5,
                comment: "Excellent parking space! Very secure and convenient location.",
                created_at: "2024-01-15T10:30:00Z",
                updated_at: "2024-01-15T10:30:00Z",
              },
              {
                id: "2",
                space_id: space.id,
                user_id: "user2",
                rating: 4,
                comment: "Good value for money. Easy access and well-lit area.",
                created_at: "2024-01-10T14:20:00Z",
                updated_at: "2024-01-10T14:20:00Z",
              },
              {
                id: "3",
                space_id: space.id,
                user_id: "user3",
                rating: 5,
                comment: "Perfect for daily commuting. Highly recommend!",
                created_at: "2024-01-05T09:15:00Z",
                updated_at: "2024-01-05T09:15:00Z",
              },
            ]
            setReviews(mockReviews)
            const avgRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length
            setAverageRating(avgRating)
            setTotalReviews(mockReviews.length)
          } else {
            setReviews(data || [])
            if (data && data.length > 0) {
              const avgRating = data.reduce((sum, review) => sum + review.rating, 0) / data.length
              setAverageRating(avgRating)
              setTotalReviews(data.length)
            }
          }
        } catch (importError) {
          console.error("Error importing Supabase:", importError)
          // Fallback to mock data
          const mockReviews: Review[] = [
            {
              id: "1",
              space_id: space.id,
              user_id: "user1",
              rating: 5,
              comment: "Excellent parking space! Very secure and convenient location.",
              created_at: "2024-01-15T10:30:00Z",
              updated_at: "2024-01-15T10:30:00Z",
            },
            {
              id: "2",
              space_id: space.id,
              user_id: "user2",
              rating: 4,
              comment: "Good value for money. Easy access and well-lit area.",
              created_at: "2024-01-10T14:20:00Z",
              updated_at: "2024-01-10T14:20:00Z",
            },
          ]
          setReviews(mockReviews)
          setAverageRating(4.5)
          setTotalReviews(mockReviews.length)
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: "sm" | "md" = "md") => {
    const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5"
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const dailyPrice = space.price_per_day
  const monthlyPrice = space.price_per_month
  const availableSpaces = space.available_spaces || space.total_spaces - (space.booked_spaces || 0)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="ml-auto h-full bg-white shadow-2xl z-10 overflow-y-auto" style={{ width: "50%" }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-900" />
        </button>

        {/* Content */}
        <div className="p-8 h-full flex flex-col">
          {/* Title with Rating */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">{space.title}</h1>
            <div className="flex items-center gap-3">
              {renderStars(averageRating)}
              <span className="text-lg font-medium text-gray-900">{averageRating.toFixed(1)} stars</span>
              <span className="text-gray-600">({totalReviews} reviews)</span>
            </div>
          </div>

          <p className="text-gray-700 mb-6">{space.description}</p>

          {/* Availability and Pricing Toggle Row */}
          <div className="flex items-center justify-between mb-6">
            {/* Left side - Availability */}
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">{availableSpaces} spaces available</span>
            </div>

            {/* Right side - Pricing Toggle */}
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setPricingMode("daily")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pricingMode === "daily" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPricingMode("monthly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pricingMode === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-gray-900 font-medium">Features:</span>
              {space.features?.split(",").map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {feature.trim() === "Secure parking" && <Shield className="w-3 h-3" />}
                  {feature.trim() === "24/7 access" && <Clock className="w-3 h-3" />}
                  {feature.trim() === "CCTV" && <Eye className="w-3 h-3" />}
                  {feature.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Image Section */}
          <div className="mb-8 flex justify-center">
            <div className="w-64 h-48 bg-gray-200 rounded-lg overflow-hidden">
              {space.image_url ? (
                <img
                  src={space.image_url || "/placeholder.svg"}
                  alt="Parking space"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=192&width=256&text=Parking+Space"
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <MapPin className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>

          {/* Pricing Sections */}
          <div className="space-y-4 mb-8">
            {Array.from({ length: availableSpaces }, (_, index) => (
              <div key={index} className="flex items-center justify-between py-4">
                <div className="text-2xl font-bold text-gray-900">
                  £{pricingMode === "daily" ? dailyPrice.toFixed(2) : monthlyPrice.toFixed(2)}
                </div>
                <button className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                  Reserve
                </button>
              </div>
            ))}
          </div>

          {/* Reviews Section */}
          <div className="mt-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reviews</h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading reviews...</p>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      {renderStars(review.rating, "sm")}
                      <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No reviews yet</p>
                <p className="text-sm">Be the first to leave a review!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
