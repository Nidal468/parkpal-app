import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CommerceLayerSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏪 Commerce Layer Setup Guide</h1>
          <p className="text-gray-600">Complete integration guide for your Commerce Layer backend</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  1
                </span>
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Add these environment variables to your Vercel deployment:</p>

              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div>COMMERCE_LAYER_CLIENT_ID=your_client_id_here</div>
                  <div>COMMERCE_LAYER_CLIENT_SECRET=your_client_secret_here</div>
                  <div>COMMERCE_LAYER_BASE_URL=https://yourdomain.commercelayer.io</div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Where to find these:</p>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Log into your Commerce Layer dashboard</li>
                      <li>• Go to Settings → Applications</li>
                      <li>• Create or select an application</li>
                      <li>• Copy the Client ID and Client Secret</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: SKU Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  2
                </span>
                Create SKUs in Commerce Layer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Create these SKUs in your Commerce Layer catalog:</p>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Hourly Parking</h3>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>SKU Code:</strong> PARKING_HOUR_DOWNTOWN
                    </p>
                    <p>
                      <strong>Name:</strong> Hourly Parking - Downtown
                    </p>
                    <p>
                      <strong>Description:</strong> Perfect for short visits
                    </p>
                    <p>
                      <strong>Price:</strong> Set your desired hourly rate
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Daily Parking</h3>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>SKU Code:</strong> PARKING_DAY_DOWNTOWN
                    </p>
                    <p>
                      <strong>Name:</strong> Daily Parking - Downtown
                    </p>
                    <p>
                      <strong>Description:</strong> All-day parking solution
                    </p>
                    <p>
                      <strong>Price:</strong> Set your desired daily rate
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Monthly Parking</h3>
                    <Badge variant="outline">Required</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <strong>SKU Code:</strong> PARKING_MONTH_DOWNTOWN
                    </p>
                    <p>
                      <strong>Name:</strong> Monthly Parking - Downtown
                    </p>
                    <p>
                      <strong>Description:</strong> Long-term parking option
                    </p>
                    <p>
                      <strong>Price:</strong> Set your desired monthly rate
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">SKU Creation Steps:</p>
                    <ol className="text-sm text-blue-700 mt-1 space-y-1 list-decimal list-inside">
                      <li>Go to Catalog → SKUs in your Commerce Layer dashboard</li>
                      <li>Click "New SKU" for each parking option</li>
                      <li>Enter the exact SKU codes shown above</li>
                      <li>Set prices in your preferred currency (GBP recommended)</li>
                      <li>Make sure SKUs are active and available</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Payment Gateway */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  3
                </span>
                Payment Gateway Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Configure your payment processing in Commerce Layer:</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Stripe Integration</p>
                    <p className="text-sm text-gray-600">Connect your Stripe account in Commerce Layer settings</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Payment Methods</p>
                    <p className="text-sm text-gray-600">Enable credit cards, digital wallets, etc.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Webhooks</p>
                    <p className="text-sm text-gray-600">Set up webhooks for order status updates</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  4
                </span>
                Test Your Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Once everything is set up, test your integration:</p>

              <div className="grid gap-3">
                <Button variant="outline" className="justify-start bg-transparent" asChild>
                  <a href="/test-reserve">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test Commerce Layer Integration
                  </a>
                </Button>

                <Button variant="outline" className="justify-start bg-transparent" asChild>
                  <a href="/api/commerce-layer/create-order" target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Test API Endpoint
                  </a>
                </Button>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">What to expect:</p>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      <li>✅ Customer creation in Commerce Layer</li>
                      <li>✅ Order creation with line items</li>
                      <li>✅ SKU validation and pricing</li>
                      <li>✅ Payment processing through your gateway</li>
                      <li>✅ Order confirmation and status updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Troubleshooting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-4">
                  <p className="font-medium text-red-800">SKU not found error</p>
                  <p className="text-sm text-red-600">
                    Make sure the SKU codes match exactly and are active in Commerce Layer
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="font-medium text-yellow-800">Authentication failed</p>
                  <p className="text-sm text-yellow-600">Check your Client ID and Client Secret are correct</p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium text-blue-800">Payment processing issues</p>
                  <p className="text-sm text-blue-600">
                    Verify your payment gateway is properly configured in Commerce Layer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
