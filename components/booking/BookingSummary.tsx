'use client'
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MapPin } from "lucide-react"
import { useRouter } from "next/navigation"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function BookingSummary({ spaceTitle, spaceLocation, price, priceType, discountType, getDiscountLabel, calculateTotal }: any) {
  const router = useRouter()

  return (
    <motion.div className="lg:col-span-1 sticky top-8" variants={fadeIn}>
      <Card className="shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Summary content here ... */}
        </CardContent>
      </Card>
    </motion.div>
  )
}
