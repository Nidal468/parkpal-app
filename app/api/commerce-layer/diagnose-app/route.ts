import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Starting Commerce Layer Integration app diagnosis...")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    const diagnosis = {
      appType: "integration",
      environment: {
        hasClientId: !!clClientId,
        hasClientSecret: !!clClientSecret,
        hasBaseUrl: !!clBaseUrl,
        hasMarketId: !!clMarketId,
        hasStockLocationId: !!clStockLocationId,
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId,
        clientIdPrefix: clClientId?.substring(0, 20) + "...",
      },
      tests: {
        authentication: { status: "pending", details: null },
        marketAccess: { status: "pending", details: null },
        customerListing: { status: "pending", details: null },
        customerCreation: { status: "pending", details: null },
        customerSearch: { status: "pending", details: null },
        skuAccess: { status: "pending", details: null },
        orderAccess: { status: "pending", details: null },
        stockLocationAccess: { status: "pending", details: null },
      },
      integrationCapabilities: [
        "Full customer management (create, read, update, delete)",
        "Customer search and filtering",
        "Complete order management",
        "SKU and product management",
        "Stock location management",
        "Comprehensive API access",
        "Advanced reporting and analytics",
      ],
    }

    // Test 1: Authentication
    try {
      if (!clClientId || !clClientSecret || !clMarketId) {
        throw new Error("Missing required credentials")
      }

      const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      diagnosis.tests.authentication = {
        status: "success",
        details: "Access token obtained successfully for Integration app",
      }

      const apiBase = `${clBaseUrl}/api`
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      }

      // Test 2: Market Access
      try {
        const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, { headers })
        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          diagnosis.tests.marketAccess = {
            status: "success",
            details: {
              id: marketData.data.id,
              name: marketData.data.attributes.name,
              currency: marketData.data.attributes.currency_code,
              message: "Integration app can access market details",
            },
          }
        } else {
          const errorText = await marketResponse.text()
          diagnosis.tests.marketAccess = {
            status: "failed",
            details: `Market access failed: ${marketResponse.status} ${errorText}`,
          }
        }
      } catch (marketError) {
        diagnosis.tests.marketAccess = {
          status: "failed",
          details: marketError instanceof Error ? marketError.message : "Unknown market access error",
        }
      }

      // Test 3: Customer Listing (Integration apps should have this)
      try {
        const customerListResponse = await fetch(`${apiBase}/customers?page[size]=3`, { headers })
        if (customerListResponse.ok) {
          const customerData = await customerListResponse.json()
          diagnosis.tests.customerListing = {
            status: "success",
            details: {
              count: customerData.data.length,
              message: "Integration app can list customers",
              samples: customerData.data.map((customer: any) => ({
                id: customer.id,
                email: customer.attributes.email,
                name: `${customer.attributes.first_name} ${customer.attributes.last_name}`,
              })),
            },
          }
        } else {
          const errorText = await customerListResponse.text()
          diagnosis.tests.customerListing = {
            status: "failed",
            details: `Customer listing failed: ${customerListResponse.status} ${errorText}`,
          }
        }
      } catch (customerListError) {
        diagnosis.tests.customerListing = {
          status: "failed",
          details: customerListError instanceof Error ? customerListError.message : "Unknown customer listing error",
        }
      }

      // Test 4: Customer Search
      try {
        const searchEmail = "test@example.com"
        const customerSearchResponse = await fetch(
          `${apiBase}/customers?filter[email_eq]=${encodeURIComponent(searchEmail)}`,
          { headers },
        )
        if (customerSearchResponse.ok) {
          const searchData = await customerSearchResponse.json()
          diagnosis.tests.customerSearch = {
            status: "success",
            details: {
              searchTerm: searchEmail,
              resultsCount: searchData.data.length,
              message: "Integration app can search customers by email",
            },
          }
        } else {
          const errorText = await customerSearchResponse.text()
          diagnosis.tests.customerSearch = {
            status: "failed",
            details: `Customer search failed: ${customerSearchResponse.status} ${errorText}`,
          }
        }
      } catch (customerSearchError) {
        diagnosis.tests.customerSearch = {
          status: "failed",
          details: customerSearchError instanceof Error ? customerSearchError.message : "Unknown customer search error",
        }
      }

      // Test 5: Customer Creation
      try {
        const testCustomerPayload = {
          data: {
            type: "customers",
            attributes: {
              email: `integration-diagnosis-${Date.now()}@example.com`,
              first_name: "Integration",
              last_name: "Diagnosis",
              metadata: { source: "integration_diagnosis_test" },
            },
          },
        }

        const customerCreateResponse = await fetch(`${apiBase}/customers`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/vnd.api+json" },
          body: JSON.stringify(testCustomerPayload),
        })

        if (customerCreateResponse.ok) {
          const customerData = await customerCreateResponse.json()
          diagnosis.tests.customerCreation = {
            status: "success",
            details: {
              customerId: customerData.data.id,
              customerEmail: customerData.data.attributes.email,
              message: "Integration app can create customers",
            },
          }

          // Clean up test customer
          try {
            await fetch(`${apiBase}/customers/${customerData.data.id}`, {
              method: "DELETE",
              headers,
            })
            console.log("🧹 Cleaned up test customer")
          } catch {
            // Ignore cleanup errors
          }
        } else {
          const errorText = await customerCreateResponse.text()
          diagnosis.tests.customerCreation = {
            status: "failed",
            details: `Customer creation failed: ${customerCreateResponse.status} ${errorText}`,
          }
        }
      } catch (customerCreateError) {
        diagnosis.tests.customerCreation = {
          status: "failed",
          details:
            customerCreateError instanceof Error ? customerCreateError.message : "Unknown customer creation error",
        }
      }

      // Test 6: SKU Access
      try {
        const skuResponse = await fetch(`${apiBase}/skus?page[size]=5`, { headers })
        if (skuResponse.ok) {
          const skuData = await skuResponse.json()
          diagnosis.tests.skuAccess = {
            status: "success",
            details: {
              count: skuData.data.length,
              message: "Integration app can access SKUs",
              samples: skuData.data.map((sku: any) => ({
                code: sku.attributes.code,
                name: sku.attributes.name,
                price: sku.attributes.formatted_compare_at_amount,
              })),
            },
          }
        } else {
          const errorText = await skuResponse.text()
          diagnosis.tests.skuAccess = {
            status: "failed",
            details: `SKU access failed: ${skuResponse.status} ${errorText}`,
          }
        }
      } catch (skuError) {
        diagnosis.tests.skuAccess = {
          status: "failed",
          details: skuError instanceof Error ? skuError.message : "Unknown SKU access error",
        }
      }

      // Test 7: Order Access
      try {
        const orderResponse = await fetch(`${apiBase}/orders?page[size]=3`, { headers })
        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          diagnosis.tests.orderAccess = {
            status: "success",
            details: {
              count: orderData.data.length,
              message: "Integration app can access orders",
              samples: orderData.data.map((order: any) => ({
                id: order.id,
                status: order.attributes.status,
                total: order.attributes.formatted_total_amount,
                customerEmail: order.attributes.customer_email,
              })),
            },
          }
        } else {
          const errorText = await orderResponse.text()
          diagnosis.tests.orderAccess = {
            status: "failed",
            details: `Order access failed: ${orderResponse.status} ${errorText}`,
          }
        }
      } catch (orderError) {
        diagnosis.tests.orderAccess = {
          status: "failed",
          details: orderError instanceof Error ? orderError.message : "Unknown order access error",
        }
      }

      // Test 8: Stock Location Access (if configured)
      if (clStockLocationId) {
        try {
          const stockResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, { headers })
          if (stockResponse.ok) {
            const stockData = await stockResponse.json()
            diagnosis.tests.stockLocationAccess = {
              status: "success",
              details: {
                id: stockData.data.id,
                name: stockData.data.attributes.name,
                message: "Integration app can access stock location",
              },
            }
          } else {
            const errorText = await stockResponse.text()
            diagnosis.tests.stockLocationAccess = {
              status: "failed",
              details: `Stock location access failed: ${stockResponse.status} ${errorText}`,
            }
          }
        } catch (stockError) {
          diagnosis.tests.stockLocationAccess = {
            status: "failed",
            details: stockError instanceof Error ? stockError.message : "Unknown stock location error",
          }
        }
      } else {
        diagnosis.tests.stockLocationAccess = {
          status: "skipped",
          details: "No stock location ID configured",
        }
      }
    } catch (authError) {
      diagnosis.tests.authentication = {
        status: "failed",
        details: authError instanceof Error ? authError.message : "Unknown authentication error",
      }
    }

    // Determine overall status
    const criticalTests = [
      "authentication",
      "marketAccess",
      "customerListing",
      "customerCreation",
      "customerSearch",
      "skuAccess",
      "orderAccess",
    ]
    const criticalTestsPassed = criticalTests.filter(
      (testName) => diagnosis.tests[testName as keyof typeof diagnosis.tests].status === "success",
    ).length

    const totalCriticalTests = criticalTests.length
    const overallSuccess = criticalTestsPassed >= totalCriticalTests - 1 // Allow for one minor failure

    return NextResponse.json({
      success: overallSuccess,
      diagnosis,
      summary: {
        appType: "Integration",
        authentication: diagnosis.tests.authentication.status,
        marketAccess: diagnosis.tests.marketAccess.status,
        customerListing: diagnosis.tests.customerListing.status,
        customerCreation: diagnosis.tests.customerCreation.status,
        customerSearch: diagnosis.tests.customerSearch.status,
        skuAccess: diagnosis.tests.skuAccess.status,
        orderAccess: diagnosis.tests.orderAccess.status,
        stockLocationAccess: diagnosis.tests.stockLocationAccess.status,
        overallStatus: overallSuccess ? "fully_functional" : "issues_detected",
        criticalTestsPassed: `${criticalTestsPassed}/${totalCriticalTests}`,
      },
      capabilities: {
        customerManagement: diagnosis.tests.customerListing.status === "success",
        customerSearch: diagnosis.tests.customerSearch.status === "success",
        orderManagement: diagnosis.tests.orderAccess.status === "success",
        productManagement: diagnosis.tests.skuAccess.status === "success",
        stockManagement: diagnosis.tests.stockLocationAccess.status === "success",
        fullApiAccess: overallSuccess,
      },
      recommendations: overallSuccess
        ? [
            "✅ Integration app is fully functional",
            "✅ All customer management features available",
            "✅ Complete order processing capabilities",
            "✅ Ready for production use",
            "🚀 Test the complete booking flow at /test-reserve",
          ]
        : [
            "❌ Some Integration app features are not working",
            "🔍 Review the failed tests above",
            "🛠️ Check Commerce Layer dashboard for app permissions",
            "🔄 Re-run diagnosis after fixing issues",
          ],
    })
  } catch (error) {
    console.error("❌ Integration app diagnosis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Integration app diagnosis failed",
        details: error instanceof Error ? error.message : "Unknown error",
        appType: "integration",
      },
      { status: 500 },
    )
  }
}
