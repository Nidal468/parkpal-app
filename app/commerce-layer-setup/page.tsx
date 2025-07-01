"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertCircle } from "lucide-react"

export default function CommerceLayerSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Commerce Layer Setup Guide</h1>
          <p className="text-gray-600">How to connect your real Commerce Layer backend</p>
        </div>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Mock SKUs</Badge>
                  <span className="text-sm">
                    Currently using test SKUs: parking_hour_test, parking_day_test, parking_month_test
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Stripe Only</Badge>
                  <span className="text-sm">Payment processing through Stripe directly (not Commerce Layer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">No Inventory</Badge>
                  <span className="text-sm">No real product catalog or inventory management</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Commerce Layer Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Set Up Commerce Layer Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Required Steps:</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    • Create Commerce Layer account at{" "}
                    <a
                      href="https://commercelayer.io"
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      commercelayer.io
                    </a>
                  </li>
                  <li>• Set up your organization and market</li>
                  <li>• Configure Stripe as payment gateway</li>
                  <li>• Get your API credentials (Client ID, Client Secret, Base Endpoint)</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Environment Variables Needed:</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {`COMMERCE_LAYER_CLIENT_ID=your_client_id
COMMERCE_LAYER_CLIENT_SECRET=your_client_secret  
COMMERCE_LAYER_BASE_ENDPOINT=https://your-org.commercelayer.io
COMMERCE_LAYER_MARKET_ID=your_market_id`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Create Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Create Products in Commerce Layer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Create These SKUs in your Commerce Layer dashboard:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span>
                      <strong>parking-hour-premium</strong> - Hourly Premium Parking
                    </span>
                    <Badge>£8.00</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span>
                      <strong>parking-day-premium</strong> - Daily Premium Parking
                    </span>
                    <Badge>£45.00</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <span>
                      <strong>parking-month-premium</strong> - Monthly Premium Parking
                    </span>
                    <Badge>£280.00</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Update Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  3
                </span>
                Update API Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Code Changes Required:</h4>
                <ul className="space-y-1 text-sm">
                  <li>
                    • Install Commerce Layer SDK:{" "}
                    <code className="bg-white px-1 rounded">npm install @commercelayer/sdk</code>
                  </li>
                  <li>• Replace mock SKUs with real Commerce Layer SKUs</li>
                  <li>• Update API routes to use Commerce Layer API instead of direct Stripe</li>
                  <li>• Add proper inventory management</li>
                  <li>• Implement webhook handling for order updates</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Updated SKU Mapping:</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                  {`// Replace in create-order/route.ts
const skuPrices: Record<string, number> = {
  // Remove these test SKUs:
  // "parking_hour_test": 8,
  // "parking_day_test": 45, 
  // "parking_month_test": 280,
  
  // Add your real Commerce Layer SKUs:
  "parking-hour-premium": 8,
  "parking-day-premium": 45,
  "parking-month-premium": 280,
}`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  4
                </span>
                Test Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button asChild>
                  <a href="/test-reserve">Test Current Setup</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://docs.commercelayer.io" target="_blank" rel="noopener noreferrer">
                    Commerce Layer Docs <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Testing Checklist:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• ✅ API endpoints respond correctly</li>
                  <li>• ❌ Real Commerce Layer SKUs configured</li>
                  <li>• ❌ Inventory management working</li>
                  <li>• ❌ Order webhooks implemented</li>
                  <li>• ❌ Production payment processing</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
