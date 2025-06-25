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
      className={`fixed top-0 right-0 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ width: "50vw" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
      >
        <X className="w-5 h-5 text-gray-900" />
      </button>

      {/* Content */}
      <div className="p-8 h-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{space.title || "Car park on Ambergate Street"}</h1>

        <p className="text-gray-700 mb-6">
          Description: {space.description || "A car park space suitable for cars and vans. Max length allowed 16ft."}
        </p>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-gray-700">{availableSpaces} spaces available</span>
        </div>
      </div>
    </div>
  )
}
