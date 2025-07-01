"use client"

import type React from "react"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, CheckCircle, MapPin, Car } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51234567890")

interface ParkingSpace {
  id: string
  name: string
  address: string
  description: string
  hourlyRate: number
  dailyRate: number
  monthlyRate: number
  rating: number
  reviews: number
  features: string[]
  coordinates: { lat: number; lng: number }
}

interface CommerceLayerCheckoutProps {
  parkingSpace: ParkingSpace
  duration: "hour" | "day" | "month"
  rate: number
  sku: string
  onBack: () => void
}

type CheckoutStep = "details" | "payment" | "confirmation"

interface BookingDetails {
  customerName: string
  email: string
  phone: string
  vehicleReg: string
  vehicleType: string
  specialRequests: string
  startDate: string
  startTime: string
}

function CheckoutForm({
  parkingSpace,
  duration,
  rate,
  sku,
  bookingDetails,
  onSuccess,
  onError,
}: {
  parkingSpace: ParkingSpace
  duration: string
  rate: number
  sku: string
  bookingDetails: BookingDetails
  onSuccess: (bookingId: string) => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      // Create order
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          quantity: 1,
          parkingSpace,
          bookingDetails,
          duration,
          rate,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Process payment
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: bookingDetails.customerName,
          email: bookingDetails.email,
          phone: bookingDetails.phone,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      // Confirm payment
      const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentMethodId: paymentMethod.id,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || "Payment failed")
      }

      onSuccess(confirmData.bookingId)
    } catch (error) {
      onError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Payment Details</h3>
        <div className="bg-white p-3 rounded border">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
              },
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Test card: 4242 4242 4242 4242 (any future date, any CVC)</p>
      </div>

      <Button type="submit" disabled={!stripe || processing} className="w-full" size="lg">
        {processing ? "Processing..." : `Pay $${rate}`}
      </Button>
    </form>
  )
}

export function CommerceLayerCheckout({ parkingSpace, duration, rate, sku, onBack }: CommerceLayerCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>("details")
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    customerName: "",
    email: "",
    phone: "",
    vehicleReg: "",
    vehicleType: "car",
    specialRequests: "",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
  })
  const [bookingId, setBookingId] = useState<string>("")
  const { toast } = useToast()

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingDetails.customerName || !bookingDetails.email || !bookingDetails.vehicleReg) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }
    setStep("payment")
  }

  const handlePaymentSuccess = (id: string) => {
    setBookingId(id)
    setStep("confirmation")
    toast({
      title: "Payment Successful!",
      description: "Your parking space has been reserved",
    })
  }

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Space Details
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
          <div className="flex items-center space-x-4">
            <Badge
              variant={
                step === "details" ? "default" : step === "payment" || step === "confirmation" ? "secondary" : "outline"
              }
            >
              1. Details
            </Badge>
            <Badge variant={step === "payment" ? "default" : step === "confirmation" ? "secondary" : "outline"}>
              2. Payment
            </Badge>
            <Badge variant={step === "confirmation" ? "default" : "outline"}>3. Confirmation</Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{parkingSpace.name}</h4>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {parkingSpace.address}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Duration:</span>
                    <Badge>{duration}ly</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Rate:</span>
                    <span className="font-medium">${rate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SKU:</span>
                    <span className="text-xs text-gray-500">{sku}</span>
                  </div>
                </div>

                {step !== "details" && bookingDetails.customerName && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Customer Details</h5>
                    <div className="text-sm space-y-1">
                      <p>{bookingDetails.customerName}</p>
                      <p>{bookingDetails.email}</p>
                      <p>{bookingDetails.phone}</p>
                      <div className="flex items-center">
                        <Car className="h-3 w-3 mr-1" />
                        {bookingDetails.vehicleReg}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span className="text-lg">${rate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2">
            {step === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="h-5 w-5 mr-2" />
                    Booking Details
                  </CardTitle>
                  <CardDescription>Please provide your details and vehicle information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input
                          id="customerName"
                          value={bookingDetails.customerName}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, customerName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingDetails.email}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={bookingDetails.phone}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                        <Input
                          id="vehicleReg"
                          value={bookingDetails.vehicleReg}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, vehicleReg: e.target.value })}
                          placeholder="ABC123"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Select
                          value={bookingDetails.vehicleType}
                          onValueChange={(value) => setBookingDetails({ ...bookingDetails, vehicleType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={bookingDetails.startDate}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={bookingDetails.startTime}
                          onChange={(e) => setBookingDetails({ ...bookingDetails, startTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        value={bookingDetails.specialRequests}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, specialRequests: e.target.value })}
                        placeholder="Any special requirements or notes..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Continue to Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === "payment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>Complete your booking with secure payment</CardDescription>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      parkingSpace={parkingSpace}
                      duration={duration}
                      rate={rate}
                      sku={sku}
                      bookingDetails={bookingDetails}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </Elements>
                </CardContent>
              </Card>
            )}

            {step === "confirmation" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Booking Confirmed!
                  </CardTitle>
                  <CardDescription>Your parking space has been successfully reserved</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">Booking Reference</h3>
                    <p className="text-green-700 font-mono text-lg">{bookingId}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Booking Details</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Location:</span>
                          <span className="font-medium">{parkingSpace.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">{duration}ly</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Start:</span>
                          <span className="font-medium">
                            {bookingDetails.startDate} at {bookingDetails.startTime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vehicle:</span>
                          <span className="font-medium">{bookingDetails.vehicleReg}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Paid:</span>
                          <span className="font-bold text-lg">${rate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• A confirmation email has been sent to {bookingDetails.email}</li>
                        <li>• Save your booking reference: {bookingId}</li>
                        <li>• Arrive at the specified time and location</li>
                        <li>• Contact support if you need to make changes</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
                      Book Another Space
                    </Button>
                    <Button className="flex-1">View My Bookings</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
