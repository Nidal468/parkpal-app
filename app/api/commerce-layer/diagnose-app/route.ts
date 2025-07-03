import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
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
        hasBaseUrl: !!clBaseUrl,
        hasMarketId: !!clMarketId,
        hasStockLocationId: !!clStockLocationId,
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId,
      },
      tests: {
        authentication: { status: "pending", details: null },
        marketAccess: { status: "pending", details: null },
        stockLocationAccess: { status: "pending", details: null },
      },
    }

    // Test 1: Authentication
    try {
      if (!clClientId || !clClientSecret || !clMarketId) {
        throw new Error("Missing required credentials")
      }

      const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      diagnosis.tests.authentication = {
        status: "success",
        details: "Access token obtained successfully",
      }

      // Test 2: Market Access
      const apiBase = `${clBaseUrl}/api`
      const marketResponse = await fetch(`${apiBase}/markets/${clMarketId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (marketResponse.ok) {
        const marketData = await marketResponse.json()
        diagnosis.tests.marketAccess = {
          status: "success",
          details: {
            name: marketData.data.attributes.name,
            currency: marketData.data.attributes.currency_code,
            id: marketData.data.id,
          },
        }
      } else {
        const errorText = await marketResponse.text()
        diagnosis.tests.marketAccess = {
          status: "failed",
          details: `Market access failed: ${marketResponse.status} ${errorText}`,
        }
      }

      // Test 3: Stock Location Access (if configured)
      if (clStockLocationId) {
        const stockLocationResponse = await fetch(`${apiBase}/stock_locations/${clStockLocationId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (stockLocationResponse.ok) {
          const stockLocationData = await stockLocationResponse.json()
          diagnosis.tests.stockLocationAccess = {
            status: "success",
            details: {
              name: stockLocationData.data.attributes.name,
              id: stockLocationData.data.id,
            },
          }
        } else {
          const errorText = await stockLocationResponse.text()
          diagnosis.tests.stockLocationAccess = {
            status: "failed",
            details: `Stock location access failed: ${stockLocationResponse.status} ${errorText}`,
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

    const overallStatus = Object.values(diagnosis.tests).every(
      (test) => test.status === "success" || test.status === "skipped",
    )

    return NextResponse.json({
      success: overallStatus,
      diagnosis,
      summary: {
        authentication: diagnosis.tests.authentication.status,
        marketAccess: diagnosis.tests.marketAccess.status,
        stockLocationAccess: diagnosis.tests.stockLocationAccess.status,
      },
    })
  } catch (error) {
    console.error("❌ App diagnosis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Diagnosis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
