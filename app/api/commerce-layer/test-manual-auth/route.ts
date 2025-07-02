import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Manual Commerce Layer Authentication Test with Correct Scope Format")

    // Get environment variables - using correct server-side variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clScope = process.env.COMMERCE_LAYER_SCOPE || `market:${process.env.COMMERCE_LAYER_MARKET_ID}`
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    // Log actual values for debugging
    console.log("🔧 Environment Values with Correct Scope:", {
      clClientId: clClientId ? `${clClientId.substring(0, 10)}...` : "undefined",
      clClientSecret: clClientSecret ? `${clClientSecret.substring(0, 10)}...` : "undefined",
      clBaseUrl,
      clMarketId,
      clScope,
      clStockLocationId,
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      clientIdLength: clClientId?.length || 0,
      clientSecretLength: clClientSecret?.length || 0,
      scopeFormat: clScope?.startsWith("market:") ? "✅ Correct format" : "❌ Missing 'market:' prefix",
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
            "",
            "For scope, either set:",
            `COMMERCE_LAYER_SCOPE=market:${clMarketId || "<your_market_id>"}`,
            "OR leave it unset and it will auto-generate from COMMERCE_LAYER_MARKET_ID",
          ],
        },
        { status: 400 },
      )
    }

    // Ensure scope has correct format
    const correctScope = clScope?.startsWith("market:") ? clScope : `market:${clMarketId}`

    // Manual token request with correct scope format
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: correctScope,
    }

    console.log("🔑 Making token request to:", `${clBaseUrl}/oauth/token`)
    console.log("🔑 With correct scope payload:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
    })
    console.log("🔑 Using corrected scope:", correctScope)

    const tokenResponse = await fetch(`${clBaseUrl}/oauth/token`, {
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
          url: `${clBaseUrl}/oauth/token`,
          payload: {
            ...tokenPayload,
            client_secret: "[REDACTED]",
          },
          scopeUsed: correctScope,
          scopeFormat: {
            original: clScope,
            corrected: correctScope,
            isCorrectFormat: correctScope.startsWith("market:"),
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
              "❌ Scope format was incorrect (now fixed to use 'market:' prefix)",
            ],
          },
          nextSteps: [
            "1. Verify your Commerce Layer application credentials",
            "2. Check that your app has 'Client Credentials' grant type enabled",
            "3. Ensure your app has access to the specified market",
            "4. Try creating a new Integration application if issues persist",
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
          url: `${clBaseUrl}/oauth/token`,
          payload: {
            ...tokenPayload,
            client_secret: "[REDACTED]",
          },
          scopeUsed: correctScope,
          scopeFormat: {
            original: clScope,
            corrected: correctScope,
            isCorrectFormat: correctScope.startsWith("market:"),
            explanation: "Scope must be in format 'market:<market_id>'",
          },
          troubleshooting: {
            message: "Authentication failed with correct scope format",
            steps: [
              "1. Verify environment variables are correct",
              "2. Check Commerce Layer Dashboard > Settings > Applications",
              "3. Ensure app has 'Client Credentials' grant type enabled",
              `4. Verify app has access to market: ${clMarketId}`,
              "5. Try creating a new Integration application",
              "6. Redeploy application after updating environment variables",
            ],
          },
        },
        { status: tokenResponse.status },
      )
    }

    console.log("✅ Token obtained successfully with correct scope format!")

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
      message: "Commerce Layer authentication successful with correct scope format!",
      tokenResponse: {
        ...tokenData,
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      },
      marketTest,
      scopeDetails: {
        original: clScope,
        corrected: correctScope,
        isCorrectFormat: correctScope.startsWith("market:"),
        explanation: "Scope must be in format 'market:<market_id>'",
      },
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        scope: correctScope,
        stockLocationId: clStockLocationId,
      },
      applicationDetails: {
        grantType: "client_credentials",
        tokenUrl: `${clBaseUrl}/oauth/token`,
        apiBaseUrl: `${clBaseUrl}/api`,
        scopeUsed: correctScope,
        scopeFormat: "market:<market_id>",
        securityNote: "All credentials are server-side only (no NEXT_PUBLIC_ exposure)",
      },
      nextSteps: [
        "✅ Authentication working with correct scope format",
        marketTest.status === "success" ? "✅ Market access working" : "❌ Check market access",
        "✅ All credentials properly secured server-side",
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
