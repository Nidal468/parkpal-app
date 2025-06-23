"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Car } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to chat page with the query
      router.push(`/chat?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Car className="w-8 h-8 text-purple-600" />
          <span className="text-xl font-bold text-gray-800 dark:text-white">parkpal.ai</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Log in
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-6">Hi, I'm Parkpal</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">Find parking that suits your precise needs.</p>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-8">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Where are you looking to park?"
              className="w-full px-6 py-4 text-lg rounded-full border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Footer Link */}
          <div className="mt-16">
            <p className="text-gray-600 dark:text-gray-400">How it works? Type: 'Park me asap' or 'Park me near'</p>
          </div>
        </div>
      </main>
    </div>
  )
}
