import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Manual Commerce Layer Authentication Test with Integration App")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    // Log actual values for debugging
    console.log("🔧 Environment Values:", {
      clClientId: clClientId ? `${clClientId.substring(0, 10)}...` : "undefined",
      clClientSecret: clClientSecret ? `${clClientSecret.substring(0, 10)}...` : "undefined",
      clBaseUrl,
      clMarketId,
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      clientIdLength: clClientId?.length || 0,
      clientSecretLength: clClientSecret?.length || 0,
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
          },
          instructions: [
            "Update your Vercel environment variables with the new Integration app credentials:",
            "COMMERCE_LAYER_CLIENT_ID=BtPDMCkSk3pEncM7ejudu5laqnAKXcXE97c1ImgHfiI",
            "COMMERCE_LAYER_CLIENT_SECRET=SuunOtYwHB5NuT9QXNxn1bjMs8hFi0vtvnEPxSiGAv4",
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "COMMERCE_LAYER_MARKET_ID=vjkaZhNPnl",
          ],
        },
        { status: 400 },
      )
    }

    // Use the exact scope format specified
    const scope = `market:${clMarketId} stock_location:okJbPuNbjk`

    // Manual token request with Integration app credentials
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: scope,
    }

    console.log("🔑 Making token request to:", `${clBaseUrl}/oauth/token`)
    console.log("🔑 With Integration app payload:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
    })
    console.log("🔑 Using scope:", scope)

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
          scopeUsed: scope,
          diagnosis: {
            issue: tokenResponse.status === 403 ? "403 Forbidden" : `HTTP ${tokenResponse.status}`,
            meaning:
              tokenResponse.status === 403
                ? "Commerce Layer is rejecting your Integration app credentials or scope"
                : "Authentication request failed",
            possibleCauses: [
              "❌ Environment variables not updated with new Integration app credentials",
              "❌ Client ID is incorrect",
              "❌ Client Secret is incorrect",
              "❌ Integration app doesn't have access to the specified market",
              "❌ Integration app doesn't have access to the specified stock location",
              "❌ Integration app is not configured for 'Client Credentials' grant type",
            ],
          },
          nextSteps: [
            "1. Update Vercel environment variables with new Integration app credentials",
            "2. Redeploy your application",
            "3. Test this endpoint again",
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
          scopeUsed: scope,
          troubleshooting: {
            message: "Integration app authentication failed",
            steps: [
              "1. Verify environment variables are updated with new Integration app credentials",
              "2. Check Commerce Layer Dashboard > Settings > Applications",
              "3. Ensure Integration app has 'Client Credentials' grant type enabled",
              `4. Verify Integration app has access to market: ${clMarketId}`,
              "5. Verify Integration app has access to stock location: okJbPuNbjk",
              "6. Redeploy application after updating environment variables",
            ],
          },
        },
        { status: tokenResponse.status },
      )
    }

    console.log("✅ Token obtained successfully with Integration app credentials!")

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
      message: "Commerce Layer Integration app authentication successful!",
      tokenResponse: {
        ...tokenData,
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      },
      marketTest,
      scopeUsed: scope,
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: "okJbPuNbjk",
      },
      integrationAppDetails: {
        appType: "Integration (confidential client)",
        grantType: "client_credentials",
        tokenUrl: `${clBaseUrl}/oauth/token`,
        apiBaseUrl: `${clBaseUrl}/api`,
      },
      nextSteps: [
        "✅ Integration app authentication working",
        marketTest.status === "success" ? "✅ Market access working" : "❌ Check market access",
        "✅ Ready to test full payment flow",
        "Now test /test-reserve page",
      ],
    })
  } catch (error) {
    console.error("❌ Integration app auth test failed:", error)
    return NextResponse.json(
      {
        error: "Integration app authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer Integration app credentials and environment variables",
      },
      { status: 500 },
    )
  }
}
