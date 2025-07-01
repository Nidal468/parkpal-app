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
import { Badge } from "@/components/ui/badge"
import { CheckCircle, CreditCard, AlertCircle } from "lucide-react"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface BookingFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleReg: string
  sku: string
}

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [bookingData, setBookingData] = useState<BookingFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    vehicleReg: "",
    sku: "parking-hour",
  })

  const skuOptions = [
    { value: "parking-hour", label: "Hourly Parking", description: "Perfect for short visits" },
    { value: "parking-day", label: "Daily Parking", description: "All-day parking solution" },
    { value: "parking-month", label: "Monthly Parking", description: "Long-term parking pass" },
  ]

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setBookingData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet")
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError("Card element not found")
      setLoading(false)
      return
    }

    try {
      // Step 1: Create Commerce Layer order
      console.log("🚀 Creating Commerce Layer order...")
      const createOrderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: bookingData.sku,
          quantity: 1,
          customerDetails: {
            name: bookingData.customerName,
            email: bookingData.customerEmail,
            phone: bookingData.customerPhone,
          },
          bookingDetails: {
            vehicleReg: bookingData.vehicleReg,
            vehicleType: "car",
            startDate: new Date().toISOString().split("T")[0],
            startTime: "09:00",
          },
        }),
      })

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json()
        throw new Error(errorData.details || errorData.error || "Failed to create order")
      }

      const orderData = await createOrderResponse.json()
      console.log("✅ Commerce Layer order created:", orderData)

      if (!orderData.clientSecret) {
        throw new Error("No payment required or Stripe not configured")
      }

      // Step 2: Confirm payment with Stripe
      console.log("💳 Confirming payment with Stripe...")
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(orderData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingData.customerName,
            email: bookingData.customerEmail,
          },
        },
      })

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed")
      }

      if (paymentIntent?.status === "succeeded") {
        console.log("✅ Payment succeeded:", paymentIntent.id)

        // Step 3: Confirm order in Commerce Layer
        console.log("🔄 Confirming order in Commerce Layer...")
        const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentIntentId: paymentIntent.id,
          }),
        })

        if (!confirmResponse.ok) {
          const errorData = await confirmResponse.json()
          throw new Error(errorData.details || errorData.error || "Failed to confirm order")
        }

        const confirmData = await confirmResponse.json()
        console.log("✅ Order confirmed:", confirmData)

        setSuccess(true)
      } else {
        throw new Error("Payment was not successful")
      }
    } catch (err) {
      console.error("❌ Payment failed:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">Booking Confirmed!</CardTitle>
          <CardDescription>Your parking space has been successfully reserved.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            A confirmation email has been sent to {bookingData.customerEmail}
          </p>
          <Button
            onClick={() => {
              setSuccess(false)
              setBookingData({
                customerName: "",
                customerEmail: "",
                customerPhone: "",
                vehicleReg: "",
                sku: "parking-hour",
              })
            }}
            variant="outline"
            className="w-full"
          >
            Make Another Booking
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Test Parking Reservation
        </CardTitle>
        <CardDescription>Test the complete Commerce Layer + Stripe integration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Details */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Full Name</Label>
            <Input
              id="customerName"
              type="text"
              value={bookingData.customerName}
              onChange={(e) => handleInputChange("customerName", e.target.value)}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => handleInputChange("customerEmail", e.target.value)}
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone (Optional)</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={bookingData.customerPhone}
              onChange={(e) => handleInputChange("customerPhone", e.target.value)}
              placeholder="+44 7700 900123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleReg">Vehicle Registration</Label>
            <Input
              id="vehicleReg"
              type="text"
              value={bookingData.vehicleReg}
              onChange={(e) => handleInputChange("vehicleReg", e.target.value.toUpperCase())}
              required
              placeholder="AB12 CDE"
            />
          </div>

          {/* SKU Selection */}
          <div className="space-y-2">
            <Label htmlFor="sku">Parking Duration</Label>
            <Select value={bookingData.sku} onValueChange={(value) => handleInputChange("sku", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select parking duration" />
              </SelectTrigger>
              <SelectContent>
                {skuOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Details */}
          <div className="space-y-2">
            <Label>Payment Details</Label>
            <div className="p-3 border rounded-md">
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

          {/* Test Card Info */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-1">Test Card Details:</p>
            <p className="text-xs text-blue-700">Card: 4242 4242 4242 4242</p>
            <p className="text-xs text-blue-700">Expiry: Any future date</p>
            <p className="text-xs text-blue-700">CVC: Any 3 digits</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Payment Failed</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={!stripe || loading} className="w-full">
            {loading ? "Processing..." : "Reserve Parking Space"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function TestReservePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Parking Reservation</h1>
          <p className="text-gray-600">Complete Commerce Layer + Stripe integration test</p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge variant="outline">Commerce Layer</Badge>
            <Badge variant="outline">Stripe</Badge>
            <Badge variant="outline">Supabase</Badge>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">This is a test environment. No real charges will be made.</p>
        </div>
      </div>
    </div>
  )
}
