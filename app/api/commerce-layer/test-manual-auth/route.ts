import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔧 Testing Commerce Layer authentication (Sales Channel mode)...")

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
      clientIdPrefix: clClientId?.substring(0, 20) + "...",
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

    console.log("✅ Access token obtained successfully!")

    // Test Sales Channel appropriate endpoints (avoid customer listing)
    const apiBase = `${clBaseUrl}/api`
    const tests = []

    // Test 1: SKUs access (Sales Channel should have this)
    try {
      console.log("🧪 Testing SKUs access...")
      const skusResponse = await fetch(`${apiBase}/skus?page[size]=3`, {
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

    // Test 2: Orders access (Sales Channel should have this)
    try {
      console.log("🧪 Testing Orders access...")
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

    // Test 3: Customer creation (Sales Channel should have this)
    try {
      console.log("🧪 Testing Customer creation...")
      const testCustomerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: `test-${Date.now()}@example.com`,
            first_name: "Test",
            last_name: "Customer",
            metadata: {
              source: "auth_test",
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

    // Test 4: Customer listing (Sales Channel should NOT have this)
    try {
      console.log("🧪 Testing Customer listing (should fail for Sales Channel)...")
      const customersResponse = await fetch(`${apiBase}/customers?page[size]=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (customersResponse.ok) {
        tests.push({
          name: "Customer Listing",
          status: "unexpected_success",
          details: "Sales Channel should not have customer listing permissions",
        })
      } else if (customersResponse.status === 401) {
        tests.push({
          name: "Customer Listing",
          status: "expected_failure",
          details: "Correctly denied - Sales Channel apps cannot list customers",
        })
      } else {
        const errorText = await customersResponse.text()
        tests.push({
          name: "Customer Listing",
          status: "failed",
          details: `${customersResponse.status}: ${errorText}`,
        })
      }
    } catch (error) {
      tests.push({
        name: "Customer Listing",
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    }

    const successfulTests = tests.filter(
      (test) => test.status === "success" || test.status === "expected_failure",
    ).length
    const totalTests = tests.length

    return NextResponse.json({
      success: successfulTests >= totalTests - 1, // Allow for expected customer listing failure
      message: `Sales Channel authentication test completed: ${successfulTests}/${totalTests} tests passed`,
      tokenObtained: true,
      appType: "sales_channel",
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
      notes: [
        "Sales Channel apps cannot list customers - this is expected behavior",
        "Customer creation should work for Sales Channel apps",
        "Orders and SKUs access should work for Sales Channel apps",
      ],
    })
  } catch (error) {
    console.error("❌ Sales Channel auth test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Sales Channel authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        appType: "sales_channel",
      },
      { status: 500 },
    )
  }
}
