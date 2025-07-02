import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Commerce Layer Debug Check...")

    // Check all environment variables
    const envCheck = {
      // Commerce Layer
      COMMERCE_LAYER_CLIENT_ID: process.env.COMMERCE_LAYER_CLIENT_ID ? "✅ Set" : "❌ Missing",
      COMMERCE_LAYER_CLIENT_SECRET: process.env.COMMERCE_LAYER_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
      COMMERCE_LAYER_BASE_URL: process.env.COMMERCE_LAYER_BASE_URL || "❌ Missing",
      COMMERCE_LAYER_MARKET_ID: process.env.COMMERCE_LAYER_MARKET_ID || "❌ Missing",

      // Stripe
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✅ Set" : "❌ Missing",

      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
    }

    console.log("🔍 Environment variables:", envCheck)

    // Test Commerce Layer authentication
    let clAuthTest = "❌ Failed"
    let clAuthDetails = ""

    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    if (clClientId && clClientSecret && clBaseUrl && clMarketId) {
      try {
        console.log("🔑 Testing Commerce Layer authentication...")

        const tokenResponse = await fetch(`${clBaseUrl}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clClientId,
            client_secret: clClientSecret,
            scope: `market:${clMarketId}`,
          }),
        })

        console.log("🔑 Token response status:", tokenResponse.status)

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          clAuthTest = "✅ Success"
          clAuthDetails = `Token obtained successfully (${tokenData.token_type})`

          // Test API access
          try {
            const apiResponse = await fetch(`${clBaseUrl}/api/markets/${clMarketId}`, {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.api+json",
              },
            })

            if (apiResponse.ok) {
              const marketData = await apiResponse.json()
              clAuthDetails += ` - Market "${marketData.data.attributes.name}" accessible`
            } else {
              clAuthDetails += ` - Market access failed: ${apiResponse.status}`
            }
          } catch (apiError) {
            clAuthDetails += ` - Market test failed: ${apiError instanceof Error ? apiError.message : "Unknown error"}`
          }
        } else {
          const errorText = await tokenResponse.text()
          clAuthTest = "❌ Failed"
          clAuthDetails = `HTTP ${tokenResponse.status}: ${errorText}`
        }
      } catch (error) {
        clAuthTest = "❌ Error"
        clAuthDetails = error instanceof Error ? error.message : "Unknown error"
      }
    } else {
      clAuthTest = "❌ Missing credentials"
      clAuthDetails = "Required environment variables not set"
    }

    // Test Stripe configuration
    let stripeTest = "❌ Failed"
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const stripePubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (stripeKey && stripePubKey) {
      if (stripeKey.startsWith("sk_test_") && stripePubKey.startsWith("pk_test_")) {
        stripeTest = "✅ Test keys configured"
      } else if (stripeKey.startsWith("sk_live_") || stripePubKey.startsWith("pk_live_")) {
        stripeTest = "⚠️ Live keys detected (use test keys for development)"
      } else {
        stripeTest = "❌ Invalid key format"
      }
    } else {
      stripeTest = "❌ Missing keys"
    }

    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envCheck,
      commerceLayerAuth: {
        status: clAuthTest,
        details: clAuthDetails,
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        clientIdPrefix: clClientId?.substring(0, 10) + "..." || "Not set",
      },
      stripeConfig: stripeTest,
      recommendations: [],
    }

    // Add recommendations based on test results
    if (clAuthTest.includes("❌")) {
      response.recommendations.push("Fix Commerce Layer authentication - check credentials and market ID")
    }
    if (stripeTest.includes("❌")) {
      response.recommendations.push("Configure Stripe test keys")
    }
    if (stripeTest.includes("⚠️")) {
      response.recommendations.push("Switch to Stripe test keys for development")
    }

    console.log("🔍 Commerce Layer debug response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Commerce Layer debug error:", error)
    return NextResponse.json(
      {
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
