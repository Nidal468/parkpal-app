import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Starting full Commerce Layer diagnostic...")

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
          ? `${environment.server.COMMERCE_LAYER_CLIENT_ID.substring(0, 10)}...`
          : "undefined",
        COMMERCE_LAYER_CLIENT_SECRET: environment.server.COMMERCE_LAYER_CLIENT_SECRET ? "set" : "undefined",
        COMMERCE_LAYER_BASE_URL: environment.server.COMMERCE_LAYER_BASE_URL,
        COMMERCE_LAYER_MARKET_ID: environment.server.COMMERCE_LAYER_MARKET_ID,
        COMMERCE_LAYER_STOCK_LOCATION_ID: environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID,
        COMMERCE_LAYER_SCOPE: environment.server.COMMERCE_LAYER_SCOPE,
      },
      client: {
        NEXT_PUBLIC_CL_CLIENT_ID: environment.client.NEXT_PUBLIC_CL_CLIENT_ID
          ? `${environment.client.NEXT_PUBLIC_CL_CLIENT_ID.substring(0, 10)}...`
          : "undefined",
        NEXT_PUBLIC_CL_CLIENT_SECRET: environment.client.NEXT_PUBLIC_CL_CLIENT_SECRET ? "set" : "undefined",
        NEXT_PUBLIC_CL_MARKET_ID: environment.client.NEXT_PUBLIC_CL_MARKET_ID,
        NEXT_PUBLIC_CL_SCOPE: environment.client.NEXT_PUBLIC_CL_SCOPE,
        NEXT_PUBLIC_CL_STOCK_LOCATION_ID: environment.client.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
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
    }

    const diagnostics = {
      environment: safeEnvironment,
      analysis,
      tests: {
        authentication: { status: "pending", details: null },
        apiAccess: { status: "pending", details: null },
        resourceAccess: { status: "pending", details: null },
      },
      recommendations: [],
    }

    // Authentication Test
    try {
      if (!environment.server.COMMERCE_LAYER_CLIENT_ID || !environment.server.COMMERCE_LAYER_CLIENT_SECRET) {
        throw new Error("Missing server-side Commerce Layer credentials")
      }

      if (!environment.server.COMMERCE_LAYER_BASE_URL || !environment.server.COMMERCE_LAYER_MARKET_ID) {
        throw new Error("Missing Commerce Layer base URL or market ID")
      }

      console.log("🔑 Testing authentication with centralized function...")
      const accessToken = await getCommerceLayerAccessToken(
        environment.server.COMMERCE_LAYER_CLIENT_ID,
        environment.server.COMMERCE_LAYER_CLIENT_SECRET,
        environment.server.COMMERCE_LAYER_MARKET_ID,
        environment.server.COMMERCE_LAYER_STOCK_LOCATION_ID,
      )

      diagnostics.tests.authentication = {
        status: "success",
        details: "Access token obtained successfully using centralized function",
      }

      // API Access Test
      const apiBase = `${environment.server.COMMERCE_LAYER_BASE_URL}/api`
      const marketResponse = await fetch(`${apiBase}/markets/${environment.server.COMMERCE_LAYER_MARKET_ID}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (marketResponse.ok) {
        const marketData = await marketResponse.json()
        diagnostics.tests.apiAccess = {
          status: "success",
          details: {
            market: {
              id: marketData.data.id,
              name: marketData.data.attributes.name,
              currency: marketData.data.attributes.currency_code,
            },
          },
        }
      } else {
        const errorText = await marketResponse.text()
        diagnostics.tests.apiAccess = {
          status: "failed",
          details: `Market API access failed: ${marketResponse.status} ${errorText}`,
        }
      }

      // Resource Access Test
      const resourceTests = []

      // Test SKUs
      const skusResponse = await fetch(`${apiBase}/skus?page[size]=3`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (skusResponse.ok) {
        const skusData = await skusResponse.json()
        resourceTests.push({
          resource: "SKUs",
          status: "success",
          count: skusData.data.length,
          samples: skusData.data.map((sku: any) => sku.attributes.code),
        })
      } else {
        resourceTests.push({
          resource: "SKUs",
          status: "failed",
          error: `${skusResponse.status}: ${await skusResponse.text()}`,
        })
      }

      // Test Customers
      const customersResponse = await fetch(`${apiBase}/customers?page[size]=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        resourceTests.push({
          resource: "Customers",
          status: "success",
          count: customersData.data.length,
        })
      } else {
        resourceTests.push({
          resource: "Customers",
          status: "failed",
          error: `${customersResponse.status}: ${await customersResponse.text()}`,
        })
      }

      diagnostics.tests.resourceAccess = {
        status: resourceTests.every((test) => test.status === "success") ? "success" : "partial",
        details: resourceTests,
      }
    } catch (error) {
      diagnostics.tests.authentication = {
        status: "failed",
        details: error instanceof Error ? error.message : "Unknown authentication error",
      }
    }

    // Generate Recommendations
    if (analysis.duplicateConfigs) {
      diagnostics.recommendations.push(
        "Remove duplicate client-side Commerce Layer credentials (NEXT_PUBLIC_CL_*) - use server-side only",
      )
    }

    if (analysis.conflictingScopes) {
      diagnostics.recommendations.push("Remove COMMERCE_LAYER_SCOPE - let the system construct scopes automatically")
    }

    if (!analysis.hasStockLocationId) {
      diagnostics.recommendations.push("Consider adding COMMERCE_LAYER_STOCK_LOCATION_ID for inventory management")
    }

    if (diagnostics.tests.authentication.status === "failed") {
      diagnostics.recommendations.push("Fix authentication issues before proceeding with API calls")
    }

    const overallSuccess =
      diagnostics.tests.authentication.status === "success" &&
      diagnostics.tests.apiAccess.status === "success" &&
      (diagnostics.tests.resourceAccess.status === "success" || diagnostics.tests.resourceAccess.status === "partial")

    return NextResponse.json({
      success: overallSuccess,
      diagnostics,
      summary: {
        authentication: diagnostics.tests.authentication.status,
        apiAccess: diagnostics.tests.apiAccess.status,
        resourceAccess: diagnostics.tests.resourceAccess.status,
        recommendationsCount: diagnostics.recommendations.length,
      },
    })
  } catch (error) {
    console.error("❌ Full diagnostic failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Full diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
