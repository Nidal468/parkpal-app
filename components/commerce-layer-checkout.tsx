"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, CheckCircle, MapPin, Calendar, Car } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CommerceLayerCheckoutProps {
  space: any
  sku: string
  duration: "hour" | "day" | "month"
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
  endDate: string
  endTime: string
}

export function CommerceLayerCheckout({ space, sku, duration, price, onBack }: CommerceLayerCheckoutProps) {
  const [step, setStep] = useState(1)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    vehicleReg: "",
    vehicleType: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [bookingId, setBookingId] = useState<string>("")

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const updateBookingDetails = (field: keyof BookingDetails, value: string) => {
    setBookingDetails((prev) => ({ ...prev, [field]: value }))
  }

  if (orderConfirmed) {
    return <ConfirmationStep bookingId={bookingId} space={space} bookingDetails={bookingDetails} />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Complete Your Booking</h1>
            <p className="text-gray-600">Step {step} of 2</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <BookingDetailsStep
                bookingDetails={bookingDetails}
                updateBookingDetails={updateBookingDetails}
                onSubmit={handleDetailsSubmit}
              />
            )}
            {step === 2 && (
              <Elements stripe={stripePromise}>
                <PaymentStep
                  space={space}
                  sku={sku}
                  duration={duration}
                  price={price}
                  bookingDetails={bookingDetails}
                  onBack={() => setStep(1)}
                  onSuccess={(id) => {
                    setBookingId(id)
                    setOrderConfirmed(true)
                  }}
                />
              </Elements>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BookingSummary space={space} duration={duration} price={price} bookingDetails={bookingDetails} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingDetailsStep({
  bookingDetails,
  updateBookingDetails,
  onSubmit,
}: {
  bookingDetails: BookingDetails
  updateBookingDetails: (field: keyof BookingDetails, value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Booking Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={bookingDetails.customerName}
                  onChange={(e) => updateBookingDetails("customerName", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={bookingDetails.customerPhone}
                  onChange={(e) => updateBookingDetails("customerPhone", e.target.value)}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={bookingDetails.customerEmail}
                  onChange={(e) => updateBookingDetails("customerEmail", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Vehicle Information */}
          <div>
            <h3 className="font-semibold mb-4">Vehicle Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                <Input
                  id="vehicleReg"
                  value={bookingDetails.vehicleReg}
                  onChange={(e) => updateBookingDetails("vehicleReg", e.target.value.toUpperCase())}
                  placeholder="AB12 CDE"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select
                  value={bookingDetails.vehicleType}
                  onValueChange={(value) => updateBookingDetails("vehicleType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div>
            <h3 className="font-semibold mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={bookingDetails.startDate}
                  onChange={(e) => updateBookingDetails("startDate", e.target.value)}
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
                  onChange={(e) => updateBookingDetails("startTime", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={bookingDetails.endDate}
                  onChange={(e) => updateBookingDetails("endDate", e.target.value)}
                  min={bookingDetails.startDate || new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={bookingDetails.endTime}
                  onChange={(e) => updateBookingDetails("endTime", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continue to Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PaymentStep({
  space,
  sku,
  duration,
  price,
  bookingDetails,
  onBack,
  onSuccess,
}: {
  space: any
  sku: string
  duration: string
  price: number
  bookingDetails: BookingDetails
  onBack: () => void
  onSuccess: (bookingId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setError("")

    try {
      // Create order with Commerce Layer
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          quantity: 1,
          space,
          bookingDetails,
          duration,
          price,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Process payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(orderData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingDetails.customerName,
            email: bookingDetails.customerEmail,
            phone: bookingDetails.customerPhone,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Confirm order
      const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentIntentId: paymentIntent.id,
          bookingId: orderData.bookingId,
        }),
      })

      if (!confirmResponse.ok) {
        throw new Error("Failed to confirm order")
      }

      onSuccess(orderData.bookingId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Card Details</Label>
            <div className="mt-2 p-3 border rounded-md">
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
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="text-xs text-gray-500">
            <p>Test card: 4242 4242 4242 4242</p>
            <p>Use any future date for expiry and any 3-digit CVC</p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
              Back
            </Button>
            <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
              {isProcessing ? "Processing..." : `Pay £${price}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function BookingSummary({
  space,
  duration,
  price,
  bookingDetails,
}: {
  space: any
  duration: string
  price: number
  bookingDetails: BookingDetails
}) {
  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">{space.title}</h4>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {space.address}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Duration:</span>
            <Badge variant="secondary">{duration}ly</Badge>
          </div>
          <div className="flex justify-between">
            <span>Rate:</span>
            <span>
              £{price}/{duration}
            </span>
          </div>
        </div>

        {bookingDetails.vehicleReg && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span className="font-medium">Vehicle</span>
              </div>
              <div className="text-sm">
                <p>{bookingDetails.vehicleReg}</p>
                <p className="text-gray-600 capitalize">{bookingDetails.vehicleType}</p>
              </div>
            </div>
          </>
        )}

        {bookingDetails.startDate && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Schedule</span>
              </div>
              <div className="text-sm">
                <p>
                  {bookingDetails.startDate} {bookingDetails.startTime}
                </p>
                <p className="text-gray-600">to</p>
                <p>
                  {bookingDetails.endDate} {bookingDetails.endTime}
                </p>
              </div>
            </div>
          </>
        )}

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>£{price}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ConfirmationStep({
  bookingId,
  space,
  bookingDetails,
}: {
  bookingId: string
  space: any
  bookingDetails: BookingDetails
}) {
  return (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
      <p className="text-gray-600 mb-8">Your parking space has been successfully reserved.</p>

      <Card className="max-w-md mx-auto text-left">
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="font-medium">Booking ID:</span>
            <p className="text-sm text-gray-600">{bookingId}</p>
          </div>
          <div>
            <span className="font-medium">Location:</span>
            <p className="text-sm text-gray-600">{space.title}</p>
          </div>
          <div>
            <span className="font-medium">Vehicle:</span>
            <p className="text-sm text-gray-600">{bookingDetails.vehicleReg}</p>
          </div>
          <div>
            <span className="font-medium">Email:</span>
            <p className="text-sm text-gray-600">{bookingDetails.customerEmail}</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button onClick={() => (window.location.href = "/")}>Return to Home</Button>
      </div>
    </div>
  )
}
