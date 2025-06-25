"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { ParkingSpace } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [pricingMode, setPricingMode] = useState<"daily" | "monthly">("daily")

  if (!isOpen || !space) return null

  const dailyPrice = space.price_per_day || 10
  const monthlyPrice = space.price_per_month || 275
  const availableSpaces = space.available_spaces || space.total_spaces || 3

  return (
    <div className={`fixed top-0 right-0 h-full bg-white`} style={{ width: "50%" }}>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
      >
        <X className="w-5 h-5 text-gray-900" />
      </button>

      {/* Content */}
      <div className="p-8 h-full flex flex-col">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{space.title || "Car park on Ambergate Street"}</h1>

        <p className="text-gray-700 mb-6">
          Description: {space.description || "A car park space suitable for cars and vans. Max length allowed 16ft."}
        </p>

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
          <div className="flex items-center gap-8">
            <span className="text-gray-900 font-medium">Features:</span>
            <span className="text-gray-700">Secure parking</span>
            <span className="text-gray-700">24/7 access</span>
          </div>
        </div>

        {/* Image Section - Larger and Lower */}
        <div className="mb-8 flex justify-end">
          <div className="w-48 h-36 bg-black rounded-lg flex items-center justify-center">
            {space.image_url ? (
              <img
                src={space.image_url || "/placeholder.svg"}
                alt="Parking space"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-white">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Available Spaces - Bottom Section */}
        <div className="mt-auto space-y-4">
          {Array.from({ length: availableSpaces }, (_, index) => (
            <div key={index} className="flex items-center justify-between py-4 border-t border-gray-200">
              <div className="text-2xl font-bold text-gray-900">
                £{pricingMode === "daily" ? dailyPrice.toFixed(2) : monthlyPrice.toFixed(2)}
              </div>
              <button className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                Reserve
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
