import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Starting comprehensive Commerce Layer diagnostic...")

    const timestamp = new Date().toISOString()

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID
    const clScope = process.env.COMMERCE_LAYER_SCOPE

    // Client-side environment variables (should NOT be set for security)
    const clClientIdPublic = process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clClientSecretPublic = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
    const clMarketIdPublic = process.env.NEXT_PUBLIC_CL_MARKET_ID
    const clScopePublic = process.env.NEXT_PUBLIC_CL_SCOPE
    const clStockLocationIdPublic = process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID

    const environment = {
      server: {
        COMMERCE_LAYER_CLIENT_ID: clClientId ? `${clClientId.substring(0, 20)}...` : "not_set",
        COMMERCE_LAYER_CLIENT_SECRET: clClientSecret ? "✅ SET" : "not_set",
        COMMERCE_LAYER_BASE_URL: clBaseUrl || "not_set",
        COMMERCE_LAYER_MARKET_ID: clMarketId || "not_set",
        COMMERCE_LAYER_STOCK_LOCATION_ID: clStockLocationId || "not_set",
        COMMERCE_LAYER_SCOPE: clScope || "not_set (auto-generated)",
      },
      client: {
        NEXT_PUBLIC_CL_CLIENT_ID: clClientIdPublic || "not_set",
        NEXT_PUBLIC_CL_CLIENT_SECRET: clClientSecretPublic ? "❌ SET (SECURITY RISK)" : "✅ not_set",
        NEXT_PUBLIC_CL_MARKET_ID: clMarketIdPublic || "not_set",
        NEXT_PUBLIC_CL_SCOPE: clScopePublic || "not_set",
        NEXT_PUBLIC_CL_STOCK_LOCATION_ID: clStockLocationIdPublic || "not_set",
      },
    }

    // Analysis
    const analysis = {
      hasServerCredentials: !!(clClientId && clClientSecret),
      hasClientCredentials: !!(clClientIdPublic && clClientSecretPublic),
      hasBaseUrl: !!clBaseUrl,
      hasMarketId: !!clMarketId,
      hasStockLocationId: !!clStockLocationId,
      conflictingScopes: !!(clScope && clScopePublic && clScope !== clScopePublic),
      duplicateConfigs: !!(clClientId && clClientIdPublic),
      hasClientSecrets: !!clClientSecretPublic,
      expectedAppType: clClientId?.startsWith("K0-")
        ? "integration"
        : clClientId?.startsWith("Ng-")
          ? "sales_channel"
          : "unknown",
    }

    let appTypeDetected = "unknown"
    const tests: any = {}

    if (!analysis.hasServerCredentials || !analysis.hasBaseUrl || !analysis.hasMarketId) {
      return NextResponse.json({
        success: false,
        error: "Missing required Commerce Layer configuration",
        environment,
        analysis,
      })
    }

    const apiBase = `${clBaseUrl}/api`

    try {
      // Test 1: Authentication
      console.log("🔐 Testing authentication...")
      const accessToken = await getCommerceLayerAccessToken(
        clClientId!,
        clClientSecret!,
        clMarketId!,
        clStockLocationId,
      )

      tests.authentication = {
        status: "success",
        details: "Access token obtained successfully for Integration app",
      }

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      }

      // Test 2: App Type Detection
      console.log("🔍 Detecting app type...")
      try {
        const customersResponse = await fetch(`${apiBase}/customers?page[limit]=1`, {
          method: "GET",
          headers,
        })

        if (customersResponse.ok) {
          appTypeDetected = "integration"
          tests.appTypeDetection = {
            status: "success",
            details: "✅ Integration app confirmed - has customer listing permissions",
          }
        } else if (customersResponse.status === 401) {
          appTypeDetected = "sales_channel"
          tests.appTypeDetection = {
            status: "success",
            details: "✅ Sales Channel app confirmed - customer listing returns 401 as expected",
          }
        } else {
          tests.appTypeDetection = {
            status: "failed",
            details: `Unexpected response: ${customersResponse.status}`,
          }
        }
      } catch (error) {
        tests.appTypeDetection = {
          status: "failed",
          details: `Error: ${error}`,
        }
      }

      // Test 3: Market Access
      console.log("🏪 Testing market access...")
      try {
        const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
          method: "GET",
          headers,
        })

        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          tests.marketAccess = {
            status: "success",
            details: {
              market: {
                id: marketData.data.id,
                name: marketData.data.attributes.name,
              },
              message: "Market access confirmed",
            },
          }
        } else {
          const errorText = await marketResponse.text()
          tests.marketAccess = {
            status: "failed",
            details: `Market access failed: ${marketResponse.status} ${errorText}`,
          }
        }
      } catch (error) {
        tests.marketAccess = {
          status: "failed",
          details: `Market access error: ${error}`,
        }
      }

      // Test 4: Customer Management (Integration apps only)
      console.log("👤 Testing customer management...")
      const customerTests = []

      try {
        // Customer Listing
        const customersResponse = await fetch(`${apiBase}/customers?page[limit]=1`, {
          method: "GET",
          headers,
        })

        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          customerTests.push({
            feature: "Customer Listing",
            status: "success",
            count: customersData.data?.length || 0,
          })
        } else {
          customerTests.push({
            feature: "Customer Listing",
            status: "failed",
            error: customersResponse.status.toString(),
          })
        }

        // Customer Search
        const searchResponse = await fetch(`${apiBase}/customers?filter[q][email_eq]=test@example.com`, {
          method: "GET",
          headers,
        })

        if (searchResponse.ok) {
          customerTests.push({
            feature: "Customer Search",
            status: "success",
          })
        } else {
          customerTests.push({
            feature: "Customer Search",
            status: "failed",
            error: searchResponse.status.toString(),
          })
        }

        // Customer Creation Test
        const testCustomerPayload = {
          data: {
            type: "customers",
            attributes: {
              email: `test-${Date.now()}@parkpal-diagnostic.com`,
              metadata: {
                test: true,
                created_by: "diagnostic",
              },
            },
          },
        }

        const createResponse = await fetch(`${apiBase}/customers`, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify(testCustomerPayload),
        })

        if (createResponse.ok) {
          const createdCustomer = await createResponse.json()
          customerTests.push({
            feature: "Customer Creation",
            status: "success",
            customerId: createdCustomer.data.id,
          })

          // Clean up test customer
          try {
            await fetch(`${apiBase}/customers/${createdCustomer.data.id}`, {
              method: "DELETE",
              headers,
            })
          } catch {
            // Ignore cleanup errors
          }
        } else {
          customerTests.push({
            feature: "Customer Creation",
            status: "failed",
            error: createResponse.status.toString(),
          })
        }

        tests.customerManagement = {
          status: customerTests.every((t) => t.status === "success") ? "success" : "partial",
          details: customerTests,
        }
      } catch (error) {
        tests.customerManagement = {
          status: "failed",
          details: `Customer management error: ${error}`,
        }
      }

      // Test 5: Order Management
      console.log("📦 Testing order management...")
      try {
        const ordersResponse = await fetch(`${apiBase}/orders?page[limit]=5`, {
          method: "GET",
          headers,
        })

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          tests.orderManagement = {
            status: "success",
            details: {
              count: ordersData.data?.length || 0,
              message: "Order management access confirmed",
            },
          }
        } else {
          const errorText = await ordersResponse.text()
          tests.orderManagement = {
            status: "failed",
            details: `Order management failed: ${ordersResponse.status} ${errorText}`,
          }
        }
      } catch (error) {
        tests.orderManagement = {
          status: "failed",
          details: `Order management error: ${error}`,
        }
      }

      // Test 6: Product Management
      console.log("🛍️ Testing product management...")
      try {
        const skusResponse = await fetch(`${apiBase}/skus?page[limit]=5`, {
          method: "GET",
          headers,
        })

        if (skusResponse.ok) {
          const skusData = await skusResponse.json()
          const sampleSkus = skusData.data?.slice(0, 3).map((sku: any) => sku.attributes.code) || []

          tests.productManagement = {
            status: "success",
            details: {
              count: skusData.data?.length || 0,
              message: "Product management access confirmed",
              samples: sampleSkus,
            },
          }
        } else {
          const errorText = await skusResponse.text()
          tests.productManagement = {
            status: "failed",
            details: `Product management failed: ${skusResponse.status} ${errorText}`,
          }
        }
      } catch (error) {
        tests.productManagement = {
          status: "failed",
          details: `Product management error: ${error}`,
        }
      }

      // Test 7: Integration Features
      console.log("🔧 Testing integration features...")
      const integrationTests = []

      try {
        // Test comprehensive includes
        const includeResponse = await fetch(`${apiBase}/orders?include=line_items,customer&page[limit]=1`, {
          method: "GET",
          headers,
        })

        if (includeResponse.ok) {
          integrationTests.push({
            feature: "Comprehensive Includes",
            status: "success",
          })
        } else {
          integrationTests.push({
            feature: "Comprehensive Includes",
            status: "failed",
          })
        }

        // Test stock location access
        if (clStockLocationId) {
          const stockLocationResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, {
            method: "GET",
            headers,
          })

          if (stockLocationResponse.ok) {
            integrationTests.push({
              feature: "Stock Location Access",
              status: "success",
            })
          } else {
            integrationTests.push({
              feature: "Stock Location Access",
              status: "failed",
            })
          }
        }

        tests.integrationFeatures = {
          status: integrationTests.every((t) => t.status === "success") ? "success" : "partial",
          details: integrationTests,
        }
      } catch (error) {
        tests.integrationFeatures = {
          status: "failed",
          details: `Integration features error: ${error}`,
        }
      }
    } catch (authError) {
      tests.authentication = {
        status: "failed",
        details: `Authentication failed: ${authError}`,
      }
    }

    // Generate recommendations and warnings
    const recommendations = []
    const warnings = []
    const securityIssues = []

    if (appTypeDetected === "integration") {
      recommendations.push("✅ Integration app confirmed - full API access available")
      recommendations.push("✅ Customer management features enabled")
      recommendations.push("✅ Advanced order processing capabilities")
      recommendations.push("✅ Ready for production use")
    } else if (appTypeDetected === "sales_channel") {
      recommendations.push("⚠️ Sales Channel app detected - limited customer access")
      recommendations.push("💡 Consider upgrading to Integration app for full features")
      recommendations.push("✅ Order creation and payment processing available")
    }

    if (analysis.hasClientSecrets) {
      securityIssues.push("🚨 SECURITY RISK: Client secret exposed in environment variables")
      securityIssues.push("🔒 Remove NEXT_PUBLIC_CL_CLIENT_SECRET immediately")
    }

    if (analysis.duplicateConfigs) {
      warnings.push("⚠️ Duplicate configurations detected - clean up unused variables")
    }

    // Calculate overall status
    const testResults = Object.values(tests)
    const successCount = testResults.filter((t: any) => t.status === "success").length
    const totalTests = testResults.length

    let overallStatus = "unknown"
    if (successCount === totalTests) {
      overallStatus = "fully_operational"
    } else if (successCount > totalTests / 2) {
      overallStatus = "mostly_operational"
    } else if (successCount > 0) {
      overallStatus = "partially_operational"
    } else {
      overallStatus = "not_operational"
    }

    const summary = {
      appType: appTypeDetected,
      expectedAppType: analysis.expectedAppType,
      appTypeMatch: appTypeDetected === analysis.expectedAppType,
      authentication: tests.authentication?.status || "unknown",
      marketAccess: tests.marketAccess?.status || "unknown",
      customerManagement: tests.customerManagement?.status || "unknown",
      orderManagement: tests.orderManagement?.status || "unknown",
      productManagement: tests.productManagement?.status || "unknown",
      integrationFeatures: tests.integrationFeatures?.status || "unknown",
      securityIssuesCount: securityIssues.length,
      warningsCount: warnings.length,
      recommendationsCount: recommendations.length,
      overallStatus,
    }

    const nextSteps = []
    if (overallStatus === "fully_operational") {
      nextSteps.push("✅ Integration app is fully operational")
      nextSteps.push("✅ All advanced features available")
      nextSteps.push("✅ Customer search and management enabled")
      nextSteps.push("✅ Ready for production deployment")
      nextSteps.push("🚀 Test the complete booking flow at /test-reserve")
    } else {
      nextSteps.push("🔧 Review failed tests and fix configuration issues")
      nextSteps.push("📞 Contact Commerce Layer support if problems persist")
      nextSteps.push("🔍 Check environment variables and permissions")
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        timestamp,
        environment,
        analysis,
        appTypeDetected,
        tests,
        recommendations,
        warnings,
        securityIssues,
      },
      summary,
      nextSteps,
    })
  } catch (error) {
    console.error("❌ Diagnostic failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Diagnostic failed",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
