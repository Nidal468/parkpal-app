"use client"

import { useState } from "react"
import { SpaceDetailsModal } from "@/components/space-details-modal"
import type { ParkingSpace } from "@/lib/supabase-types"

export default function ModalPreview() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock parking space data for preview (no Supabase needed)
  const mockSpace: ParkingSpace = {
    id: "mock-space-1",
    host_id: "mock-host-1",
    title: "Car park on Ambergate Street",
    description: "A car park space suitable for cars and vans. Max length allowed 16ft.",
    location: "Kennington",
    postcode: "SE17 3RY",
    price_per_day: 12.5,
    price_per_month: 275.0,
    total_spaces: 3,
    booked_spaces: 1,
    available_spaces: 2,
    image_url: "/placeholder.svg?height=256&width=400&text=Parking+Space",
    latitude: 51.4875,
    longitude: -0.1097,
    address: "123 Ambergate Street",
    features: "Secure parking,24/7 access,CCTV",
    is_available: true,
    available_from: "2024-01-01",
    available_to: "2024-12-31",
    what3words: "///example.words.here",
    available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
    available_hours: "00:00-23:59",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Modal Preview</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to see the parking space modal with the 5-star review system.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Open Modal Preview
        </button>

        <div className="mt-6 text-sm text-gray-500">
          <p>Features included:</p>
          <ul className="mt-2 space-y-1">
            <li>• 5-star rating system</li>
            <li>• Daily/Monthly pricing toggle</li>
            <li>• Reviews section</li>
            <li>• Clean design without separators</li>
          </ul>
        </div>
      </div>

      <SpaceDetailsModal space={mockSpace} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
