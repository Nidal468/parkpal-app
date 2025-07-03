import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debugging Commerce Layer 403 error...")

    // Get all environment variables
    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
    const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID!
    const stockLocationId = process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID!
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL!
    const envScope = process.env.NEXT_PUBLIC_CL_SCOPE

    console.log("📋 Environment variables:")
    console.log("- Client ID:", clientId.substring(0, 20) + "...")
    console.log("- Market ID:", marketId)
    console.log("- Stock Location ID:", stockLocationId)
    console.log("- Base URL:", baseUrl)
    console.log("- Env Scope:", envScope)

    // Test different scope configurations
    const scopeTests = [
      {
        name: "Environment Variable Scope",
        scope: envScope || "market:all",
      },
      {
        name: "Dynamic Market Only",
        scope: `market:id:${marketId}`,
      },
      {
        name: "Dynamic Market + Stock Location",
        scope: `market:id:${marketId} stock_location:id:${stockLocationId}`,
      },
      {
        name: "Market All",
        scope: "market:all",
      },
      {
        name: "No Scope",
        scope: undefined,
      },
    ]

    const results = []

    for (const test of scopeTests) {
      console.log(`\n🧪 Testing scope: ${test.name}`)
      console.log(`📝 Scope value: ${test.scope || "undefined"}`)

      try {
        const payload = {
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          ...(test.scope && { scope: test.scope }),
        }

        console.log("📤 Request payload:", {
          grant_type: payload.grant_type,
          client_id: payload.client_id.substring(0, 20) + "...",
          client_secret: "***",
          scope: payload.scope || "not_included",
        })

        const response = await fetch(`${baseUrl}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        })

        const responseText = await response.text()
        let responseData = null

        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          // Response is not JSON
        }

        const result = {
          testName: test.name,
          scope: test.scope,
          status: response.status,
          success: response.ok,
          responseText: responseText.substring(0, 500),
          hasAccessToken: responseData?.access_token ? true : false,
          errorDetail: responseData?.errors?.[0]?.detail || responseData?.error_description || null,
        }

        console.log(`${response.ok ? "✅" : "❌"} ${test.name}: ${response.status}`)
        if (responseData?.access_token) {
          console.log("🔑 Access token received!")
        }
        if (result.errorDetail) {
          console.log("❌ Error:", result.errorDetail)
        }

        results.push(result)
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error)
        results.push({
          testName: test.name,
          scope: test.scope,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Test with different base URLs in case that's the issue
    const baseUrlTest = {
      provided: baseUrl,
      alternatives: ["https://mr-peat-worldwide.commercelayer.io", "https://auth.commercelayer.io"],
    }

    return NextResponse.json({
      success: results.some((r) => r.success),
      timestamp: new Date().toISOString(),
      environment: {
        clientIdPrefix: clientId.substring(0, 20) + "...",
        marketId,
        stockLocationId,
        baseUrl,
        envScope,
      },
      scopeTests: results,
      baseUrlTest,
      recommendations: [
        "Look for the test that returns success: true",
        "Check if any specific scope format works",
        "Verify your Integration app has the right permissions",
        "Consider if the base URL is correct",
      ],
      nextSteps: results.some((r) => r.success)
        ? ["✅ Found working scope! Use the successful configuration"]
        : ["❌ All scope tests failed - check Integration app permissions in Commerce Layer dashboard"],
    })
  } catch (error) {
    console.error("❌ Debug test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Debug test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
