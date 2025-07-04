import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔬 Deep debugging Commerce Layer authentication...")

    const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
    const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
    const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID!
    const stockLocationId = process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID!
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL!

    const diagnostics = {
      credentialValidation: {},
      baseUrlTests: [],
      authEndpointTests: [],
      detailedErrorAnalysis: {},
    }

    // 1. Validate credential format
    console.log("🔍 Validating credential formats...")
    diagnostics.credentialValidation = {
      clientIdLength: clientId.length,
      clientIdFormat: /^[A-Za-z0-9_-]+$/.test(clientId),
      clientSecretLength: clientSecret.length,
      clientSecretFormat: /^[A-Za-z0-9_-]+$/.test(clientSecret),
      marketIdLength: marketId.length,
      marketIdFormat: /^[A-Za-z0-9]+$/.test(marketId),
      stockLocationIdLength: stockLocationId.length,
      stockLocationIdFormat: /^[A-Za-z0-9]+$/.test(stockLocationId),
    }

    // 2. Test different base URLs
    console.log("🌐 Testing different base URLs...")
    const baseUrls = [
      "https://mr-peat-worldwide.commercelayer.io",
      "https://auth.commercelayer.io",
      baseUrl, // User's configured URL
    ]

    for (const testBaseUrl of baseUrls) {
      try {
        console.log(`🧪 Testing base URL: ${testBaseUrl}`)

        const response = await fetch(`${testBaseUrl}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: clientId,
            client_secret: clientSecret,
            scope: `market:id:${marketId}`,
          }),
        })

        const responseText = await response.text()
        let responseData = null

        try {
          responseData = JSON.parse(responseText)
        } catch (e) {
          // Not JSON
        }

        diagnostics.baseUrlTests.push({
          url: testBaseUrl,
          status: response.status,
          success: response.ok,
          responseLength: responseText.length,
          hasJsonResponse: !!responseData,
          errorType: responseData?.error || "unknown",
          errorDescription: responseData?.error_description || null,
          headers: Object.fromEntries(response.headers.entries()),
        })

        console.log(`${response.ok ? "✅" : "❌"} ${testBaseUrl}: ${response.status}`)
      } catch (error) {
        diagnostics.baseUrlTests.push({
          url: testBaseUrl,
          success: false,
          error: error instanceof Error ? error.message : "Network error",
        })
      }
    }

    // 3. Test auth endpoint accessibility
    console.log("🔐 Testing auth endpoint accessibility...")
    const authEndpoints = [`${baseUrl}/oauth/token`, `${baseUrl}/api/oauth/token`, `${baseUrl}/auth/token`]

    for (const endpoint of authEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: ${endpoint}`)

        // First, test if endpoint exists with a simple GET
        const getResponse = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        })

        // Then test with POST (actual auth request)
        const postResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: "test",
            client_secret: "test",
          }),
        })

        const postResponseText = await postResponse.text()

        diagnostics.authEndpointTests.push({
          endpoint,
          getStatus: getResponse.status,
          postStatus: postResponse.status,
          postResponseLength: postResponseText.length,
          postResponsePreview: postResponseText.substring(0, 200),
          accessible: getResponse.status !== 404 && postResponse.status !== 404,
        })

        console.log(`📍 ${endpoint}: GET ${getResponse.status}, POST ${postResponse.status}`)
      } catch (error) {
        diagnostics.authEndpointTests.push({
          endpoint,
          error: error instanceof Error ? error.message : "Network error",
          accessible: false,
        })
      }
    }

    // 4. Detailed error analysis with real credentials
    console.log("🔬 Detailed error analysis...")
    try {
      const response = await fetch(`${baseUrl}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "ParkPal-Debug/1.0",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: `market:id:${marketId}`,
        }),
      })

      const responseText = await response.text()
      const responseHeaders = Object.fromEntries(response.headers.entries())

      let responseData = null
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        // Not JSON
      }

      diagnostics.detailedErrorAnalysis = {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        responseText: responseText,
        responseData: responseData,
        isJson: !!responseData,
        contentType: responseHeaders["content-type"],
        serverHeader: responseHeaders["server"],
        corsHeaders: {
          accessControlAllowOrigin: responseHeaders["access-control-allow-origin"],
          accessControlAllowMethods: responseHeaders["access-control-allow-methods"],
        },
      }
    } catch (error) {
      diagnostics.detailedErrorAnalysis = {
        error: error instanceof Error ? error.message : "Network error",
        stack: error instanceof Error ? error.stack : null,
      }
    }

    // Analysis and recommendations
    const analysis = {
      likelyIssues: [],
      recommendations: [],
    }

    // Analyze results
    if (diagnostics.baseUrlTests.every((test) => test.status === 403)) {
      analysis.likelyIssues.push("All base URLs return 403 - credential issue")
    }

    if (diagnostics.credentialValidation.clientIdLength < 10) {
      analysis.likelyIssues.push("Client ID seems too short")
    }

    if (diagnostics.credentialValidation.clientSecretLength < 20) {
      analysis.likelyIssues.push("Client Secret seems too short")
    }

    if (!diagnostics.authEndpointTests.some((test) => test.accessible)) {
      analysis.likelyIssues.push("Auth endpoints not accessible")
    }

    // Recommendations
    analysis.recommendations = [
      "Check Commerce Layer dashboard for correct Integration app credentials",
      "Verify the Integration app has 'Full Access' permissions",
      "Ensure Market ID and Stock Location ID exist in your Commerce Layer organization",
      "Try creating a new Integration application with full permissions",
      "Check if your Commerce Layer organization is active and not suspended",
    ]

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      diagnostics,
      analysis,
      environment: {
        clientIdPrefix: clientId.substring(0, 20) + "...",
        clientSecretPrefix: clientSecret.substring(0, 10) + "...",
        marketId,
        stockLocationId,
        baseUrl,
      },
    })
  } catch (error) {
    console.error("❌ Deep debug failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Deep debug failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
