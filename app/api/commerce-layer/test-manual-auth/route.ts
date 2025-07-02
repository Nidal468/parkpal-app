import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Manual Commerce Layer Authentication Test")

    // Get environment variables exactly as ChatGPT suggested
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    // Log actual values as ChatGPT suggested
    console.log("🔧 Raw Environment Values:", {
      clClientId,
      clClientSecret: clClientSecret ? `${clClientSecret.substring(0, 10)}...` : "undefined",
      clBaseUrl,
      clMarketId,
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
        },
        { status: 400 },
      )
    }

    // Manual token request exactly as ChatGPT suggested
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: `market:${clMarketId}`,
    }

    console.log("🔑 Making manual token request to:", `${clBaseUrl}/oauth/token`)
    console.log("🔑 With payload:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
    })

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
          troubleshooting: {
            message: "Check your Commerce Layer dashboard:",
            steps: [
              "1. Go to Settings > Applications",
              "2. Find your integration app",
              "3. Verify Client ID matches your environment variable",
              "4. Regenerate Client Secret if needed",
              "5. Ensure app has 'Client Credentials' grant type",
              `6. Verify app has access to market: ${clMarketId}`,
              "7. Check if app has correct scopes/permissions",
            ],
          },
        },
        { status: tokenResponse.status },
      )
    }

    console.log("✅ Token obtained successfully!")

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
      message: "Commerce Layer authentication successful!",
      tokenResponse: {
        ...tokenData,
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
      },
      marketTest,
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
      },
      nextSteps: [
        "✅ Authentication working",
        marketTest.status === "success" ? "✅ Market access working" : "❌ Check market access",
        "Now test the full create-order flow",
      ],
    })
  } catch (error) {
    console.error("❌ Manual auth test failed:", error)
    return NextResponse.json(
      {
        error: "Manual authentication test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer credentials in the dashboard",
      },
      { status: 500 },
    )
  }
}
