"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, MapPin, User, Mail, Phone, CreditCard, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import type { ParkingSpaceDisplay } from "@/lib/supabase-types"
import { PARKING_SKUS, type ParkingDuration, createOrder, updateOrderWithCustomer } from "@/lib/commerce-layer"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CheckoutModalProps {
  space: ParkingSpaceDisplay | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (orderId: string) => void
}

interface BookingDetails {
  duration: ParkingDuration
  startDate: Date
  endDate: Date
  quantity: number
  vehicleReg: string
  specialRequests?: string
}

interface CustomerDetails {
  firstName: string
  lastName: string
  email: string
  phone: string
}

// Pricing configuration with fallback values
const PRICING_CONFIG = {
  hourly: { label: "Hourly", basePrice: 3, unit: "hour" },
  daily: { label: "Daily", basePrice: 15, unit: "day" },
  monthly: { label: "Monthly", basePrice: 300, unit: "month" },
}

function CheckoutForm({
  space,
  bookingDetails,
  customerDetails,
  onSuccess,
  onBack,
}: {
  space: ParkingSpaceDisplay
  bookingDetails: BookingDetails
  customerDetails: CustomerDetails
  onSuccess: (orderId: string) => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateTotal = () => {
    const config = PRICING_CONFIG[bookingDetails.duration]
    return config.basePrice * bookingDetails.quantity
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create Commerce Layer order
      const order = await createOrder([
        {
          skuCode: PARKING_SKUS[bookingDetails.duration],
          quantity: bookingDetails.quantity,
          metadata: {
            space_id: space.id,
            space_title: space.title,
            vehicle_registration: bookingDetails.vehicleReg,
            start_date: bookingDetails.startDate.toISOString(),
            end_date: bookingDetails.endDate.toISOString(),
            special_requests: bookingDetails.specialRequests,
          },
        },
      ])

      // Update order with customer details
      await updateOrderWithCustomer(order.id, customerDetails)

      // Create payment intent via our API
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          amount: calculateTotal() * 100, // Convert to pence
          currency: "gbp",
          customerEmail: customerDetails.email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment intent")
      }

      const { client_secret } = await response.json()

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("Card element not found")
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerDetails.firstName} ${customerDetails.lastName}`,
            email: customerDetails.email,
            phone: customerDetails.phone,
          },
        },
      })

      if (stripeError) {
        setError(stripeError.message || "Payment failed")
      } else if (paymentIntent.status === "succeeded") {
        // Update order status in Commerce Layer
        await fetch("/api/update-order-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: order.id,
            paymentIntentId: paymentIntent.id,
            status: "paid",
          }),
        })

        onSuccess(order.id)
      }
    } catch (err) {
      console.error("Payment error:", err)
      setError("Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const total = calculateTotal()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{space.title}</p>
              <p className="text-sm text-muted-foreground">{space.location}</p>
            </div>
            <Badge variant="secondary">{PRICING_CONFIG[bookingDetails.duration].label}</Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>
                {bookingDetails.quantity} {PRICING_CONFIG[bookingDetails.duration].unit}(s)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Vehicle:</span>
              <span>{bookingDetails.vehicleReg}</span>
            </div>
            <div className="flex justify-between">
              <span>Start:</span>
              <span>{format(bookingDetails.startDate, "PPP")}</span>
            </div>
            <div className="flex justify-between">
              <span>End:</span>
              <span>{format(bookingDetails.endDate, "PPP")}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total:</span>
            <span className="text-green-600">£{total}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
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
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing} className="flex-1 bg-green-600 hover:bg-green-700">
          {isProcessing ? "Processing..." : `Pay £${total}`}
        </Button>
      </div>
    </form>
  )
}

export function CheckoutModal({ space, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<"booking" | "customer" | "payment">("booking")
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    duration: "daily",
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    quantity: 1,
    vehicleReg: "",
  })
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  if (!space) return null

  const resetForm = () => {
    setStep("booking")
    setBookingDetails({
      duration: "daily",
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      quantity: 1,
      vehicleReg: "",
    })
    setCustomerDetails({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    })
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Reserve Parking Space
          </DialogTitle>
          <DialogDescription>Complete your booking for {space.title}</DialogDescription>
        </DialogHeader>

        {step === "booking" && (
          <BookingStep
            space={space}
            bookingDetails={bookingDetails}
            onUpdate={setBookingDetails}
            onNext={() => setStep("customer")}
            onCancel={handleClose}
          />
        )}

        {step === "customer" && (
          <CustomerStep
            customerDetails={customerDetails}
            onUpdate={setCustomerDetails}
            onNext={() => setStep("payment")}
            onBack={() => setStep("booking")}
          />
        )}

        {step === "payment" && (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              space={space}
              bookingDetails={bookingDetails}
              customerDetails={customerDetails}
              onSuccess={onSuccess}
              onBack={() => setStep("customer")}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Booking Details Step
function BookingStep({
  space,
  bookingDetails,
  onUpdate,
  onNext,
  onCancel,
}: {
  space: ParkingSpaceDisplay
  bookingDetails: BookingDetails
  onUpdate: (details: BookingDetails) => void
  onNext: () => void
  onCancel: () => void
}) {
  const calculateQuantity = () => {
    const { duration, startDate, endDate } = bookingDetails
    const diffTime = endDate.getTime() - startDate.getTime()

    switch (duration) {
      case "hourly":
        return Math.ceil(diffTime / (1000 * 60 * 60))
      case "daily":
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      case "monthly":
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
      default:
        return 1
    }
  }

  const [quantity, setQuantity] = useState<number>(calculateQuantity())

  useEffect(() => {
    const newQuantity = calculateQuantity()
    setQuantity(newQuantity)
    onUpdate({ ...bookingDetails, quantity: newQuantity })
  }, [bookingDetails.duration, bookingDetails.startDate, bookingDetails.endDate])

  const total = PRICING_CONFIG[bookingDetails.duration].basePrice * quantity

  return (
    <div className="space-y-6">
      {/* Space Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <img
              src={space.image_url || "/placeholder.svg?height=80&width=120"}
              alt={space.title}
              className="w-20 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold">{space.title}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {space.location}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duration Selection */}
      <div className="space-y-2">
        <Label>Parking Duration</Label>
        <Select
          value={bookingDetails.duration}
          onValueChange={(value: ParkingDuration) => onUpdate({ ...bookingDetails, duration: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRICING_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center justify-between w-full">
                  <span>{config.label}</span>
                  <span className="ml-4 text-green-600">
                    £{config.basePrice}/{config.unit}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input
            type="datetime-local"
            value={format(bookingDetails.startDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) =>
              onUpdate({
                ...bookingDetails,
                startDate: new Date(e.target.value),
              })
            }
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input
            type="datetime-local"
            value={format(bookingDetails.endDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) =>
              onUpdate({
                ...bookingDetails,
                endDate: new Date(e.target.value),
              })
            }
            min={format(bookingDetails.startDate, "yyyy-MM-dd'T'HH:mm")}
          />
        </div>
      </div>

      {/* Vehicle Registration */}
      <div className="space-y-2">
        <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
        <Input
          id="vehicleReg"
          placeholder="AB12 CDE"
          value={bookingDetails.vehicleReg}
          onChange={(e) => onUpdate({ ...bookingDetails, vehicleReg: e.target.value.toUpperCase() })}
          required
        />
      </div>

      {/* Special Requests */}
      <div className="space-y-2">
        <Label htmlFor="requests">Special Requests</Label>
        <Textarea
          id="requests"
          placeholder="Any special requirements..."
          value={bookingDetails.specialRequests || ""}
          onChange={(e) => onUpdate({ ...bookingDetails, specialRequests: e.target.value })}
          rows={3}
        />
      </div>

      {/* Price Summary */}
      <Card className="bg-green-50 dark:bg-green-900/20">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">Total Price</p>
              <p className="text-sm text-muted-foreground">
                {quantity} {PRICING_CONFIG[bookingDetails.duration].unit}(s) × £
                {PRICING_CONFIG[bookingDetails.duration].basePrice}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">£{total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!bookingDetails.vehicleReg.trim()} className="flex-1">
          Continue
        </Button>
      </div>
    </div>
  )
}

// Customer Details Step
function CustomerStep({
  customerDetails,
  onUpdate,
  onNext,
  onBack,
}: {
  customerDetails: CustomerDetails
  onUpdate: (details: CustomerDetails) => void
  onNext: () => void
  onBack: () => void
}) {
  const isValid =
    customerDetails.firstName && customerDetails.lastName && customerDetails.email && customerDetails.phone

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Customer Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="firstName"
                placeholder="John"
                className="pl-10"
                value={customerDetails.firstName}
                onChange={(e) => onUpdate({ ...customerDetails, firstName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="lastName"
                placeholder="Doe"
                className="pl-10"
                value={customerDetails.lastName}
                onChange={(e) => onUpdate({ ...customerDetails, lastName: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                className="pl-10"
                value={customerDetails.email}
                onChange={(e) => onUpdate({ ...customerDetails, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+44 7123 456789"
                className="pl-10"
                value={customerDetails.phone}
                onChange={(e) => onUpdate({ ...customerDetails, phone: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} className="flex-1">
          Continue to Payment
        </Button>
      </div>
    </div>
  )
}
