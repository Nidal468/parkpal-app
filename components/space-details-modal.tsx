"use client"

import { X } from "lucide-react"
import type { ParkingSpace } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  if (!isOpen || !space) return null

  const dailyPrice = space.price_per_day || 10
  const monthlyPrice = space.price_per_month || 275
  const availableSpaces = space.available_spaces || space.total_spaces || 3

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Content */}
      <div className="p-8 h-full">
        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
          {space.title || "Car park on Ambergate Street"}
        </h1>

        {/* Description */}
        <div className="mb-8">
          <p className="text-gray-800 text-lg leading-relaxed">
            <span className="font-medium">Description:</span>{" "}
            {space.description || "A car park space suitable for cars and vans. Max length allowed 16ft."}
          </p>
        </div>

        {/* Availability */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-800 text-lg font-medium">{availableSpaces} spaces available</span>
          </div>
        </div>

        {/* Pricing and Features Row */}
        <div className="flex justify-between items-start mb-8">
          {/* Pricing */}
          <div>
            <div className="grid grid-cols-2 gap-12 mb-8">
              <div>
                <div className="text-xl font-medium text-gray-800 mb-2">Daily</div>
                <div className="text-2xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xl font-medium text-gray-800 mb-2">Monthly</div>
                <div className="text-2xl font-bold text-gray-900">£{monthlyPrice.toFixed(2)}</div>
              </div>
            </div>

            {/* Features */}
            <div>
              <div className="text-xl font-medium text-gray-900 mb-4">Features:</div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-gray-800">Secure parking</div>
                <div className="text-gray-800">24/7 access</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="w-32 h-32 bg-black rounded-2xl flex items-center justify-center">
            {space.image_url ? (
              <img
                src={space.image_url || "/placeholder.svg"}
                alt={space.title}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="text-white">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Multiple Pricing Rows */}
        <div className="space-y-4 mt-12">
          <div className="flex items-center justify-between py-4">
            <div className="text-3xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors text-lg">
              Reserve
            </button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="text-3xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors text-lg">
              Reserve
            </button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="text-3xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors text-lg">
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
