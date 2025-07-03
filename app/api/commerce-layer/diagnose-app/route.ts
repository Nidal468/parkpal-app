import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 Diagnosing Commerce Layer Application Configuration")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

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
          "Create a new Integration application in Commerce Layer:",
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
        ],
      })
    }

    // Test different authentication approaches
    const results = []

    // Test 1: Current credentials with centralized function
    console.log("🧪 Test 1: Current credentials with centralized function")
    try {
      const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      results.push({
        test: "Centralized Authentication Function",
        status: 200,
        success: true,
        response: "Token obtained successfully",
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : "missing",
      })
    } catch (error) {
      results.push({
        test: "Centralized Authentication Function",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 2: Try without scope (some apps don't need it)
    console.log("🧪 Test 2: Without scope")
    try {
      const tokenUrl = "https://auth.commercelayer.io/oauth/token"
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
        scopeUsed: "none",
      })
    } catch (error) {
      results.push({
        test: "No Scope Authentication",
        status: "error",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        scopeUsed: "none",
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
      },
      testResults: results,
      analysis: {
        allTestsFailed: allFailed,
        hasSuccessfulTest: !!successfulTest,
        successfulTest: successfulTest?.test || null,
        usingCentralizedFunction: true,
        commonIssues: [
          "403 Forbidden usually means the app credentials are invalid",
          "Empty response body suggests the request is being rejected at the API gateway level",
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
            "✅ Using centralized authentication function",
            "✅ Scope format corrected and duplicates removed",
            "Update your main authentication code to use this approach.",
          ],
      nextSteps: [
        "1. Create a new Integration application in Commerce Layer",
        "2. Update environment variables with Integration app credentials",
        "3. Redeploy your application",
        "4. Test /api/commerce-layer/test-manual-auth again",
        "5. All authentication now uses centralized function!",
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
