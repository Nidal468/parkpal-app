"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CreditCard, Shield, MapPin } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

// Initialize Stripe
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
  specialRequests: string
  quantity: number
  startDate: string
  startTime: string
}

export function CommerceLayerCheckout({ space, sku, duration, price, onBack }: CommerceLayerCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm space={space} sku={sku} duration={duration} price={price} onBack={onBack} />
    </Elements>
  )
}

function CheckoutForm({ space, sku, duration, price, onBack }: CommerceLayerCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<"details" | "payment" | "confirmation">("details")
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    vehicleReg: "",
    vehicleType: "car",
    specialRequests: "",
    quantity: 1,
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
  })

  const totalPrice = price * bookingDetails.quantity

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep("payment")
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      // Create Commerce Layer order
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          quantity: bookingDetails.quantity,
          customerDetails: {
            name: bookingDetails.customerName,
            email: bookingDetails.customerEmail,
            phone: bookingDetails.customerPhone,
          },
          bookingDetails: {
            vehicleReg: bookingDetails.vehicleReg,
            vehicleType: bookingDetails.vehicleType,
            startDate: bookingDetails.startDate,
            startTime: bookingDetails.startTime,
            specialRequests: bookingDetails.specialRequests,
          },
          spaceId: space.id,
        }),
      })

      const order = await orderResponse.json()

      if (!order.success) {
        throw new Error(order.error || "Failed to create order")
      }

      // Process payment with Stripe
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(order.clientSecret, {
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
        throw error
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm the order in Commerce Layer
        await fetch("/api/commerce-layer/confirm-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.orderId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        setStep("confirmation")
      }
    } catch (error) {
      console.error("Payment failed:", error)
      alert("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
    },
  }

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 mb-6">
                Your parking space has been successfully reserved. You'll receive a confirmation email shortly.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Booking Details</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Space:</strong> {space.title}
                  </p>
                  <p>
                    <strong>Duration:</strong> {bookingDetails.quantity} {duration}(s)
                  </p>
                  <p>
                    <strong>Vehicle:</strong> {bookingDetails.vehicleReg} ({bookingDetails.vehicleType})
                  </p>
                  <p>
                    <strong>Start:</strong> {bookingDetails.startDate} at {bookingDetails.startTime}
                  </p>
                  <p>
                    <strong>Total Paid:</strong> £{totalPrice}
                  </p>
                </div>
              </div>
              <Button onClick={() => (window.location.href = "/")} className="w-full">
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{space.title}</h4>
                  <p className="text-sm text-gray-600">{space.address}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{duration}ly</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span>
                      {bookingDetails.quantity} {duration}(s)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate:</span>
                    <span>
                      £{price}/{duration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SKU:</span>
                    <Badge variant="outline">{sku}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>£{totalPrice}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-2">
            {step === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    {/* Customer Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Customer Information</h3>
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
                          <Label htmlFor="customerEmail">Email *</Label>
                          <Input
                            id="customerEmail"
                            type="email"
                            value={bookingDetails.customerEmail}
                            onChange={(e) => setBookingDetails((prev) => ({ ...prev, customerEmail: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="customerPhone">Phone Number</Label>
                          <Input
                            id="customerPhone"
                            type="tel"
                            value={bookingDetails.customerPhone}
                            onChange={(e) => setBookingDetails((prev) => ({ ...prev, customerPhone: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Vehicle Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Vehicle Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                          <Input
                            id="vehicleReg"
                            placeholder="e.g. AB12 CDE"
                            value={bookingDetails.vehicleReg}
                            onChange={(e) => setBookingDetails((prev) => ({ ...prev, vehicleReg: e.target.value }))}
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
                              <SelectItem value="motorcycle">Motorcycle</SelectItem>
                              <SelectItem value="van">Van</SelectItem>
                              <SelectItem value="truck">Truck</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Booking Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Booking Schedule</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Select
                            value={bookingDetails.quantity.toString()}
                            onValueChange={(value) =>
                              setBookingDetails((prev) => ({ ...prev, quantity: Number.parseInt(value) }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={bookingDetails.startDate}
                            onChange={(e) => setBookingDetails((prev) => ({ ...prev, startDate: e.target.value }))}
                            min={new Date().toISOString().split("T")[0]}
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
                    </div>

                    <div>
                      <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                      <Textarea
                        id="specialRequests"
                        placeholder="Any special requirements..."
                        value={bookingDetails.specialRequests}
                        onChange={(e) => setBookingDetails((prev) => ({ ...prev, specialRequests: e.target.value }))}
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
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div>
                      <Label>Card Details</Label>
                      <div className="mt-2 p-3 border rounded-md">
                        <CardElement options={cardElementOptions} />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Test card: 4242 4242 4242 4242 | Any future date | Any 3 digits
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep("details")} className="flex-1">
                        Back to Details
                      </Button>
                      <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
                        {isProcessing ? "Processing..." : `Pay £${totalPrice}`}
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
