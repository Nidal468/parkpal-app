"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2, CreditCard, Globe } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function TestReservePage() {
  const [step, setStep] = useState<"select" | "details" | "payment" | "success">("select")
  const [selectedSKU, setSelectedSKU] = useState("")
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleReg: "",
  })
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState("")

  // Your ACTUAL Commerce Layer SKUs from Parkpal
  const commerceLayerSKUs = [
    {
      id: "parking-hour",
      name: "Hourly Parking",
      description: "Perfect for short visits and appointments",
      duration: "1 hour",
      clId: "nOpOSOOmjP",
    },
    {
      id: "parking-day",
      name: "Daily Parking",
      description: "All-day parking solution for work or events",
      duration: "1 day",
      clId: "nzPQSQQljQ",
    },
    {
      id: "parking-month",
      name: "Monthly Parking",
      description: "Long-term parking pass for regular commuters",
      duration: "1 month",
      clId: "ZrxeSjjmvm",
    },
  ]

  const selectedProduct = commerceLayerSKUs.find((sku) => sku.id === selectedSKU)

  const handleSKUSelect = (skuId: string) => {
    setSelectedSKU(skuId)
    setError("")
    setStep("details")
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerDetails.name || !customerDetails.email || !customerDetails.vehicleReg) {
      setError("Please fill in all required fields")
      return
    }
    setError("")
    setStep("payment")
  }

  const handleCreateOrder = async () => {
    setError("")

    try {
      console.log("🚀 Creating Commerce Layer order with Parkpal SKUs...")

      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedSKU, // Using the actual SKU code (parking-hour, parking-day, parking-month)
          quantity: 1,
          customerDetails: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
          },
          bookingDetails: {
            vehicleReg: customerDetails.vehicleReg,
            vehicleType: "car",
            startDate: new Date().toISOString().split("T")[0],
            startTime: "09:00",
          },
        }),
      })

      const orderData = await orderResponse.json()
      console.log("📦 Order Response:", orderData)

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || `HTTP ${orderResponse.status}: ${orderResponse.statusText}`)
      }

      setOrderData(orderData)
      return orderData
    } catch (error) {
      console.error("❌ Order Creation Error:", error)
      setError(error instanceof Error ? error.message : "Failed to create order")
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🚗 Parkpal Commerce Layer Integration</h1>
          <p className="text-gray-600">Real parking booking with your actual SKUs and market</p>
        </div>

        {/* Market Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Parkpal UK Market Active</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Market: Parkpal UK (vjkaZhNPnl)</p>
                  <p>• Stock Location: Parkpal HQ (okJbPuNbjk)</p>
                  <p>• Using your actual SKU codes from Commerce Layer</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: SKU Selection */}
        {step === "select" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Parking Option</CardTitle>
              <p className="text-sm text-gray-600">Choose from your actual Parkpal Commerce Layer SKUs</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {commerceLayerSKUs.map((sku) => (
                <div
                  key={sku.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSKUSelect(sku.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{sku.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{sku.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{sku.duration}</Badge>
                        <span className="text-xs text-gray-500">SKU: {sku.id}</span>
                        <span className="text-xs text-blue-600">ID: {sku.clId}</span>
                      </div>
                    </div>
                    <Button size="sm">Select</Button>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">✅ Real Parkpal SKUs Loaded:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• parking-hour (nOpOSOOmjP)</li>
                  <li>• parking-day (nzPQSQQljQ)</li>
                  <li>• parking-month (ZrxeSjjmvm)</li>
                  <li>• Market: Parkpal UK (vjkaZhNPnl)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Customer Details */}
        {step === "details" && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Customer Details</CardTitle>
              <div className="flex items-center gap-2">
                <Badge>{selectedProduct.id}</Badge>
                <span className="text-sm text-gray-600">{selectedProduct.name}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedProduct.clId}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+44 7700 900123"
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                  <Input
                    id="vehicleReg"
                    value={customerDetails.vehicleReg}
                    onChange={(e) =>
                      setCustomerDetails((prev) => ({ ...prev, vehicleReg: e.target.value.toUpperCase() }))
                    }
                    placeholder="AB12 CDE"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep("select")} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continue to Payment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && selectedProduct && (
          <Elements stripe={stripePromise}>
            <PaymentForm
              selectedProduct={selectedProduct}
              customerDetails={customerDetails}
              onCreateOrder={handleCreateOrder}
              onSuccess={(data) => {
                setOrderData(data)
                setStep("success")
              }}
              onError={setError}
              onBack={() => setStep("details")}
            />
          </Elements>
        )}

        {/* Step 4: Success */}
        {step === "success" && selectedProduct && orderData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Parkpal Booking Confirmed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 text-green-800">✅ Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Booking Reference:</span>
                    <span className="font-mono">{orderData.bookingReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commerce Layer Order:</span>
                    <span className="font-mono text-xs">{orderData.commerceLayerOrderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market:</span>
                    <span className="font-mono text-xs">Parkpal UK ({orderData.marketId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{customerDetails.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="font-mono">{customerDetails.vehicleReg}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SKU:</span>
                    <span className="font-mono text-xs">{orderData.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CL SKU ID:</span>
                    <span className="font-mono text-xs">{selectedProduct.clId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">
                      {orderData.currency} {orderData.amount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline">{orderData.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-blue-800">🎉 Parkpal Integration Success</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>✅ Commerce Layer order created in Parkpal UK market</p>
                  <p>✅ Customer created/found with vehicle details</p>
                  <p>✅ Real Parkpal SKU validated and added</p>
                  <p>✅ Market-specific pricing applied</p>
                  <p>✅ Stripe payment processed successfully</p>
                  <p>✅ Order confirmed and placed</p>
                  <p>✅ Database booking record created</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setStep("select")
                  setSelectedSKU("")
                  setCustomerDetails({ name: "", email: "", phone: "", vehicleReg: "" })
                  setOrderData(null)
                  setError("")
                }}
                className="w-full"
              >
                Create Another Booking
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function PaymentForm({
  selectedProduct,
  customerDetails,
  onCreateOrder,
  onSuccess,
  onError,
  onBack,
}: {
  selectedProduct: any
  customerDetails: any
  onCreateOrder: () => Promise<any>
  onSuccess: (data: any) => void
  onError: (error: string) => void
  onBack: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    onError("")

    if (!stripe || !elements) {
      onError("Stripe not loaded. Check your NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.")
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: Create Commerce Layer order with real Parkpal SKUs
      const orderData = await onCreateOrder()

      if (!orderData.clientSecret) {
        onError("No payment required or Stripe not configured properly")
        return
      }

      // Step 2: Process payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("Card element not found")
      }

      console.log("💳 Processing Stripe payment for Parkpal SKU:", selectedProduct.id)

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(orderData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerDetails.name,
            email: customerDetails.email,
          },
        },
      })

      if (paymentError) {
        throw new Error(paymentError.message)
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error(`Payment failed with status: ${paymentIntent?.status}`)
      }

      console.log("✅ Stripe payment succeeded for Parkpal:", paymentIntent.id)

      // Step 3: Confirm order in Commerce Layer
      const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          commerceLayerOrderId: orderData.commerceLayerOrderId,
          paymentIntentId: paymentIntent.id,
        }),
      })

      const confirmData = await confirmResponse.json()
      console.log("✅ Parkpal order confirmation response:", confirmData)

      if (!confirmResponse.ok || !confirmData.success) {
        throw new Error(confirmData.error || "Failed to confirm order")
      }

      onSuccess({ ...orderData, ...confirmData })
    } catch (error) {
      console.error("❌ Parkpal payment processing error:", error)
      onError(error instanceof Error ? error.message : "Payment processing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge>{selectedProduct.id}</Badge>
          <span className="text-sm text-gray-600">{selectedProduct.name}</span>
          <Badge variant="outline" className="text-xs">
            {selectedProduct.clId}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">📦 Parkpal Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Product:</span>
                <span className="font-medium">{selectedProduct.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{selectedProduct.duration}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{customerDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <span className="font-mono">{customerDetails.vehicleReg}</span>
              </div>
              <div className="flex justify-between">
                <span>SKU Code:</span>
                <span className="font-mono text-xs">{selectedProduct.id}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Parkpal UK Market</span>
            </div>
            <p className="text-sm text-green-700">
              Processing in your configured Parkpal UK market with real SKUs and pricing.
            </p>
          </div>

          <div>
            <Label>Card Details</Label>
            <div className="mt-2 p-3 border rounded-md bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      "::placeholder": { color: "#aab7c4" },
                    },
                  },
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Test card: 4242 4242 4242 4242 | Any future date | Any 3 digits
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 bg-transparent"
              disabled={isProcessing}
            >
              Back
            </Button>
            <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Complete Payment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
