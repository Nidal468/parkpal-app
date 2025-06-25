"use client"

import { useState } from "react"
import { X, MapPin, Clock, Car } from "lucide-react"
import type { ParkingSpace } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [pricingMode, setPricingMode] = useState<"daily" | "monthly">("daily")

  if (!isOpen || !space) return null

  const dailyPrice = space.price_per_day || 0
  const monthlyPrice = space.price_per_month || dailyPrice * 25 // Estimate if not set

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{space.title}</h2>
              <div className="flex items-center gap-1 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {space.location}, {space.postcode}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          {space.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{space.description}</p>
            </div>
          )}

          {/* Availability */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Availability</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                {space.available_spaces || space.total_spaces || "X"} spaces available
              </span>
            </div>
          </div>

          {/* Pricing Toggle */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPricingMode("daily")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  pricingMode === "daily" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPricingMode("monthly")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  pricingMode === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
            </div>

            <div className="mt-4 text-center">
              <div className="text-3xl font-bold text-gray-900">
                £{pricingMode === "daily" ? dailyPrice : monthlyPrice}
              </div>
              <div className="text-sm text-gray-600">per {pricingMode === "daily" ? "day" : "month"}</div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Car className="w-4 h-4" />
                <span>Secure parking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>24/7 access</span>
              </div>
            </div>
          </div>

          {/* Check-in CTA */}
          <button className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Proceed to Check-in
          </button>
        </div>
      </div>
    </div>
  )
}
