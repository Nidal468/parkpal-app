"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, ThumbsUp, ThumbsDown, Mic, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "assistant" | "user"
  content: string
  timestamp: string
}

export default function ChatInterface() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history on component mount
  useEffect(() => {
    loadChatHistory()
  }, [])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/chat/history?limit=20")
      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages)
        } else {
          // Show initial message if no history
          setMessages([
            {
              role: "assistant",
              content: "Hi, I'm Parkpal 👋 Where would you like to park?",
              timestamp: new Date().toLocaleTimeString(),
            },
          ])
        }
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      // Show initial message on error
      setMessages([
        {
          role: "assistant",
          content: "Hi, I'm Parkpal 👋 Where would you like to park?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setIsLoading(true)

    // Add user message immediately
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages((prev) => [...prev, newUserMessage])

    // Add thinking message
    const thinkingMessage: Message = {
      role: "assistant",
      content: "Thinking...",
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
          message: userMessage,
          conversation: messages.filter((msg) => msg.content !== "Thinking..."),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send message")
      }

      const data = await response.json()

      // Replace thinking message with actual response
      setMessages((prev) => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString(),
        }
        return newMessages
      })
    } catch (error) {
      console.error("Error sending message:", error)
      setError(error instanceof Error ? error.message : "Failed to send message")

      // Remove thinking message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex gap-3 max-w-[85%]", message.role === "user" && "ml-auto flex-row-reverse")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium",
                  message.role === "assistant" ? "bg-purple-600 text-white" : "bg-gray-600 text-white",
                )}
              >
                {message.role === "assistant" ? "🚗" : "You"}
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
                  {message.content === "Thinking..." ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>

                {message.role === "assistant" && message.content !== "Thinking..." && (
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
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="Where are you looking to park?"
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
    </div>
  )
}
