"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, Car, MapPin, Clock, Shield, Users, Zap } from "lucide-react"
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

  const examplePrompts = [
    "find parking near downtown restaurants",
    "predict parking availability",
    "optimize parking routes for events",
    "analyze parking patterns",
  ]

  const agents = [
    {
      name: "Parking Finder",
      description: "Locates available parking spots",
      icon: <MapPin className="w-6 h-6" />,
      color: "bg-red-500",
    },
    {
      name: "Route Optimizer",
      description: "Optimizes parking routes",
      icon: <Car className="w-6 h-6" />,
      color: "bg-pink-500",
    },
    {
      name: "Availability Predictor",
      description: "Predicts parking availability",
      icon: <Clock className="w-6 h-6" />,
      color: "bg-purple-500",
    },
    {
      name: "Security Monitor",
      description: "Monitors parking security",
      icon: <Shield className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      name: "Community Helper",
      description: "Connects parking community",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      name: "Smart Analytics",
      description: "Analyzes parking data",
      icon: <Zap className="w-6 h-6" />,
      color: "bg-gray-500",
    },
  ]

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

          {/* Example Prompts */}
          <div className="flex flex-wrap justify-center gap-3 mb-20">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(prompt)
                  router.push(`/chat?q=${encodeURIComponent(prompt)}`)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Agents Section */}
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-8">
            Try to create your own agent!
          </h2>

          <div className="flex overflow-x-auto space-x-6 pb-4 px-4">
            {agents.map((agent, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-64 p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div
                  className={`w-12 h-12 ${agent.color} rounded-full flex items-center justify-center text-white mb-4`}
                >
                  {agent.icon}
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{agent.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{agent.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-16">
          <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            How it works?
          </button>
        </div>
      </main>
    </div>
  )
}
