"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function TestReservePage() {
  const [step, setStep] = useState<"select" | "details" | "payment" | "success">("select")
  const [selectedSKU, setSelectedSKU] = useState("")
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    vehicleReg: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)

  // Test SKUs - these need to match your Commerce Layer backend
  const testSKUs = [
    { id: "parking_hour_test", name: "Hourly Parking", price: 8 },
    { id: "parking_day_test", name: "Daily Parking", price: 45 },
    { id: "parking_month_test", name: "Monthly Parking", price: 280 },
  ]

  const selectedProduct = testSKUs.find((sku) => sku.id === selectedSKU)

  const handleSKUSelect = (skuId: string) => {
    setSelectedSKU(skuId)
    setStep("details")
  }

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerDetails.name || !customerDetails.email || !customerDetails.vehicleReg) {
      alert("Please fill in all required fields")
      return
    }
    setStep("payment")
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      // Test the API endpoints
      const orderResponse = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: selectedSKU,
          quantity: 1,
          customerDetails: {
            name: customerDetails.name,
            email: customerDetails.email,
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
      console.log("Order Response:", orderData)

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Simulate payment success for testing
      const confirmResponse = await fetch("/api/commerce-layer/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentIntentId: orderData.paymentIntentId,
        }),
      })

      const confirmData = await confirmResponse.json()
      console.log("Confirm Response:", confirmData)

      if (confirmData.success) {
        setStep("success")
      } else {
        throw new Error(confirmData.error || "Failed to confirm order")
      }
    } catch (error) {
      console.error("Payment Error:", error)
      alert(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Commerce Layer Test</h1>
          <p className="text-gray-600">Simple test page for booking integration</p>
        </div>

        {step === "select" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select SKU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testSKUs.map((sku) => (
                <div
                  key={sku.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSKUSelect(sku.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{sku.name}</h3>
                      <p className="text-sm text-gray-500">SKU: {sku.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">£{sku.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {step === "details" && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Customer Details</CardTitle>
              <p className="text-sm text-gray-600">
                Selected: {selectedProduct.name} - £{selectedProduct.price}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleReg">Vehicle Registration *</Label>
                  <Input
                    id="vehicleReg"
                    value={customerDetails.vehicleReg}
                    onChange={(e) => setCustomerDetails((prev) => ({ ...prev, vehicleReg: e.target.value }))}
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

        {step === "payment" && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Test Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span>{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SKU:</span>
                    <span>{selectedSKU}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{customerDetails.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span>{customerDetails.email}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>£{selectedProduct.price}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Test Mode:</strong> This will test the API endpoints without real payment processing.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setStep("details")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handlePayment} disabled={isProcessing} className="flex-1">
                  {isProcessing ? "Processing..." : "Test Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "success" && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Test Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Test Results</h3>
                <div className="space-y-1 text-sm">
                  <p>✅ Order creation API working</p>
                  <p>✅ Order confirmation API working</p>
                  <p>✅ SKU: {selectedSKU} processed</p>
                  <p>✅ Price: £{selectedProduct.price}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setStep("select")
                  setSelectedSKU("")
                  setCustomerDetails({ name: "", email: "", vehicleReg: "" })
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
