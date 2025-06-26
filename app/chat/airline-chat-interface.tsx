"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import type { ParkingSpace } from "@/lib/supabase-types"
import { MapboxParkingMap } from "@/components/mapbox-parking-map"

interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
  parkingSpaces?: ParkingSpace[]
}

export default function AirlineChatInterface() {
  const searchParams = useSearchParams()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false)
  const [allParkingSpaces, setAllParkingSpaces] = useState<ParkingSpace[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load initial message on component mount
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi, I'm Parkpal 3 Where would you like to park? Just tell me the location and dates, and I'll find available spaces for you!",
        timestamp: "12:10:39",
      },
    ])
  }, [])

  // Handle URL query parameter
  useEffect(() => {
    const query = searchParams.get("q")
    if (query && !hasProcessedQuery) {
      setHasProcessedQuery(true)
      setTimeout(() => {
        sendMessageWithText(query)
      }, 500)
    }
  }, [searchParams, hasProcessedQuery])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    setIsLoading(true)

    const newUserMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: "12:10:40",
    }

    setMessages((prev) => [...prev, newUserMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          conversation: messages,
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "",
        timestamp: "12:10:39",
        parkingSpaces: data.parkingSpaces || [],
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update map with new parking spaces
      if (data.parkingSpaces && data.parkingSpaces.length > 0) {
        setAllParkingSpaces(data.parkingSpaces)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: "12:10:39",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    const messageText = input.trim()
    setInput("")
    await sendMessageWithText(messageText)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSpaceSelect = (space: ParkingSpace) => {
    setSelectedSpaceId(space.id)
    // You can add more logic here for when a space is selected
    console.log("Selected parking space:", space)
  }

  return (
    <div className="flex h-screen">
      {/* Left Side - Chat Area */}
      <div className="w-1/2 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6 flex flex-col">
        {/* Chat Input at Top */}
        <div className="bg-transparent rounded-2xl border border-black p-4 flex items-center gap-4 mb-6 shadow-lg">
          {/* Left side - Typography Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-800" style={{ fontFamily: "Montserrat, sans-serif" }}>
                P
              </span>
              <span className="text-3xl text-gray-800" style={{ fontFamily: "Inria Serif, serif" }}>
                p
              </span>
            </div>
            <span className="text-gray-400 text-lg font-medium">Chat</span>
          </div>

          {/* Input field */}
          <input
            type="text"
            placeholder=""
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent text-gray-800 text-lg focus:outline-none placeholder-gray-400"
            disabled={isLoading}
          />

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto" ref={scrollAreaRef}>
          {messages.map((message, index) => (
            <div key={index}>
              {/* Message */}
              <div>
                <div className="text-sm text-gray-700 mb-1">
                  {message.role === "assistant" ? "Parkpal" : "You"} {message.timestamp}
                </div>
                <div className="text-gray-800 text-sm leading-relaxed">
                  {isLoading && index === messages.length - 1 && message.role === "assistant"
                    ? "Searching for parking spaces..."
                    : message.content}
                </div>
              </div>

              {/* Real Parking Results from Supabase */}
              {message.parkingSpaces && message.parkingSpaces.length > 0 && (
                <div className="space-y-3 mt-4">
                  {message.parkingSpaces.map((space) => (
                    <div
                      key={space.id}
                      className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedSpaceId === space.id ? "bg-white/50" : "hover:bg-white/30"
                      }`}
                      onClick={() => handleSpaceSelect(space)}
                    >
                      <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-800 text-sm font-medium">
                          {space.title}
                          {space.location && `, ${space.location}`}
                          {space.postcode && ` ${space.postcode}`}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          [{space.available_spaces || space.total_spaces || "X"}:SPACES AVAILABLE]
                        </div>
                        {space.price_per_day && (
                          <div className="text-xs text-green-600 font-medium mt-1">£{space.price_per_day}/day</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Mapbox Map */}
      <div className="w-1/2">
        <MapboxParkingMap
          spaces={allParkingSpaces}
          onSpaceSelect={handleSpaceSelect}
          selectedSpaceId={selectedSpaceId}
        />
      </div>
    </div>
  )
}
