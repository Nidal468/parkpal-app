"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function TestPaymentLinking() {
  const [linkingStatus, setLinkingStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [orderStatus, setOrderStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [linkingResult, setLinkingResult] = useState<any>(null)
  const [orderResult, setOrderResult] = useState<any>(null)

  const handleLinkPaymentMethod = async () => {
    setLinkingStatus("loading")
    setLinkingResult(null)

    try {
      const response = await fetch("/api/commerce-layer/link-payment-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setLinkingResult(data)

      if (response.ok) {
        setLinkingStatus("success")
      } else {
        setLinkingStatus("error")
      }
    } catch (error) {
      setLinkingStatus("error")
      setLinkingResult({ error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const handleCreateTestOrder = async () => {
    setOrderStatus("loading")
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
          customerEmail: "test@example.com",
          quantity: 1,
        }),
      })

      const data = await response.json()
      setOrderResult(data)

      if (response.ok) {
        setOrderStatus("success")
      } else {
        setOrderStatus("error")
      }
    } catch (error) {
      setOrderStatus("error")
      setOrderResult({ error: error instanceof Error ? error.message : "Unknown error" })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "loading":
        return <Badge variant="secondary">Loading...</Badge>
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Ready</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Commerce Layer Payment Testing</h1>
        <p className="text-muted-foreground">Test payment method linking and order creation</p>
      </div>

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>Commerce Layer integration settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Market ID:</strong> vjkaZhNPnl
            </div>
            <div>
              <strong>Payment Method ID:</strong> KkqYWsPzjk
            </div>
            <div>
              <strong>Payment Gateway ID:</strong> PxpOwsDWKk
            </div>
            <div>
              <strong>Stripe Key:</strong> sk_test_51RXh8D...
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Link Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 1: Link Payment Method
            {getStatusIcon(linkingStatus)}
            {getStatusBadge(linkingStatus)}
          </CardTitle>
          <CardDescription>Link payment method KkqYWsPzjk to market vjkaZhNPnl</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleLinkPaymentMethod} disabled={linkingStatus === "loading"} className="w-full">
            {linkingStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking Payment Method...
              </>
            ) : (
              "Link Payment Method"
            )}
          </Button>

          {linkingResult && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(linkingResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Create Test Order */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 2: Create Test Order
            {getStatusIcon(orderStatus)}
            {getStatusBadge(orderStatus)}
          </CardTitle>
          <CardDescription>Create a test order with the linked payment method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCreateTestOrder}
            disabled={orderStatus === "loading" || linkingStatus !== "success"}
            className="w-full"
          >
            {orderStatus === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Test Order...
              </>
            ) : (
              "Create Test Order"
            )}
          </Button>

          {linkingStatus !== "success" && (
            <p className="text-sm text-muted-foreground">Complete step 1 successfully before proceeding to step 2.</p>
          )}

          {orderResult && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Result:</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(orderResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Additional debugging endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/commerce-layer/debug-token", "_blank")}
            >
              Debug Token
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/commerce-layer/link-payment-method", "_blank")}
            >
              View Link Endpoint
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/commerce-layer/create-order", "_blank")}
            >
              View Order Endpoint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
