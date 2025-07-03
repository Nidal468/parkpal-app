import { NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function GET() {
  try {
    console.log("🧪 Testing Commerce Layer Integration App Authentication")

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    console.log("🔧 Integration App Environment Check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      hasBaseUrl: !!clBaseUrl,
      hasMarketId: !!clMarketId,
      hasStockLocationId: !!clStockLocationId,
      clientIdPrefix: clClientId?.substring(0, 10) + "...",
      baseUrl: clBaseUrl,
      marketId: clMarketId,
      stockLocationId: clStockLocationId,
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
            "COMMERCE_LAYER_STOCK_LOCATION_ID=<your_stock_location_id> (optional)",
          ],
        },
        { status: 400 },
      )
    }

    // Test Integration app authentication using centralized function
    let accessToken: string
    try {
      console.log("🔑 Testing Integration app token request using centralized function...")
      accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)
      console.log("✅ Integration app authentication successful using centralized function!")
    } catch (tokenError) {
      console.error("❌ Integration app authentication failed:", tokenError)
      return NextResponse.json(
        {
          error: "Integration app authentication failed",
          details: tokenError instanceof Error ? tokenError.message : "Unknown authentication error",
          troubleshooting: {
            possibleCauses: [
              "❌ Client ID is incorrect",
              "❌ Client Secret is incorrect",
              "❌ Application doesn't have access to the specified market",
              "❌ Application is not configured for 'Client Credentials' grant type",
              "❌ Market ID is incorrect",
              "❌ Stock Location ID is incorrect (if used)",
            ],
          },
          nextSteps: [
            "1. Verify you created an 'Integration' app (not Sales Channel)",
            "2. Check that 'Client Credentials' grant type is enabled",
            "3. Verify the client ID and secret are correct",
            "4. Make sure the app has access to your market",
            `5. Ensure market ID is correct: ${clMarketId}`,
            clStockLocationId ? `6. Verify stock location exists: ${clStockLocationId}` : "6. Stock location not used",
            "7. Try creating a completely new Integration app",
          ],
        },
        { status: 500 },
      )
    }

    // Test API access with the token
    let apiTest: any = { status: "not_tested" }
    if (accessToken) {
      try {
        console.log("🧪 Testing API access...")
        const apiResponse = await fetch(`${clBaseUrl}/api/markets`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
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
      message: "Integration app authentication successful using centralized function!",
      appType: "Integration",
      tokenResponse: {
        access_token: accessToken ? `${accessToken.substring(0, 20)}...` : "missing",
        token_type: "Bearer",
      },
      apiTest,
      environmentCheck: {
        clientId: clClientId?.substring(0, 10) + "...",
        clientSecret: "✅ Set",
        baseUrl: clBaseUrl,
        marketId: clMarketId,
        stockLocationId: clStockLocationId || "Not set",
      },
      integrationAppDetails: {
        appType: "Integration (server-side with full API access)",
        grantType: "client_credentials",
        tokenUrl: "https://auth.commercelayer.io/oauth/token",
        apiBaseUrl: `${clBaseUrl}/api`,
        permissions: "Full API access for server-side operations",
        usingCentralizedFunction: true,
      },
      nextSteps: [
        "✅ Integration app authentication working with centralized function",
        apiTest.status === "success" ? "✅ API access working" : "❌ Check API access",
        "✅ Using centralized authentication function",
        "✅ Scope format corrected and duplicates removed",
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
