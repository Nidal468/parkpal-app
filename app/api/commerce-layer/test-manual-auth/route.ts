import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Manual Commerce Layer Authentication Test with Sales Channel App")

    // Get environment variables - using correct server-side variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clScope = process.env.COMMERCE_LAYER_SCOPE
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    // Log actual values for debugging
    console.log("🔧 Sales Channel App Environment Values:", {
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
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId || !clScope) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
          missing: {
            clientId: !clClientId,
            clientSecret: !clClientSecret,
            baseUrl: !clBaseUrl,
            marketId: !clMarketId,
            scope: !clScope,
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
            "Update your Vercel environment variables with the new Sales Channel app credentials:",
            "COMMERCE_LAYER_CLIENT_ID=YmPSGJKq4UbXPGPmTE6FMhConHND6gIRyggZHH1bTYo",
            "COMMERCE_LAYER_CLIENT_SECRET=PbCOEFxAiiX1B5PzXiVwQP3NwsPKJYlB5ARz63g7uKY",
            "COMMERCE_LAYER_SCOPE=vjkaZhNPnl",
            "COMMERCE_LAYER_MARKET_ID=vjkaZhNPnl",
            "COMMERCE_LAYER_STOCK_LOCATION_ID=okJbPuNbjk",
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "",
            "REMOVE these security risks:",
            "NEXT_PUBLIC_CL_SCOPE (should be server-side)",
            "NEXT_PUBLIC_CL_STOCK_LOCATION_ID (should be server-side)",
          ],
        },
        { status: 400 },
      )
    }

    // Manual token request with Sales Channel app credentials
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: clScope,
    }

    console.log("🔑 Making token request to:", `${clBaseUrl}/oauth/token`)
    console.log("🔑 With Sales Channel app payload:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
    })
    console.log("🔑 Using scope:", clScope)

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
          scopeUsed: clScope,
          diagnosis: {
            issue: tokenResponse.status === 403 ? "403 Forbidden" : `HTTP ${tokenResponse.status}`,
            meaning:
              tokenResponse.status === 403
                ? "Commerce Layer is rejecting your Sales Channel app credentials or scope"
                : "Authentication request failed",
            possibleCauses: [
              "❌ Environment variables not updated with new Sales Channel app credentials",
              "❌ Client ID is incorrect",
              "❌ Client Secret is incorrect",
              "❌ Sales Channel app doesn't have access to the specified market",
              "❌ Sales Channel app is not configured for 'Client Credentials' grant type",
              "❌ Scope format is incorrect",
            ],
          },
          nextSteps: [
            "1. Update Vercel environment variables with new Sales Channel app credentials",
            "2. Remove NEXT_PUBLIC_CL_* variables (security risk)",
            "3. Add server-side COMMERCE_LAYER_* variables",
            "4. Redeploy your application",
            "5. Test this endpoint again",
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
          scopeUsed: clScope,
          troubleshooting: {
            message: "Sales Channel app authentication failed",
            steps: [
              "1. Verify environment variables are updated with new Sales Channel app credentials",
              "2. Check Commerce Layer Dashboard > Settings > Applications",
              "3. Ensure Sales Channel app has 'Client Credentials' grant type enabled",
              `4. Verify Sales Channel app has access to market: ${clMarketId}`,
              "5. Remove NEXT_PUBLIC_CL_* variables from Vercel (security risk)",
              "6. Redeploy application after updating environment variables",
            ],
          },
        },
        { status: tokenResponse.status },
      )
    }

    console.log("✅ Token obtained successfully with Sales Channel app credentials!")

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
      message: "Commerce Layer Sales Channel app authentication successful!",
      tokenResponse: {
        ...tokenData,
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      },
      marketTest,
      scopeUsed: clScope,
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        scope: clScope,
        stockLocationId: clStockLocationId,
      },
      salesChannelAppDetails: {
        appType: "Sales Channel (with market access assigned via dashboard)",
        grantType: "client_credentials",
        tokenUrl: `${clBaseUrl}/oauth/token`,
        apiBaseUrl: `${clBaseUrl}/api`,
        scopeUsed: clScope,
        marketAccess: "Assigned via Commerce Layer dashboard UI",
        securityNote: "All credentials are server-side only (no NEXT_PUBLIC_ exposure)",
      },
      nextSteps: [
        "✅ Sales Channel app authentication working",
        marketTest.status === "success" ? "✅ Market access working" : "❌ Check market access",
        "✅ All credentials properly secured server-side",
        "✅ Ready to test full payment flow",
        "Now test /test-reserve page",
      ],
    })
  } catch (error) {
    console.error("❌ Sales Channel app auth test failed:", error)
    return NextResponse.json(
      {
        error: "Sales Channel app authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer Sales Channel app credentials and environment variables",
      },
      { status: 500 },
    )
  }
}
