"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, ExternalLink, Globe, CreditCard, Database } from "lucide-react"

export default function CommerceLayerSetupPage() {
  const envVars = [
    {
      name: "COMMERCE_LAYER_CLIENT_ID",
      description: "Your sales channel client ID",
      required: true,
      example: "your_sales_channel_client_id",
    },
    {
      name: "COMMERCE_LAYER_CLIENT_SECRET",
      description: "Your sales channel client secret",
      required: true,
      example: "your_sales_channel_client_secret",
    },
    {
      name: "COMMERCE_LAYER_BASE_URL",
      description: "Your Commerce Layer domain",
      required: true,
      example: "https://yourdomain.commercelayer.io",
    },
    {
      name: "COMMERCE_LAYER_MARKET_ID",
      description: "Your market ID (Parkpal UK)",
      required: true,
      example: "vjkaZhNPnl",
    },
    {
      name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      description: "Stripe publishable key (TEST/SANDBOX)",
      required: true,
      example: "pk_test_...",
    },
    {
      name: "STRIPE_SECRET_KEY",
      description: "Stripe secret key (TEST/SANDBOX)",
      required: true,
      example: "sk_test_...",
    },
  ]

  const setupSteps = [
    {
      title: "1. Commerce Layer Configuration",
      items: [
        "Create a sales channel in Commerce Layer",
        "Configure Parkpal UK market (vjkaZhNPnl)",
        "Set up stock location: Parkpal HQ (okJbPuNbjk)",
        "Create SKUs: parking-hour, parking-day, parking-month",
        "Set pricing for each SKU in GBP",
      ],
    },
    {
      title: "2. Stripe Integration",
      items: [
        "Use SANDBOX/TEST Stripe credentials (not live)",
        "Configure Stripe as payment gateway in Commerce Layer",
        "Set up webhooks for payment confirmation",
        "Test with card: 4242 4242 4242 4242",
      ],
    },
    {
      title: "3. Environment Variables",
      items: [
        "Set all required environment variables in Vercel",
        "Ensure STRIPE keys are TEST keys (pk_test_, sk_test_)",
        "Verify Commerce Layer credentials are correct",
        "Double-check market ID matches your setup",
      ],
    },
    {
      title: "4. Database Setup",
      items: [
        "Run the SQL script to add Commerce Layer fields",
        "Verify Supabase connection is working",
        "Test database writes with booking records",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🏪 Commerce Layer Setup Guide</h1>
          <p className="text-gray-600">Complete integration setup for Parkpal parking bookings</p>
        </div>

        {/* Critical Warning */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 mb-1">⚠️ Important: Use TEST Stripe Credentials</h3>
                <p className="text-sm text-red-700">
                  Make sure you're using Stripe SANDBOX/TEST keys (pk_test_, sk_test_) not live credentials. Using live
                  Stripe with test Commerce Layer data can cause payment failures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Required Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {envVars.map((envVar) => (
                <div key={envVar.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{envVar.name}</h4>
                    {envVar.required && <Badge variant="destructive">Required</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{envVar.description}</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{envVar.example}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {setupSteps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {step.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Parkpal Specific Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Parkpal Commerce Layer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Market Setup</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Market Name:</span>
                    <span className="font-mono">Parkpal UK</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market ID:</span>
                    <span className="font-mono">vjkaZhNPnl</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span className="font-mono">GBP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock Location:</span>
                    <span className="font-mono">Parkpal HQ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location ID:</span>
                    <span className="font-mono">okJbPuNbjk</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">SKU Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Hourly:</span>
                    <span className="font-mono">parking-hour (nOpOSOOmjP)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily:</span>
                    <span className="font-mono">parking-day (nzPQSQQljQ)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly:</span>
                    <span className="font-mono">parking-month (ZrxeSjjmvm)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Test Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Once you've completed the setup above, test the integration with the test reservation page.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <a href="/test-reserve" className="flex items-center gap-2">
                    Test Reservation Flow
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://dashboard.stripe.com/test/payments"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Stripe Test Dashboard
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Test Card Details</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Card Number: 4242 4242 4242 4242</p>
                  <p>Expiry: Any future date</p>
                  <p>CVC: Any 3 digits</p>
                  <p>ZIP: Any 5 digits</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
