"use client"

import { useEffect, useRef, useState } from "react"
import type { ParkingSpace } from "@/lib/supabase-types"
import { getMapboxToken } from "@/lib/mapbox-config"

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

    // Default center (London)
    let center = [-0.1278, 51.5074]

    // If we have spaces with coordinates, center on the first one
    if (spaces.length > 0 && spaces[0].latitude && spaces[0].longitude) {
      center = [spaces[0].longitude, spaces[0].latitude]
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11", // Dark theme to match your design
      center: center,
      zoom: 13,
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

      // Create custom marker element
      const markerElement = document.createElement("div")
      markerElement.className = "parking-marker"
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: #fbbf24;
        border: 2px solid #f59e0b;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: #000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${selectedSpaceId === space.id ? "transform: scale(1.2); background-color: #ef4444; border-color: #dc2626;" : ""}
      `
      markerElement.textContent = "P"

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${space.title}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${space.location || ""}</p>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${space.postcode || ""}</p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; color: #666;">
              ${space.available_spaces || space.total_spaces || "X"} spaces available
            </span>
            <span style="font-size: 14px; font-weight: bold; color: #059669;">
              £${space.price_per_day || "N/A"}/day
            </span>
          </div>
        </div>
      `)

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([space.longitude, space.latitude])
        .setPopup(popup)
        .addTo(map.current)

      // Add click handler
      markerElement.addEventListener("click", () => {
        onSpaceSelect?.(space)
      })
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
          maxZoom: 15,
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
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading map...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        {spaces.length} parking spaces found
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 border border-yellow-500 rounded-full"></div>
          <span>Available Parking</span>
        </div>
      </div>
    </div>
  )
}
