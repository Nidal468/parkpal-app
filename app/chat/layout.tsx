import type React from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Car, Clock, X, ArrowLeft, Calendar, DollarSign } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Mock booking data - later this will come from chat state/Supabase
  const mockBookingData = {
    location: "Kennington SE17",
    startDate: "2024-01-15",
    endDate: "2024-01-15",
    timeRange: "6pm–10pm",
    vehicleRegistration: "AB12 CDE",
    vehicleMake: "Toyota",
    vehicleModel: "Camry",
    estimatedCost: "£12.50",
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Car className="h-6 w-6 text-purple-600" />
            <span className="font-semibold">Parkpal assistant</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="space-y-4 p-4">
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                🏠 Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                📅 My Bookings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                🚘 Vehicle Info
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                📍 Saved Locations
              </Button>
              <Button variant="ghost" className="w-full justify-start bg-muted">
                💬 Chat Assistant
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                ⚙️ Settings
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                🔔 Notifications
              </Button>
            </nav>
            <div className="pt-4 border-t">
              <Button variant="ghost" className="w-full justify-start">
                👁️ Live Map
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                📈 Parking History
              </Button>
            </div>
            <div className="pt-4 border-t">
              <Link href="/">
                <Button variant="ghost" className="w-full justify-start">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 border-b px-4 flex items-center justify-between">
            <h1 className="text-sm font-medium">Parking Assistant</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm">
                Save conversation
              </Button>
              <Link href="/">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </header>
          {children}
        </div>

        {/* Right Panel */}
        <div className="w-80 border-l">
          <div className="h-14 border-b px-4 flex items-center">
            <h2 className="font-medium">Parking details</h2>
          </div>
          <div className="p-4">
            <div className="flex gap-2 border-b pb-4 mb-4">
              <Button variant="secondary" size="sm" className="rounded-full">
                Summary
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Space Info
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full">
                Support
              </Button>
            </div>

            {/* Summary Content */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Current Booking</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm">📍</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Location:</span>
                    <p className="text-sm text-muted-foreground break-words">{mockBookingData.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Date:</span>
                    <p className="text-sm text-muted-foreground">
                      {mockBookingData.startDate === mockBookingData.endDate
                        ? mockBookingData.startDate
                        : `${mockBookingData.startDate} - ${mockBookingData.endDate}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Time:</span>
                    <p className="text-sm text-muted-foreground">{mockBookingData.timeRange}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="text-sm">🚗</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Vehicle:</span>
                    <p className="text-sm text-muted-foreground">{mockBookingData.vehicleRegistration}</p>
                    <p className="text-xs text-muted-foreground">
                      {mockBookingData.vehicleMake} {mockBookingData.vehicleModel}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">Estimated Cost:</span>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {mockBookingData.estimatedCost}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-muted-foreground">Booking in progress...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
