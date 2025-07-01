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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, CheckCircle, MapPin, Car } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  images: string[]
}

interface CommerceLayerCheckoutProps {
  parkingSpace: ParkingSpace
  duration: "hour" | "day" | "month"
  price: number
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
  startDate: string
  startTime: string
}

function CheckoutForm({ parkingSpace, duration, price, sku, onBack }: CommerceLayerCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [step, setStep] = useState<CheckoutStep>("details")
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string>("")
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    customerName: "",
    email: "",
    phone: "",
    vehicleReg: "",
    vehicleType: "car",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
  })

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bookingDetails.customerName && bookingDetails.email && bookingDetails.vehicleReg) {
      setStep("payment")
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    try {
      // Create order in Commerce Layer
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          quantity: 1,
          price,
          parkingSpace,
          bookingDetails,
          duration,
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error("Card element not found")

      const { error, paymentIntent } = await stripe.confirmCardPayment(orderData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingDetails.customerName,
            email: bookingDetails.email,
            phone: bookingDetails.phone,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm order in Commerce Layer
        const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderData.bookingId,
            paymentMethodId: paymentIntent.payment_method,
          }),
        })

        const confirmData = await confirmResponse.json()

        if (confirmData.success) {
          setBookingId(confirmData.bookingId)
          setStep("confirmation")
        } else {
          throw new Error("Failed to confirm booking")
        }
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-700">Booking Confirmed!</CardTitle>
              <CardDescription>Your parking space has been successfully reserved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Booking Details</h3>
                <p>
                  <strong>Booking ID:</strong> {bookingId}
                </p>
                <p>
                  <strong>Space:</strong> {parkingSpace.name}
                </p>
                <p>
                  <strong>Duration:</strong> {duration}
                </p>
                <p>
                  <strong>Price:</strong> ${price}
                </p>
                <p>
                  <strong>Vehicle:</strong> {bookingDetails.vehicleReg}
                </p>
              </div>

              <div className="text-center space-y-4">
                <p className="text-gray-600">A confirmation email has been sent to {bookingDetails.email}</p>
                <Button onClick={onBack} className="w-full">
                  Book Another Space
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Complete Your Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{parkingSpace.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {parkingSpace.address}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <Badge>{duration}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>SKU:</span>
                    <span className="text-sm font-mono">{sku}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {step === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Car className="w-5 h-5 mr-2" />
                    Booking Details
                  </CardTitle>
                  <CardDescription>Please provide your details and vehicle information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDetailsSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input
                          id="customerName"
                          value={bookingDetails.customerName}
                          onChange={(e) => setBookingDetails((prev) => ({ ...prev, customerName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingDetails.email}
                          onChange={(e) => setBookingDetails((prev) => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={bookingDetails.phone}
                        onChange={(e) => setBookingDetails((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                        <Input
                          id="vehicleReg"
                          value={bookingDetails.vehicleReg}
                          onChange={(e) => setBookingDetails((prev) => ({ ...prev, vehicleReg: e.target.value }))}
                          placeholder="ABC123"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleType">Vehicle Type</Label>
                        <Select
                          value={bookingDetails.vehicleType}
                          onValueChange={(value) => setBookingDetails((prev) => ({ ...prev, vehicleType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="car">Car</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={bookingDetails.startDate}
                          onChange={(e) => setBookingDetails((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={bookingDetails.startTime}
                          onChange={(e) => setBookingDetails((prev) => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
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
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Details
                  </CardTitle>
                  <CardDescription>Enter your payment information to complete the booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePayment} className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <Label className="block mb-2">Card Details</Label>
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

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Test Card Information</h4>
                      <p className="text-sm text-gray-600">
                        Use card number: <code>4242 4242 4242 4242</code>
                        <br />
                        Any future expiry date and any 3-digit CVC
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep("details")} className="flex-1">
                        Back to Details
                      </Button>
                      <Button type="submit" disabled={!stripe || loading} className="flex-1">
                        {loading ? "Processing..." : `Pay $${price}`}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CommerceLayerCheckout(props: CommerceLayerCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
