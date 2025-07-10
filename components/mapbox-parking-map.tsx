"use client"

import { useEffect, useRef, useState } from "react"
import { getMapboxToken } from "@/lib/mapbox-config"
import { SpaceDetailsModal } from "./space-details-modal"
import { ISpaces } from "@/model/spaces"

interface MapboxParkingMapProps {
  spaces: ISpaces[]
  onSpaceSelect: (space: ISpaces | null) => void
  selectedSpace: ISpaces | null
  userLocation?: { latitude: number; longitude: number } | null
}


function MapboxParkingMap({ spaces, onSpaceSelect, selectedSpace, userLocation }: MapboxParkingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapboxgl, setMapboxgl] = useState<any>(null)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [mapLoaded, setMapLoaded] = useState(false)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null);

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

    const center = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : [-0.0877, 51.4948] // fallback to SE17

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

  useEffect(() => {
    console.log("Adding user marker, mapboxgl:", mapboxgl, "userLocation:", userLocation, "mapLoaded:", mapLoaded);
    if (!mapboxgl || !map.current || !mapLoaded) return;

    // Remove previous user marker if exists
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.backgroundColor = "#1d4ed8";
      el.style.border = "2px solid white";
      el.style.borderRadius = "9999px";
      el.style.boxShadow = "0 0 0 2px rgba(29, 78, 216, 0.5)";
      el.style.position = "relative";
      el.style.zIndex = "10";

      const marker = new mapboxgl.Marker(el)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);

      userMarkerRef.current = marker;

      map.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
      });
    }
  }, [userLocation, mapboxgl, mapLoaded]);


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

      // Create custom marker element - always green, no color change
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
      `

      const price = space.price_per_day ? `£${Number.parseFloat(space.price_per_day.toString()).toFixed(2)}` : "£N/A"
      markerElement.innerHTML = price

      // Click event to open modal (no color change)
      markerElement.addEventListener("click", () => {
        onSpaceSelect(space)
        onSpaceSelect?.(space)
      })

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([space.longitude!, space.latitude!])
        .addTo(map.current)

      markersRef.current.push(marker)
      console.log(`🗺️ Marker ${index + 1} added successfully`)
    })

    if (spacesWithCoords.length > 1 && !userLocation) {
      // Fit to bounds only if userLocation is not provided
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
    } else if (spacesWithCoords.length === 1 && !userLocation) {
      // Only center on single space if no user location
      const space = spacesWithCoords[0]
      map.current.setCenter([space.longitude!, space.latitude!])
      map.current.setZoom(15)
    }

  }, [mapLoaded, spaces, selectedSpace])

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
            <div className="w-4 h-4" style={{ backgroundColor: "#16fe35" }}></div>
            <span>Available Parking</span>
          </div>
        </div>
      </div>

      {/* Space Details Modal */}
      {selectedSpace && <SpaceDetailsModal space={selectedSpace} onClose={() => onSpaceSelect(null)} />}
    </>
  )
}

export default MapboxParkingMap
export { MapboxParkingMap }
