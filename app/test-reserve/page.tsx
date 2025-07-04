"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function TestReservePage() {
  const [step, setStep] = useState<"select" | "details" | "payment" | "success">("select")
  const [selectedSKU, setSelectedSKU] = useState("")
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleReg: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState("")

  // Your actual Commerce Layer SKUs - update these with your real SKUs
  const commerceLayerSKUs = [
    {
      id: "PARKING_HOUR_DOWNTOWN",
      name: "Hourly Parking - Downtown",
      description: "Perfect for short visits",
      duration: "1 hour",
    },
    {
      id: "PARKING_DAY_DOWNTOWN",
      name: "Daily Parking - Downtown",
      description: "All-day parking solution",
      duration: "1 day",
    },
    {
      id: "PARKING_MONTH_DOWNTOWN",
      name: "Monthly Parking - Downtown",
      description: "Long-term parking option",
      duration: "1 month",
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

  const handleCommerceLayerOrder = async () => {
    setIsProcessing(true)
    setError("")

    try {
      console.log("🚀 Creating Commerce Layer order...")

      // Step 1: Create Commerce Layer order
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedSKU,
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

      // Step 2: Confirm the order (simulate payment)
      console.log("💳 Confirming Commerce Layer order...")

      const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          commerceLayerOrderId: orderData.commerceLayerOrderId,
          paymentMethodId: "test_payment_method_123",
        }),
      })

      const confirmData = await confirmResponse.json()
      console.log("✅ Confirm Response:", confirmData)

      if (!confirmResponse.ok || !confirmData.success) {
        throw new Error(confirmData.error || `HTTP ${confirmResponse.status}: ${confirmResponse.statusText}`)
      }

      setOrderData({ ...orderData, ...confirmData })
      setStep("success")
    } catch (error) {
      console.error("❌ Commerce Layer Error:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏪 Commerce Layer Integration Test</h1>
          <p className="text-gray-600">Testing real Commerce Layer API integration</p>
        </div>

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
              <CardTitle>Step 1: Select Commerce Layer SKU</CardTitle>
              <p className="text-sm text-gray-600">Choose a parking option from your Commerce Layer catalog</p>
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
                      </div>
                    </div>
                    <Button size="sm">Select</Button>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">📋 Requirements:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• These SKUs must exist in your Commerce Layer catalog</li>
                  <li>• Set COMMERCE_LAYER_CLIENT_ID in environment variables</li>
                  <li>• Set COMMERCE_LAYER_CLIENT_SECRET in environment variables</li>
                  <li>• Set COMMERCE_LAYER_BASE_URL (e.g., https://yourdomain.commercelayer.io)</li>
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

        {/* Step 3: Commerce Layer Order Processing */}
        {step === "payment" && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Commerce Layer Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">📦 Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span className="font-medium">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SKU:</span>
                    <span className="font-mono text-xs">{selectedSKU}</span>
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
                    <span>Email:</span>
                    <span>{customerDetails.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vehicle:</span>
                    <span className="font-mono">{customerDetails.vehicleReg}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>🧪 Test Mode:</strong> This will create a real Commerce Layer order and customer. The payment
                  will be simulated for testing purposes.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button onClick={handleCommerceLayerOrder} disabled={isProcessing} className="flex-1">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Create Commerce Layer Order"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === "success" && selectedProduct && orderData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Commerce Layer Order Created!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 text-green-800">✅ Success Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Commerce Layer Order ID:</span>
                    <span className="font-mono text-xs">{orderData.commerceLayerOrderId || orderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer ID:</span>
                    <span className="font-mono text-xs">{orderData.customerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SKU Processed:</span>
                    <span className="font-mono text-xs">{orderData.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Status:</span>
                    <Badge variant="outline">{orderData.status}</Badge>
                  </div>
                  {orderData.amount && (
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-medium">
                        {orderData.currency} {orderData.amount}
                      </span>
                    </div>
                  )}
                  {orderData.bookingReference && (
                    <div className="flex justify-between">
                      <span>Booking Reference:</span>
                      <span className="font-mono">{orderData.bookingReference}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-blue-800">🎉 Integration Status</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>✅ Commerce Layer SDK connected</p>
                  <p>✅ Customer created/found in Commerce Layer</p>
                  <p>✅ Order created with line items</p>
                  <p>✅ SKU validation successful</p>
                  <p>✅ Order placed and confirmed</p>
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
                Test Another SKU
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
