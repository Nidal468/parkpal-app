"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ParkingResultCard } from "@/components/parking-result-card"
import { AirlineNav } from "@/components/airline-nav"
import { CheckInPage } from "@/components/checkin-page"
import type { ParkingSpace } from "@/lib/supabase-types"
import Image from "next/image"

interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
  parkingSpaces?: ParkingSpace[]
}

export default function AirlineChatInterface() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"search" | "checkin" | "profile">("search")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Load initial message on component mount
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi, I'm Parkpal  Where would you like to park? Just tell me the location and dates, and I'll find available spaces for you!",
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
        content: data.message || "I found these options:",
        timestamp: "12:10:39",
        parkingSpaces: data.parkingSpaces || [],
      }

      setMessages((prev) => [...prev, assistantMessage])
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
    setSelectedSpace(space)
    setActiveTab("checkin")
  }

  const renderSearchContent = () => (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        <div className="space-y-6 max-w-4xl">
          {messages.map((message, index) => (
            <div key={index} className="space-y-4">
              {/* Message */}
              <div className={cn("flex gap-3", message.role === "user" && "justify-end")}>
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <Image src="/parkpal-logo-minimal.png" alt="P" width={16} height={16} className="w-4 h-4" />
                  </div>
                )}

                <div className={cn("max-w-[70%]", message.role === "user" && "order-first")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.role === "assistant" ? "Parkpal" : "You"}
                    </span>
                    <span className="text-xs text-gray-500">{message.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      message.role === "assistant" ? "bg-gray-50 text-gray-900" : "bg-blue-500 text-white ml-auto",
                    )}
                  >
                    {isLoading && index === messages.length - 1 && message.role === "assistant" ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Finding parking spaces...</span>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-medium">
                    You
                  </div>
                )}
              </div>

              {/* Parking Results */}
              {message.parkingSpaces && message.parkingSpaces.length > 0 && (
                <div className="ml-11 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {message.parkingSpaces.map((space) => (
                      <ParkingResultCard key={space.id} space={space} onSelect={handleSpaceSelect} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <div className="flex gap-3 max-w-4xl">
          <div className="flex-1 relative">
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-gray-300"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderProfileContent = () => (
    <div className="flex-1 p-6 bg-white">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">PROFILE</h1>
        <div className="grid grid-cols-1 gap-3">
          <Button variant="outline" className="justify-start h-12 text-left">
            My Bookings
          </Button>
          <Button variant="outline" className="justify-start h-12 text-left">
            Vehicle Info
          </Button>
          <Button variant="outline" className="justify-start h-12 text-left">
            Saved Locations
          </Button>
          <Button variant="outline" className="justify-start h-12 text-left">
            Settings
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-white">
      <AirlineNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col">
        {activeTab === "search" && renderSearchContent()}
        {activeTab === "checkin" && <CheckInPage selectedSpace={selectedSpace} />}
        {activeTab === "profile" && renderProfileContent()}
      </div>
    </div>
  )
}
