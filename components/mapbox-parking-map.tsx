"use client"

import { useEffect, useRef, useState } from "react"
import type { ParkingSpace } from "@/lib/supabase-types"
import { getMapboxToken } from "@/lib/mapbox-config"
import { SpaceDetailsModal } from "./space-details-modal"

interface MapboxParkingMapProps {
  spaces: ParkingSpace[]
  onSpaceSelect?: (space: ParkingSpace) => void
  selectedSpaceId?: string
}

export function MapboxParkingMap({ spaces, onSpaceSelect, selectedSpaceId }: MapboxParkingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapboxgl, setMapboxgl] = useState<any>(null)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const markersRef = useRef<any[]>([])

  // Debug: Log spaces data
  useEffect(() => {
    console.log("🗺️ MapboxParkingMap received spaces:", spaces)
    console.log(
      "🗺️ Spaces with coordinates:",
      spaces.filter((s) => s.latitude && s.longitude),
    )
  }, [spaces])

  // Load Mapbox token from server
  useEffect(() => {
    const loadToken = async () => {
      const token = await getMapboxToken()
      console.log("🗺️ Mapbox token loaded:", token ? "✅" : "❌")
      setMapboxToken(token)
    }
    loadToken()
  }, [])

  // Load Mapbox GL JS
  useEffect(() => {
    const loadMapbox = async () => {
      if (typeof window !== "undefined") {
        try {
          const mapboxgl = await import("mapbox-gl")
          console.log("🗺️ Mapbox GL loaded:", "✅")
          setMapboxgl(mapboxgl.default)
        } catch (error) {
          console.error("🗺️ Failed to load Mapbox GL:", error)
        }
      }
    }
    loadMapbox()
  }, [])

  // Initialize map once
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || map.current || !mapboxToken) {
      console.log("🗺️ Map initialization blocked:", {
        mapboxgl: !!mapboxgl,
        container: !!mapContainer.current,
        existingMap: !!map.current,
        token: !!mapboxToken,
      })
      return
    }

    console.log("🗺️ Initializing map...")

    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken

    // Default center (London SE17 area)
    const center = [-0.0877, 51.4948] // SE17 coordinates

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/parkpal33/cmcca0287043d01s53esbas0y",
        center: center,
        zoom: 14,
      })

      map.current.on("load", () => {
        console.log("🗺️ Map loaded successfully")
        setMapLoaded(true)
      })

      map.current.on("styledata", () => {
        console.log("🗺️ Map style loaded")
        setMapLoaded(true)
      })

      map.current.on("error", (e: any) => {
        console.error("🗺️ Map error:", e)
      })
    } catch (error) {
      console.error("🗺️ Failed to create map:", error)
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        setMapLoaded(false)
      }
    }
  }, [mapboxgl, mapboxToken])

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      marker.remove()
    })
    markersRef.current = []
  }

  // Add parking spaces when map is loaded and spaces are available
  useEffect(() => {
    if (!map.current || !mapLoaded || !spaces.length) {
      console.log("🗺️ Cannot add spaces:", {
        map: !!map.current,
        mapLoaded,
        spacesCount: spaces.length,
      })
      return
    }

    console.log("🗺️ Adding parking spaces to map...")

    // Clear existing markers first
    clearMarkers()

    const spacesWithCoords = spaces.filter((space) => space.latitude && space.longitude)
    console.log("🗺️ Spaces with coordinates:", spacesWithCoords.length)

    if (spacesWithCoords.length === 0) {
      console.log("🗺️ No spaces with coordinates found")
      return
    }

    // Add markers for each parking space
    spacesWithCoords.forEach((space, index) => {
      console.log(`🗺️ Adding marker ${index + 1}:`, {
        title: space.title,
        lat: space.latitude,
        lng: space.longitude,
        price: space.price_per_day,
      })

      // Create custom marker element - just the price text with your green color
      const markerElement = document.createElement("div")
      markerElement.className = "parking-marker"
      markerElement.style.cssText = `
        color: #16fe35;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        white-space: nowrap;
        user-select: none;
        pointer-events: auto;
        ${selectedSpaceId === space.id ? "transform: scale(1.2); color: #ff4444;" : ""}
      `

      const price = space.price_per_day ? `£${Number.parseFloat(space.price_per_day.toString()).toFixed(2)}` : "£N/A"
      markerElement.innerHTML = price

      // Click event to open modal (only interaction)
      markerElement.addEventListener("click", () => {
        setSelectedSpace(space)
        setIsModalOpen(true)
        onSpaceSelect?.(space)
      })

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([space.longitude!, space.latitude!])
        .addTo(map.current)

      markersRef.current.push(marker)
      console.log(`🗺️ Marker ${index + 1} added successfully`)
    })

    // Fit map to show all markers if we have multiple spaces
    if (spacesWithCoords.length > 1) {
      const coordinates = spacesWithCoords.map((space) => [space.longitude!, space.latitude!])

      try {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord)
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 16,
        })
        console.log("🗺️ Map bounds fitted to markers")
      } catch (error) {
        console.error("🗺️ Failed to fit bounds:", error)
      }
    } else if (spacesWithCoords.length === 1) {
      // Center on single space
      const space = spacesWithCoords[0]
      map.current.setCenter([space.longitude!, space.latitude!])
      map.current.setZoom(15)
    }
  }, [mapLoaded, spaces, selectedSpaceId])

  // Show loading state while token is being fetched
  if (!mapboxToken) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading map...</div>
      </div>
    )
  }

  return (
    <>
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="w-full h-full" />

        {/* Debug info */}
        <div className="absolute top-4 left-4 bg-red-500/80 text-white px-3 py-2 rounded-lg text-xs">
          Debug: {spaces.length} total, {spaces.filter((s) => s.latitude && s.longitude).length} with coords, Map:{" "}
          {mapLoaded ? "✅" : "⏳"}
        </div>

        {/* Map controls overlay */}
        <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          {spaces.length} parking spaces found
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ backgroundColor: "#16fe35" }}></div>
            <span>Available Parking</span>
          </div>
        </div>
      </div>

      {/* Space Details Modal */}
      <SpaceDetailsModal space={selectedSpace} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
