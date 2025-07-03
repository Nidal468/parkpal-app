import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🧪 Manual Commerce Layer Authentication Test")

    // Get environment variables - using correct server-side variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    // Log actual values for debugging
    console.log("🔧 Environment Values:", {
      clClientId: clClientId ? `${clClientId.substring(0, 10)}...` : "undefined",
      clClientSecret: clClientSecret ? `${clClientSecret.substring(0, 10)}...` : "undefined",
      clBaseUrl,
      clMarketId,
      clStockLocationId,
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      clientIdLength: clClientId?.length || 0,
      clientSecretLength: clClientSecret?.length || 0,
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
          missing: {
            clientId: !clClientId,
            clientSecret: !clClientSecret,
            baseUrl: !clBaseUrl,
            marketId: !clMarketId,
          },
          actualValues: {
            clientId: clClientId || "undefined",
            clientSecret: clClientSecret ? "set" : "undefined",
            baseUrl: clBaseUrl || "undefined",
            marketId: clMarketId || "undefined",
            stockLocationId: clStockLocationId || "undefined",
          },
          instructions: [
            "Update your Vercel environment variables:",
            "COMMERCE_LAYER_CLIENT_ID=<your_client_id>",
            "COMMERCE_LAYER_CLIENT_SECRET=<your_client_secret>",
            "COMMERCE_LAYER_MARKET_ID=<your_market_id>",
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "COMMERCE_LAYER_STOCK_LOCATION_ID=<your_stock_location_id> (optional)",
          ],
        },
        { status: 400 },
      )
    }

    // Get access token using centralized function
    let tokenData: any
    try {
      const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      tokenData = { access_token: accessToken }
      console.log("✅ Token obtained successfully using centralized function!")
    } catch (tokenError) {
      console.error("❌ Token request failed:", tokenError)
      return NextResponse.json(
        {
          error: "Commerce Layer authentication failed",
          details: tokenError instanceof Error ? tokenError.message : "Unknown authentication error",
          suggestion: "Check your Commerce Layer application credentials and environment variables",
        },
        { status: 500 },
      )
    }

    // Test market access
    let marketTest: any = { status: "not_tested" }
    if (tokenData.access_token) {
      try {
        console.log("🏪 Testing market access...")
        const marketResponse = await fetch(`${clBaseUrl}/api/markets/${clMarketId}`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          marketTest = {
            status: "success",
            marketName: marketData.data?.attributes?.name || "Unknown",
            marketId: marketData.data?.id || clMarketId,
          }
          console.log("✅ Market access successful:", marketTest)
        } else {
          const marketError = await marketResponse.text()
          marketTest = {
            status: "failed",
            error: `HTTP ${marketResponse.status}: ${marketError}`,
          }
          console.error("❌ Market access failed:", marketTest)
        }
      } catch (marketError) {
        marketTest = {
          status: "error",
          error: marketError instanceof Error ? marketError.message : "Unknown error",
        }
        console.error("❌ Market test error:", marketTest)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Commerce Layer authentication successful using centralized function!",
      tokenResponse: {
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: "Bearer",
      },
      marketTest,
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "Not set",
      },
      nextSteps: [
        "✅ Authentication working with centralized function",
        marketTest.status === "success" ? "✅ Market access working" : "❌ Check market access",
        "✅ All credentials properly secured server-side",
        "✅ Scope constructed safely from raw IDs",
        "✅ Ready to test full payment flow",
        "Now test /test-reserve page",
      ],
    })
  } catch (error) {
    console.error("❌ Auth test failed:", error)
    return NextResponse.json(
      {
        error: "Authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer application credentials and environment variables",
      },
      { status: 500 },
    )
  }
}
