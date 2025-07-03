import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔧 Testing manual Commerce Layer authentication...")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    console.log("🔧 Environment check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      baseUrl: clBaseUrl,
      marketId: clMarketId,
      stockLocationId: clStockLocationId,
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Missing required Commerce Layer environment variables",
          missing: {
            clientId: !clClientId,
            clientSecret: !clClientSecret,
            baseUrl: !clBaseUrl,
            marketId: !clMarketId,
          },
        },
        { status: 500 },
      )
    }

    // Test authentication using centralized function
    console.log("🔑 Testing authentication with centralized function...")
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    // Test API access
    console.log("🧪 Testing API access...")
    const apiBase = `${clBaseUrl}/api`
    const testResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      throw new Error(`API test failed: ${testResponse.status} ${errorText}`)
    }

    const marketData = await testResponse.json()

    return NextResponse.json({
      success: true,
      message: "Commerce Layer authentication successful",
      tokenObtained: true,
      apiAccessible: true,
      market: {
        id: marketData.data.id,
        name: marketData.data.attributes.name,
        currency: marketData.data.attributes.currency_code,
      },
      environment: {
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "not_configured",
      },
    })
  } catch (error) {
    console.error("❌ Manual auth test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
