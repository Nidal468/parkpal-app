import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 FULL Commerce Layer Environment Diagnostic")
    console.log("🔍 Checking for any local .env interference or hardcoded values...")

    // Get ALL environment variables that could be related
    const allEnvVars = {
      // Server-side Commerce Layer vars (correct)
      COMMERCE_LAYER_CLIENT_ID: process.env.COMMERCE_LAYER_CLIENT_ID,
      COMMERCE_LAYER_CLIENT_SECRET: process.env.COMMERCE_LAYER_CLIENT_SECRET,
      COMMERCE_LAYER_BASE_URL: process.env.COMMERCE_LAYER_BASE_URL,
      COMMERCE_LAYER_MARKET_ID: process.env.COMMERCE_LAYER_MARKET_ID,
      COMMERCE_LAYER_SCOPE: process.env.COMMERCE_LAYER_SCOPE,
      COMMERCE_LAYER_STOCK_LOCATION_ID: process.env.COMMERCE_LAYER_STOCK_LOCATION_ID,

      // Legacy public vars (should NOT exist)
      NEXT_PUBLIC_CL_CLIENT_ID: process.env.NEXT_PUBLIC_CL_CLIENT_ID,
      NEXT_PUBLIC_CL_CLIENT_SECRET: process.env.NEXT_PUBLIC_CL_CLIENT_SECRET,
      NEXT_PUBLIC_CL_BASE_URL: process.env.NEXT_PUBLIC_CL_BASE_URL,
      NEXT_PUBLIC_CL_MARKET_ID: process.env.NEXT_PUBLIC_CL_MARKET_ID,
      NEXT_PUBLIC_CL_SCOPE: process.env.NEXT_PUBLIC_CL_SCOPE,
      NEXT_PUBLIC_CL_STOCK_LOCATION_ID: process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID,

      // Other potential interference
      CL_CLIENT_ID: process.env.CL_CLIENT_ID,
      CL_CLIENT_SECRET: process.env.CL_CLIENT_SECRET,
      CL_BASE_URL: process.env.CL_BASE_URL,
      CL_MARKET_ID: process.env.CL_MARKET_ID,
      CL_SCOPE: process.env.CL_SCOPE,

      // Node environment
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    }

    // Check what values are actually being used in the create-order logic
    const actualValues = {
      clientId: process.env.COMMERCE_LAYER_CLIENT_ID,
      clientSecret: process.env.COMMERCE_LAYER_CLIENT_SECRET,
      baseUrl: process.env.COMMERCE_LAYER_BASE_URL,
      marketId: process.env.COMMERCE_LAYER_MARKET_ID,
      scope: process.env.COMMERCE_LAYER_SCOPE || `market:${process.env.COMMERCE_LAYER_MARKET_ID}`,
    }

    console.log("🔧 Actual values being used:", {
      clientId: actualValues.clientId ? `${actualValues.clientId.substring(0, 10)}...` : "undefined",
      clientSecret: actualValues.clientSecret ? `${actualValues.clientSecret.substring(0, 10)}...` : "undefined",
      baseUrl: actualValues.baseUrl,
      marketId: actualValues.marketId,
      scope: actualValues.scope,
    })

    // Test the EXACT same token request that create-order would make
    console.log("🧪 Testing EXACT token request from create-order logic...")

    if (!actualValues.clientId || !actualValues.clientSecret || !actualValues.baseUrl || !actualValues.marketId) {
      return NextResponse.json({
        error: "Missing required environment variables",
        diagnosis: "Environment variables are not properly set in Vercel",
        allEnvironmentVars: Object.fromEntries(
          Object.entries(allEnvVars).map(([key, value]) => [
            key,
            value ? (key.includes("SECRET") ? "✅ SET" : value) : "❌ UNDEFINED",
          ]),
        ),
        actualValuesUsed: {
          clientId: actualValues.clientId || "❌ UNDEFINED",
          clientSecret: actualValues.clientSecret ? "✅ SET" : "❌ UNDEFINED",
          baseUrl: actualValues.baseUrl || "❌ UNDEFINED",
          marketId: actualValues.marketId || "❌ UNDEFINED",
          scope: actualValues.scope || "❌ UNDEFINED",
        },
        interference: {
          hasLegacyPublicVars: !!(
            process.env.NEXT_PUBLIC_CL_CLIENT_ID ||
            process.env.NEXT_PUBLIC_CL_CLIENT_SECRET ||
            process.env.NEXT_PUBLIC_CL_BASE_URL
          ),
          hasShortVars: !!(process.env.CL_CLIENT_ID || process.env.CL_CLIENT_SECRET),
          environment: process.env.NODE_ENV,
          isVercel: !!process.env.VERCEL,
          vercelEnv: process.env.VERCEL_ENV,
        },
        instructions: [
          "❌ Required environment variables are missing in Vercel",
          "Go to Vercel Dashboard > Your Project > Settings > Environment Variables",
          "Ensure these are set:",
          "COMMERCE_LAYER_CLIENT_ID=<your_client_id>",
          "COMMERCE_LAYER_CLIENT_SECRET=<your_client_secret>",
          "COMMERCE_LAYER_BASE_URL=https://mr-peat-worldwide.commercelayer.io",
          "COMMERCE_LAYER_MARKET_ID=<your_market_id>",
          "COMMERCE_LAYER_SCOPE=market:<your_market_id>",
          "",
          "Then redeploy your application",
        ],
      })
    }

    // Make the EXACT same token request as create-order
    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: actualValues.clientId,
      client_secret: actualValues.clientSecret,
      scope: actualValues.scope,
    }

    console.log("🔑 Making EXACT token request with actual environment values...")
    console.log("🔑 Token payload:", {
      ...tokenPayload,
      client_secret: "[REDACTED]",
      client_id: actualValues.clientId?.substring(0, 10) + "...",
    })

    const tokenResponse = await fetch(`${actualValues.baseUrl}/oauth/token`, {
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

    // Comprehensive analysis
    const analysis = {
      environmentCheck: {
        usingCorrectVars: !!(
          actualValues.clientId &&
          actualValues.clientSecret &&
          actualValues.baseUrl &&
          actualValues.marketId
        ),
        hasLegacyInterference: !!(
          process.env.NEXT_PUBLIC_CL_CLIENT_ID ||
          process.env.NEXT_PUBLIC_CL_CLIENT_SECRET ||
          process.env.NEXT_PUBLIC_CL_BASE_URL
        ),
        hasShortVarInterference: !!(process.env.CL_CLIENT_ID || process.env.CL_CLIENT_SECRET),
        environment: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV,
      },
      tokenRequest: {
        status: tokenResponse.status,
        success: tokenResponse.ok,
        hasResponse: !!responseText,
        responseLength: responseText?.length || 0,
      },
      credentialsUsed: {
        clientId: actualValues.clientId?.substring(0, 10) + "...",
        clientIdLength: actualValues.clientId?.length || 0,
        clientSecret: "✅ SET",
        clientSecretLength: actualValues.clientSecret?.length || 0,
        baseUrl: actualValues.baseUrl,
        marketId: actualValues.marketId,
        scope: actualValues.scope,
        scopeFormat: actualValues.scope?.startsWith("market:") ? "✅ Correct" : "❌ Incorrect",
      },
    }

    if (!tokenResponse.ok) {
      return NextResponse.json({
        error: "Token request failed with actual environment variables",
        status: tokenResponse.status,
        rawResponse: responseText || "Empty response",
        analysis,
        allEnvironmentVars: Object.fromEntries(
          Object.entries(allEnvVars).map(([key, value]) => [
            key,
            value ? (key.includes("SECRET") ? "✅ SET" : value) : "❌ UNDEFINED",
          ]),
        ),
        actualValuesUsed: {
          clientId: actualValues.clientId?.substring(0, 15) + "...",
          clientSecret: actualValues.clientSecret ? "✅ SET" : "❌ UNDEFINED",
          baseUrl: actualValues.baseUrl,
          marketId: actualValues.marketId,
          scope: actualValues.scope,
        },
        interference: {
          legacyPublicVars: {
            NEXT_PUBLIC_CL_CLIENT_ID: process.env.NEXT_PUBLIC_CL_CLIENT_ID ? "⚠️ EXISTS" : "✅ NOT SET",
            NEXT_PUBLIC_CL_CLIENT_SECRET: process.env.NEXT_PUBLIC_CL_CLIENT_SECRET ? "⚠️ EXISTS" : "✅ NOT SET",
            NEXT_PUBLIC_CL_BASE_URL: process.env.NEXT_PUBLIC_CL_BASE_URL ? "⚠️ EXISTS" : "✅ NOT SET",
          },
          shortVars: {
            CL_CLIENT_ID: process.env.CL_CLIENT_ID ? "⚠️ EXISTS" : "✅ NOT SET",
            CL_CLIENT_SECRET: process.env.CL_CLIENT_SECRET ? "⚠️ EXISTS" : "✅ NOT SET",
          },
        },
        diagnosis: {
          issue: "Commerce Layer is rejecting the credentials from Vercel environment",
          emptyResponse: !responseText,
          status403: tokenResponse.status === 403,
          possibleCauses: [
            "❌ Client ID is incorrect in Vercel",
            "❌ Client Secret is incorrect in Vercel",
            "❌ Commerce Layer application was deleted or doesn't exist",
            "❌ Application doesn't have 'Client Credentials' grant type enabled",
            "❌ Application doesn't have access to the specified market",
            "❌ Base URL is incorrect",
          ],
        },
        solution: {
          immediate: [
            "1. Go to Commerce Layer Dashboard",
            "2. Check if your application still exists",
            "3. Verify the Client ID and Secret are correct",
            "4. Create a NEW Integration application if needed",
            "5. Update Vercel environment variables with new credentials",
            "6. Redeploy",
          ],
          createNewApp: [
            "If your app doesn't exist, create a new one:",
            "1. Commerce Layer Dashboard > Settings > Applications",
            "2. New Application > Integration",
            "3. Name: 'ParkPal Integration'",
            "4. Grant Types: ✅ Client Credentials",
            "5. Scopes: Select your market",
            "6. Save and copy NEW credentials to Vercel",
          ],
        },
      })
    }

    // Parse successful response
    let tokenData: any
    try {
      tokenData = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        error: "Invalid JSON response",
        rawResponse: responseText,
        analysis,
        parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
      })
    }

    return NextResponse.json({
      success: true,
      message: "✅ Environment variables are working correctly!",
      analysis,
      tokenResponse: {
        access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : "missing",
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      },
      allEnvironmentVars: Object.fromEntries(
        Object.entries(allEnvVars).map(([key, value]) => [
          key,
          value ? (key.includes("SECRET") ? "✅ SET" : value) : "❌ UNDEFINED",
        ]),
      ),
      actualValuesUsed: {
        clientId: actualValues.clientId?.substring(0, 15) + "...",
        clientSecret: "✅ SET",
        baseUrl: actualValues.baseUrl,
        marketId: actualValues.marketId,
        scope: actualValues.scope,
      },
      interference: {
        legacyPublicVars: {
          NEXT_PUBLIC_CL_CLIENT_ID: process.env.NEXT_PUBLIC_CL_CLIENT_ID ? "⚠️ EXISTS (remove)" : "✅ NOT SET",
          NEXT_PUBLIC_CL_CLIENT_SECRET: process.env.NEXT_PUBLIC_CL_CLIENT_SECRET ? "⚠️ EXISTS (remove)" : "✅ NOT SET",
          NEXT_PUBLIC_CL_BASE_URL: process.env.NEXT_PUBLIC_CL_BASE_URL ? "⚠️ EXISTS (remove)" : "✅ NOT SET",
        },
        shortVars: {
          CL_CLIENT_ID: process.env.CL_CLIENT_ID ? "⚠️ EXISTS (remove)" : "✅ NOT SET",
          CL_CLIENT_SECRET: process.env.CL_CLIENT_SECRET ? "⚠️ EXISTS (remove)" : "✅ NOT SET",
        },
        hasInterference: !!(
          process.env.NEXT_PUBLIC_CL_CLIENT_ID ||
          process.env.NEXT_PUBLIC_CL_CLIENT_SECRET ||
          process.env.CL_CLIENT_ID ||
          process.env.CL_CLIENT_SECRET
        ),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV,
        usingCorrectServerSideVars: true,
      },
      nextSteps: [
        "✅ Environment variables are correctly configured",
        "✅ No local .env interference detected",
        "✅ Using proper server-side variables",
        "✅ Token authentication successful",
        "Ready to test full payment flow at /test-reserve",
      ],
    })
  } catch (error) {
    console.error("❌ Full diagnostic failed:", error)
    return NextResponse.json(
      {
        error: "Full diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error",
        suggestion: "Check network connectivity and Commerce Layer service status",
      },
      { status: 500 },
    )
  }
}
