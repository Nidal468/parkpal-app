"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapboxParkingMap } from "@/components/mapbox-parking-map"
import { SpaceDetailsModal } from "@/components/space-details-modal"
import type { ParkingSpace } from "@/lib/supabase-types"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  spaces?: ParkingSpace[]
}

export default function AirlineChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hi! I'm your ParkPal assistant. I can help you find parking spaces in London. Try searching for areas like 'SE17', 'Kennington', or 'Borough'.",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: data.response,
        timestamp: new Date(),
        spaces: data.spaces || [],
      }

      setMessages((prev) => [...prev, botMessage])

      // Update spaces for map
      if (data.spaces && data.spaces.length > 0) {
        setSpaces(data.spaces)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSpaceSelect = (space: ParkingSpace) => {
    setSelectedSpace(space)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSpace(null)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Panel */}
      <div className="w-1/2 flex flex-col bg-white border-r">
        {/* Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">ParkPal Assistant</h1>
              <p className="text-sm text-gray-600">Find parking spaces in London</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user" ? "bg-blue-600" : "bg-green-600"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="space-y-2">
                  <div
                    className={`p-3 rounded-lg ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Show spaces if available */}
                  {message.spaces && message.spaces.length > 0 && (
                    <div className="space-y-2">
                      {message.spaces.map((space) => (
                        <Card
                          key={space.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleSpaceSelect(space)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 text-sm">{space.title}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-600">
                                    {space.location}, {space.postcode}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    £{space.price_per_day}/day
                                  </Badge>
                                  {space.price_per_month && (
                                    <Badge variant="outline" className="text-xs">
                                      £{space.price_per_month}/month
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about parking in London..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map Panel */}
      <div className="w-1/2 relative">
        <MapboxParkingMap spaces={spaces} onSpaceSelect={handleSpaceSelect} selectedSpaceId={selectedSpace?.id} />
      </div>

      {/* Space Details Modal */}
      <SpaceDetailsModal space={selectedSpace} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  )
}
