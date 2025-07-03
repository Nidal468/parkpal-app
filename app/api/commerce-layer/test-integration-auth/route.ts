import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🧪 Testing Commerce Layer Integration app authentication...")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    console.log("🔧 Integration app environment check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      baseUrl: clBaseUrl,
      marketId: clMarketId,
      stockLocationId: clStockLocationId,
      clientIdPrefix: clClientId?.substring(0, 10) + "...",
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Missing required Commerce Layer environment variables for Integration app",
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
    console.log("🔑 Testing Integration app authentication...")
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    // Test comprehensive API access for Integration apps
    const apiBase = `${clBaseUrl}/api`
    const tests = []

    // Test 1: Market access
    try {
      const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (marketResponse.ok) {
        const marketData = await marketResponse.json()
        tests.push({
          name: "Market Access",
          status: "success",
          details: {
            id: marketData.data.id,
            name: marketData.data.attributes.name,
            currency: marketData.data.attributes.currency_code,
          },
        })
      } else {
        const errorText = await marketResponse.text()
        tests.push({
          name: "Market Access",
          status: "failed",
          details: `${marketResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "Market Access",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 2: SKUs access
    try {
      const skusResponse = await fetch(`${apiBase}/skus?page[size]=5`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (skusResponse.ok) {
        const skusData = await skusResponse.json()
        tests.push({
          name: "SKUs Access",
          status: "success",
          details: {
            count: skusData.data.length,
            skus: skusData.data.map((sku: any) => ({
              code: sku.attributes.code,
              name: sku.attributes.name,
            })),
          },
        })
      } else {
        const errorText = await skusResponse.text()
        tests.push({
          name: "SKUs Access",
          status: "failed",
          details: `${skusResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "SKUs Access",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 3: Customers access
    try {
      const customersResponse = await fetch(`${apiBase}/customers?page[size]=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        tests.push({
          name: "Customers Access",
          status: "success",
          details: {
            count: customersData.data.length,
            canCreateCustomers: true,
          },
        })
      } else {
        const errorText = await customersResponse.text()
        tests.push({
          name: "Customers Access",
          status: "failed",
          details: `${customersResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "Customers Access",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 4: Orders access
    try {
      const ordersResponse = await fetch(`${apiBase}/orders?page[size]=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        tests.push({
          name: "Orders Access",
          status: "success",
          details: {
            count: ordersData.data.length,
            canCreateOrders: true,
          },
        })
      } else {
        const errorText = await ordersResponse.text()
        tests.push({
          name: "Orders Access",
          status: "failed",
          details: `${ordersResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "Orders Access",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    const successfulTests = tests.filter((test) => test.status === "success").length
    const totalTests = tests.length

    return NextResponse.json({
      success: successfulTests === totalTests,
      message: `Integration app authentication test completed: ${successfulTests}/${totalTests} tests passed`,
      tokenObtained: true,
      tests,
      environment: {
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "not_configured",
        appType: "Integration",
      },
      summary: {
        passed: successfulTests,
        total: totalTests,
        percentage: Math.round((successfulTests / totalTests) * 100),
      },
    })
  } catch (error) {
    console.error("❌ Integration auth test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Integration app authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
