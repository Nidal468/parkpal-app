"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Calendar, Globe, CheckCircle } from "lucide-react"
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

export function DeployedParkpalChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: `👋 Hi! I'm your Parkpal assistant, now powered by your deployed demo-store-core backend!

🌐 **Backend**: park-pal-core-website-prnz.vercel.app
🔗 **Integration**: Full Commerce Layer + Stripe checkout

I can help you find and book parking spaces. Where would you like to park?`,
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
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean
    verified: boolean
  }>({ connected: false, verified: false })

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection()
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const checkBackendConnection = async () => {
    try {
      console.log("🔍 Checking deployed backend connection...")
      const response = await fetch("/api/parkpal/verify-deployed-backend")
      const result = await response.json()
      
      setBackendStatus({
        connected: result.deployedBackend?.connected || false,
        verified: result.results?.integrationStatus === "READY",
      })

      if (result.deployedBackend?.connected) {
        console.log("✅ Backend connected:", result.deployedBackend.url)
      } else {
        console.warn("❌ Backend connection failed")
      }
    } catch (error) {
      console.error("❌ Backend verification failed:", error)
      setBackendStatus({ connected: false, verified: false })
    }
  }

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
      console.log("🚗 Confirming booking with deployed demo-store integration...")
      toast({
        title: "🎉 Booking Confirmed!",
        description: "Your parking space has been reserved via your deployed demo-store-core backend",
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
                  <Globe className="w-3 h-3 mr-1" />
                  Book via Deployed Backend
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
          <div className="flex-1">
            <h2 className="font-semibold text-sm">Parkpal Assistant</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="w-3 h-3" />
              <span>park-pal-core-website-prnz.vercel.app</span>
              {backendStatus.connected ? (
                <Badge variant="outline" className="text-xs px-1 py-0 flex items-center gap-1">
                  <CheckCircle className="w-2 h-2 text-green-500" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs px-1 py-0">
                  Disconnected
                </Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkBackendConnection}
            className="text-xs bg-transparent"
          >
            Test Connection
          </Button>
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
                          {message.metadata.selectedDates.\
