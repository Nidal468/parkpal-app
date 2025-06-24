"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Car, Plus } from "lucide-react"
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
      {/* Header - Mobile Optimized */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center space-x-2">
          <Car className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
          <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">parkpal.ai</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-xs sm:text-sm px-3 sm:px-4"
          >
            Log in
          </Button>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <main className="flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-20">
        <div className="text-center max-w-4xl mx-auto w-full">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6 leading-tight">
            Hi, I'm Parkpal
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 px-2">
            Find parking that suits your precise needs.
          </p>

          {/* Updated Search Input - Mobile Optimized */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-4 px-2">
            <div className="relative bg-gray-900 dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where are you looking to park?"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 text-base sm:text-lg outline-none min-w-0"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-colors duration-200 flex-shrink-0 text-sm sm:text-base"
                >
                  PARK
                </button>
              </div>
            </div>
          </form>

          {/* How it works - Mobile Optimized */}
          <div className="mb-6 sm:mb-8 px-2">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              How it works? Type: 'Park me asap' or 'Park me near'
            </p>
          </div>

          {/* Terms and Privacy Disclaimer - Mobile Optimized */}
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto px-4 leading-relaxed">
            By sending a message, you agree to our{" "}
            <button className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Use</button> and acknowledge
            that you have read and understand our{" "}
            <button className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</button>.
          </div>
        </div>
      </main>
    </div>
  )
}
