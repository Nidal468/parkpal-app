"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Send,
  Loader2,
  AlertCircle,
  Map,
  Grid,
  CalendarIcon,
  X,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ParkingSpaceCard } from "@/components/parking-space-card"
import { ParkingMap } from "@/components/parking-map"
import { BookingModal, type BookingData } from "@/components/booking-modal"
import type { ParkingSpace } from "@/lib/supabase-types"
import Image from "next/image"

interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
  parkingSpaces?: ParkingSpace[]
}

// Simple booking flow stages
type BookingStage = "chat" | "date-selection" | "time-selection" | "complete"

export default function ChatInterface() {
  const searchParams = useSearchParams()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false)

  // Simple booking flow state
  const [bookingStage, setBookingStage] = useState<BookingStage>("chat")
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [selectedTime, setSelectedTime] = useState("")
  const [latestParkingSpaces, setLatestParkingSpaces] = useState<ParkingSpace[]>([])

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Generate 30-minute time slots
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const min = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${min}`
  })

  // Load initial message on component mount
  useEffect(() => {
    console.log("🚀 ChatInterface mounted - DEBUG VERSION")
    setMessages([
      {
        role: "assistant",
        content:
          "Hi, I'm Parkpal 👋 Where would you like to park? Just tell me the location and I'll find available spaces for you!",
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }, [])

  // Handle URL query parameter
  useEffect(() => {
    const query = searchParams.get("q")
    console.log("🔗 URL query parameter:", query)
    if (query && !hasProcessedQuery) {
      console.log("📝 Processing URL query:", query)
      setHasProcessedQuery(true)
      setTimeout(() => {
        sendMessageWithText(query)
      }, 500)
    }
  }, [searchParams, hasProcessedQuery])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    console.log("📜 Messages updated, count:", messages.length)
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, bookingStage])

  const sendMessageWithText = async (messageText: string) => {
    console.log("📤 sendMessageWithText called with:", messageText)

    if (!messageText.trim() || isLoading) {
      console.log("❌ Message rejected - empty or loading")
      return
    }

    setError(null)
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString(),
    }

    console.log("👤 Adding user message:", newUserMessage)
    setMessages((prev) => {
      console.log("📝 Previous messages count:", prev.length)
      const newMessages = [...prev, newUserMessage]
      console.log("📝 New messages count:", newMessages.length)
      return newMessages
    })

    // Handle simple commands
    if (messageText.toLowerCase().trim() === "date") {
      console.log("📅 Date command detected")
      setBookingStage("date-selection")
      const dateMessage: Message = {
        role: "assistant",
        content: "Perfect! Please select your booking dates below:",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, dateMessage])
      setIsLoading(false)
      return
    }

    if (messageText.toLowerCase().trim() === "time") {
      console.log("🕐 Time command detected")
      setBookingStage("time-selection")
      const timeMessage: Message = {
        role: "assistant",
        content: "Great! Now select your preferred arrival time:",
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, timeMessage])
      setIsLoading(false)
      return
    }

    // Add thinking message for parking searches
    const thinkingMessage: Message = {
      role: "assistant",
      content: "Searching for parking spaces...",
      timestamp: new Date().toLocaleTimeString(),
    }

    console.log("🤔 Adding thinking message")
    setMessages((prev) => [...prev, thinkingMessage])

    try {
      console.log("🌐 Making API call to /api/chat")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          conversation: messages.filter((msg) => msg.content !== "Searching for parking spaces..."),
        }),
      })

      console.log("📡 API Response status:", response.status)
      console.log("📡 API Response ok:", response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API Error:", errorText)
        throw new Error(`Server error: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      console.log("📄 Content-Type:", contentType)

      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        console.error("❌ Non-JSON response:", errorText)
        throw new Error("Server returned invalid response format")
      }

      const data = await response.json()
      console.log("📥 FULL API RESPONSE RECEIVED:")
      console.log("📥 - message:", data.message)
      console.log("📥 - parkingSpaces:", data.parkingSpaces)
      console.log("📥 - parkingSpaces length:", data.parkingSpaces?.length)
      console.log("📥 - parkingSpaces type:", typeof data.parkingSpaces)
      console.log("📥 - parkingSpaces is array:", Array.isArray(data.parkingSpaces))

      if (data.error) {
        console.error("❌ API returned error:", data.error)
        throw new Error(data.error)
      }

      // Replace thinking message with actual response
      console.log("🔄 Replacing thinking message with API response")
      setMessages((prev) => {
        console.log("📝 Before replacing thinking message, count:", prev.length)
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: data.message || "Sorry, I couldn't process that request.",
          timestamp: new Date().toLocaleTimeString(),
          parkingSpaces: data.parkingSpaces || undefined,
        }
        console.log("📝 After replacing thinking message, count:", newMessages.length)
        console.log("📝 Last message now has parkingSpaces:", !!newMessages[newMessages.length - 1].parkingSpaces)
        console.log("📝 Last message parkingSpaces count:", newMessages[newMessages.length - 1].parkingSpaces?.length)
        return newMessages
      })

      // Store parking spaces and add follow-up if found
      console.log("🔍 CHECKING IF WE SHOULD ADD FOLLOW-UP MESSAGE...")
      console.log("🔍 - data.parkingSpaces exists:", !!data.parkingSpaces)
      console.log("🔍 - data.parkingSpaces is array:", Array.isArray(data.parkingSpaces))
      console.log("🔍 - data.parkingSpaces length:", data.parkingSpaces?.length)

      if (data.parkingSpaces && Array.isArray(data.parkingSpaces) && data.parkingSpaces.length > 0) {
        console.log("✅ PARKING SPACES FOUND! Setting latest spaces and adding follow-up")
        console.log(
          "✅ Spaces to store:",
          data.parkingSpaces.map((s) => ({ id: s.id, title: s.title })),
        )

        setLatestParkingSpaces(data.parkingSpaces)

        // Add simple follow-up message
        console.log("⏰ Setting timeout for follow-up message (800ms)")
        setTimeout(() => {
          console.log("📨 ADDING FOLLOW-UP MESSAGE NOW!")
          const followUpMessage: Message = {
            role: "assistant",
            content: "Type 'date' to set your booking duration, or click on any space to book directly.",
            timestamp: new Date().toLocaleTimeString(),
          }
          console.log("📨 Follow-up message created:", followUpMessage)

          setMessages((prevMessages) => {
            console.log("📝 Adding follow-up to messages. Previous count:", prevMessages.length)
            const newMessages = [...prevMessages, followUpMessage]
            console.log("📝 New count after follow-up:", newMessages.length)
            console.log(
              "📝 All messages after follow-up:",
              newMessages.map((m) => ({ role: m.role, content: m.content.substring(0, 50) + "..." })),
            )
            return newMessages
          })
        }, 800)
      } else {
        console.log("❌ NO PARKING SPACES FOUND OR INVALID FORMAT")
        console.log("❌ - data.parkingSpaces:", data.parkingSpaces)
        console.log("❌ - typeof data.parkingSpaces:", typeof data.parkingSpaces)
        console.log("❌ - Array.isArray(data.parkingSpaces):", Array.isArray(data.parkingSpaces))
      }
    } catch (error) {
      console.error("💥 Error in sendMessageWithText:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")

      // Replace thinking message with error message
      setMessages((prev) => {
        const newMessages = [...prev]
        if (newMessages[newMessages.length - 1]?.content === "Searching for parking spaces...") {
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. Please try again.",
            timestamp: new Date().toLocaleTimeString(),
          }
        }
        return newMessages
      })
    } finally {
      console.log("🏁 sendMessageWithText completed, setting loading to false")
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    const messageText = input.trim()
    console.log("📤 sendMessage called, clearing input and calling sendMessageWithText")
    setInput("")
    await sendMessageWithText(messageText)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleBookSpace = (spaceId: string) => {
    console.log("🎯 handleBookSpace called for space:", spaceId)
    // Find the space from latest parking spaces or current message
    const space =
      latestParkingSpaces.find((s) => s.id === spaceId) ||
      [...messages]
        .reverse()
        .find((msg) => msg.parkingSpaces?.length)
        ?.parkingSpaces?.find((s) => s.id === spaceId)

    console.log("🎯 Found space:", space ? { id: space.id, title: space.title } : "not found")

    if (space) {
      setSelectedSpace(space)
      setIsBookingModalOpen(true)
    }
  }

  const handleSelectSpaceFromMap = (space: ParkingSpace) => {
    console.log("🗺️ handleSelectSpaceFromMap called for space:", space.id)
    setSelectedSpace(space)
    setIsBookingModalOpen(true)
  }

  const handleConfirmBooking = async (bookingData: BookingData) => {
    try {
      console.log("📋 Creating booking:", bookingData)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const confirmationMessage: Message = {
        role: "assistant",
        content: `🎉 Booking confirmed! Your parking space "${selectedSpace?.title}" has been booked from ${bookingData.startDate.toLocaleDateString()} to ${bookingData.endDate.toLocaleDateString()}. 

Total cost: £${bookingData.totalPrice}
Vehicle: ${bookingData.vehicleReg}

You'll receive a confirmation email at ${bookingData.contactEmail} with all the details and access instructions.`,
        timestamp: new Date().toLocaleTimeString(),
      }

      setMessages((prev) => [...prev, confirmationMessage])
      setSelectedSpace(null)
      setBookingStage("chat") // Reset to chat mode
    } catch (error) {
      console.error("💥 Booking error:", error)
      throw error
    }
  }

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      console.log("📅 Date range selected:", range)
      setSelectedDates(range)
    }
  }

  const handleConfirmDates = () => {
    if (selectedDates.from && selectedDates.to) {
      console.log("✅ Confirming dates:", selectedDates)
      const confirmationMessage: Message = {
        role: "assistant",
        content: `Perfect! I've set your booking dates from ${selectedDates.from.toLocaleDateString()} to ${selectedDates.to.toLocaleDateString()}. Now type 'time' to select your arrival time, or click on any parking space to proceed with booking.`,
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, confirmationMessage])
      setBookingStage("chat")
    }
  }

  const handleTimeSelect = () => {
    if (selectedTime) {
      console.log("🕐 Time selected:", selectedTime)
      const timeMessage: Message = {
        role: "assistant",
        content: `Excellent! Your arrival time is set to ${selectedTime}. You can now click on any parking space above to complete your booking with these pre-filled details.`,
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, timeMessage])
      setBookingStage("chat")
    }
  }

  const handleBackToChat = () => {
    console.log("🔙 Returning to chat mode")
    setBookingStage("chat")
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div key={index} className="space-y-4">
              <div className={cn("flex gap-3 max-w-[85%]", message.role === "user" && "ml-auto flex-row-reverse")}>
                {/* Avatar */}
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium",
                    message.role === "assistant" ? "bg-[#021e34] text-white" : "bg-gray-600 text-white",
                  )}
                >
                  {message.role === "assistant" ? (
                    <Image src="/parkpal-logo-minimal.png" alt="P" width={20} height={20} className="w-5 h-5" />
                  ) : (
                    "You"
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{message.role === "assistant" ? "Parkpal" : "You"}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-lg prose prose-sm max-w-none",
                      message.role === "assistant"
                        ? "bg-muted/50 text-foreground"
                        : "bg-primary text-primary-foreground ml-auto",
                    )}
                  >
                    {message.content === "Searching for parking spaces..." ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Searching for parking spaces...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>

                  {message.role === "assistant" && message.content !== "Searching for parking spaces..." && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Parking Spaces Results */}
              {message.parkingSpaces && message.parkingSpaces.length > 0 && (
                <div className="ml-11 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Found {message.parkingSpaces.length} parking space(s):
                    </h4>
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "grid" | "map")}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="grid" className="flex items-center gap-1">
                          <Grid className="w-4 h-4" />
                          Grid
                        </TabsTrigger>
                        <TabsTrigger value="map" className="flex items-center gap-1">
                          <Map className="w-4 h-4" />
                          Map
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <Tabs value={viewMode} className="w-full">
                    <TabsContent value="grid" className="mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {message.parkingSpaces.map((space) => (
                          <ParkingSpaceCard key={space.id} space={space} onBook={handleBookSpace} />
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="map" className="mt-0">
                      <ParkingMap
                        spaces={message.parkingSpaces}
                        onSelectSpace={handleSelectSpaceFromMap}
                        selectedSpaceId={selectedSpace?.id}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          ))}

          {/* Date Selection Interface */}
          {bookingStage === "date-selection" && (
            <div className="ml-11">
              <Card className="w-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Select Booking Dates
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleBackToChat}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Calendar
                    mode="range"
                    selected={selectedDates}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                  {selectedDates.from && selectedDates.to && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {selectedDates.from.toLocaleDateString()} - {selectedDates.to.toLocaleDateString()}
                      </div>
                      <Button onClick={handleConfirmDates} size="sm">
                        Confirm Dates
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Time Selection Interface */}
          {bookingStage === "time-selection" && (
            <div className="ml-11">
              <Card className="w-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Select Arrival Time
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleBackToChat}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select arrival time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTime && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">Arrival time: {selectedTime}</div>
                      <Button onClick={handleTimeSelect} size="sm">
                        Confirm Time
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          {/* Show current selections */}
          {(selectedDates.from && selectedDates.to) || selectedTime ? (
            <div className="mb-3 p-2 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center gap-4">
                {selectedDates.from && selectedDates.to && (
                  <span>
                    📅 {selectedDates.from.toLocaleDateString()} - {selectedDates.to.toLocaleDateString()}
                  </span>
                )}
                {selectedTime && <span>🕐 Arrival: {selectedTime}</span>}
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder={
                  bookingStage === "date-selection"
                    ? "Select dates above, or type 'back' to return to chat"
                    : bookingStage === "time-selection"
                      ? "Select time above, or type 'back' to return to chat"
                      : "Try: 'I need parking in SE17' or type 'date' to set booking duration"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[44px] max-h-32 pr-12 resize-none"
                disabled={isLoading}
              />
              <Button variant="ghost" size="sm" className="absolute right-2 top-2 h-8 w-8 p-0" disabled={isLoading}>
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} className="px-6">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        space={selectedSpace}
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false)
          setSelectedSpace(null)
        }}
        onConfirm={handleConfirmBooking}
        selectedDates={selectedDates}
        selectedTime={selectedTime}
      />
    </div>
  )
}
