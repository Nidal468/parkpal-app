'use client'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function BookingHeader() {
  const router = useRouter()

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <Image src="/parkpal-logo-chat.png" alt="Parkpal" width={100} height={32} />
          </div>
          <div className="text-sm text-gray-600">Secure Booking</div>
        </div>
      </div>
    </div>
  )
}
