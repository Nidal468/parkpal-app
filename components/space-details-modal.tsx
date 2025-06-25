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

  const dailyPrice = space.price_per_day || 0
  const monthlyPrice = space.price_per_month || dailyPrice * 25 // Estimate if not set
  const availableSpaces = space.available_spaces || space.total_spaces || 3

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{space.title}</h1>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 h-full overflow-hidden">
        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700 text-base leading-relaxed">
            <span className="font-medium">Description:</span>{" "}
            {space.description || "A car park space suitable for cars and vans. Max length allowed 16ft."}
          </p>
        </div>

        {/* Availability */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 font-medium">{availableSpaces} spaces available</span>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-700 mb-1">Daily</div>
              <div className="text-2xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-medium text-gray-700 mb-1">Monthly</div>
              <div className="text-2xl font-bold text-gray-900">£{monthlyPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <div className="text-lg font-medium text-gray-900 mb-3">Features:</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-gray-700">Secure parking</div>
            <div className="text-gray-700">24/7 access</div>
          </div>
        </div>

        {/* Image */}
        <div className="mb-6">
          <div className="w-32 h-32 bg-black rounded-2xl flex items-center justify-center ml-auto">
            {space.image_url ? (
              <img
                src={space.image_url || "/placeholder.svg"}
                alt={space.title}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="text-white">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Booking Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div className="text-xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors">
              Reserve
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-gray-100">
            <div className="text-xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors">
              Reserve
            </button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="text-xl font-bold text-gray-900">£{dailyPrice.toFixed(2)}</div>
            <button className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors">
              Reserve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
