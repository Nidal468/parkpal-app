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
import { ArrowLeft, CreditCard, CheckCircle, MapPin, Clock, Car } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ParkingSpace {
  id: string
  name: string
  address: string
  description: string
  features: string[]
  rating: number
  reviews: number
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
  specialRequests: string
  startDate: string
  startTime: string
}

function CheckoutForm({ parkingSpace, duration, price, sku, onBack }: CommerceLayerCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>("details")
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string>("")
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

  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!bookingDetails.customerName || !bookingDetails.email || !bookingDetails.vehicleReg) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setStep("payment")
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      // Create order in our backend
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku,
          quantity: 1,
          parkingSpaceId: parkingSpace.id,
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

      setBookingId(confirmData.bookingId)
      setStep("confirmation")

      toast({
        title: "Booking Confirmed!",
        description: "Your parking space has been reserved successfully.",
      })
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">Booking Confirmed!</CardTitle>
              <CardDescription>Your parking space has been successfully reserved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Booking ID: {bookingId}</p>
                <p className="text-sm text-gray-600">Please save this for your records</p>
              </div>

              <div className="text-left space-y-4">
                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location
                  </h3>
                  <p className="text-gray-700">{parkingSpace.name}</p>
                  <p className="text-sm text-gray-600">{parkingSpace.address}</p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    Duration & Schedule
                  </h3>
                  <p className="text-gray-700">
                    {duration.charAt(0).toUpperCase() + duration.slice(1)}ly booking - ${price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Starting: {bookingDetails.startDate} at {bookingDetails.startTime}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <Car className="w-4 h-4 mr-2" />
                    Vehicle
                  </h3>
                  <p className="text-gray-700">{bookingDetails.vehicleReg}</p>
                  <p className="text-sm text-gray-600 capitalize">{bookingDetails.vehicleType}</p>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={onBack} className="w-full">
                  Return to Homepage
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
          <div>
            <h1 className="text-2xl font-bold">Complete Your Booking</h1>
            <p className="text-gray-600">Step {step === "details" ? "1" : "2"} of 2</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{parkingSpace.name}</h3>
                  <p className="text-sm text-gray-600">{parkingSpace.address}</p>
                </div>

                <div className="flex justify-between items-center py-2 border-t">
                  <span className="capitalize">{duration}ly Rate</span>
                  <span className="font-semibold">${price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-t font-bold">
                  <span>Total</span>
                  <span>${price.toFixed(2)}</span>
                </div>

                <Badge variant="outline" className="w-full justify-center">
                  SKU: {sku}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-2">
            {step === "details" && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                  <CardDescription>Please provide your information and vehicle details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDetailsSubmit} className="space-y-6">
                    {/* Customer Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Customer Information</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerName">Full Name *</Label>
                          <Input
                            id="customerName"
                            value={bookingDetails.customerName}
                            onChange={(e) =>
                              setBookingDetails((prev) => ({
                                ...prev,
                                customerName: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={bookingDetails.email}
                            onChange={(e) =>
                              setBookingDetails((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
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
                          onChange={(e) =>
                            setBookingDetails((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Vehicle Information</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                          <Input
                            id="vehicleReg"
                            value={bookingDetails.vehicleReg}
                            onChange={(e) =>
                              setBookingDetails((prev) => ({
                                ...prev,
                                vehicleReg: e.target.value.toUpperCase(),
                              }))
                            }
                            placeholder="ABC123"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="vehicleType">Vehicle Type</Label>
                          <Select
                            value={bookingDetails.vehicleType}
                            onValueChange={(value) =>
                              setBookingDetails((prev) => ({
                                ...prev,
                                vehicleType: value,
                              }))
                            }
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
                    </div>

                    {/* Schedule */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Schedule</h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={bookingDetails.startDate}
                            onChange={(e) =>
                              setBookingDetails((prev) => ({
                                ...prev,
                                startDate: e.target.value,
                              }))
                            }
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>

                        <div>
                          <Label htmlFor="startTime">Start Time</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={bookingDetails.startTime}
                            onChange={(e) =>
                              setBookingDetails((prev) => ({
                                ...prev,
                                startTime: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                      <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                      <Textarea
                        id="specialRequests"
                        value={bookingDetails.specialRequests}
                        onChange={(e) =>
                          setBookingDetails((prev) => ({
                            ...prev,
                            specialRequests: e.target.value,
                          }))
                        }
                        placeholder="Any special requirements or requests..."
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
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>Enter your card details to complete the booking</CardDescription>
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
                        Use card number: <code className="bg-white px-1 rounded">4242 4242 4242 4242</code>
                      </p>
                      <p className="text-sm text-gray-600">Any future expiry date and any 3-digit CVC</p>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setStep("details")} className="flex-1">
                        Back to Details
                      </Button>
                      <Button type="submit" disabled={!stripe || loading} className="flex-1">
                        {loading ? "Processing..." : `Pay $${price.toFixed(2)}`}
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
