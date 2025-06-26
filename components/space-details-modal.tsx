"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ParkingSpace } from "@/lib/supabase-types"

interface SpaceDetailsModalProps {
  space: ParkingSpace | null
  isOpen: boolean
  onClose: () => void
}

export function SpaceDetailsModal({ space, isOpen, onClose }: SpaceDetailsModalProps) {
  const [isMonthly, setIsMonthly] = useState(false)

  // Reset to daily when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsMonthly(false)
    }
  }, [isOpen])

  if (!isOpen || !space) return null

  // Calculate prices
  const dailyPrice = space.price_per_day ? Number.parseFloat(space.price_per_day.toString()) : 0
  const monthlyPrice = space.price_per_month ? Number.parseFloat(space.price_per_month.toString()) : dailyPrice * 30

  const currentPrice = isMonthly ? monthlyPrice : dailyPrice
  const priceLabel = isMonthly ? "per month" : "per day"

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal - slides in from right, 50% width */}
      <div className="relative ml-auto w-1/2 h-full bg-white shadow-xl overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{space.title}</h2>
            <p className="text-gray-600">{space.address}</p>
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
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Secure parking
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                24/7 access
              </Badge>
            </div>
          </div>

          {/* Image */}
          <div className="mb-8">
            <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
              <img src="/placeholder.jpg" alt={space.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Bottom Reservation Section - 3 rows without separators */}
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold">
                  £{currentPrice.toFixed(2)} {priceLabel}
                </div>
                <div className="text-sm text-gray-600">Standard rate</div>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6">Reserve</Button>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold">
                  £{(currentPrice * 0.9).toFixed(2)} {priceLabel}
                </div>
                <div className="text-sm text-gray-600">Early bird discount</div>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6">Reserve</Button>
            </div>

            {/* Row 3 */}
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-semibold">
                  £{(currentPrice * 0.8).toFixed(2)} {priceLabel}
                </div>
                <div className="text-sm text-gray-600">Long-term discount</div>
              </div>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6">Reserve</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
