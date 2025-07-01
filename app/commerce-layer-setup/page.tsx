"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"

export default function CommerceLayerSetup() {
  const [copied, setCopied] = useState("")

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(""), 2000)
  }

  const envVars = [
    {
      name: "COMMERCE_LAYER_CLIENT_ID",
      description: "Your Commerce Layer Sales Channel Client ID",
      required: true,
      example: "your_sales_channel_client_id_here",
      serverOnly: true,
    },
    {
      name: "COMMERCE_LAYER_CLIENT_SECRET",
      description: "Your Commerce Layer Sales Channel Client Secret",
      required: true,
      example: "your_sales_channel_client_secret_here",
      serverOnly: true,
    },
    {
      name: "COMMERCE_LAYER_BASE_URL",
      description: "Your Commerce Layer domain (e.g., https://yourdomain.commercelayer.io)",
      required: true,
      example: "https://yourdomain.commercelayer.io",
      serverOnly: true,
    },
    {
      name: "COMMERCE_LAYER_MARKET_ID",
      description: "Your Parkpal UK Market ID",
      required: true,
      example: "vjkaZhNPnl",
      serverOnly: true,
    },
    {
      name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      description: "Stripe Publishable Key (should start with pk_test_)",
      required: true,
      example: "pk_test_...",
      serverOnly: false,
    },
    {
      name: "STRIPE_SECRET_KEY",
      description: "Stripe Secret Key (should start with sk_test_)",
      required: true,
      example: "sk_test_...",
      serverOnly: true,
    },
  ]

  const skus = [
    {
      name: "parking-hour",
      id: "nOpOSOOmjP",
      description: "Hourly parking rate",
    },
    {
      name: "parking-day",
      id: "nzPQSQQljQ",
      description: "Daily parking rate",
    },
    {
      name: "parking-month",
      id: "ZrxeSjjmvm",
      description: "Monthly parking rate",
    },
  ]

  const setupSteps = [
    "Set all environment variables in Vercel (server-side only)",
    "Run the SQL script to add Commerce Layer fields to your database",
    "Ensure your SKUs exist in the Parkpal UK market with proper pricing",
    "Configure Stripe as payment gateway in Commerce Layer",
    "Use TEST Stripe credentials (pk_test_, sk_test_)",
    "Test the integration at /test-reserve",
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Commerce Layer Setup</h1>
        <p className="text-muted-foreground">Configuration guide for Parkpal Commerce Layer integration</p>
      </div>

      {/* Important Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="h-5 w-5" />
            Important: Server-Side Environment Variables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 text-sm">
            Commerce Layer credentials should be server-side only (no NEXT_PUBLIC_ prefix). Only the Stripe publishable
            key should be client-side accessible.
          </p>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>Required environment variables for Commerce Layer integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {envVars.map((envVar) => (
            <div key={envVar.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{envVar.name}</code>
                  {envVar.required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                  {envVar.serverOnly && (
                    <Badge variant="secondary" className="text-xs">
                      Server Only
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${envVar.name}=${envVar.example}`, envVar.name)}
                >
                  {copied === envVar.name ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{envVar.description}</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                {envVar.name}={envVar.example}
              </code>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SKU Information */}
      <Card>
        <CardHeader>
          <CardTitle>Parkpal SKUs</CardTitle>
          <CardDescription>Available SKUs in your Commerce Layer catalog</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {skus.map((sku) => (
            <div key={sku.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{sku.name}</code>
                  <Badge variant="outline" className="text-xs">
                    {sku.id}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{sku.description}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(sku.name, `sku-${sku.name}`)}>
                {copied === `sku-${sku.name}` ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Market Information */}
      <Card>
        <CardHeader>
          <CardTitle>Market Configuration</CardTitle>
          <CardDescription>Your Commerce Layer market and stock location details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-2">Market</h3>
              <p className="text-sm">Name: Parkpal UK</p>
              <p className="text-sm font-mono">ID: vjkaZhNPnl</p>
              <p className="text-sm">Currency: GBP</p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <h3 className="font-semibold mb-2">Stock Location</h3>
              <p className="text-sm">Name: Parkpal HQ</p>
              <p className="text-sm font-mono">ID: okJbPuNbjk</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>Step-by-step guide to configure Commerce Layer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {setupSteps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="font-medium">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Database Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Database Setup</CardTitle>
          <CardDescription>SQL script to add Commerce Layer fields</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Run this SQL script in your database to add the required Commerce Layer fields:
          </p>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{`-- Add Commerce Layer fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS commerce_layer_order_id TEXT,
ADD COLUMN IF NOT EXISTS commerce_layer_customer_id TEXT,
ADD COLUMN IF NOT EXISTS commerce_layer_market_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_cl_order_id ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cl_customer_id ON bookings(commerce_layer_customer_id);`}</code>
            </pre>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              copyToClipboard(
                `-- Add Commerce Layer fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS commerce_layer_order_id TEXT,
ADD COLUMN IF NOT EXISTS commerce_layer_customer_id TEXT,
ADD COLUMN IF NOT EXISTS commerce_layer_market_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_cl_order_id ON bookings(commerce_layer_order_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cl_customer_id ON bookings(commerce_layer_customer_id);`,
                "sql",
              )
            }
          >
            {copied === "sql" ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            Copy SQL Script
          </Button>
        </CardContent>
      </Card>

      {/* Test Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Integration</CardTitle>
          <CardDescription>Test your Commerce Layer setup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button asChild>
              <a href="/test-reserve" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Test Reserve Page
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/reserve" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Production Reserve Page
              </a>
            </Button>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Test Card Details</h4>
            <p className="text-sm">Card Number: 4242 4242 4242 4242</p>
            <p className="text-sm">Expiry: Any future date</p>
            <p className="text-sm">CVC: Any 3 digits</p>
            <p className="text-sm">ZIP: Any 5 digits</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
