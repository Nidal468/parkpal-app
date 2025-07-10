'use client'
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { User, Car, Mail, Phone, Calendar, Clock } from "lucide-react"

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function BookingForm({ bookingForm, handleInputChange, selectedVehicle, setSelectedVehicle, timeSlots }: any) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="lg:col-span-2 space-y-8"
    >
      {/* Personal Details */}
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <User className="w-5 h-5" /> Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs here ... */}
        </CardContent>
      </Card>

      {/* Vehicle Details */}
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Car className="w-5 h-5" /> Vehicle Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs here ... */}
        </CardContent>
      </Card>

      {/* Booking Period */}
      <Card className="shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="w-5 h-5" /> Booking Period
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs here ... */}
        </CardContent>
      </Card>
    </motion.div>
  )
}
