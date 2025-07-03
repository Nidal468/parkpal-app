import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting comprehensive Commerce Layer diagnostic...")

    // Collect all environment variables
    const envVars = {
      // Server-side variables
      COMMERCE_LAYER_CLIENT_ID: process.env.COMMERCE_LAYER_CLIENT_ID,
      COMMERCE_LAYER_CLIENT_SECRET: process.env.COMMERCE_LAYER_CLIENT_SECRET,
      COMMERCE_LAYER_BASE_URL: process.env.COMMERCE_LAYER_BASE_URL,
      COMMERCE_LAYER_MARKET_ID: process.env.COMMERCE_LAYER_MARKET_ID,
      COMMERCE_LAYER_STOCK_LOCATION_ID: process.env.COMMERCE_LAYER_STOCK_LOCATION_ID,
      COMMERCE_LAYER_SCOPE: process.env.COMMERCE_LAYER_SCOPE,

      // Client-side variables (these might interfere)
      NEXT_PUBLIC_CL_CLIENT_ID: process.env.NEXT_PUBLIC_CL_CLIENT_ID,
      NEXT_PUBLIC_CL_CLIENT_SECRET: process.env.NEXT_PUBLIC_CL_CLIENT_SECRET,
      NEXT_PUBLIC_CL_MARKET_ID: process.env.NEXT_PUBLIC_CL_MARKET_ID,
      NEXT_PUBLIC_CL_SCOPE: process.env.NEXT_PUBLIC_CL_SCOPE,
      NEXT_PUBLIC_CL_STOCK_LOCATION_ID: process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
    }

    const diagnostic = {
      timestamp: new Date().toISOString(),
      environment: {} as any,
      warnings: [] as string[],
      tests: {} as any,
    }

    // Environment analysis
    diagnostic.environment = {
      serverSide: {
        hasClientId: !!envVars.COMMERCE_LAYER_CLIENT_ID,
        hasClientSecret: !!envVars.COMMERCE_LAYER_CLIENT_SECRET,
        hasBaseUrl: !!envVars.COMMERCE_LAYER_BASE_URL,
        hasMarketId: !!envVars.COMMERCE_LAYER_MARKET_ID,
        hasStockLocationId: !!envVars.COMMERCE_LAYER_STOCK_LOCATION_ID,
        hasScope: !!envVars.COMMERCE_LAYER_SCOPE,
        clientIdLength: envVars.COMMERCE_LAYER_CLIENT_ID?.length || 0,
        clientSecretLength: envVars.COMMERCE_LAYER_CLIENT_SECRET?.length || 0,
        baseUrl: envVars.COMMERCE_LAYER_BASE_URL,
        marketId: envVars.COMMERCE_LAYER_MARKET_ID,
        stockLocationId: envVars.COMMERCE_LAYER_STOCK_LOCATION_ID,
        scope: envVars.COMMERCE_LAYER_SCOPE,
      },
      clientSide: {
        hasClientId: !!envVars.NEXT_PUBLIC_CL_CLIENT_ID,
        hasClientSecret: !!envVars.NEXT_PUBLIC_CL_CLIENT_SECRET,
        hasMarketId: !!envVars.NEXT_PUBLIC_CL_MARKET_ID,
        hasScope: !!envVars.NEXT_PUBLIC_CL_SCOPE,
        hasStockLocationId: !!envVars.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,
      },
    }

    // Check for potential conflicts
    if (envVars.NEXT_PUBLIC_CL_CLIENT_ID && envVars.COMMERCE_LAYER_CLIENT_ID) {
      if (envVars.NEXT_PUBLIC_CL_CLIENT_ID !== envVars.COMMERCE_LAYER_CLIENT_ID) {
        diagnostic.warnings.push("Client ID mismatch between server and client environment variables")
      }
    }

    if (envVars.COMMERCE_LAYER_SCOPE) {
      diagnostic.warnings.push("COMMERCE_LAYER_SCOPE is set - this might override dynamic scope construction")
    }

    // Check required variables
    const requiredVars = [
      "COMMERCE_LAYER_CLIENT_ID",
      "COMMERCE_LAYER_CLIENT_SECRET",
      "COMMERCE_LAYER_BASE_URL",
      "COMMERCE_LAYER_MARKET_ID",
    ]
    const missingVars = requiredVars.filter((varName) => !envVars[varName as keyof typeof envVars])

    if (missingVars.length > 0) {
      diagnostic.tests.environment = {
        passed: false,
        error: `Missing required environment variables: ${missingVars.join(", ")}`,
        missingVars,
      }
      return NextResponse.json(diagnostic, { status: 500 })
    }

    diagnostic.tests.environment = { passed: true }

    // Test authentication using centralized function
    try {
      console.log("🔑 Testing authentication with centralized function...")
      const accessToken = await getCommerceLayerAccessToken(
        envVars.COMMERCE_LAYER_CLIENT_ID!,
        envVars.COMMERCE_LAYER_CLIENT_SECRET!,
        envVars.COMMERCE_LAYER_MARKET_ID!,
        envVars.COMMERCE_LAYER_STOCK_LOCATION_ID,
      )

      diagnostic.tests.authentication = {
        passed: true,
        method: "centralized_function",
        tokenObtained: true,
        tokenLength: accessToken.length,
        tokenPrefix: accessToken.substring(0, 20) + "...",
      }
    } catch (authError) {
      diagnostic.tests.authentication = {
        passed: false,
        method: "centralized_function",
        error: authError instanceof Error ? authError.message : "Unknown auth error",
      }
      return NextResponse.json(diagnostic, { status: 500 })
    }

    // Test API calls
    const accessToken = await getCommerceLayerAccessToken(
      envVars.COMMERCE_LAYER_CLIENT_ID!,
      envVars.COMMERCE_LAYER_CLIENT_SECRET!,
      envVars.COMMERCE_LAYER_MARKET_ID!,
      envVars.COMMERCE_LAYER_STOCK_LOCATION_ID,
    )

    const apiBase = `${envVars.COMMERCE_LAYER_BASE_URL}/api`

    // Test market access
    try {
      const marketResponse = await fetch(`${apiBase}/markets/${envVars.COMMERCE_LAYER_MARKET_ID}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (marketResponse.ok) {
        const marketData = await marketResponse.json()
        diagnostic.tests.marketAccess = {
          passed: true,
          marketId: marketData.data.id,
          marketName: marketData.data.attributes.name,
          url: `${apiBase}/markets/${envVars.COMMERCE_LAYER_MARKET_ID}`,
        }
      } else {
        const errorText = await marketResponse.text()
        diagnostic.tests.marketAccess = {
          passed: false,
          error: `${marketResponse.status}: ${errorText}`,
          url: `${apiBase}/markets/${envVars.COMMERCE_LAYER_MARKET_ID}`,
        }
      }
    } catch (marketError) {
      diagnostic.tests.marketAccess = {
        passed: false,
        error: marketError instanceof Error ? marketError.message : "Unknown error",
      }
    }

    // Test customer search (this was failing before)
    try {
      const testEmail = "diagnostic-test@example.com"
      const customerSearchUrl = `${apiBase}/customers?filter[email_eq]=${encodeURIComponent(testEmail)}`

      const customerResponse = await fetch(customerSearchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (customerResponse.ok || customerResponse.status === 404) {
        diagnostic.tests.customerSearch = {
          passed: true,
          status: customerResponse.status,
          message: customerResponse.status === 404 ? "No customers found (expected)" : "Customer search successful",
          url: customerSearchUrl,
        }
      } else {
        const errorText = await customerResponse.text()
        diagnostic.tests.customerSearch = {
          passed: false,
          error: `${customerResponse.status}: ${errorText}`,
          url: customerSearchUrl,
        }
      }
    } catch (customerError) {
      diagnostic.tests.customerSearch = {
        passed: false,
        error: customerError instanceof Error ? customerError.message : "Unknown error",
      }
    }

    // Test stock location (if configured)
    if (envVars.COMMERCE_LAYER_STOCK_LOCATION_ID) {
      try {
        const stockResponse = await fetch(`${apiBase}/stock_locations/${envVars.COMMERCE_LAYER_STOCK_LOCATION_ID}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (stockResponse.ok) {
          const stockData = await stockResponse.json()
          diagnostic.tests.stockLocation = {
            passed: true,
            stockLocationId: stockData.data.id,
            stockLocationName: stockData.data.attributes.name,
          }
        } else {
          const errorText = await stockResponse.text()
          diagnostic.tests.stockLocation = {
            passed: false,
            error: `${stockResponse.status}: ${errorText}`,
          }
        }
      } catch (stockError) {
        diagnostic.tests.stockLocation = {
          passed: false,
          error: stockError instanceof Error ? stockError.message : "Unknown error",
        }
      }
    } else {
      diagnostic.tests.stockLocation = {
        passed: true,
        note: "Stock location not configured (optional)",
      }
    }

    const allTestsPassed = Object.values(diagnostic.tests).every((test: any) => test.passed)

    return NextResponse.json({
      ...diagnostic,
      overall: {
        passed: allTestsPassed,
        message: allTestsPassed
          ? "All diagnostic tests passed! Commerce Layer is properly configured."
          : "Some tests failed. Check the details above.",
        warningCount: diagnostic.warnings.length,
      },
    })
  } catch (error) {
    console.error("❌ Full diagnostic failed:", error)
    return NextResponse.json(
      {
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
