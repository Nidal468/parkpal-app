import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 Testing Commerce Layer Integration app authentication...")

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
      clientIdType: clClientId?.startsWith("integration_") ? "Integration" : "Unknown",
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
    console.log("🔑 Testing Integration app authentication...")
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    console.log("✅ Integration authentication successful!")

    // Test API access with Integration app
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
          test: "Market Access",
          passed: true,
          data: {
            marketId: marketData.data.id,
            marketName: marketData.data.attributes.name,
          },
        })
      } else {
        const errorText = await marketResponse.text()
        tests.push({
          test: "Market Access",
          passed: false,
          error: `${marketResponse.status}: ${errorText}`,
        })
      }
    } catch (marketError) {
      tests.push({
        test: "Market Access",
        passed: false,
        error: marketError instanceof Error ? marketError.message : "Unknown error",
      })
    }

    // Test 2: Customer creation (Integration apps should have this permission)
    try {
      const customerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: `test-${Date.now()}@example.com`,
            first_name: "Test",
            last_name: "Customer",
            metadata: {
              source: "integration_test",
            },
          },
        },
      }

      const customerResponse = await fetch(`${apiBase}/customers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(customerPayload),
      })

      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        tests.push({
          test: "Customer Creation",
          passed: true,
          data: {
            customerId: customerData.data.id,
            customerEmail: customerData.data.attributes.email,
          },
        })

        // Clean up test customer
        try {
          await fetch(`${apiBase}/customers/${customerData.data.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/vnd.api+json",
            },
          })
        } catch {
          // Ignore cleanup errors
        }
      } else {
        const errorText = await customerResponse.text()
        tests.push({
          test: "Customer Creation",
          passed: false,
          error: `${customerResponse.status}: ${errorText}`,
        })
      }
    } catch (customerError) {
      tests.push({
        test: "Customer Creation",
        passed: false,
        error: customerError instanceof Error ? customerError.message : "Unknown error",
      })
    }

    // Test 3: Stock location access (if configured)
    if (clStockLocationId) {
      try {
        const stockResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (stockResponse.ok) {
          const stockData = await stockResponse.json()
          tests.push({
            test: "Stock Location Access",
            passed: true,
            data: {
              stockLocationId: stockData.data.id,
              stockLocationName: stockData.data.attributes.name,
            },
          })
        } else {
          const errorText = await stockResponse.text()
          tests.push({
            test: "Stock Location Access",
            passed: false,
            error: `${stockResponse.status}: ${errorText}`,
          })
        }
      } catch (stockError) {
        tests.push({
          test: "Stock Location Access",
          passed: false,
          error: stockError instanceof Error ? stockError.message : "Unknown error",
        })
      }
    }

    const allTestsPassed = tests.every((test) => test.passed)

    return NextResponse.json({
      success: allTestsPassed,
      message: allTestsPassed
        ? "Integration app authentication and API access successful"
        : "Some tests failed - check Integration app permissions",
      appType: "Integration",
      tokenObtained: true,
      tests,
      environment: {
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "not_configured",
        clientIdPrefix: clClientId?.substring(0, 20) + "...",
      },
    })
  } catch (error) {
    console.error("❌ Integration auth test failed:", error)
    return NextResponse.json(
      {
        error: "Integration app authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
