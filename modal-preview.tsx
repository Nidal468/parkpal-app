"use client"

import { useState } from "react"
import { X } from "lucide-react"

// Mock space data for preview
const mockSpace = {
  title: "Car park on Ambergate Street",
  description: "A car park space suitable for cars and vans. Max length allowed 16ft.",
  price_per_day: 10.0,
  price_per_month: 275.0,
  available_spaces: 3,
  image_url: null,
}

export default function ModalPreview() {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [pricingMode, setPricingMode] = useState<"daily" | "monthly">("daily")

  const dailyPrice = mockSpace.price_per_day
  const monthlyPrice = mockSpace.price_per_month
  const availableSpaces = mockSpace.available_spaces

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {/* Button to open modal */}
      <button onClick={() => setIsModalOpen(true)} className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium">
        Open Modal Preview
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50" style={{ width: "50%" }}>
          {/* Close button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>

          {/* Content */}
          <div className="p-8 h-full">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">{mockSpace.title}</h1>

            <p className="text-gray-700 mb-6">Description: {mockSpace.description}</p>

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

            {/* Current Price Display */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-900">
                £{pricingMode === "daily" ? dailyPrice.toFixed(2) : monthlyPrice.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">per {pricingMode}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
