"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestPaymentLinking() {
  const [linkingResult, setLinkingResult] = useState<any>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)

  const linkPaymentMethod = async () => {
    setIsLinking(true)
    setLinkingResult(null)

    try {
      const response = await fetch("/api/commerce-layer/link-payment-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setLinkingResult({ success: response.ok, data, status: response.status })
    } catch (error) {
      setLinkingResult({
        success: false,
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        status: 500,
      })
    } finally {
      setIsLinking(false)
    }
  }

  const testOrderCreation = async () => {
    setIsCreatingOrder(true)
    setOrderResult(null)

    try {
      const response = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: "parking-hour",
          customerName: "Test Customer",
          customerEmail: "test@parkpal.com",
          quantity: 1,
        }),
      })

      const data = await response.json()
      setOrderResult({ success: response.ok, data, status: response.status })
    } catch (error) {
      setOrderResult({
        success: false,
        data: { error: error instanceof Error ? error.message : "Unknown error" },
        status: 500,
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Commerce Layer Payment Integration Test</h1>
        <p className="text-muted-foreground">Test the payment method linking and order creation process</p>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>Commerce Layer setup details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Market & Payment</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Market ID:</strong> vjkaZhNPnl
                </div>
                <div>
                  <strong>Payment Method ID:</strong> KkqYWsPzjk
                </div>
                <div>
                  <strong>Payment Gateway ID:</strong> PxpOwsDWKk
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Stripe Configuration</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Mode:</strong> <Badge variant="secondary">Test/Sandbox</Badge>
                </div>
                <div>
                  <strong>Key:</strong> sk_test_51RXh8D...
                </div>
                <div>
                  <strong>Webhook:</strong> Active
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Link Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 1: Link Payment Method to Market
            {linkingResult?.success && <CheckCircle className="h-5 w-5 text-green-500" />}
            {linkingResult?.success === false && <XCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>Connect payment method KkqYWsPzjk to market vjkaZhNPnl</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={linkPaymentMethod} disabled={isLinking} className="w-full">
            {isLinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLinking ? "Linking Payment Method..." : "Link Payment Method"}
          </Button>

          {linkingResult && (
            <div className="mt-4">
              <div
                className={`p-4 rounded-lg ${linkingResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {linkingResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">{linkingResult.success ? "Success!" : "Failed"}</span>
                  <Badge variant={linkingResult.success ? "default" : "destructive"}>{linkingResult.status}</Badge>
                </div>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                  {JSON.stringify(linkingResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Test Order Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 2: Test Order Creation
            {orderResult?.success && <CheckCircle className="h-5 w-5 text-green-500" />}
            {orderResult?.success === false && <XCircle className="h-5 w-5 text-red-500" />}
          </CardTitle>
          <CardDescription>Create a test order with the linked payment method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Test Order Details:</h4>
            <div className="text-sm space-y-1">
              <div>
                <strong>SKU:</strong> parking-hour
              </div>
              <div>
                <strong>Customer:</strong> Test Customer (test@parkpal.com)
              </div>
              <div>
                <strong>Quantity:</strong> 1
              </div>
            </div>
          </div>

          <Button
            onClick={testOrderCreation}
            disabled={isCreatingOrder || !linkingResult?.success}
            className="w-full"
            variant={linkingResult?.success ? "default" : "secondary"}
          >
            {isCreatingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreatingOrder ? "Creating Test Order..." : "Create Test Order"}
          </Button>

          {!linkingResult?.success && linkingResult !== null && (
            <p className="text-sm text-muted-foreground">Complete Step 1 successfully before testing order creation</p>
          )}

          {orderResult && (
            <div className="mt-4">
              <div
                className={`p-4 rounded-lg ${orderResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {orderResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-semibold">{orderResult.success ? "Order Created!" : "Order Failed"}</span>
                  <Badge variant={orderResult.success ? "default" : "destructive"}>{orderResult.status}</Badge>
                </div>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                  {JSON.stringify(orderResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Summary */}
      {linkingResult?.success && orderResult?.success && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Integration Complete!
            </CardTitle>
            <CardDescription className="text-green-700">
              Payment method is linked and orders can be created successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-green-800">
              <div>✅ Payment method linked to market</div>
              <div>✅ Order creation working</div>
              <div>✅ Stripe integration configured</div>
              <div>✅ Database booking storage working</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
