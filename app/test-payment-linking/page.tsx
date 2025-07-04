"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

interface ApiResponse {
  success?: boolean
  error?: string
  [key: string]: any
}

export default function TestPaymentLinking() {
  const [debugResult, setDebugResult] = useState<ApiResponse | null>(null)
  const [linkResult, setLinkResult] = useState<ApiResponse | null>(null)
  const [orderResult, setOrderResult] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const runDebugToken = async () => {
    setLoading("debug")
    try {
      const response = await fetch("/api/commerce-layer/debug-token")
      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      setDebugResult({ error: error instanceof Error ? error.message : "Debug failed" })
    } finally {
      setLoading(null)
    }
  }

  const runLinkPaymentMethod = async () => {
    setLoading("link")
    try {
      const response = await fetch("/api/commerce-layer/link-payment-method", {
        method: "POST",
      })
      const data = await response.json()
      setLinkResult(data)
    } catch (error) {
      setLinkResult({ error: error instanceof Error ? error.message : "Linking failed" })
    } finally {
      setLoading(null)
    }
  }

  const runCreateOrder = async () => {
    setLoading("order")
    try {
      const response = await fetch("/api/commerce-layer/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: "parking-hour",
          customerName: "Test User",
          customerEmail: "test@example.com",
          quantity: 1,
        }),
      })
      const data = await response.json()
      setOrderResult(data)
    } catch (error) {
      setOrderResult({ error: error instanceof Error ? error.message : "Order creation failed" })
    } finally {
      setLoading(null)
    }
  }

  const StatusIcon = ({ success }: { success?: boolean }) => {
    if (success === true) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (success === false) return <XCircle className="h-5 w-5 text-red-500" />
    return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Commerce Layer Payment Integration Test</h1>
        <p className="text-muted-foreground">
          Test the Commerce Layer integration with simplified scope for Integration Apps
        </p>
      </div>

      {/* Configuration Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Current Commerce Layer setup</CardDescription>
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
              <strong>Scope:</strong> <Badge variant="secondary">market:all</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Debug Token */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Step 1: Debug Token Request</span>
            {debugResult && <StatusIcon success={debugResult.success} />}
          </CardTitle>
          <CardDescription>Test token generation with simplified scope</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runDebugToken} disabled={loading === "debug"} className="mb-4">
            {loading === "debug" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Token...
              </>
            ) : (
              "Test Token Generation"
            )}
          </Button>

          {debugResult && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon success={debugResult.success} />
                <span className="font-medium">
                  {debugResult.success ? "Token Generated Successfully" : "Token Generation Failed"}
                </span>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Link Payment Method */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Step 2: Link Payment Method</span>
            {linkResult && <StatusIcon success={linkResult.success} />}
          </CardTitle>
          <CardDescription>Link payment method KkqYWsPzjk to market vjkaZhNPnl</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runLinkPaymentMethod}
            disabled={loading === "link" || !debugResult?.success}
            className="mb-4"
          >
            {loading === "link" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Linking Payment Method...
              </>
            ) : (
              "Link Payment Method"
            )}
          </Button>

          {!debugResult?.success && (
            <p className="text-sm text-muted-foreground mb-4">⚠️ Complete Step 1 successfully before proceeding</p>
          )}

          {linkResult && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon success={linkResult.success} />
                <span className="font-medium">
                  {linkResult.success ? "Payment Method Linked Successfully" : "Payment Method Linking Failed"}
                </span>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(linkResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Create Test Order */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Step 3: Create Test Order</span>
            {orderResult && <StatusIcon success={orderResult.success} />}
          </CardTitle>
          <CardDescription>Test order creation with linked payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runCreateOrder} disabled={loading === "order" || !linkResult?.success} className="mb-4">
            {loading === "order" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Order...
              </>
            ) : (
              "Create Test Order"
            )}
          </Button>

          {!linkResult?.success && (
            <p className="text-sm text-muted-foreground mb-4">⚠️ Complete Step 2 successfully before proceeding</p>
          )}

          {orderResult && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon success={orderResult.success} />
                <span className="font-medium">
                  {orderResult.success ? "Order Created Successfully" : "Order Creation Failed"}
                </span>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(orderResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {debugResult && linkResult && orderResult && (
        <Card>
          <CardHeader>
            <CardTitle>Integration Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StatusIcon success={debugResult.success} />
                <span>Token Generation: {debugResult.success ? "✅ Success" : "❌ Failed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={linkResult.success} />
                <span>Payment Method Linking: {linkResult.success ? "✅ Success" : "❌ Failed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon success={orderResult.success} />
                <span>Order Creation: {orderResult.success ? "✅ Success" : "❌ Failed"}</span>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-muted-foreground">
                {debugResult.success && linkResult.success && orderResult.success
                  ? "🎉 All tests passed! Your Commerce Layer integration is working correctly."
                  : "❌ Some tests failed. Check the error details above and verify your Commerce Layer configuration."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
