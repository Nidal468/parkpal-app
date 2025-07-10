"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VehicleSelector } from "@/components/vehicle-selector"
import { ArrowLeft, MapPin, Calendar, Clock, User, Mail, Phone, Car } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Fetch } from "@/hooks/fetch"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookingSchema, bookingSchema } from "@/schema/bookingSchema"



// Generate 30-minute time slots
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      slots.push(timeString)
    }
  }
  return slots
}

export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function BookingPage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ email: string, name: string, image: string, phone: string } | null>(null);
  const [loading, setLoading] = useState(false);
  // Get booking details from URL params
  const spaceId = searchParams.get("spaceId")
  const spaceTitle = searchParams.get("spaceTitle")
  const spaceLocation = searchParams.get("spaceLocation")
  const price = searchParams.get("price")
  const priceType = searchParams.get("priceType")
  const discountType = searchParams.get("discountType")
  const preSelectedStartDate = searchParams.get("startDate")
  const preSelectedEndDate = searchParams.get("endDate")
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)

  const timeSlots = generateTimeSlots();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm<BookingSchema>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      fullName: '',
      email: "",
      phone: "",
      vehicleReg: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      selectedVehicle: selectedVehicle || "",
    },
  });


  useEffect(() => {
    const handle = async () => {
      setLoading(true);
      try {
        const response = await Fetch({
          body: '',
          api: 'get/user/selected',
          method: "GET",
          host: 'server',
          loading: (v) => { }
        });

        if (response !== null) {
          setUser({
            name: response.fullName,
            email: response.email,
            image: response.avatarUrl,
            phone: response.phone
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    handle();
  }, []);

  useEffect(() => {
    if (user) {
      reset((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        startDate: preSelectedStartDate || new Date().toISOString().split("T")[0],
        endDate: preSelectedEndDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      }));
    }
  }, [user, preSelectedStartDate, preSelectedEndDate, reset]);

  const calculateTotal = () => {
    const basePrice = Number.parseFloat(price || "0")
    const discountMultiplier = discountType === "weekly" ? 0.9 : discountType === "monthly" ? 0.8 : 1
    return (basePrice * discountMultiplier).toFixed(2)
  }

  const getDiscountLabel = () => {
    switch (discountType) {
      case "weekly":
        return "Weekly Discount (10% off)"
      case "monthly":
        return "Monthly Discount (20% off)"
      default:
        return "Standard Rate"
    }
  }


  const onSubmit = async (data: BookingSchema) => {
    console.log("Form data:", data); // ✅ see if selectedVehicle is included

    const payload = {
      id: spaceId,
      customer: {
        name: data.fullName,
        email: data.email,
        phone: data.phone,
      },
      metadata: {
        vehicle: data.vehicleReg,
        vehicleType: data.selectedVehicle || "N/A",
        bookingPeriod: `${data.startDate} ${data.startTime} to ${data.endDate} ${data.endTime}`,
      },
      amount: parseFloat(calculateTotal()) * 100, // in cents
      currency: "gbp",
      description: `Booking for ${spaceTitle}`,
    };

    const response = await Fetch({
      body: payload,
      api: 'post/book/reserve',
      method: "POST",
      host: 'server',
      loading: (v) => { }
    });
    if (response) {
      window.location.href = `${response.url}`
    }
    console.log("Stripe Payload:", payload);
  };

  return (
    user && <form onSubmit={handleSubmit(onSubmit)}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="min-h-screen bg-white text-zinc-700 select-none"
      >
        {/* Header */}
        <div className="bg-white border-b border-zinc-200 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-zinc-700">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="h-6 w-px bg-zinc-300" />
                <Image src="/parkpal-logo-clean.png" alt="Parkpal" width={100} height={32} />
              </div>
              <div className="text-sm text-zinc-500">Secure Booking</div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Left: Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Details */}
              <Card className="bg-white shadow-md border border-zinc-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-black">
                    <User className="w-5 h-5" /> Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* First Name */}
                  <Controller
                    name="fullName"
                    control={control}
                    render={({ field }) => (
                      <div className="w-full flex flex-col">
                        <Label htmlFor="fullName" className="text-zinc-800">FullName</Label>
                        <Input
                          id="fullName"
                          readOnly
                          {...field}
                          placeholder="John"
                          className="mt-1 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500"
                        />
                      </div>
                    )}
                  />

                  {/* Email & Phone */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Email */}
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col">
                          <Label htmlFor="email" className="text-zinc-800">Email</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              readOnly
                              {...field}
                              placeholder="john@example.com"
                              className="pl-10 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500"
                            />
                          </div>
                        </div>
                      )}
                    />

                    {/* Phone */}
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col">
                          <Label htmlFor="phone" className="text-zinc-800">Phone</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="phone"
                              type="tel"
                              {...field}
                              placeholder="+44 7123 456789"
                              className="pl-10 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500"
                            />
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Details */}
              <Card className="bg-white shadow-md border border-zinc-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-black">
                    <Car className="w-5 h-5" /> Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <VehicleSelector
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={(vehicle) => {
                      setSelectedVehicle(vehicle);
                      setValue("selectedVehicle", vehicle); // ✅ keep in sync with form
                    }}
                  />

                  {/* Vehicle Reg */}
                  <Controller
                    name="vehicleReg"
                    control={control}
                    render={({ field }) => (
                      <div className="flex flex-col">
                        <Label htmlFor="vehicleReg" className="text-zinc-800">Vehicle Registration</Label>
                        <div className="relative mt-1">
                          <Car className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="vehicleReg"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            placeholder="AB12 CDE"
                            maxLength={8}
                            className="pl-10 mt-1 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500"
                          />
                        </div>
                      </div>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Booking Period */}
              <Card className="bg-white shadow-md border border-zinc-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-black">
                    <Calendar className="w-5 h-5" /> Booking Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <div className="w-full flex flex-col">
                          <Label htmlFor="startDate" className="text-zinc-800">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            {...field}
                            min={new Date().toISOString().split('T')[0]}
                            className="mt-1 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <div className="w-full flex flex-col">
                          <Label htmlFor="endDate" className="text-zinc-800">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            {...field}
                            min={watch("startDate")} // dynamically set min to startDate
                            className="mt-1 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500"
                          />
                        </div>
                      )}
                    />

                  </div>
                  <div className="grid md:grid-cols-2 gap-4 w-full">
                    <Controller
                      name="startTime"
                      control={control}
                      render={({ field }) => (
                        <div className="w-full flex flex-col">
                          <Label htmlFor="startTime" className="text-zinc-800">Start Time</Label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="pl-10 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500 relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-zinc-800 z-10" />
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black border border-zinc-300">
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time} className="hover:bg-zinc-100">
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                    <Controller
                      name='endTime'
                      control={control}
                      render={({ field }) => (
                        <div className="w-full flex flex-col">
                          <Label htmlFor="endTime" className="text-zinc-800">End Time</Label>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="pl-10 bg-white text-black border border-zinc-300 focus:ring-zinc-500 focus:border-zinc-500 relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-zinc-800 z-10" />
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black border border-zinc-300">
                              {timeSlots.map((time) => (
                                <SelectItem key={time} value={time} className="hover:bg-zinc-100">
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Summary */}
            <motion.div className="lg:col-span-1 sticky top-8" variants={fadeIn}>
              <Card className="bg-white shadow-lg border border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-black">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-black">{spaceTitle || 'Parking Space'}</h3>
                    <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                      <MapPin className="w-4 h-4" /> {spaceLocation}
                    </div>
                  </div>
                  <Separator className="bg-zinc-200" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-zinc-600">
                      <span>Base Price</span>
                      <span className="font-medium text-black">£{price}/{priceType}</span>
                    </div>
                    {discountType && discountType !== 'standard' && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>{getDiscountLabel()}</span>
                        <span className="font-medium">-{discountType === 'weekly' ? '10%' : '20%'}</span>
                      </div>
                    )}
                    <Separator className="bg-zinc-200" />
                    <div className="flex justify-between text-lg font-bold text-black">
                      <span>Total</span>
                      <span>£{calculateTotal()}</span>
                    </div>
                  </div>

                  <Separator className="bg-zinc-200" />

                  <div className="space-y-2">
                    <h4 className="font-medium text-black">Included</h4>
                    {['24/7 Access', 'Secure Parking', 'CCTV Monitoring'].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full" /> {feature}
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-zinc-200" />

                  <div className="space-y-3">
                    <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold" size="lg" type="submit">
                      Complete Booking
                    </Button>
                    <Button variant="outline" className="w-full text-zinc-300 border-zinc-300" onClick={() => window.location.href = '/'}>
                      Back to Space Details
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-800">🔒 Your payment is secured using stripe</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </form>

  )
}
