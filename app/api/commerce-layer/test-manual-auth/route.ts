import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 Testing Commerce Layer manual authentication...")

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

    console.log("✅ Authentication successful!")

    // Test a simple API call to verify the token works
    const apiBase = `${clBaseUrl}/api`
    const testResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error("❌ API test failed:", testResponse.status, errorText)
      return NextResponse.json(
        {
          error: "Authentication succeeded but API test failed",
          details: `${testResponse.status}: ${errorText}`,
          tokenObtained: true,
        },
        { status: 500 },
      )
    }

    const marketData = await testResponse.json()

    return NextResponse.json({
      success: true,
      message: "Commerce Layer authentication successful",
      tokenObtained: true,
      apiTestPassed: true,
      marketData: marketData.data,
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
        error: "Commerce Layer authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
