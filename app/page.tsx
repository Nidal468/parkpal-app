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

          {/* Updated Search Input */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-4">
            <div className="relative bg-gray-900 dark:bg-gray-800 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where are you looking to park?"
                  className="flex-1 bg-transparent text-white placeholder-gray-400 text-lg outline-none"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors duration-200 flex-shrink-0"
                >
                  PARK
                </button>
              </div>
            </div>
          </form>

          {/* How it works - moved up */}
          <div className="mb-8">
            <p className="text-gray-600 dark:text-gray-400">How it works? Type: 'Park me asap' or 'Park me near'</p>
          </div>

          {/* Terms and Privacy Disclaimer - moved down */}
          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
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
