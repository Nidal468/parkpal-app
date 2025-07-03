import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Starting Commerce Layer app diagnostic...")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Commerce Layer environment variables",
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

    // Test authentication
    console.log("🔑 Testing authentication...")
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    const apiBase = `${clBaseUrl}/api`
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.api+json",
    }

    // Test market access
    console.log("🏪 Testing market access...")
    const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, { headers })

    if (!marketResponse.ok) {
      const errorText = await marketResponse.text()
      throw new Error(`Market access failed: ${marketResponse.status} ${errorText}`)
    }

    const marketData = await marketResponse.json()

    // Test customer access (determines app type)
    console.log("👤 Testing customer access...")
    const customerResponse = await fetch(`${apiBase}/customers?page[size]=1`, { headers })

    let appType = "unknown"
    let customerAccess = false

    if (customerResponse.ok) {
      appType = "integration"
      customerAccess = true
    } else if (customerResponse.status === 401) {
      appType = "sales_channel"
      customerAccess = false
    }

    // Test SKU access
    console.log("📦 Testing SKU access...")
    const skuResponse = await fetch(`${apiBase}/skus?page[size]=3`, { headers })
    const skuData = skuResponse.ok ? await skuResponse.json() : null

    // Test order access
    console.log("📋 Testing order access...")
    const orderResponse = await fetch(`${apiBase}/orders?page[size]=1`, { headers })
    const orderData = orderResponse.ok ? await orderResponse.json() : null

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "not_configured",
      },
      appType,
      capabilities: {
        authentication: true,
        marketAccess: true,
        customerAccess,
        skuAccess: skuResponse.ok,
        orderAccess: orderResponse.ok,
      },
      market: {
        id: marketData.data.id,
        name: marketData.data.attributes.name,
        currency: marketData.data.attributes.currency_code,
      },
      resources: {
        skus: skuData ? skuData.data.length : 0,
        orders: orderData ? orderData.data.length : 0,
      },
      recommendations:
        appType === "integration"
          ? ["✅ Integration app detected - full API access available"]
          : ["⚠️ Sales Channel app detected - limited customer access"],
    })
  } catch (error) {
    console.error("❌ Commerce Layer diagnostic failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
