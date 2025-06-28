"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, ThumbsUp, ThumbsDown, Mic, Send, Loader2, AlertCircle, Map, Grid, CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ParkingSpaceCard } from "@/components/parking-space-card"
import { ParkingMap } from "@/components/parking-map"
import { BookingModal, type BookingData } from "@/components/booking-modal"
import type { ParkingSpace } from "@/lib/supabase-types"
import Image from "next/image"
import { format } from "date-fns"

interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
  parkingSpaces?: ParkingSpace[]
}

export default function ChatInterface() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [latestParkingSpaces, setLatestParkingSpaces] = useState<ParkingSpace[]>([])

  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get dates from URL parameters
  const getSelectedDates = () => {
    const fromDate = searchParams.get("from")
    const toDate = searchParams.get("to")
    return {
      from: fromDate ? new Date(fromDate) : undefined,
      to: toDate ? new Date(toDate) : undefined,
    }
  }

  const selectedDates = getSelectedDates()

  // Update URL with selected dates
  const updateDatesInURL = (dates: { from: Date | undefined; to: Date | undefined }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (dates.from) {
      params.set("from", dates.from.toISOString().split("T")[0])
    } else {
      params.delete("from")
    }

    if (dates.to) {
      params.set("to", dates.to.toISOString().split("T")[0])
    } else {
      params.delete("to")
    }

    router.replace(`/chat?${params.toString()}`, { scroll: false })
  }

  // Load initial message on component mount
  useEffect(() => {
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

    setError(null)
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, newUserMessage])

    // Add thinking message for parking searches
    const thinkingMessage: Message = {
      role: "assistant",
      content: "Searching for parking spaces...",
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, thinkingMessage])

    try {
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

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text()
        throw new Error("Server returned invalid response format")
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Replace thinking message with actual response
      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: data.message || "Sorry, I couldn't process that request.",
          timestamp: new Date().toLocaleTimeString(),
          parkingSpaces: data.parkingSpaces || undefined,
        }
        return newMessages
      })

      // Store parking spaces for booking
      if (data.parkingSpaces && data.parkingSpaces.length > 0) {
        setLatestParkingSpaces(data.parkingSpaces)
      }
    } catch (error) {
      console.error("Error sending message:", error)
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

  const handleBookSpace = (spaceId: string) => {
    // Find the space from latest parking spaces or current message
    const space =
      latestParkingSpaces.find((s) => s.id === spaceId) ||
      [...messages]
        .reverse()
        .find((msg) => msg.parkingSpaces?.length)
        ?.parkingSpaces?.find((s) => s.id === spaceId)

    if (space) {
      setSelectedSpace(space)
      setIsBookingModalOpen(true)
    }
  }

  const handleSelectSpaceFromMap = (space: ParkingSpace) => {
    setSelectedSpace(space)
    setIsBookingModalOpen(true)
  }

  const handleConfirmBooking = async (bookingData: BookingData) => {
    try {
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
    } catch (error) {
      console.error("Booking error:", error)
      throw error
    }
  }

  const handleDateSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range) {
      updateDatesInURL(range)
    }
  }

  const handleConfirmDates = () => {
    setShowDatePicker(false)
  }

  const clearDates = () => {
    updateDatesInURL({ from: undefined, to: undefined })
  }

  // Check if any message has parking spaces
  const hasAnyParkingSpaces = messages.some((msg) => msg.parkingSpaces && msg.parkingSpaces.length > 0)

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

          {/* Date Picker - Shows when parking spaces are available */}
          {hasAnyParkingSpaces && (
            <div className="ml-11">
              <Card className="w-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Select Booking Dates
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDates.from && selectedDates.to && (
                        <Button variant="ghost" size="sm" onClick={clearDates}>
                          Clear
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setShowDatePicker(!showDatePicker)}>
                        {showDatePicker ? <X className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Selection Display */}
                  {selectedDates.from && selectedDates.to ? (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">Dates Selected</p>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            {format(selectedDates.from, "MMM dd, yyyy")} - {format(selectedDates.to, "MMM dd, yyyy")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="text-green-700 dark:text-green-400"
                        >
                          {showDatePicker ? "Hide" : "Change"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Select your booking dates to see pricing and availability
                      </p>
                      <Button variant="outline" size="sm" onClick={() => setShowDatePicker(true)} className="mt-2">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Select Dates
                      </Button>
                    </div>
                  )}

                  {/* Calendar */}
                  {showDatePicker && (
                    <div className="space-y-3">
                      <Calendar
                        mode="range"
                        selected={selectedDates}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        disabled={(date) => date < new Date()}
                        className="rounded-md border"
                      />
                      {selectedDates.from && selectedDates.to && (
                        <Button onClick={handleConfirmDates} size="sm" className="w-full">
                          Confirm Dates
                        </Button>
                      )}
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
          {selectedDates.from && selectedDates.to && (
            <div className="mb-3 p-2 bg-muted/50 rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span>
                  📅 {format(selectedDates.from, "MMM dd")} - {format(selectedDates.to, "MMM dd, yyyy")}
                </span>
                <Button variant="ghost" size="sm" onClick={clearDates}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Try: 'I need parking in SE17' or 'Find secure parking near London Bridge'"
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
      />
    </div>
  )
}
