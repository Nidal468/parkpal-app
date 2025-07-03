import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Starting full Commerce Layer diagnostic (Integration app expected)...")

    // Environment Analysis
    const environment = {
      server: {
        COMMERCE_LAYER_CLIENT_ID: process.env.COMMERCE_LAYER_CLIENT_ID,
        COMMERCE_LAYER_CLIENT_SECRET: process.env.COMMERCE_LAYER_CLIENT_SECRET,
        COMMERCE_LAYER_BASE_URL: process.env.COMMERCE_LAYER_BASE_URL,
        COMMERCE_LAYER_MARKET_ID: process.env.COMMERCE_LAYER_MARKET_ID,
        COMMERCE_LAYER_STOCK_LOCATION_ID: process.env.COMMERCE_LAYER_STOCK_LOCATION_ID,
        COMMERCE_LAYER_SCOPE: process.env.COMMERCE_LAYER_SCOPE,
      },
      client: {
        NEXT_PUBLIC_CL_CLIENT_ID: process.env.NEXT_PUBLIC_CL_CLIENT_ID,
        NEXT_PUBLIC_CL_CLIENT_SECRET: process.env.NEXT_PUBLIC_CL_CLIENT_SECRET,
        NEXT_PUBLIC_CL_MARKET_ID: process.env.NEXT_PUBLIC_CL_MARKET_ID,
        NEXT_PUBLIC_CL_SCOPE: process.env.NEXT_PUBLIC_CL_SCOPE,
        NEXT_PUBLIC_CL_STOCK_LOCATION_ID: process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
      },
    }

    // Redact sensitive values for logging
    const safeEnvironment = {
      server: {
        COMMERCE_LAYER_CLIENT_ID: environment.server.COMMERCE_LAYER_CLIENT_ID
          ? `${environment.server.COMMERCE_LAYER_CLIENT_ID.substring(0, 20)}...`
          : "❌ UNDEFINED",
        COMMERCE_LAYER_CLIENT_SECRET: environment.server.COMMERCE_LAYER_CLIENT_SECRET ? "✅ SET" : "❌ UNDEFINED",
        COMMERCE_LAYER_BASE_URL: environment.server.COMMERCE_LAYER_BASE_URL || "❌ UNDEFINED",
        COMMERCE_LAYER_MARKET_ID: environment.server.COMMERCE_LAYER_MARKET_ID || "❌ UNDEFINED",
        COMMERCE_LAYER_STOCK_LOCATION_ID: environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID || "not_set",
        COMMERCE_LAYER_SCOPE: environment.server.COMMERCE_LAYER_SCOPE || "not_set (auto-generated)",
      },
      client: {
        NEXT_PUBLIC_CL_CLIENT_ID: environment.client.NEXT_PUBLIC_CL_CLIENT_ID
          ? `${environment.client.NEXT_PUBLIC_CL_CLIENT_ID.substring(0, 20)}...`
          : "not_set",
        NEXT_PUBLIC_CL_CLIENT_SECRET: environment.client.NEXT_PUBLIC_CL_CLIENT_SECRET
          ? "⚠️ SET (SECURITY RISK)"
          : "✅ not_set",
        NEXT_PUBLIC_CL_MARKET_ID: environment.client.NEXT_PUBLIC_CL_MARKET_ID || "not_set",
        NEXT_PUBLIC_CL_SCOPE: environment.client.NEXT_PUBLIC_CL_SCOPE || "not_set",
        NEXT_PUBLIC_CL_STOCK_LOCATION_ID: environment.client.NEXT_PUBLIC_CL_STOCK_LOCATION_ID || "not_set",
      },
    }

    console.log("🔧 Environment analysis:", safeEnvironment)

    // Configuration Analysis
    const analysis = {
      hasServerCredentials: !!(
        environment.server.COMMERCE_LAYER_CLIENT_ID && environment.server.COMMERCE_LAYER_CLIENT_SECRET
      ),
      hasClientCredentials: !!(
        environment.client.NEXT_PUBLIC_CL_CLIENT_ID && environment.client.NEXT_PUBLIC_CL_CLIENT_SECRET
      ),
      hasBaseUrl: !!environment.server.COMMERCE_LAYER_BASE_URL,
      hasMarketId: !!environment.server.COMMERCE_LAYER_MARKET_ID,
      hasStockLocationId: !!environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID,
      conflictingScopes: !!(environment.server.COMMERCE_LAYER_SCOPE && environment.client.NEXT_PUBLIC_CL_SCOPE),
      duplicateConfigs: !!(environment.server.COMMERCE_LAYER_CLIENT_ID && environment.client.NEXT_PUBLIC_CL_CLIENT_ID),
      hasClientSecrets: !!environment.client.NEXT_PUBLIC_CL_CLIENT_SECRET, // Security risk
      expectedAppType: "integration",
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: safeEnvironment,
      analysis,
      appTypeDetected: "unknown",
      tests: {
        authentication: { status: "pending", details: null },
        appTypeDetection: { status: "pending", details: null },
        marketAccess: { status: "pending", details: null },
        customerManagement: { status: "pending", details: null },
        orderManagement: { status: "pending", details: null },
        productManagement: { status: "pending", details: null },
        integrationFeatures: { status: "pending", details: null },
      },
      recommendations: [] as string[],
      warnings: [] as string[],
      securityIssues: [] as string[],
    }

    // Security Analysis
    if (analysis.hasClientSecrets) {
      diagnostics.securityIssues.push("🚨 CRITICAL: Client secrets exposed in NEXT_PUBLIC_ variables")
      diagnostics.warnings.push("⚠️ Remove NEXT_PUBLIC_CL_CLIENT_SECRET immediately")
    }

    if (analysis.duplicateConfigs) {
      diagnostics.warnings.push("⚠️ Duplicate configurations detected between server and client variables")
    }

    if (analysis.conflictingScopes) {
      diagnostics.warnings.push("⚠️ Manual scope configuration detected - auto-generation recommended")
    }

    // Authentication Test
    try {
      if (!environment.server.COMMERCE_LAYER_CLIENT_ID || !environment.server.COMMERCE_LAYER_CLIENT_SECRET) {
        throw new Error("Missing server-side Commerce Layer credentials")
      }

      if (!environment.server.COMMERCE_LAYER_BASE_URL || !environment.server.COMMERCE_LAYER_MARKET_ID) {
        throw new Error("Missing Commerce Layer base URL or market ID")
      }

      console.log("🔑 Testing authentication with Integration app credentials...")
      const accessToken = await getCommerceLayerAccessToken(
        environment.server.COMMERCE_LAYER_CLIENT_ID,
        environment.server.COMMERCE_LAYER_CLIENT_SECRET,
        environment.server.COMMERCE_LAYER_MARKET_ID,
        environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID,
      )

      diagnostics.tests.authentication = {
        status: "success",
        details: "Access token obtained successfully for Integration app",
      }

      // App Type Detection Test
      const apiBase = `${environment.server.COMMERCE_LAYER_BASE_URL}/api`
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      }

      console.log("🔍 Detecting app type...")
      try {
        const customerListResponse = await fetch(`${apiBase}/customers?page[size]=1`, { headers })

        if (customerListResponse.ok) {
          diagnostics.appTypeDetected = "integration"
          diagnostics.tests.appTypeDetection = {
            status: "success",
            details: "✅ Integration app confirmed - has customer listing permissions",
          }
        } else if (customerListResponse.status === 401) {
          diagnostics.appTypeDetected = "sales_channel"
          diagnostics.tests.appTypeDetection = {
            status: "warning",
            details: "⚠️ Sales Channel app detected - expected Integration app",
          }
          diagnostics.warnings.push("Expected Integration app but detected Sales Channel app")
        } else {
          diagnostics.tests.appTypeDetection = {
            status: "failed",
            details: `Unexpected response: ${customerListResponse.status}`,
          }
        }
      } catch (appTypeError) {
        diagnostics.tests.appTypeDetection = {
          status: "failed",
          details: appTypeError instanceof Error ? appTypeError.message : "Unknown app type detection error",
        }
      }

      // Market Access Test
      try {
        const marketResponse = await fetch(`${apiBase}/markets/${environment.server.COMMERCE_LAYER_MARKET_ID}`, {
          headers,
        })

        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          diagnostics.tests.marketAccess = {
            status: "success",
            details: {
              market: {
                id: marketData.data.id,
                name: marketData.data.attributes.name,
                currency: marketData.data.attributes.currency_code,
              },
              message: "Market access confirmed",
            },
          }
        } else {
          const errorText = await marketResponse.text()
          diagnostics.tests.marketAccess = {
            status: "failed",
            details: `Market API access failed: ${marketResponse.status} ${errorText}`,
          }
        }
      } catch (marketError) {
        diagnostics.tests.marketAccess = {
          status: "failed",
          details: marketError instanceof Error ? marketError.message : "Unknown market access error",
        }
      }

      // Customer Management Test (Integration app feature)
      const customerTests = []
      try {
        // Test customer listing
        const customerListResponse = await fetch(`${apiBase}/customers?page[size]=2`, { headers })
        if (customerListResponse.ok) {
          const customerData = await customerListResponse.json()
          customerTests.push({
            feature: "Customer Listing",
            status: "success",
            count: customerData.data.length,
          })
        } else {
          const errorText = await customerListResponse.text()
          customerTests.push({
            feature: "Customer Listing",
            status: "failed",
            error: `${customerListResponse.status}: ${errorText}`,
          })
        }

        // Test customer search with corrected filter syntax
        const customerSearchResponse = await fetch(`${apiBase}/customers?filter[q][email_eq]=test@example.com`, {
          headers,
        })
        if (customerSearchResponse.ok) {
          customerTests.push({
            feature: "Customer Search",
            status: "success",
          })
        } else {
          const errorText = await customerSearchResponse.text()
          customerTests.push({
            feature: "Customer Search",
            status: "failed",
            error: `${customerSearchResponse.status}: ${errorText}`,
          })
        }

        // Test customer creation with proper payload
        const testCustomer = {
          data: {
            type: "customers",
            attributes: {
              email: `full-diagnostic-${Date.now()}@example.com`,
              first_name: "Full",
              last_name: "Diagnostic",
              phone: null,
              metadata: { source: "full_diagnostic_test" },
            },
          },
        }

        const customerCreateResponse = await fetch(`${apiBase}/customers`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/vnd.api+json" },
          body: JSON.stringify(testCustomer),
        })

        if (customerCreateResponse.ok) {
          const customerData = await customerCreateResponse.json()
          customerTests.push({
            feature: "Customer Creation",
            status: "success",
            customerId: customerData.data.id,
          })

          // Clean up
          try {
            await fetch(`${apiBase}/customers/${customerData.data.id}`, {
              method: "DELETE",
              headers,
            })
          } catch {
            // Ignore cleanup errors
          }
        } else {
          const errorText = await customerCreateResponse.text()
          customerTests.push({
            feature: "Customer Creation",
            status: "failed",
            error: `${customerCreateResponse.status}: ${errorText}`,
          })
        }

        diagnostics.tests.customerManagement = {
          status: customerTests.every((test) => test.status === "success") ? "success" : "partial",
          details: customerTests,
        }
      } catch (customerError) {
        diagnostics.tests.customerManagement = {
          status: "failed",
          details: customerError instanceof Error ? customerError.message : "Unknown customer management error",
        }
      }

      // Order Management Test
      try {
        const orderResponse = await fetch(`${apiBase}/orders?page[size]=2`, { headers })
        if (orderResponse.ok) {
          const orderData = await orderResponse.json()
          diagnostics.tests.orderManagement = {
            status: "success",
            details: {
              count: orderData.data.length,
              message: "Order management access confirmed",
            },
          }
        } else {
          const errorText = await orderResponse.text()
          diagnostics.tests.orderManagement = {
            status: "failed",
            details: `Order management failed: ${orderResponse.status} ${errorText}`,
          }
        }
      } catch (orderError) {
        diagnostics.tests.orderManagement = {
          status: "failed",
          details: orderError instanceof Error ? orderError.message : "Unknown order management error",
        }
      }

      // Product Management Test
      try {
        const skuResponse = await fetch(`${apiBase}/skus?page[size]=3`, { headers })
        if (skuResponse.ok) {
          const skuData = await skuResponse.json()
          diagnostics.tests.productManagement = {
            status: "success",
            details: {
              count: skuData.data.length,
              message: "Product management access confirmed",
              samples: skuData.data.map((sku: any) => sku.attributes.code),
            },
          }
        } else {
          const errorText = await skuResponse.text()
          diagnostics.tests.productManagement = {
            status: "failed",
            details: `Product management failed: ${skuResponse.status} ${errorText}`,
          }
        }
      } catch (productError) {
        diagnostics.tests.productManagement = {
          status: "failed",
          details: productError instanceof Error ? productError.message : "Unknown product management error",
        }
      }

      // Integration Features Test
      const integrationFeatures = []

      // Test comprehensive order includes
      try {
        const orderWithIncludesResponse = await fetch(
          `${apiBase}/orders?page[size]=1&include=line_items,customer,market`,
          { headers },
        )
        if (orderWithIncludesResponse.ok) {
          integrationFeatures.push({
            feature: "Comprehensive Includes",
            status: "success",
          })
        } else {
          integrationFeatures.push({
            feature: "Comprehensive Includes",
            status: "failed",
          })
        }
      } catch {
        integrationFeatures.push({
          feature: "Comprehensive Includes",
          status: "failed",
        })
      }

      // Test stock location access (if configured)
      if (environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID) {
        try {
          const stockResponse = await fetch(
            `${apiBase}/stock_locations/${environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID}`,
            { headers },
          )
          if (stockResponse.ok) {
            integrationFeatures.push({
              feature: "Stock Location Access",
              status: "success",
            })
          } else {
            integrationFeatures.push({
              feature: "Stock Location Access",
              status: "failed",
            })
          }
        } catch {
          integrationFeatures.push({
            feature: "Stock Location Access",
            status: "failed",
          })
        }
      }

      diagnostics.tests.integrationFeatures = {
        status: integrationFeatures.every((test) => test.status === "success") ? "success" : "partial",
        details: integrationFeatures,
      }
    } catch (error) {
      diagnostics.tests.authentication = {
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown authentication error",
      }
    }

    // Generate Recommendations
    if (diagnostics.appTypeDetected === "integration") {
      diagnostics.recommendations.push(
        "✅ Integration app confirmed - full API access available",
        "✅ Customer management features enabled",
        "✅ Advanced order processing capabilities",
        "✅ Ready for production use",
      )
    } else if (diagnostics.appTypeDetected === "sales_channel") {
      diagnostics.recommendations.push(
        "⚠️ Sales Channel app detected - consider upgrading to Integration",
        "ℹ️ Limited customer management capabilities",
        "💡 Integration app recommended for full feature set",
      )
    }

    if (analysis.hasClientSecrets) {
      diagnostics.recommendations.push("🚨 URGENT: Remove client secrets from environment variables")
    }

    if (analysis.duplicateConfigs) {
      diagnostics.recommendations.push("🧹 Clean up duplicate Commerce Layer configurations")
    }

    if (analysis.conflictingScopes) {
      diagnostics.recommendations.push("🔧 Remove manual scope configuration - use auto-generation")
    }

    const overallSuccess =
      diagnostics.tests.authentication.status === "success" &&
      diagnostics.tests.appTypeDetection.status === "success" &&
      diagnostics.tests.marketAccess.status === "success" &&
      (diagnostics.tests.customerManagement.status === "success" ||
        diagnostics.tests.customerManagement.status === "partial") &&
      diagnostics.tests.orderManagement.status === "success" &&
      diagnostics.tests.productManagement.status === "success"

    return NextResponse.json({
      success: overallSuccess,
      diagnostics,
      summary: {
        appType: diagnostics.appTypeDetected,
        expectedAppType: "integration",
        appTypeMatch: diagnostics.appTypeDetected === "integration",
        authentication: diagnostics.tests.authentication.status,
        marketAccess: diagnostics.tests.marketAccess.status,
        customerManagement: diagnostics.tests.customerManagement.status,
        orderManagement: diagnostics.tests.orderManagement.status,
        productManagement: diagnostics.tests.productManagement.status,
        integrationFeatures: diagnostics.tests.integrationFeatures.status,
        securityIssuesCount: diagnostics.securityIssues.length,
        warningsCount: diagnostics.warnings.length,
        recommendationsCount: diagnostics.recommendations.length,
        overallStatus: overallSuccess ? "fully_operational" : "issues_detected",
      },
      nextSteps: overallSuccess
        ? [
            "✅ Integration app is fully operational",
            "✅ All advanced features available",
            "✅ Customer search and management enabled",
            "✅ Ready for production deployment",
            "🚀 Test the complete booking flow at /test-reserve",
          ]
        : [
            "❌ Issues detected in Integration app setup",
            "🔍 Review the diagnostic details above",
            "🛠️ Address security issues and warnings",
            "🔄 Re-run diagnostic after making changes",
          ],
    })
  } catch (error) {
    console.error("❌ Full Integration app diagnostic failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Full Integration app diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        expectedAppType: "integration",
      },
      { status: 500 },
    )
  }
}
