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
  onSpaceSelect?: (space: ParkingSpace) => void
  selectedSpaceId?: string | null
}

export function MapboxParkingMap({ spaces, onSpaceSelect, selectedSpaceId }: MapboxParkingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  console.log("🗺️ MapboxParkingMap received spaces:", spaces)
  console.log(
    "🗺️ Spaces with coordinates:",
    spaces.filter((s) => s.latitude && s.longitude),
  )

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return

    console.log("🗺️ Mapbox token loaded:", mapboxgl.accessToken ? "✅" : "❌")

    if (!mapboxgl.accessToken) {
      console.log("🗺️ Map initialization blocked:", { reason: "No access token" })
      return
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-0.1276, 51.5074], // London center
        zoom: 12,
      })

      map.current.on("load", () => {
        console.log("🗺️ Mapbox GL loaded:", "✅")
        setMapLoaded(true)
      })

      map.current.on("error", (e) => {
        console.error("🗺️ Mapbox error:", e)
      })
    } catch (error) {
      console.error("🗺️ Map initialization error:", error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  // Add markers when map is loaded and spaces change
  useEffect(() => {
    if (!map.current || !mapLoaded || !spaces.length) {
      console.log("🗺️ Cannot add spaces:", {
        mapExists: !!map.current,
        mapLoaded,
        spacesCount: spaces.length,
      })
      return
    }

    // Clear existing markers
    const existingMarkers = document.querySelectorAll(".mapbox-marker")
    existingMarkers.forEach((marker) => marker.remove())

    // Add new markers
    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) {
        console.log("🗺️ Skipping space without coordinates:", space.title)
        return
      }

      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.className = "mapbox-marker"
      markerEl.style.cssText = `
        background-color: #10b981;
        color: white;
        border-radius: 20px;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        white-space: nowrap;
      `
      markerEl.textContent = `£${space.price_per_day || 10}`

      // Add click handler
      markerEl.addEventListener("click", () => {
        setSelectedSpace(space)
        setIsModalOpen(true)
        if (onSpaceSelect) {
          onSpaceSelect(space)
        }
      })

      // Create and add marker
      new mapboxgl.Marker(markerEl).setLngLat([space.longitude, space.latitude]).addTo(map.current!)

      console.log("🗺️ Added marker for:", space.title, "at", [space.longitude, space.latitude])
    })

    // Fit map to show all markers if we have spaces
    if (spaces.length > 0) {
      const coordinates = spaces
        .filter((space) => space.latitude && space.longitude)
        .map((space) => [space.longitude!, space.latitude!] as [number, number])

      if (coordinates.length > 0) {
        const bounds = new mapboxgl.LngLatBounds()
        coordinates.forEach((coord) => bounds.extend(coord))

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        })
      }
    }
  }, [mapLoaded, spaces, onSpaceSelect])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapboxgl.accessToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <p className="text-gray-600">Map requires Mapbox access token</p>
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
