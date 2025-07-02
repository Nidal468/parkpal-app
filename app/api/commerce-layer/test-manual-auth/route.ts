import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Manual Commerce Layer Authentication Test with Correct Endpoint and Scope Format")

    // Get environment variables - using correct server-side variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    // Create correct scope format - FIXED: Ensure no duplicate prefixes
    const clScope = clStockLocationId
      ? `market:id:${clMarketId} stock_location:id:${clStockLocationId}`
      : `market:id:${clMarketId}`

    // Log actual values for debugging
    console.log("🔧 Environment Values with Correct Endpoint and Scope:", {
      clClientId: clClientId ? `${clClientId.substring(0, 10)}...` : "undefined",
      clClientSecret: clClientSecret ? `${clClientSecret.substring(0, 10)}...` : "undefined",
      clBaseUrl,
      clMarketId,
      clStockLocationId,
      clScope,
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      clientIdLength: clClientId?.length || 0,
      clientSecretLength: clClientSecret?.length || 0,
      scopeFormat: clScope?.includes("market:id:") ? "✅ Correct format" : "❌ Incorrect format",
      scopeCheck: {
        marketPart: `market:id:${clMarketId}`,
        stockLocationPart: clStockLocationId ? `stock_location:id:${clStockLocationId}` : "not_used",
        combined: clScope,
        noDuplicates: !clScope.includes("stock_location:id:stock_location:id:"),
      },
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
          missing: {
            clientId: !clClientId,
            clientSecret: !clClientSecret,
            baseUrl: !clBaseUrl,
            marketId: !clMarketId,
          },
          actualValues: {
            clientId: clClientId || "undefined",
            clientSecret: clClientSecret ? "set" : "undefined",
            baseUrl: clBaseUrl || "undefined",
            marketId: clMarketId || "undefined",
            scope: clScope || "undefined",
            stockLocationId: clStockLocationId || "undefined",
          },
          instructions: [
            "Update your Vercel environment variables:",
            "COMMERCE_LAYER_CLIENT_ID=<your_client_id>",
            "COMMERCE_LAYER_CLIENT_SECRET=<your_client_secret>",
            "COMMERCE_LAYER_MARKET_ID=<your_market_id>",
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "COMMERCE_LAYER_STOCK_LOCATION_ID=<your_stock_location_id> (optional)",
            "",
            "Scope will auto-generate as:",
            `market:id:${clMarketId || "<your_market_id>"}`,
            "OR with stock location:",
            `market:id:${clMarketId || "<your_market_id>"} stock_location:id:${clStockLocationId || "<your_stock_location_id>"}`,
          ],
        },
        { status: 400 },
      )
    }

    // Use correct global auth endpoint
    const tokenUrl = "https://auth.commercelayer.io/oauth/token"

    // Manual token request with correct endpoint and scope format
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: clScope,
    }

    console.log("🔑 Making token request to CORRECT endpoint:", tokenUrl)
    console.log("🔑 With FIXED scope payload:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
    })
    console.log("🔑 Using FIXED scope (no duplicates):", clScope)

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenPayload),
    })

    console.log("🔑 Token response status:", tokenResponse.status)
    console.log("🔑 Token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    const responseText = await tokenResponse.text()
    console.log("🔑 Raw token response:", responseText)

    let tokenData: any
    try {
      tokenData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("❌ Failed to parse token response as JSON:", parseError)
      return NextResponse.json(
        {
          error: "Invalid JSON response from Commerce Layer",
          status: tokenResponse.status,
          rawResponse: responseText,
          url: tokenUrl,
          payload: {
            ...tokenPayload,
            client_secret: "[REDACTED]",
          },
          scopeUsed: clScope,
          endpointUsed: tokenUrl,
          scopeFormat: {
            used: clScope,
            explanation: "Scope format: market:id:<market_id> [stock_location:id:<stock_location_id>]",
            isCorrectFormat: clScope?.includes("market:id:"),
            noDuplicates: !clScope.includes("stock_location:id:stock_location:id:"),
          },
          diagnosis: {
            issue: tokenResponse.status === 403 ? "403 Forbidden" : `HTTP ${tokenResponse.status}`,
            meaning:
              tokenResponse.status === 403
                ? "Commerce Layer is rejecting your credentials or scope"
                : "Authentication request failed",
            possibleCauses: [
              "❌ Client ID is incorrect",
              "❌ Client Secret is incorrect",
              "❌ Application doesn't have access to the specified market",
              "❌ Application is not configured for 'Client Credentials' grant type",
              "❌ Market ID is incorrect",
              "❌ Stock Location ID is incorrect (if used)",
              "❌ Scope format had duplicates (now fixed)",
            ],
          },
          nextSteps: [
            "1. Verify your Commerce Layer application credentials",
            "2. Check that your app has 'Client Credentials' grant type enabled",
            "3. Ensure your app has access to the specified market",
            "4. Verify market ID and stock location ID are correct",
            "5. Try creating a new Integration application if issues persist",
          ],
        },
        { status: 500 },
      )
    }

    if (!tokenResponse.ok) {
      console.error("❌ Token request failed:", tokenResponse.status, tokenData)
      return NextResponse.json(
        {
          error: "Commerce Layer authentication failed",
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          commerceLayerError: tokenData,
          url: tokenUrl,
          payload: {
            ...tokenPayload,
            client_secret: "[REDACTED]",
          },
          scopeUsed: clScope,
          endpointUsed: tokenUrl,
          scopeFormat: {
            used: clScope,
            explanation: "Scope format: market:id:<market_id> [stock_location:id:<stock_location_id>]",
            isCorrectFormat: clScope?.includes("market:id:"),
            noDuplicates: !clScope.includes("stock_location:id:stock_location:id:"),
            fixed: "Removed duplicate prefixes in scope",
          },
          troubleshooting: {
            message: "Authentication failed with correct endpoint and FIXED scope format",
            steps: [
              "1. Verify environment variables are correct",
              "2. Check Commerce Layer Dashboard > Settings > Applications",
              "3. Ensure app has 'Client Credentials' grant type enabled",
              `4. Verify app has access to market: ${clMarketId}`,
              clStockLocationId
                ? `5. Verify stock location exists: ${clStockLocationId}`
                : "5. Stock location not used",
              "6. Try creating a new Integration application",
              "7. Redeploy application after updating environment variables",
            ],
          },
        },
        { status: tokenResponse.status },
      )
    }

    console.log("✅ Token obtained successfully with correct endpoint and FIXED scope format!")

    // Test market access
    let marketTest: any = { status: "not_tested" }
    if (tokenData.access_token) {
      try {
        console.log("🏪 Testing market access...")
        const marketResponse = await fetch(`${clBaseUrl}/api/markets/${clMarketId}`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (marketResponse.ok) {
          const marketData = await marketResponse.json()
          marketTest = {
            status: "success",
            marketName: marketData.data?.attributes?.name || "Unknown",
            marketId: marketData.data?.id || clMarketId,
          }
          console.log("✅ Market access successful:", marketTest)
        } else {
          const marketError = await marketResponse.text()
          marketTest = {
            status: "failed",
            error: `HTTP ${marketResponse.status}: ${marketError}`,
          }
          console.error("❌ Market access failed:", marketTest)
        }
      } catch (marketError) {
        marketTest = {
          status: "error",
          error: marketError instanceof Error ? marketError.message : "Unknown error",
        }
        console.error("❌ Market test error:", marketTest)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Commerce Layer authentication successful with correct endpoint and FIXED scope format!",
      tokenResponse: {
        ...tokenData,
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      },
      marketTest,
      endpointUsed: tokenUrl,
      scopeDetails: {
        used: clScope,
        explanation: "Scope format: market:id:<market_id> [stock_location:id:<stock_location_id>]",
        isCorrectFormat: clScope?.includes("market:id:"),
        hasStockLocation: !!clStockLocationId,
        noDuplicates: !clScope.includes("stock_location:id:stock_location:id:"),
        fixed: "Removed duplicate prefixes that were causing 400 Bad Request",
      },
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "Not set",
        scope: clScope,
      },
      applicationDetails: {
        grantType: "client_credentials",
        tokenUrl: tokenUrl,
        apiBaseUrl: `${clBaseUrl}/api`,
        scopeUsed: clScope,
        scopeFormat: "market:id:<market_id> [stock_location:id:<stock_location_id>]",
        securityNote: "All credentials are server-side only (no NEXT_PUBLIC_ exposure)",
        bugFixed: "Removed duplicate 'stock_location:id:' prefix that was causing scope errors",
      },
      nextSteps: [
        "✅ Authentication working with correct endpoint and FIXED scope format",
        marketTest.status === "success" ? "✅ Market access working" : "❌ Check market access",
        "✅ All credentials properly secured server-side",
        "✅ Scope format bug fixed (no more duplicates)",
        "✅ Ready to test full payment flow",
        "Now test /test-reserve page",
      ],
    })
  } catch (error) {
    console.error("❌ Auth test failed:", error)
    return NextResponse.json(
      {
        error: "Authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer application credentials and environment variables",
      },
      { status: 500 },
    )
  }
}
