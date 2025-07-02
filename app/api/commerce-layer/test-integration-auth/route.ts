import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Testing Commerce Layer Integration App Authentication")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clScope = process.env.COMMERCE_LAYER_SCOPE || `market:${process.env.COMMERCE_LAYER_MARKET_ID}`

    console.log("🔧 Integration App Environment Check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      hasBaseUrl: !!clBaseUrl,
      hasMarketId: !!clMarketId,
      hasScope: !!clScope,
      clientIdPrefix: clClientId?.substring(0, 10) + "...",
      baseUrl: clBaseUrl,
      marketId: clMarketId,
      scope: clScope,
      scopeFormat: clScope?.startsWith("market:") ? "✅ Correct format" : "❌ Will be auto-corrected",
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "Missing Integration app credentials",
          instructions: [
            "Create a new Integration application in Commerce Layer:",
            "",
            "1. Go to Commerce Layer Dashboard > Settings > Applications",
            "2. Click 'New Application'",
            "3. Select 'Integration' as the application type",
            "4. Name: 'ParkPal Integration'",
            "5. Grant Types: ✅ Client Credentials",
            "6. Scopes: Select your market scope",
            "7. Save and copy the credentials",
            "",
            "Then set these environment variables in Vercel:",
            "COMMERCE_LAYER_CLIENT_ID=<integration_client_id>",
            "COMMERCE_LAYER_CLIENT_SECRET=<integration_client_secret>",
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "COMMERCE_LAYER_MARKET_ID=<your_market_id>",
            `COMMERCE_LAYER_SCOPE=market:${clMarketId || "<your_market_id>"}`,
          ],
        },
        { status: 400 },
      )
    }

    // Ensure scope has correct format
    const correctScope = clScope?.startsWith("market:") ? clScope : `market:${clMarketId}`

    // Test Integration app authentication
    console.log("🔑 Testing Integration app token request...")

    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: correctScope,
    }

    console.log("🔑 Token request payload:", {
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

    if (!tokenResponse.ok) {
      let errorDetails = responseText
      try {
        const errorJson = JSON.parse(responseText)
        errorDetails = JSON.stringify(errorJson, null, 2)
      } catch {
        // Keep as text if not JSON
      }

      return NextResponse.json(
        {
          error: "Integration app authentication failed",
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          response: responseText || "Empty response",
          url: `${clBaseUrl}/oauth/token`,
          payload: {
            ...tokenPayload,
            client_secret: "[REDACTED]",
          },
          scopeDetails: {
            original: clScope,
            corrected: correctScope,
            isCorrectFormat: correctScope.startsWith("market:"),
            explanation: "Scope must be in format 'market:<market_id>'",
          },
          troubleshooting: {
            status403: tokenResponse.status === 403 ? "Invalid credentials or app not configured correctly" : null,
            status401: tokenResponse.status === 401 ? "Authentication failed - check client ID and secret" : null,
            status404: tokenResponse.status === 404 ? "Invalid base URL or endpoint" : null,
            emptyResponse: !responseText ? "Empty response suggests request rejected at API gateway" : null,
            scopeIssue: !correctScope.startsWith("market:") ? "Scope format was incorrect (now corrected)" : null,
          },
          nextSteps: [
            "1. Verify you created an 'Integration' app (not Sales Channel)",
            "2. Check that 'Client Credentials' grant type is enabled",
            "3. Verify the client ID and secret are correct",
            "4. Make sure the app has access to your market",
            `5. Ensure scope is set to: market:${clMarketId}`,
            "6. Try creating a completely new Integration app",
          ],
        },
        { status: tokenResponse.status },
      )
    }

    // Parse successful response
    let tokenData: any
    try {
      tokenData = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON response from Commerce Layer",
          rawResponse: responseText,
          parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 500 },
      )
    }

    console.log("✅ Integration app authentication successful!")

    // Test API access with the token
    let apiTest: any = { status: "not_tested" }
    if (tokenData.access_token) {
      try {
        console.log("🧪 Testing API access...")
        const apiResponse = await fetch(`${clBaseUrl}/api/markets`, {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/vnd.api+json",
          },
        })

        if (apiResponse.ok) {
          const apiData = await apiResponse.json()
          apiTest = {
            status: "success",
            marketsFound: apiData.data?.length || 0,
            markets:
              apiData.data?.map((m: any) => ({
                id: m.id,
                name: m.attributes?.name,
              })) || [],
          }
        } else {
          const apiError = await apiResponse.text()
          apiTest = {
            status: "failed",
            error: `HTTP ${apiResponse.status}: ${apiError}`,
          }
        }
      } catch (apiError) {
        apiTest = {
          status: "error",
          error: apiError instanceof Error ? apiError.message : "Unknown error",
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Integration app authentication successful with correct scope format!",
      appType: "Integration",
      tokenResponse: {
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      },
      apiTest,
      scopeDetails: {
        original: clScope,
        corrected: correctScope,
        isCorrectFormat: correctScope.startsWith("market:"),
        explanation: "Scope must be in format 'market:<market_id>'",
        wasFixed: clScope !== correctScope,
      },
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        scope: correctScope,
      },
      integrationAppDetails: {
        appType: "Integration (server-side with full API access)",
        grantType: "client_credentials",
        tokenUrl: `${clBaseUrl}/oauth/token`,
        apiBaseUrl: `${clBaseUrl}/api`,
        scopeUsed: correctScope,
        scopeFormat: "market:<market_id>",
        permissions: "Full API access for server-side operations",
      },
      nextSteps: [
        "✅ Integration app authentication working with correct scope",
        apiTest.status === "success" ? "✅ API access working" : "❌ Check API access",
        "✅ Scope format corrected",
        "✅ Ready to update main payment flow",
        "Now test the payment flow at /test-reserve",
      ],
    })
  } catch (error) {
    console.error("❌ Integration app test failed:", error)
    return NextResponse.json(
      {
        error: "Integration app test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your Commerce Layer Integration app configuration",
      },
      { status: 500 },
    )
  }
}
