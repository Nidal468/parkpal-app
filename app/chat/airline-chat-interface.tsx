"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { MapboxParkingMap } from "@/components/mapbox-parking-map"
import { ISpaces } from "@/model/spaces"
import { Fetch } from "@/hooks/fetch"
import Image from "next/image";

export interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
  parkingSpaces?: ISpaces[]
}

export default function AirlineChatInterface() {
  const searchParams = useSearchParams()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasProcessedQuery, setHasProcessedQuery] = useState(false)
  const [allParkingSpaces, setAllParkingSpaces] = useState<ISpaces[]>([])
  const [selectedSpace, setSelectedSpace] = useState<ISpaces | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour12: false });
  const [user, setUser] = useState<{ email: string, name: string, image: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Hi, I'm Parkpal 👋 
Where would you like to park? Just tell me the location, and I’ll find available spaces for you!

To get started, I’ll also need a few details:
• Vehicle registration  
• Booking date and time  
• How long do you plan to park? (hour/day/month)`,
        timestamp,
      }
    ]);
  }, []);

  useEffect(() => {
    const handle = async () => {
      setLoading(true);
      try {
        const response = await Fetch({
          body: '',
          api: 'get/spaces/all',
          method: "GET",
          host: 'server',
          loading: (v) => { },
          params: 'available=true'
        });

        if (response !== null) {
          setAllParkingSpaces(response)
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    handle();
  }, []);

  useEffect(() => {
    const handle = async () => {
      setLoading(true);
      try {
        const response = await Fetch({
          body: '',
          api: 'get/user/selected',
          method: "GET",
          host: 'server',
          loading: (v) => { }
        });

        if (response !== null) {
          setUser({
            name: response.fullName,
            email: response.email,
            image: response.avatarUrl
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    handle();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn("Geolocation not supported");
    }
  }, []);

  // Handle URL query parameter
  useEffect(() => {
    const query = searchParams.get("q")
    if (query && !hasProcessedQuery && userLocation) {
      setHasProcessedQuery(true)
      setTimeout(() => {
        sendMessageWithText(query)
      }, 500)
    }
  }, [searchParams, hasProcessedQuery, userLocation])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages]);


  const sendMessageWithText = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return
    setIsLoading(true)
    const newUserMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: timestamp,
    }

    setMessages((prev) => [...prev, newUserMessage])

    try {
      const response = await Fetch({
        body: {
          message: messageText,
          conversation: messages,
          location: userLocation,
          spaces: allParkingSpaces
        },
        api: 'post/ai/chat',
        method: "POST",
        host: 'server',
        loading: (v) => { }
      });
      if (response === null) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = response;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "",
        timestamp: timestamp,
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

  const handleSpaceSelect = (space: ISpaces | null) => {
    setSelectedSpace(space)
    // You can add more logic here for when a space is selected
    console.log("Selected parking space:", space)
  }

  return (
    <div className="flex h-screen">
      {/* Left Side - Chat Area */}
      {/* Left Side - Chat Area */}
      <div className="w-1/2 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6 flex flex-col">
        {/* Chat Header with User Info */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-800 font-montserrat">P</span>
              <span className="text-3xl text-gray-800 font-serif">p</span>
            </div>
            <span className="text-gray-400 text-lg font-medium">Chat</span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Image
                src={user.image || "/default-avatar.png"}
                alt={user.name}
                width={32}
                height={32}
                className="rounded-full object-cover border border-gray-300"
              />
              <span className="text-sm text-gray-800 font-medium">{user.name}</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="bg-white rounded-2xl border border-gray-300 p-4 flex items-center gap-4 mb-6 shadow-md">
          <input
            type="text"
            placeholder="Ask me anything about parking..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent text-gray-800 text-lg focus:outline-none placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto pr-1" ref={scrollAreaRef}>
          {messages.map((message, index) => {
            const isAssistant = message.role === "assistant"
            return (
              <div key={index} className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-xl p-4 shadow-sm ${isAssistant ? "bg-white/80 text-gray-800" : "bg-indigo-100 text-gray-800"}`}>
                  <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                    {isAssistant ? (
                      <>
                        <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">Pp</div>
                        Parkpal • {message.timestamp}
                      </>
                    ) : (
                      <>
                        You • {message.timestamp}
                      </>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">
                    {message.content}
                  </div>

                  {/* Parking Results (if any) */}
                  {message.parkingSpaces && message.parkingSpaces.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.parkingSpaces.map((space, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-2 rounded border border-gray-300 cursor-pointer transition-colors ${selectedSpace?._id === space.id ? "bg-indigo-100" : "hover:bg-indigo-50"
                            }`}
                          onClick={() => handleSpaceSelect(space)}
                        >
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center mt-1">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-800">
                              {space.title}
                              {space.location && `, ${space.location}`}
                              {space.postcode && ` ${space.postcode}`}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              [{space.is_available || space.total_spaces || "X"}:SPACES AVAILABLE]
                            </div>
                            {space.price_per_day && (
                              <div className="text-xs text-green-600 font-medium mt-1">
                                £{space.price_per_day}/day
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Side - Mapbox Map */}
      <div className="w-1/2">
        <MapboxParkingMap
          spaces={allParkingSpaces}
          onSpaceSelect={(v) => handleSpaceSelect(v)}
          selectedSpace={selectedSpace}
          userLocation={userLocation}
        />
      </div>
    </div>
  )
}
