import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Starting Commerce Layer app diagnosis...")

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

    // Test app type by trying to list customers
    console.log("🔍 Testing app type...")
    const customerResponse = await fetch(`${apiBase}/customers?page[size]=1`, { headers })

    let appType = "unknown"
    let customerAccess = false

    if (customerResponse.ok) {
      appType = "integration"
      customerAccess = true
      console.log("✅ Integration app detected - has customer access")
    } else if (customerResponse.status === 401) {
      appType = "sales_channel"
      customerAccess = false
      console.log("✅ Sales Channel app detected - no customer access")
    } else {
      console.log("⚠️ Unexpected customer response:", customerResponse.status)
    }

    // Test market access
    console.log("🏪 Testing market access...")
    const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, { headers })
    const marketAccess = marketResponse.ok

    if (marketAccess) {
      const marketData = await marketResponse.json()
      console.log("✅ Market access confirmed:", marketData.data.attributes.name)
    } else {
      console.log("❌ Market access failed:", marketResponse.status)
    }

    // Test SKU access
    console.log("📦 Testing SKU access...")
    const skuResponse = await fetch(`${apiBase}/skus?page[size]=3`, { headers })
    const skuAccess = skuResponse.ok

    let skuSamples = []
    if (skuAccess) {
      const skuData = await skuResponse.json()
      skuSamples = skuData.data.map((sku: any) => sku.attributes.code)
      console.log("✅ SKU access confirmed, samples:", skuSamples)
    } else {
      console.log("❌ SKU access failed:", skuResponse.status)
    }

    // Test order access
    console.log("📋 Testing order access...")
    const orderResponse = await fetch(`${apiBase}/orders?page[size]=1`, { headers })
    const orderAccess = orderResponse.ok

    if (orderAccess) {
      const orderData = await orderResponse.json()
      console.log("✅ Order access confirmed, count:", orderData.data.length)
    } else {
      console.log("❌ Order access failed:", orderResponse.status)
    }

    // Test stock location access (if configured)
    let stockLocationAccess = null
    if (clStockLocationId) {
      console.log("📍 Testing stock location access...")
      const stockResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, { headers })
      stockLocationAccess = stockResponse.ok

      if (stockLocationAccess) {
        const stockData = await stockResponse.json()
        console.log("✅ Stock location access confirmed:", stockData.data.attributes.name)
      } else {
        console.log("❌ Stock location access failed:", stockResponse.status)
      }
    }

    const diagnosis = {
      success: true,
      appType,
      capabilities: {
        authentication: true,
        marketAccess,
        customerAccess,
        skuAccess,
        orderAccess,
        stockLocationAccess,
      },
      configuration: {
        hasClientId: !!clClientId,
        hasClientSecret: !!clClientSecret,
        hasBaseUrl: !!clBaseUrl,
        hasMarketId: !!clMarketId,
        hasStockLocationId: !!clStockLocationId,
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || null,
      },
      samples: {
        skus: skuSamples,
      },
      recommendations: [],
    }

    // Generate recommendations
    if (appType === "sales_channel") {
      diagnosis.recommendations.push(
        "Sales Channel app detected - limited customer management",
        "Consider Integration app for full customer features",
        "Customer search/listing not available",
      )
    } else if (appType === "integration") {
      diagnosis.recommendations.push(
        "Integration app detected - full API access available",
        "Customer management features enabled",
        "All Commerce Layer features should work",
      )
    }

    if (!marketAccess) {
      diagnosis.recommendations.push("Market access failed - check market ID and permissions")
    }

    if (!skuAccess) {
      diagnosis.recommendations.push("SKU access failed - check product configuration")
    }

    if (!orderAccess) {
      diagnosis.recommendations.push("Order access failed - check order permissions")
    }

    if (clStockLocationId && !stockLocationAccess) {
      diagnosis.recommendations.push("Stock location access failed - check stock location ID")
    }

    console.log("✅ App diagnosis completed:", diagnosis)
    return NextResponse.json(diagnosis)
  } catch (error) {
    console.error("❌ App diagnosis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
