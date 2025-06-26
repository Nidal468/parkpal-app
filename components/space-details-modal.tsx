"use client"

import { useState, useEffect } from "react"
import { X, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { ParkingSpace, Review } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [isMonthly, setIsMonthly] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [loading, setLoading] = useState(false)

  // Reset to daily when modal opens and fetch reviews
  useEffect(() => {
    if (isOpen && space) {
      setIsMonthly(false)
      fetchReviews(space.id)
    }
  }, [isOpen, space])

  const fetchReviews = async (spaceId: string) => {
    setLoading(true)
    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching reviews:", error)
        return
      }

      setReviews(reviewsData || [])

      // Calculate average rating and total reviews
      if (reviewsData && reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        setAverageRating(Math.round(avgRating * 10) / 10) // Round to 1 decimal place
        setTotalReviews(reviewsData.length)
      } else {
        setAverageRating(0)
        setTotalReviews(0)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const stars = []
    const sizeClass = size === "lg" ? "w-5 h-5" : "w-4 h-4"

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`${sizeClass} ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />,
      )
    }
    return stars
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
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
          {/* Header with Rating */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{space.title || "Parking Space"}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">{renderStars(Math.round(averageRating))}</div>
                  <span className="text-sm font-medium text-gray-900">
                    {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
                  </span>
                  <span className="text-sm text-gray-600">
                    ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
                  </span>
                </div>
                <p className="text-gray-600">
                  {space.location && `${space.location}, `}
                  {space.postcode}
                </p>
              </div>
            </div>
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
          <div className="space-y-4 mb-8">
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
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews ({totalReviews})</h3>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                        <span className="text-sm font-medium text-gray-900">{review.rating}.0</span>
                      </div>
                      <span className="text-sm text-gray-500">{formatDate(review.created_at)}</span>
                    </div>
                    {review.comment && <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
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
