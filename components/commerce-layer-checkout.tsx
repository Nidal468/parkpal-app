"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Car, Calendar, MapPin, CreditCard, CheckCircle } from "lucide-react"
import { toast } from "sonner"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CommerceLayerCheckoutProps {
  space: any
  duration: "hour" | "day" | "month"
  sku: string
  price: number
  onBack: () => void
}

interface BookingDetails {
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleReg: string
  vehicleType: string
  startDate: string
  startTime: string
  duration: number
  notes: string
}

const vehicleTypes = ["Car", "SUV", "Van", "Motorcycle", "Electric Vehicle", "Truck"]

function CheckoutForm({
  bookingDetails,
  space,
  duration,
  sku,
  price,
  onSuccess,
}: {
  bookingDetails: BookingDetails
  space: any
  duration: string
  sku: string
  price: number
  onSuccess: (bookingId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      // Create order with Commerce Layer integration
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          quantity: bookingDetails.duration,
          price,
          bookingDetails,
          spaceId: space.id,
        }),
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      const { clientSecret, bookingId } = await orderResponse.json()

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingDetails.customerName,
            email: bookingDetails.customerEmail,
            phone: bookingDetails.customerPhone,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent.status === "succeeded") {
        // Confirm the order
        await fetch("/api/commerce-layer/confirm-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        onSuccess(bookingId)
        toast.success("Booking confirmed successfully!")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Details
          </CardTitle>
          <CardDescription>Enter your payment information to complete the booking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg">
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
          <p className="text-sm text-gray-500 mt-2">Test card: 4242 4242 4242 4242 (any future expiry, any CVC)</p>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing ? "Processing Payment..." : `Complete Booking - £${price.toFixed(2)}`}
      </Button>
    </form>
  )
}

export function CommerceLayerCheckout({ space, duration, sku, price, onBack }: CommerceLayerCheckoutProps) {
  const [step, setStep] = useState(1)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    vehicleReg: "",
    vehicleType: "",
    startDate: "",
    startTime: "",
    duration: duration === "hour" ? 1 : duration === "day" ? 1 : 1,
    notes: "",
  })
  const [bookingId, setBookingId] = useState<string>("")

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setBookingDetails((prev) => ({ ...prev, startDate: today }))
  }, [])

  const handleInputChange = (field: keyof BookingDetails, value: string | number) => {
    setBookingDetails((prev) => ({ ...prev, [field]: value }))
  }

  const isStep1Valid = () => {
    return (
      bookingDetails.customerName &&
      bookingDetails.customerEmail &&
      bookingDetails.customerPhone &&
      bookingDetails.vehicleReg &&
      bookingDetails.vehicleType &&
      bookingDetails.startDate &&
      bookingDetails.startTime
    )
  }

  if (step === 3) {
    return (
      <div className="container mx-auto px-4 max-w-2xl py-8">
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your parking space has been successfully reserved.</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">Booking Details:</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Booking ID:</strong> {bookingId}
                </p>
                <p>
                  <strong>Space:</strong> {space.title}
                </p>
                <p>
                  <strong>Duration:</strong> {duration}
                </p>
                <p>
                  <strong>Price:</strong> £{price.toFixed(2)}
                </p>
                <p>
                  <strong>Vehicle:</strong> {bookingDetails.vehicleReg}
                </p>
                <p>
                  <strong>Date:</strong> {bookingDetails.startDate} at {bookingDetails.startTime}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={onBack} className="w-full">
                Book Another Space
              </Button>
              <Button variant="outline" className="w-full bg-transparent">
                View My Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
          <p className="text-gray-600">Step {step} of 2</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {step === 1 && (
            <div className="space-y-6">
              {/* Customer Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>Please provide your contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">Full Name *</Label>
                      <Input
                        id="customerName"
                        value={bookingDetails.customerName}
                        onChange={(e) => handleInputChange("customerName", e.target.value)}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email Address *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={bookingDetails.customerEmail}
                        onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={bookingDetails.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      placeholder="+44 7123 456789"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    Vehicle Information
                  </CardTitle>
                  <CardDescription>Details about your vehicle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                      <Input
                        id="vehicleReg"
                        value={bookingDetails.vehicleReg}
                        onChange={(e) => handleInputChange("vehicleReg", e.target.value.toUpperCase())}
                        placeholder="AB12 CDE"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleType">Vehicle Type *</Label>
                      <Select
                        value={bookingDetails.vehicleType}
                        onValueChange={(value) => handleInputChange("vehicleType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Schedule
                  </CardTitle>
                  <CardDescription>When do you need the parking space?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={bookingDetails.startDate}
                        onChange={(e) => handleInputChange("startDate", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={bookingDetails.startTime}
                        onChange={(e) => handleInputChange("startTime", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration ({duration}s)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={bookingDetails.duration}
                        onChange={(e) => handleInputChange("duration", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                  <CardDescription>Any special requirements or comments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={bookingDetails.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any special requirements..."
                    rows={3}
                  />
                </CardContent>
              </Card>

              <Button size="lg" className="w-full" onClick={() => setStep(2)} disabled={!isStep1Valid()}>
                Continue to Payment
              </Button>
            </div>
          )}

          {step === 2 && (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                bookingDetails={bookingDetails}
                space={space}
                duration={duration}
                sku={sku}
                price={price * bookingDetails.duration}
                onSuccess={(id) => {
                  setBookingId(id)
                  setStep(3)
                }}
              />
            </Elements>
          )}
        </div>

        {/* Sidebar - Booking Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">{space.title}</h4>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {space.address}
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="capitalize">{duration}ly</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>
                    {bookingDetails.duration} {duration}(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rate:</span>
                  <span>
                    £{price.toFixed(2)} per {duration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <Badge variant="outline" className="text-xs">
                    {sku}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>£{(price * bookingDetails.duration).toFixed(2)}</span>
              </div>

              {step === 1 && bookingDetails.startDate && bookingDetails.startTime && (
                <>
                  <Separator />
                  <div className="text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {bookingDetails.startDate} at {bookingDetails.startTime}
                      </span>
                    </div>
                    {bookingDetails.vehicleReg && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <Car className="w-4 h-4 mr-1" />
                        <span>
                          {bookingDetails.vehicleReg} ({bookingDetails.vehicleType})
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
