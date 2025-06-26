"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import type { ParkingSpace } from "@/lib/supabase-types"
import { SpaceDetailsModal } from "./space-details-modal"

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""

interface MapboxParkingMapProps {
  spaces: ParkingSpace[]
  onSpaceSelect: (space: ParkingSpace) => void
  selectedSpaceId?: string
}

export function MapboxParkingMap({ spaces, onSpaceSelect, selectedSpaceId }: MapboxParkingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  console.log("🗺️ MapboxParkingMap received spaces:", spaces)

  // Filter spaces that have coordinates
  const spacesWithCoords = spaces.filter(
    (space) => space.latitude && space.longitude && !isNaN(space.latitude) && !isNaN(space.longitude),
  )

  console.log("🗺️ Spaces with coordinates:", spacesWithCoords)

  useEffect(() => {
    if (!mapContainer.current) {
      console.log("🗺️ Map container not ready")
      return
    }

    if (!mapboxgl.accessToken) {
      console.log("🗺️ Mapbox token not available")
      return
    }

    console.log("🗺️ Mapbox token loaded: ✅")

    // Initialize map
    if (!map.current) {
      console.log("🗺️ Initializing Mapbox map...")

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-0.1097, 51.4875], // London coordinates
        zoom: 13,
      })

      map.current.on("load", () => {
        console.log("🗺️ Map loaded successfully")
        setMapLoaded(true)
      })

      map.current.on("error", (e) => {
        console.error("🗺️ Map error:", e)
      })
    }

    return () => {
      // Cleanup markers
      markers.current.forEach((marker) => marker.remove())
      markers.current = []
    }
  }, [])

  // Add markers when map is loaded and spaces are available
  useEffect(() => {
    if (!map.current || !mapLoaded || spacesWithCoords.length === 0) {
      console.log("🗺️ Cannot add markers:", {
        mapExists: !!map.current,
        mapLoaded,
        spacesCount: spacesWithCoords.length,
      })
      return
    }

    console.log("🗺️ Adding markers for spaces:", spacesWithCoords.length)

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove())
    markers.current = []

    // Add new markers
    spacesWithCoords.forEach((space) => {
      if (!space.latitude || !space.longitude) return

      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.className = "cursor-pointer"
      markerEl.innerHTML = `
        <div class="bg-green-500 text-white px-2 py-1 rounded-md text-sm font-medium shadow-lg border-2 border-white hover:bg-green-600 transition-colors">
          £${space.price_per_day}
        </div>
      `

      // Create marker
      const marker = new mapboxgl.Marker(markerEl).setLngLat([space.longitude, space.latitude]).addTo(map.current!)

      // Add click handler
      markerEl.addEventListener("click", () => {
        console.log("🗺️ Marker clicked for space:", space.title)
        setSelectedSpace(space)
        setIsModalOpen(true)
        onSpaceSelect(space)
      })

      markers.current.push(marker)
    })

    // Fit map to show all markers if we have spaces
    if (spacesWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      spacesWithCoords.forEach((space) => {
        if (space.latitude && space.longitude) {
          bounds.extend([space.longitude, space.latitude])
        }
      })

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      })
    }
  }, [mapLoaded, spacesWithCoords, onSpaceSelect])

  if (!mapboxgl.accessToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Map configuration required</p>
          <p className="text-sm text-gray-500">Mapbox access token needed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        {spaces.length} parking spaces found
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: "#10b981" }}></div>
          <span>Available Parking</span>
        </div>
      </div>

      {/* Space Details Modal */}
      <SpaceDetailsModal space={selectedSpace} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}

// Named export

// Default export
export default MapboxParkingMap
