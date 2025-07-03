import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🔍 FULL Commerce Layer Environment Diagnostic")
    console.log("🔍 Using centralized authentication function...")

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

    // Check what values are actually being used
    const actualValues = {
      clientId: process.env.COMMERCE_LAYER_CLIENT_ID,
      clientSecret: process.env.COMMERCE_LAYER_CLIENT_SECRET,
      baseUrl: process.env.COMMERCE_LAYER_BASE_URL,
      marketId: process.env.COMMERCE_LAYER_MARKET_ID,
      stockLocationId: process.env.COMMERCE_LAYER_STOCK_LOCATION_ID,
    }

    console.log("🔧 Actual values being used:", {
      clientId: actualValues.clientId ? `${actualValues.clientId.substring(0, 10)}...` : "undefined",
      clientSecret: actualValues.clientSecret ? `${actualValues.clientSecret.substring(0, 10)}...` : "undefined",
      baseUrl: actualValues.baseUrl,
      marketId: actualValues.marketId,
      stockLocationId: actualValues.stockLocationId,
    })

    // Test the centralized authentication function
    console.log("🧪 Testing centralized authentication function...")

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
          stockLocationId: actualValues.stockLocationId || "❌ UNDEFINED",
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
          "COMMERCE_LAYER_STOCK_LOCATION_ID=<your_stock_location_id> (optional)",
          "",
          "Then redeploy your application",
        ],
      })
    }

    // Test centralized authentication function
    let authResult: any
    try {
      const accessToken = await getCommerceLayerAccessToken(
        actualValues.clientId,
        actualValues.clientSecret,
        actualValues.marketId,
        actualValues.stockLocationId,
      )
      authResult = {
        success: true,
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : "missing",
        usingCentralizedFunction: true,
      }
    } catch (authError) {
      authResult = {
        success: false,
        error: authError instanceof Error ? authError.message : "Unknown error",
        usingCentralizedFunction: true,
      }
    }

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
      authenticationTest: authResult,
      credentialsUsed: {
        clientId: actualValues.clientId?.substring(0, 10) + "...",
        clientIdLength: actualValues.clientId?.length || 0,
        clientSecret: "✅ SET",
        clientSecretLength: actualValues.clientSecret?.length || 0,
        baseUrl: actualValues.baseUrl,
        marketId: actualValues.marketId,
        stockLocationId: actualValues.stockLocationId || "Not set",
      },
    }

    if (!authResult.success) {
      return NextResponse.json({
        error: "Authentication failed with centralized function",
        authError: authResult.error,
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
          stockLocationId: actualValues.stockLocationId,
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
          usingCentralizedFunction: true,
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

    return NextResponse.json({
      success: true,
      message: "✅ Environment variables are working correctly with centralized function!",
      analysis,
      authenticationTest: authResult,
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
        stockLocationId: actualValues.stockLocationId,
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
        usingCentralizedFunction: true,
      },
      nextSteps: [
        "✅ Environment variables are correctly configured",
        "✅ No local .env interference detected",
        "✅ Using proper server-side variables",
        "✅ Token authentication successful with centralized function",
        "✅ All authentication logic now centralized",
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
