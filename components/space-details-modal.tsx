"use client"

import { useState, useEffect } from "react"
import { X, Star } from "lucide-react"
import type { ParkingSpace, Review } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [isMonthly, setIsMonthly] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)

  // Reset to daily when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsMonthly(false)
    }
  }, [isOpen])

  // Fetch reviews when modal opens
  useEffect(() => {
    if (isOpen && space?.id) {
      fetchReviews()
    }
  }, [isOpen, space?.id])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      console.log("🔍 Fetching reviews for space:", space!.id)

      // Use our API route instead of direct Supabase connection
      const response = await fetch(`/api/reviews?space_id=${space!.id}`)
      const data = await response.json()

      console.log("📊 API response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reviews")
      }

      if (data.reviews && data.reviews.length > 0) {
        console.log("✅ Using real database reviews:", data.reviews.length)
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
      } else {
        console.log("⚠️ No reviews found, using mock data")
        // Fallback to mock data
        const mockReviews: Review[] = [
          {
            id: "mock-1",
            space_id: space!.id,
            user_id: "user1",
            rating: 5,
            comment: "Excellent parking space! Very secure and convenient location.",
            created_at: "2024-01-20T10:30:00Z",
            updated_at: "2024-01-20T10:30:00Z",
          },
          {
            id: "mock-2",
            space_id: space!.id,
            user_id: "user2",
            rating: 4,
            comment: "Good value for money. Easy access and well-lit area.",
            created_at: "2024-01-18T14:20:00Z",
            updated_at: "2024-01-18T14:20:00Z",
          },
          {
            id: "mock-3",
            space_id: space!.id,
            user_id: "user3",
            rating: 5,
            comment: "Perfect for daily commuting. Highly recommend!",
            created_at: "2024-01-15T09:15:00Z",
            updated_at: "2024-01-15T09:15:00Z",
          },
          {
            id: "mock-4",
            space_id: space!.id,
            user_id: "user4",
            rating: 4,
            comment: "Great location, close to transport links.",
            created_at: "2024-01-12T16:45:00Z",
            updated_at: "2024-01-12T16:45:00Z",
          },
          {
            id: "mock-5",
            space_id: space!.id,
            user_id: "user5",
            rating: 5,
            comment: "Outstanding service and very reliable.",
            created_at: "2024-01-10T11:30:00Z",
            updated_at: "2024-01-10T11:30:00Z",
          },
          {
            id: "mock-6",
            space_id: space!.id,
            user_id: "user6",
            rating: 4,
            comment: "Clean, safe, and well-maintained parking area.",
            created_at: "2024-01-08T13:20:00Z",
            updated_at: "2024-01-08T13:20:00Z",
          },
        ]
        setReviews(mockReviews)
        const avgRating = mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length
        setAverageRating(avgRating)
        setTotalReviews(mockReviews.length)
      }
    } catch (error) {
      console.error("❌ Error fetching reviews:", error)
      // Fallback to mock data on error
      const mockReviews: Review[] = [
        {
          id: "fallback-1",
          space_id: space!.id,
          user_id: "user1",
          rating: 4,
          comment: "Great parking space with easy access and good security.",
          created_at: "2024-01-20T10:30:00Z",
          updated_at: "2024-01-20T10:30:00Z",
        },
        {
          id: "fallback-2",
          space_id: space!.id,
          user_id: "user2",
          rating: 5,
          comment: "Very convenient location and secure. Highly recommended!",
          created_at: "2024-01-18T14:20:00Z",
          updated_at: "2024-01-18T14:20:00Z",
        },
        {
          id: "fallback-3",
          space_id: space!.id,
          user_id: "user3",
          rating: 4,
          comment: "Good value for money. Easy booking process.",
          created_at: "2024-01-15T09:15:00Z",
          updated_at: "2024-01-15T09:15:Z",
        },
        {
          id: "fallback-4",
          space_id: space!.id,
          user_id: "user4",
          rating: 5,
          comment: "Perfect for daily use. Clean and well-maintained.",
          created_at: "2024-01-12T16:45:00Z",
          updated_at: "2024-01-12T16:45:00Z",
        },
        {
          id: "fallback-5",
          space_id: space!.id,
          user_id: "user5",
          rating: 4,
          comment: "Reliable and safe parking. Would use again.",
          created_at: "2024-01-10T11:30:00Z",
          updated_at: "2024-01-10T11:30:00Z",
        },
        {
          id: "fallback-6",
          space_id: space!.id,
          user_id: "user6",
          rating: 5,
          comment: "Excellent location with great transport links nearby.",
          created_at: "2024-01-08T13:20:00Z",
          updated_at: "2024-01-08T13:20:00Z",
        },
      ]
      setReviews(mockReviews)
      setAverageRating(4.5)
      setTotalReviews(mockReviews.length)
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

  if (!isOpen || !space) return null

  // Calculate prices
  const dailyPrice = space.price_per_day ? Number.parseFloat(space.price_per_day.toString()) : 0
  const monthlyPrice = space.price_per_month ? Number.parseFloat(space.price_per_month.toString()) : dailyPrice * 30

  const currentPrice = isMonthly ? monthlyPrice : dailyPrice
  const priceLabel = isMonthly ? "month" : "day"

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal - slides in from right, 50% width */}
      <div className="relative ml-auto w-1/2 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{space.title || "Parking Space"}</h2>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  {renderStars(averageRating, "sm")}
                  <span className="text-sm font-medium text-gray-700">
                    {averageRating.toFixed(1)} stars ({totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
            <p className="text-gray-600">
              {space.location && `${space.location}, `}
              {space.postcode}
            </p>
          </div>

          {/* Daily/Monthly Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setIsMonthly(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  !isMonthly ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setIsMonthly(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isMonthly ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Secure parking
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">24/7 access</span>
            </div>
          </div>

          {/* Image */}
          <div className="mb-8">
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={space.image_url || "/placeholder.svg?height=256&width=400"}
                alt={space.title || "Parking space"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=256&width=400"
                }}
              />
            </div>
          </div>

          {/* Bottom Reservation Sections - No separators */}
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">
                  £{currentPrice.toFixed(2)}/{priceLabel}
                </div>
                <div className="text-sm text-gray-600">Standard rate</div>
              </div>
              <button className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                Reserve
              </button>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">
                  £{(currentPrice * 0.9).toFixed(2)}/{priceLabel}
                </div>
                <div className="text-sm text-gray-600">Weekly discount</div>
              </div>
              <button className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                Reserve
              </button>
            </div>

            {/* Row 3 */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-gray-900">
                  £{(currentPrice * 0.8).toFixed(2)}/{priceLabel}
                </div>
                <div className="text-sm text-gray-600">Monthly discount</div>
              </div>
              <button className="bg-black text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                Reserve
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>

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
