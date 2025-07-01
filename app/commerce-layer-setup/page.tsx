"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle, Copy, ExternalLink, Settings, Globe, CreditCard } from "lucide-react"
import { useState } from "react"

export default function CommerceLayerSetupPage() {
  const [copiedText, setCopiedText] = useState("")

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(""), 2000)
  }

  const envVars = [
    {
      key: "COMMERCE_LAYER_CLIENT_ID",
      description: "Your Sales Channel Client ID",
      example: "your_sales_channel_client_id_here",
    },
    {
      key: "COMMERCE_LAYER_CLIENT_SECRET",
      description: "Your Sales Channel Client Secret",
      example: "your_sales_channel_client_secret_here",
    },
    {
      key: "COMMERCE_LAYER_BASE_URL",
      description: "Your Commerce Layer organization URL",
      example: "https://yourdomain.commercelayer.io",
    },
    {
      key: "COMMERCE_LAYER_MARKET_ID",
      description: "Parkpal UK Market ID (vjkaZhNPnl)",
      example: "vjkaZhNPnl",
    },
    {
      key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      description: "Stripe publishable key (starts with pk_)",
      example: "pk_test_...",
    },
    {
      key: "STRIPE_SECRET_KEY",
      description: "Stripe secret key (starts with sk_)",
      example: "sk_test_...",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🚗 Parkpal Commerce Layer Setup</h1>
          <p className="text-gray-600">Configuration guide for your actual Parkpal SKUs and market</p>
        </div>

        {/* Parkpal Configuration Alert */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 mb-1">Parkpal Configuration Detected</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p>• Market: Parkpal UK (vjkaZhNPnl)</p>
                  <p>• Stock Location: Parkpal HQ (okJbPuNbjk)</p>
                  <p>• SKUs: parking-hour, parking-day, parking-month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Environment Variable Cleanup:</p>
                  <p>
                    You can <strong>delete NEXT_PUBLIC_CL_BASE_URL</strong> - we only need COMMERCE_LAYER_BASE_URL for
                    server-side API calls.
                  </p>
                </div>
              </div>
            </div>

            {envVars.map((envVar) => (
              <div key={envVar.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="font-medium">{envVar.key}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(envVar.key, envVar.key)}
                    className="h-8"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedText === envVar.key ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-2">{envVar.description}</p>
                <Input
                  value={envVar.example}
                  readOnly
                  className="font-mono text-xs bg-gray-50"
                  onClick={() => copyToClipboard(envVar.example, `${envVar.key}_example`)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Parkpal SKUs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Your Parkpal SKUs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">These are your actual SKUs from Commerce Layer:</p>

            <div className="space-y-3">
              {[
                {
                  sku: "parking-hour",
                  name: "Hourly Parking",
                  id: "nOpOSOOmjP",
                  description: "Perfect for short visits and appointments",
                },
                {
                  sku: "parking-day",
                  name: "Daily Parking",
                  id: "nzPQSQQljQ",
                  description: "All-day parking solution for work or events",
                },
                {
                  sku: "parking-month",
                  name: "Monthly Parking",
                  id: "ZrxeSjjmvm",
                  description: "Long-term parking pass for regular commuters",
                },
              ].map((item) => (
                <div key={item.sku} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.sku}
                        </Badge>
                        <Badge className="text-xs bg-blue-100 text-blue-800">{item.id}</Badge>
                      </div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(item.sku, item.sku)}
                      className="h-8"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedText === item.sku ? "Copied!" : "Copy SKU"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">✅ SKUs Updated in Code:</p>
                  <ul className="space-y-1">
                    <li>• Code now uses your actual SKU codes (parking-hour, parking-day, parking-month)</li>
                    <li>• Market scoped to Parkpal UK (vjkaZhNPnl)</li>
                    <li>• Stock location: Parkpal HQ (okJbPuNbjk)</li>
                    <li>• Ready for real Commerce Layer integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Market Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">🎯 Parkpal UK Market Details:</h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>Market Name:</span>
                  <Badge variant="outline">Parkpal UK</Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>Market ID:</span>
                  <Badge variant="outline" className="font-mono">
                    vjkaZhNPnl
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span>Stock Location:</span>
                  <Badge variant="outline">Parkpal HQ (okJbPuNbjk)</Badge>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Market Scoping Benefits:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• All orders created in correct Parkpal UK market</li>
                <li>• Market-specific pricing and currency (GBP)</li>
                <li>• Proper inventory management from Parkpal HQ</li>
                <li>• UK-specific payment methods and tax rules</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Your Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button asChild className="h-auto p-4">
                <a href="/test-reserve" className="block text-center">
                  <div className="font-medium">Test Parkpal Booking</div>
                  <div className="text-sm opacity-90">Real SKUs, real market, real payments</div>
                </a>
              </Button>
              <Button variant="outline" asChild className="h-auto p-4 bg-transparent">
                <a
                  href="https://dashboard.commercelayer.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center"
                >
                  <div className="font-medium flex items-center justify-center gap-2">
                    Commerce Layer Dashboard
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div className="text-sm opacity-70">Monitor orders and manage SKUs</div>
                </a>
              </Button>
            </div>

            <Separator />

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">✅ Parkpal Integration Checklist:</h3>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Parkpal SKUs identified and updated in code</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Market ID configured (vjkaZhNPnl)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Environment variables set in Vercel</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>NEXT_PUBLIC_CL_BASE_URL removed (cleanup)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Stripe configured as payment gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Test booking completed successfully</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
