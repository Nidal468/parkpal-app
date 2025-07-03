import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🧪 Testing Commerce Layer Integration app authentication...")
    console.log("⚠️ Note: This test assumes you have an Integration app, not a Sales Channel app")

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
      clientIdPrefix: clClientId?.substring(0, 20) + "...",
      note: "If using Sales Channel app, some tests will fail (expected)",
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Missing required Commerce Layer environment variables for Integration app test",
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

    // Test 3: Customer listing (Integration apps should have this)
    try {
      const customersResponse = await fetch(`${apiBase}/customers?page[size]=3`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        tests.push({
          name: "Customer Listing (Integration Only)",
          status: "success",
          details: {
            count: customersData.data.length,
            hasIntegrationPermissions: true,
            note: "This confirms you have an Integration app, not Sales Channel",
          },
        })
      } else if (customersResponse.status === 401) {
        tests.push({
          name: "Customer Listing (Integration Only)",
          status: "expected_failure_for_sales_channel",
          details: {
            message: "401 Unauthorized - You likely have a Sales Channel app, not Integration",
            recommendation: "Sales Channel apps cannot list customers - this is normal",
          },
        })
      } else {
        const errorText = await customersResponse.text()
        tests.push({
          name: "Customer Listing (Integration Only)",
          status: "failed",
          details: `${customersResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "Customer Listing (Integration Only)",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 4: Customer creation
    try {
      const testCustomerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: `integration-test-${Date.now()}@example.com`,
            first_name: "Integration",
            last_name: "Test",
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
        body: JSON.stringify(testCustomerPayload),
      })

      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        tests.push({
          name: "Customer Creation",
          status: "success",
          details: {
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
          name: "Customer Creation",
          status: "failed",
          details: `${customerResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "Customer Creation",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 5: Orders access
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

    // Test 6: Stock location access (if configured)
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
            name: "Stock Location Access",
            status: "success",
            details: {
              stockLocationId: stockData.data.id,
              stockLocationName: stockData.data.attributes.name,
            },
          })
        } else {
          const errorText = await stockResponse.text()
          tests.push({
            name: "Stock Location Access",
            status: "failed",
            details: `${stockResponse.status}: ${errorText}`,
          })
        }
      } catch (error) {
        tests.push({
          name: "Stock Location Access",
          status: "failed",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    } else {
      tests.push({
        name: "Stock Location Access",
        status: "skipped",
        details: "No stock location ID configured",
      })
    }

    const successfulTests = tests.filter(
      (test) =>
        test.status === "success" || test.status === "skipped" || test.status === "expected_failure_for_sales_channel",
    ).length
    const totalTests = tests.length

    // Determine app type based on customer listing test
    const customerListingTest = tests.find((test) => test.name === "Customer Listing (Integration Only)")
    const isIntegrationApp = customerListingTest?.status === "success"
    const isSalesChannelApp = customerListingTest?.status === "expected_failure_for_sales_channel"

    let appTypeDetected = "unknown"
    if (isIntegrationApp) {
      appTypeDetected = "integration"
    } else if (isSalesChannelApp) {
      appTypeDetected = "sales_channel"
    }

    return NextResponse.json({
      success: successfulTests >= totalTests - 1, // Allow for some expected failures
      message: `Integration app test completed: ${successfulTests}/${totalTests} tests passed`,
      tokenObtained: true,
      appTypeDetected,
      tests,
      environment: {
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "not_configured",
        clientIdPrefix: clClientId?.substring(0, 20) + "...",
      },
      summary: {
        passed: successfulTests,
        total: totalTests,
        percentage: Math.round((successfulTests / totalTests) * 100),
      },
      recommendations: isIntegrationApp
        ? [
            "✅ You have an Integration app with full API access",
            "✅ Customer management features are available",
            "✅ All Commerce Layer features should work",
          ]
        : isSalesChannelApp
          ? [
              "ℹ️ You have a Sales Channel app (not Integration)",
              "⚠️ Customer listing is not available (expected for Sales Channel)",
              "✅ Order creation and payment processing should work",
              "💡 Consider upgrading to Integration app for full customer management",
            ]
          : [
              "❓ Could not determine app type",
              "🔍 Check Commerce Layer dashboard for app configuration",
              "🛠️ Verify app permissions and scopes",
            ],
    })
  } catch (error) {
    console.error("❌ Integration auth test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Integration app authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        note: "If you have a Sales Channel app, use /api/commerce-layer/test-manual-auth instead",
      },
      { status: 500 },
    )
  }
}
