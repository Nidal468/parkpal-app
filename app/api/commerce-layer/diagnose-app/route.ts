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
      return NextResponse.json({
        success: false,
        error: "Missing Commerce Layer environment variables",
        missing: {
          clientId: !clClientId,
          clientSecret: !clClientSecret,
          baseUrl: !clBaseUrl,
          marketId: !clMarketId,
        },
      })
    }

    const apiBase = `${clBaseUrl}/api`

    // Get access token
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.api+json",
    }

    // Test 1: Check app type by trying to list customers
    console.log("🔍 Testing app type...")
    let appType = "unknown"
    let customerAccess = false

    try {
      const customersResponse = await fetch(`${apiBase}/customers?page[limit]=1`, {
        method: "GET",
        headers,
      })

      if (customersResponse.ok) {
        appType = "integration"
        customerAccess = true
        console.log("✅ Integration app confirmed - has customer access")
      } else if (customersResponse.status === 401) {
        appType = "sales_channel"
        customerAccess = false
        console.log("✅ Sales Channel app confirmed - no customer access (expected)")
      } else {
        console.log("⚠️ Unexpected customer access response:", customersResponse.status)
      }
    } catch (error) {
      console.error("❌ Customer access test failed:", error)
    }

    // Test 2: Market access
    console.log("🏪 Testing market access...")
    let marketAccess = false
    let marketInfo = null

    try {
      const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
        method: "GET",
        headers,
      })

      if (marketResponse.ok) {
        const marketData = await marketResponse.json()
        marketAccess = true
        marketInfo = {
          id: marketData.data.id,
          name: marketData.data.attributes.name,
          currency: marketData.data.attributes.currency_code,
        }
        console.log("✅ Market access confirmed:", marketInfo.name)
      } else {
        console.log("❌ Market access failed:", marketResponse.status)
      }
    } catch (error) {
      console.error("❌ Market access test failed:", error)
    }

    // Test 3: Order access
    console.log("📦 Testing order access...")
    let orderAccess = false
    let orderCount = 0

    try {
      const ordersResponse = await fetch(`${apiBase}/orders?page[limit]=5`, {
        method: "GET",
        headers,
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        orderAccess = true
        orderCount = ordersData.data?.length || 0
        console.log("✅ Order access confirmed, found", orderCount, "orders")
      } else {
        console.log("❌ Order access failed:", ordersResponse.status)
      }
    } catch (error) {
      console.error("❌ Order access test failed:", error)
    }

    // Test 4: SKU/Product access
    console.log("🛍️ Testing product access...")
    let productAccess = false
    let productCount = 0
    let sampleSkus = []

    try {
      const skusResponse = await fetch(`${apiBase}/skus?page[limit]=5`, {
        method: "GET",
        headers,
      })

      if (skusResponse.ok) {
        const skusData = await skusResponse.json()
        productAccess = true
        productCount = skusData.data?.length || 0
        sampleSkus = skusData.data?.slice(0, 3).map((sku: any) => sku.attributes.code) || []
        console.log("✅ Product access confirmed, found", productCount, "SKUs")
      } else {
        console.log("❌ Product access failed:", skusResponse.status)
      }
    } catch (error) {
      console.error("❌ Product access test failed:", error)
    }

    // Test 5: Stock location access (if provided)
    let stockLocationAccess = false
    let stockLocationInfo = null

    if (clStockLocationId) {
      console.log("📍 Testing stock location access...")
      try {
        const stockLocationResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, {
          method: "GET",
          headers,
        })

        if (stockLocationResponse.ok) {
          const stockLocationData = await stockLocationResponse.json()
          stockLocationAccess = true
          stockLocationInfo = {
            id: stockLocationData.data.id,
            name: stockLocationData.data.attributes.name,
          }
          console.log("✅ Stock location access confirmed:", stockLocationInfo.name)
        } else {
          console.log("❌ Stock location access failed:", stockLocationResponse.status)
        }
      } catch (error) {
        console.error("❌ Stock location access test failed:", error)
      }
    }

    // Generate recommendations
    const recommendations = []
    const issues = []

    if (appType === "integration") {
      recommendations.push("✅ Integration app detected - full API access available")
      recommendations.push("✅ Customer management enabled")
      recommendations.push("✅ Advanced order processing capabilities")
    } else if (appType === "sales_channel") {
      recommendations.push("⚠️ Sales Channel app detected - limited customer access")
      recommendations.push("💡 Consider upgrading to Integration app for full customer management")
      recommendations.push("✅ Order creation and payment processing still available")
    } else {
      issues.push("❌ Unable to determine app type")
    }

    if (!marketAccess) {
      issues.push("❌ Market access failed - check market ID and permissions")
    }

    if (!orderAccess) {
      issues.push("❌ Order access failed - check application permissions")
    }

    if (!productAccess) {
      issues.push("❌ Product access failed - check SKU configuration")
    }

    if (clStockLocationId && !stockLocationAccess) {
      issues.push("❌ Stock location access failed - check stock location ID")
    }

    const overallStatus = issues.length === 0 ? "healthy" : issues.length <= 2 ? "warning" : "critical"

    return NextResponse.json({
      success: true,
      diagnosis: {
        timestamp: new Date().toISOString(),
        appType,
        overallStatus,
        capabilities: {
          customerAccess,
          marketAccess,
          orderAccess,
          productAccess,
          stockLocationAccess,
        },
        details: {
          market: marketInfo,
          stockLocation: stockLocationInfo,
          orderCount,
          productCount,
          sampleSkus,
        },
        recommendations,
        issues,
        configuration: {
          clientId: clClientId ? `${clClientId.substring(0, 10)}...` : "missing",
          baseUrl: clBaseUrl,
          marketId: clMarketId,
          stockLocationId: clStockLocationId || "not_configured",
        },
      },
    })
  } catch (error) {
    console.error("❌ Commerce Layer diagnosis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Diagnosis failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
