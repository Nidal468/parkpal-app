import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test environment variables - ONLY using NEXT_PUBLIC_CL_ prefix
    const envTest = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      commerceLayerClientId: !!process.env.NEXT_PUBLIC_CL_CLIENT_ID,
      commerceLayerClientSecret: !!process.env.NEXT_PUBLIC_CL_CLIENT_SECRET,
      commerceLayerBaseUrl: !!process.env.COMMERCE_LAYER_BASE_URL,
      commerceLayerMarketId: !!process.env.NEXT_PUBLIC_CL_MARKET_ID,
      commerceLayerScope: !!process.env.NEXT_PUBLIC_CL_SCOPE,
      commerceLayerStockLocationId: !!process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
    }

    // Show actual values for debugging (masked)
    const envValues = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
      commerceLayerClientId: process.env.NEXT_PUBLIC_CL_CLIENT_ID?.substring(0, 20) + "...",
      commerceLayerBaseUrl: process.env.COMMERCE_LAYER_BASE_URL,
      commerceLayerMarketId: process.env.NEXT_PUBLIC_CL_MARKET_ID,
      commerceLayerScope: process.env.NEXT_PUBLIC_CL_SCOPE,
      commerceLayerStockLocationId: process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
    }

    // Test Supabase connection
    const supabaseTest = { success: false, error: null, spacesCount: 0 }
    try {
      if (envTest.supabaseUrl && envTest.supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
        )

        const { data, error } = await supabase.from("spaces").select("id").limit(5)

        if (error) {
          supabaseTest.error = error.message
        } else {
          supabaseTest.success = true
          supabaseTest.spacesCount = data?.length || 0
        }
      }
    } catch (error) {
      supabaseTest.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test Commerce Layer auth - ONLY using NEXT_PUBLIC_CL_ variables
    const commerceLayerTest = { success: false, error: null, hasToken: false, authDetails: {} }
    try {
      if (envTest.commerceLayerClientId && envTest.commerceLayerClientSecret && envTest.commerceLayerBaseUrl) {
        const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
        const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
        const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID!
        const stockLocationId = process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID

        // Build proper scope
        let scope = marketId ? `market:id:${marketId}` : "market:all"
        if (stockLocationId) {
          scope += ` stock_location:id:${stockLocationId}`
        }

        const authPayload = {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: scope,
        }

        commerceLayerTest.authDetails = {
          baseUrl: process.env.COMMERCE_LAYER_BASE_URL,
          clientIdPrefix: clientId?.substring(0, 20) + "...",
          marketId: marketId,
          stockLocationId: stockLocationId,
          scope: scope,
        }

        const authResponse = await fetch(`${process.env.COMMERCE_LAYER_BASE_URL}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(authPayload),
        })

        if (authResponse.ok) {
          const authData = await authResponse.json()
          commerceLayerTest.success = true
          commerceLayerTest.hasToken = !!authData.access_token
          commerceLayerTest.authDetails.tokenType = authData.token_type
          commerceLayerTest.authDetails.expiresIn = authData.expires_in
          commerceLayerTest.authDetails.returnedScope = authData.scope
        } else {
          const errorText = await authResponse.text()
          commerceLayerTest.error = `${authResponse.status}: ${errorText}`

          // Try to parse error details
          try {
            const errorJson = JSON.parse(errorText)
            commerceLayerTest.error =
              errorJson.errors?.[0]?.detail || errorJson.error_description || commerceLayerTest.error
          } catch (e) {
            // Keep original error if JSON parsing fails
          }
        }
      } else {
        commerceLayerTest.error = "Missing required Commerce Layer environment variables"
      }
    } catch (error) {
      commerceLayerTest.error = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json({
      success: envTest.supabaseUrl && envTest.supabaseKey && supabaseTest.success && commerceLayerTest.success,
      timestamp: new Date().toISOString(),
      tests: {
        environment: envTest,
        environmentValues: envValues,
        supabase: supabaseTest,
        commerceLayer: commerceLayerTest,
      },
      hardcodedSpaceIds: {
        HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
        DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
        MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
      },
      consistentNaming: {
        message: "Now using ONLY NEXT_PUBLIC_CL_ prefix for all Commerce Layer variables",
        requiredVariables: [
          "NEXT_PUBLIC_CL_CLIENT_ID",
          "NEXT_PUBLIC_CL_CLIENT_SECRET",
          "NEXT_PUBLIC_CL_MARKET_ID",
          "NEXT_PUBLIC_CL_SCOPE",
          "NEXT_PUBLIC_CL_STOCK_LOCATION_ID",
          "COMMERCE_LAYER_BASE_URL",
        ],
      },
      recommendations: [
        envTest.commerceLayerMarketId ? "✅ Market ID found" : "❌ Add NEXT_PUBLIC_CL_MARKET_ID environment variable",
        commerceLayerTest.success ? "✅ Commerce Layer auth working" : "❌ Fix Commerce Layer authentication",
        supabaseTest.success ? "✅ Supabase connection working" : "❌ Fix Supabase connection",
        "Check the authDetails in commerceLayer test for specific issues",
      ],
    })
  } catch (error) {
    console.error("Simple test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
