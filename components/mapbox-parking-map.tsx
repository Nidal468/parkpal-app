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

  // Load Mapbox token from server
  useEffect(() => {
    const loadToken = async () => {
      const token = await getMapboxToken()
      setMapboxToken(token)
    }
    loadToken()
  }, [])

  // Load Mapbox GL JS
  useEffect(() => {
    const loadMapbox = async () => {
      if (typeof window !== "undefined") {
        const mapboxgl = await import("mapbox-gl")
        setMapboxgl(mapboxgl.default)
      }
    }
    loadMapbox()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || map.current || !mapboxToken) return

    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken

    // Default center (London SE17 area)
    let center = [-0.0877, 51.4948] // SE17 coordinates

    // If we have spaces with coordinates, center on the first one
    if (spaces.length > 0 && spaces[0].latitude && spaces[0].longitude) {
      center = [spaces[0].longitude, spaces[0].latitude]
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/parkpal33/cmcca0287043d01s53esbas0y", // Your custom style
      center: center,
      zoom: 14,
    })

    map.current.on("load", () => {
      addParkingSpaces()
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [mapboxgl, mapboxToken, spaces])

  const addParkingSpaces = () => {
    if (!map.current || !spaces.length) return

    // Add markers for each parking space
    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) return

      // Create custom marker element with price
      const markerElement = document.createElement("div")
      markerElement.className = "parking-marker"
      markerElement.style.cssText = `
        background-color: #ffffff;
        border: 2px solid #f59e0b;
        border-radius: 8px;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        color: #000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        white-space: nowrap;
        transition: all 0.2s ease;
        ${selectedSpaceId === space.id ? "transform: scale(1.1); border-color: #dc2626; background-color: #fef2f2;" : ""}
      `
      markerElement.innerHTML = `£${space.price_per_day || "N/A"}`

      // Create hover tooltip
      const tooltip = document.createElement("div")
      tooltip.className = "marker-tooltip"
      tooltip.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 1000;
        margin-bottom: 8px;
      `
      tooltip.innerHTML = `
        <div style="font-weight: bold;">${space.title}</div>
        <div style="opacity: 0.8; margin-top: 2px;">${space.description || space.location || ""}</div>
      `

      markerElement.appendChild(tooltip)

      // Hover events
      markerElement.addEventListener("mouseenter", () => {
        tooltip.style.opacity = "1"
        markerElement.style.transform = "scale(1.05)"
      })

      markerElement.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0"
        if (selectedSpaceId !== space.id) {
          markerElement.style.transform = "scale(1)"
        }
      })

      // Click event to open modal
      markerElement.addEventListener("click", () => {
        setSelectedSpace(space)
        setIsModalOpen(true)
        onSpaceSelect?.(space)
      })

      // Create marker
      const marker = new mapboxgl.Marker(markerElement).setLngLat([space.longitude, space.latitude]).addTo(map.current)
    })

    // Fit map to show all markers if we have multiple spaces
    if (spaces.length > 1) {
      const coordinates = spaces
        .filter((space) => space.latitude && space.longitude)
        .map((space) => [space.longitude!, space.latitude!])

      if (coordinates.length > 0) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord)
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 16,
        })
      }
    }
  }

  // Update markers when selected space changes
  useEffect(() => {
    if (!map.current) return

    // Remove existing markers and re-add them
    const markers = document.querySelectorAll(".parking-marker")
    markers.forEach((marker) => {
      const parent = marker.parentElement
      if (parent) parent.remove()
    })

    addParkingSpaces()
  }, [selectedSpaceId])

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

        {/* Map controls overlay */}
        <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          {spaces.length} parking spaces found
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-yellow-500 rounded"></div>
            <span>Available Parking</span>
          </div>
        </div>
      </div>

      {/* Space Details Modal */}
      <SpaceDetailsModal space={selectedSpace} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
