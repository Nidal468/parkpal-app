import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Verifying New Commerce Layer Integration Setup")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clScope = process.env.COMMERCE_LAYER_SCOPE || `market:${process.env.COMMERCE_LAYER_MARKET_ID}`

    console.log("🔧 New Setup Environment Check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      hasBaseUrl: !!clBaseUrl,
      hasMarketId: !!clMarketId,
      hasScope: !!clScope,
      clientIdPrefix: clClientId?.substring(0, 10) + "...",
      baseUrl: clBaseUrl,
      marketId: clMarketId,
      scope: clScope,
      scopeFormat: clScope?.startsWith("market:") ? "✅ Correct" : "❌ Incorrect",
    })

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      return NextResponse.json(
        {
          error: "New Integration app not properly configured",
          missing: {
            clientId: !clClientId,
            clientSecret: !clClientSecret,
            baseUrl: !clBaseUrl,
            marketId: !clMarketId,
          },
          instructions: [
            "❌ New Integration application environment variables are missing",
            "",
            "Please ensure you've set these in Vercel:",
            "COMMERCE_LAYER_CLIENT_ID=<new_integration_client_id>",
            "COMMERCE_LAYER_CLIENT_SECRET=<new_integration_client_secret>",
            "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
            "COMMERCE_LAYER_MARKET_ID=<your_market_id>",
            "COMMERCE_LAYER_SCOPE=market:<your_market_id>",
            "",
            "Then redeploy your application and try again.",
          ],
          nextSteps: [
            "1. Go to /api/commerce-layer/create-new-app-guide for detailed instructions",
            "2. Create a new Integration application in Commerce Layer",
            "3. Update Vercel environment variables",
            "4. Redeploy and test again",
          ],
        },
        { status: 400 },
      )
    }

    // Ensure scope has correct format
    const correctScope = clScope?.startsWith("market:") ? clScope : `market:${clMarketId}`

    // Test new Integration app authentication
    console.log("🔑 Testing new Integration app authentication...")

    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: correctScope,
    }

    console.log("🔑 Token request with new credentials:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
      client_id: clClientId?.substring(0, 10) + "...",
    })

    const tokenResponse = await fetch(`${clBaseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(tokenPayload),
    })

    console.log("🔑 New app token response status:", tokenResponse.status)
    console.log("🔑 New app token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    const responseText = await tokenResponse.text()
    console.log("🔑 New app raw token response:", responseText)

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
          error: "New Integration app authentication failed",
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          response: responseText || "Empty response",
          url: `${clBaseUrl}/oauth/token`,
          payload: {
            ...tokenPayload,
            client_secret: "[REDACTED]",
          },
          newCredentials: {
            clientId: clClientId?.substring(0, 15) + "...",
            clientSecret: "✅ SET",
            baseUrl: clBaseUrl,
            marketId: clMarketId,
            scope: correctScope,
          },
          diagnosis: {
            stillFailing: true,
            possibleCauses: [
              "❌ New Integration app credentials are still incorrect",
              "❌ Integration app wasn't created properly",
              "❌ Integration app doesn't have Client Credentials grant type",
              "❌ Integration app doesn't have access to the market",
              "❌ Market ID is incorrect",
              "❌ Base URL is wrong",
            ],
          },
          troubleshooting: [
            "1. Double-check you created an 'Integration' application (not Sales Channel)",
            "2. Verify 'Client Credentials' grant type is enabled in the app",
            "3. Ensure the app has access to your market",
            "4. Confirm you copied the Client ID and Secret correctly",
            "5. Check that your market ID is correct",
            "6. Try creating a completely new Integration application",
          ],
          nextSteps: [
            "1. Go back to Commerce Layer Dashboard",
            "2. Verify your Integration application configuration",
            "3. Create a new Integration app if needed",
            "4. Double-check all environment variables in Vercel",
            "5. Redeploy and test again",
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
          error: "Invalid JSON response from new Integration app",
          rawResponse: responseText,
          parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 500 },
      )
    }

    console.log("✅ New Integration app authentication successful!")

    // Test API access with the new token
    const apiTests = []

    // Test 1: Markets access
    try {
      console.log("🧪 Testing markets API access...")
      const marketsResponse = await fetch(`${clBaseUrl}/api/markets`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (marketsResponse.ok) {
        const marketsData = await marketsResponse.json()
        apiTests.push({
          test: "Markets API",
          status: "success",
          marketsFound: marketsData.data?.length || 0,
          markets:
            marketsData.data?.map((m: any) => ({
              id: m.id,
              name: m.attributes?.name,
            })) || [],
        })
      } else {
        const marketsError = await marketsResponse.text()
        apiTests.push({
          test: "Markets API",
          status: "failed",
          error: `HTTP ${marketsResponse.status}: ${marketsError}`,
        })
      }
    } catch (marketsError) {
      apiTests.push({
        test: "Markets API",
        status: "error",
        error: marketsError instanceof Error ? marketsError.message : "Unknown error",
      })
    }

    // Test 2: Specific market access
    try {
      console.log("🧪 Testing specific market access...")
      const marketResponse = await fetch(`${clBaseUrl}/api/markets/${clMarketId}`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (marketResponse.ok) {
        const marketData = await marketResponse.json()
        apiTests.push({
          test: "Specific Market Access",
          status: "success",
          marketId: marketData.data?.id,
          marketName: marketData.data?.attributes?.name,
        })
      } else {
        const marketError = await marketResponse.text()
        apiTests.push({
          test: "Specific Market Access",
          status: "failed",
          error: `HTTP ${marketResponse.status}: ${marketError}`,
        })
      }
    } catch (marketError) {
      apiTests.push({
        test: "Specific Market Access",
        status: "error",
        error: marketError instanceof Error ? marketError.message : "Unknown error",
      })
    }

    // Test 3: SKUs access (for order creation)
    try {
      console.log("🧪 Testing SKUs API access...")
      const skusResponse = await fetch(`${clBaseUrl}/api/skus?page[size]=5`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.api+json",
        },
      })

      if (skusResponse.ok) {
        const skusData = await skusResponse.json()
        apiTests.push({
          test: "SKUs API",
          status: "success",
          skusFound: skusData.data?.length || 0,
          sampleSkus:
            skusData.data?.slice(0, 3).map((s: any) => ({
              code: s.attributes?.code,
              name: s.attributes?.name,
            })) || [],
        })
      } else {
        const skusError = await skusResponse.text()
        apiTests.push({
          test: "SKUs API",
          status: "failed",
          error: `HTTP ${skusResponse.status}: ${skusError}`,
        })
      }
    } catch (skusError) {
      apiTests.push({
        test: "SKUs API",
        status: "error",
        error: skusError instanceof Error ? skusError.message : "Unknown error",
      })
    }

    const allTestsPassed = apiTests.every((test) => test.status === "success")

    return NextResponse.json({
      success: true,
      message: "🎉 New Integration application setup verified successfully!",
      authentication: {
        status: "success",
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        accessToken: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
      },
      newCredentials: {
        clientId: clClientId?.substring(0, 15) + "...",
        clientSecret: "✅ SET",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        scope: correctScope,
        scopeFormat: correctScope.startsWith("market:") ? "✅ Correct" : "❌ Incorrect",
      },
      apiTests,
      overallStatus: {
        authenticationWorking: true,
        apiAccessWorking: allTestsPassed,
        readyForPayments: allTestsPassed,
      },
      integrationAppDetails: {
        appType: "Integration (full API access)",
        grantType: "client_credentials",
        tokenUrl: `${clBaseUrl}/oauth/token`,
        apiBaseUrl: `${clBaseUrl}/api`,
        scopeUsed: correctScope,
        permissions: "Full server-side API access for payment processing",
      },
      nextSteps: allTestsPassed
        ? [
            "✅ New Integration application working perfectly!",
            "✅ Authentication successful",
            "✅ API access verified",
            "✅ Ready for payment processing",
            "",
            "🚀 Next: Test the full payment flow at /test-reserve",
          ]
        : [
            "⚠️ Authentication working but some API tests failed",
            "Check the apiTests results above",
            "Verify your Integration app has proper permissions",
            "Contact Commerce Layer support if issues persist",
          ],
      celebration: allTestsPassed
        ? "🎉 Congratulations! Your new Commerce Layer Integration application is working perfectly!"
        : "⚠️ Authentication works but some API access issues remain",
    })
  } catch (error) {
    console.error("❌ New setup verification failed:", error)
    return NextResponse.json(
      {
        error: "New setup verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check your new Integration app configuration and try again",
      },
      { status: 500 },
    )
  }
}
