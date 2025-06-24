"use client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface AirlineNavProps {
  activeTab: "search" | "checkin" | "profile"
  onTabChange: (tab: "search" | "checkin" | "profile") => void
}

export function AirlineNav({ activeTab, onTabChange }: AirlineNavProps) {
  return (
    <div className="w-48 bg-[#1a1a1a] text-white h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Image src="/parkpal-logo-minimal.png" alt="P" width={24} height={24} className="w-6 h-6" />
          <div>
            <div className="font-bold text-lg">PARK</div>
            <div className="text-sm text-white/70">pal</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 text-left font-medium text-sm",
              activeTab === "search" ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
            )}
            onClick={() => onTabChange("search")}
          >
            SEARCH
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 text-left font-medium text-sm",
              activeTab === "checkin" ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
            )}
            onClick={() => onTabChange("checkin")}
          >
            CHECK-IN
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 text-left font-medium text-sm",
              activeTab === "profile" ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
            )}
            onClick={() => onTabChange("profile")}
          >
            PROFILE
          </Button>
        </div>
      </nav>
    </div>
  )
}
