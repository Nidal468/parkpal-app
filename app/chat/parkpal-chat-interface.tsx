"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, MapPin, Calendar, Clock, ExternalLink } from "lucide-react"
import { ParkpalBookingModal } from "@/components/parkpal-booking-modal"
import type { ParkingSpace } from "@/lib/supabase-types"
import { toast } from "@/hooks/use-toast"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  metadata?: {
    spaces?: ParkingSpace[]
    selectedDates?: {
      from: Date | undefined
      to: Date | undefined
    }
    selectedTime?: string
    bookingData?: any
  }
}

export function ParkpalChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "👋 Hi! I'm your Parkpal assistant. I can help you find and book parking spaces. Where would you like to park?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [bookingContext, setBookingContext] = useState<{
    selectedDates?: { from: Date | undefined; to: Date | undefined }
    selectedTime?: string
  }>({})

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || "I'm sorry, I couldn't process that request.",
        role: "assistant",
        timestamp: new Date(),
        metadata: data.metadata,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Handle booking context from chat
      if (data.metadata?.selectedDates || data.metadata?.selectedTime) {
        setBookingContext({
          selectedDates: data.metadata.selectedDates,
          selectedTime: data.metadata.selectedTime,
        })
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again.",
        role: "assistant",
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
    setIsBookingModalOpen(true)
  }

  const handleBookingConfirm = async (bookingData: any) => {
    try {
      console.log("🚗 Confirming booking with demo-store integration...")
      toast({
        title: "🎉 Booking Confirmed!",
        description: "Your parking space has been reserved via demo-store-core",
      })
    } catch (error) {
      console.error("Booking confirmation failed:", error)
      toast({
        title: "❌ Booking Failed",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const renderSpaceCards = (spaces: ParkingSpace[]) => {
    return (
      <div className="grid gap-3 mt-3">
        {spaces.slice(0, 3).map((space) => (
          <Card key={space.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-sm">{space.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {space.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${space.hourly_rate}/hr</p>
                  <p className="text-xs text-muted-foreground">${space.daily_rate}/day</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {space.features?.slice(0, 3).map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs px-2 py-0">
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-[#9ef01a] hover:bg-[#8ed617] text-black text-xs"
                  onClick={() => handleSpaceSelect(space)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Book via Demo Store
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src="/parkpal-logo-chat.png" alt="Parkpal" />
            <AvatarFallback className="bg-[#9ef01a] text-black text-xs">PP</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sm">Parkpal Assistant</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Powered by demo-store-core
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                <div
                  className={`rounded-lg p-3 text-sm ${
                    message.role === "user" ? "bg-[#9ef01a] text-black ml-auto" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Render parking spaces if available */}
                  {message.metadata?.spaces && renderSpaceCards(message.metadata.spaces)}

                  {/* Show booking context */}
                  {message.metadata?.selectedDates && (
                    <div className="mt-2 p-2 bg-white/20 rounded text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {message.metadata.selectedDates.from?.toLocaleDateString()} -{" "}
                          {message.metadata.selectedDates.to?.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {message.metadata?.selectedTime && (
                    <div className="mt-1 p-2 bg-white/20 rounded text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{message.metadata.selectedTime}</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {message.role === "assistant" && (
                <Avatar className="w-6 h-6 order-1 mr-2">
                  <AvatarImage src="/parkpal-logo-chat.png" alt="Parkpal" />
                  <AvatarFallback className="bg-[#9ef01a] text-black text-xs">PP</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/parkpal-logo-chat.png" alt="Parkpal" />
                  <AvatarFallback className="bg-[#9ef01a] text-black text-xs">PP</AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
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
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="p-4 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about parking spaces, dates, or locations..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-[#9ef01a] hover:bg-[#8ed617] text-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <ExternalLink className="w-3 h-3" />
          <span>Integrated with demo-store-core backend</span>
        </div>
      </div>

      {/* Booking Modal */}
      <ParkpalBookingModal
        space={selectedSpace}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setSelectedSpace(null)
        }}
        selectedDates={bookingContext.selectedDates}
        selectedTime={bookingContext.selectedTime}
      />
    </div>
  )
}
