import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Starting Commerce Layer app diagnosis...")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    const diagnosis = {
      environment: {
        hasClientId: !!clClientId,
        hasClientSecret: !!clClientSecret,
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId,
        clientIdLength: clClientId?.length || 0,
        clientSecretLength: clClientSecret?.length || 0,
      },
      tests: {} as any,
    }

    // Test 1: Environment variables
    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      diagnosis.tests.environment = {
        passed: false,
        error: "Missing required environment variables",
        missing: {
          clientId: !clClientId,
          clientSecret: !clClientSecret,
          baseUrl: !clBaseUrl,
          marketId: !clMarketId,
        },
      }
      return NextResponse.json(diagnosis, { status: 500 })
    }

    diagnosis.tests.environment = { passed: true }

    // Test 2: Authentication using centralized function
    try {
      console.log("🔑 Testing authentication...")
      const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      diagnosis.tests.authentication = {
        passed: true,
        tokenObtained: true,
        tokenLength: accessToken.length,
      }
    } catch (authError) {
      diagnosis.tests.authentication = {
        passed: false,
        error: authError instanceof Error ? authError.message : "Unknown auth error",
      }
      return NextResponse.json(diagnosis, { status: 500 })
    }

    // Test 3: API connectivity
    try {
      console.log("🌐 Testing API connectivity...")
      const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      const apiBase = `${clBaseUrl}/api`

      const apiResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (apiResponse.ok) {
        const marketData = await apiResponse.json()
        diagnosis.tests.apiConnectivity = {
          passed: true,
          marketName: marketData.data.attributes.name,
          marketId: marketData.data.id,
        }
      } else {
        const errorText = await apiResponse.text()
        diagnosis.tests.apiConnectivity = {
          passed: false,
          error: `API call failed: ${apiResponse.status} ${errorText}`,
        }
      }
    } catch (apiError) {
      diagnosis.tests.apiConnectivity = {
        passed: false,
        error: apiError instanceof Error ? apiError.message : "Unknown API error",
      }
    }

    // Test 4: Stock location (if configured)
    if (clStockLocationId) {
      try {
        console.log("📦 Testing stock location...")
        const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
        const apiBase = `${clBaseUrl}/api`

        const stockResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (stockResponse.ok) {
          const stockData = await stockResponse.json()
          diagnosis.tests.stockLocation = {
            passed: true,
            stockLocationName: stockData.data.attributes.name,
            stockLocationId: stockData.data.id,
          }
        } else {
          const errorText = await stockResponse.text()
          diagnosis.tests.stockLocation = {
            passed: false,
            error: `Stock location test failed: ${stockResponse.status} ${errorText}`,
          }
        }
      } catch (stockError) {
        diagnosis.tests.stockLocation = {
          passed: false,
          error: stockError instanceof Error ? stockError.message : "Unknown stock location error",
        }
      }
    } else {
      diagnosis.tests.stockLocation = {
        passed: true,
        note: "Stock location not configured (optional)",
      }
    }

    const allTestsPassed = Object.values(diagnosis.tests).every((test: any) => test.passed)

    return NextResponse.json({
      ...diagnosis,
      overall: {
        passed: allTestsPassed,
        message: allTestsPassed
          ? "All tests passed! Commerce Layer is properly configured."
          : "Some tests failed. Check the details above.",
      },
    })
  } catch (error) {
    console.error("❌ Diagnosis failed:", error)
    return NextResponse.json(
      {
        error: "Diagnosis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
