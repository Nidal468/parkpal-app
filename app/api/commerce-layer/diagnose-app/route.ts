import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Diagnosing Commerce Layer Application Configuration")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    // Create correct scope format
    const clScope = clStockLocationId
      ? `market:id:${clMarketId} stock_location:id:${clStockLocationId}`
      : `market:id:${clMarketId}`

    console.log("🔧 Environment Check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      hasBaseUrl: !!clBaseUrl,
      hasMarketId: !!clMarketId,
      hasStockLocationId: !!clStockLocationId,
      clientIdLength: clClientId?.length || 0,
      clientSecretLength: clClientSecret?.length || 0,
      baseUrl: clBaseUrl,
      marketId: clMarketId,
      stockLocationId: clStockLocationId,
      scope: clScope,
      scopeFormat: clScope?.includes("market:id:") ? "✅ Correct format" : "❌ Incorrect format",
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json({
        error: "Missing required environment variables",
        missing: {
          clientId: !clClientId,
          clientSecret: !clClientSecret,
          baseUrl: !clBaseUrl,
          marketId: !clMarketId,
        },
        instructions: [
          "The 403 error suggests your Commerce Layer app configuration is incorrect.",
          "Let's try a different approach:",
          "",
          "1. Go to Commerce Layer Dashboard > Settings > Applications",
          "2. DELETE the current app (it's not working)",
          "3. Create a NEW 'Integration' application instead:",
          "   - Name: 'ParkPal Integration'",
          "   - Role: Integration",
          "   - Grant Types: ✅ Client Credentials",
          "   - Scopes: Select your market scope",
          "",
          "4. Copy the NEW credentials and update Vercel:",
          "   COMMERCE_LAYER_CLIENT_ID=<new_client_id>",
          "   COMMERCE_LAYER_CLIENT_SECRET=<new_client_secret>",
          `   COMMERCE_LAYER_MARKET_ID=${clMarketId || "<your_market_id>"}`,
          "   COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
          "   COMMERCE_LAYER_STOCK_LOCATION_ID=<your_stock_location_id> (optional)",
          "",
          "Scope will auto-generate as:",
          `market:id:${clMarketId || "<your_market_id>"}`,
        ],
      })
    }

    // Use correct global auth endpoint
    const tokenUrl = "https://auth.commercelayer.io/oauth/token"

    // Test different authentication approaches
    const results = []

    // Test 1: Current credentials with corrected endpoint and scope
    console.log("🧪 Test 1: Current credentials with corrected endpoint and scope")
    try {
      const test1Response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clClientId,
          client_secret: clClientSecret,
          scope: clScope,
        }),
      })

      const test1Text = await test1Response.text()
      results.push({
        test: "Corrected Endpoint + Scope Authentication",
        status: test1Response.status,
        success: test1Response.ok,
        response: test1Text || "Empty response",
        headers: Object.fromEntries(test1Response.headers.entries()),
        endpointUsed: tokenUrl,
        scopeUsed: clScope,
      })
    } catch (error) {
      results.push({
        test: "Corrected Endpoint + Scope Authentication",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        endpointUsed: tokenUrl,
        scopeUsed: clScope,
      })
    }

    // Test 2: Try without scope (some apps don't need it)
    console.log("🧪 Test 2: Without scope")
    try {
      const test2Response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clClientId,
          client_secret: clClientSecret,
        }),
      })

      const test2Text = await test2Response.text()
      results.push({
        test: "No Scope Authentication",
        status: test2Response.status,
        success: test2Response.ok,
        response: test2Text || "Empty response",
        headers: Object.fromEntries(test2Response.headers.entries()),
        endpointUsed: tokenUrl,
        scopeUsed: "none",
      })
    } catch (error) {
      results.push({
        test: "No Scope Authentication",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        endpointUsed: tokenUrl,
        scopeUsed: "none",
      })
    }

    // Test 3: Try with different content type
    console.log("🧪 Test 3: Form-encoded request with correct endpoint and scope")
    try {
      const params = new URLSearchParams()
      params.append("grant_type", "client_credentials")
      params.append("client_id", clClientId)
      params.append("client_secret", clClientSecret)
      params.append("scope", clScope)

      const test3Response = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      })

      const test3Text = await test3Response.text()
      results.push({
        test: "Form-Encoded Authentication with Correct Endpoint + Scope",
        status: test3Response.status,
        success: test3Response.ok,
        response: test3Text || "Empty response",
        headers: Object.fromEntries(test3Response.headers.entries()),
        endpointUsed: tokenUrl,
        scopeUsed: clScope,
      })
    } catch (error) {
      results.push({
        test: "Form-Encoded Authentication with Correct Endpoint + Scope",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        endpointUsed: tokenUrl,
        scopeUsed: clScope,
      })
    }

    // Analyze results
    const successfulTest = results.find((r) => r.success)
    const allFailed = results.every((r) => !r.success)

    return NextResponse.json({
      diagnosis: "Commerce Layer Application Configuration Analysis",
      currentCredentials: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "Not set",
        scope: clScope,
        scopeFormat: clScope.includes("market:id:") ? "✅ Correct" : "❌ Incorrect",
      },
      endpointCorrection: {
        correctEndpoint: tokenUrl,
        explanation: "Using global auth endpoint instead of organization-specific endpoint",
      },
      scopeCorrection: {
        used: clScope,
        explanation: "Scope format: market:id:<market_id> [stock_location:id:<stock_location_id>]",
        isCorrectFormat: clScope.includes("market:id:"),
        hasStockLocation: !!clStockLocationId,
      },
      testResults: results,
      analysis: {
        allTestsFailed: allFailed,
        hasSuccessfulTest: !!successfulTest,
        successfulTest: successfulTest?.test || null,
        commonIssues: [
          "403 Forbidden usually means the app credentials are invalid",
          "Empty response body suggests the request is being rejected at the API gateway level",
          "Incorrect endpoint URL was a common cause (now fixed)",
          "Incorrect scope format was a common cause (now fixed)",
          "This often happens when the app type or configuration is incorrect",
        ],
      },
      recommendations: allFailed
        ? [
            "🚨 ALL authentication tests failed - your app configuration is still incorrect",
            "",
            "SOLUTION: Create a new Integration app in Commerce Layer:",
            "1. Go to Commerce Layer Dashboard > Settings > Applications",
            "2. Click 'New Application'",
            "3. Choose 'Integration' (NOT Sales Channel)",
            "4. Name: 'ParkPal Integration'",
            "5. Grant Types: ✅ Client Credentials",
            "6. Scopes: Select your market (usually the market ID)",
            "7. Save and copy the NEW credentials",
            "",
            "Then update your Vercel environment variables:",
            "COMMERCE_LAYER_CLIENT_ID=<new_integration_client_id>",
            "COMMERCE_LAYER_CLIENT_SECRET=<new_integration_client_secret>",
            `COMMERCE_LAYER_MARKET_ID=${clMarketId}`,
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "COMMERCE_LAYER_STOCK_LOCATION_ID=<your_stock_location_id> (optional)",
            "",
            "Integration apps have broader permissions and work better for server-side operations.",
          ]
        : [
            `✅ Found working authentication method: ${successfulTest?.test}`,
            `✅ Endpoint corrected to: ${tokenUrl}`,
            `✅ Scope format corrected to: ${clScope}`,
            "Update your main authentication code to use this approach.",
          ],
      nextSteps: [
        "1. Create a new Integration application in Commerce Layer",
        "2. Update environment variables with Integration app credentials",
        "3. Redeploy your application",
        "4. Test /api/commerce-layer/test-manual-auth again",
      ],
    })
  } catch (error) {
    console.error("❌ Diagnosis failed:", error)
    return NextResponse.json(
      {
        error: "Diagnosis failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer base URL and network connectivity",
      },
      { status: 500 },
    )
  }
}
