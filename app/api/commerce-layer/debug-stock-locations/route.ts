import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debugging Commerce Layer Stock Locations")

    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

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
        },
        { status: 400 },
      )
    }

    // First, try to get a token with ONLY market scope
    console.log("🔑 Step 1: Getting token with ONLY market scope...")
    const marketOnlyScope = `market:${clMarketId}`

    const tokenPayload = {
      grant_type: "client_credentials",
      client_id: clClientId,
      client_secret: clClientSecret,
      scope: marketOnlyScope,
    }

    console.log("🔑 Token request with market-only scope:", {
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

    console.log("🔑 Market-only token response status:", tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Market-only token failed:", tokenResponse.status, errorText)
      return NextResponse.json(
        {
          error: "Failed to get market-only token",
          status: tokenResponse.status,
          response: errorText,
          message: "Your application doesn't have access to the market. Check your Commerce Layer dashboard.",
        },
        { status: 500 },
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    console.log("✅ Market-only token obtained successfully")

    // Step 2: List all stock locations available to this market
    console.log("📦 Step 2: Fetching all stock locations...")

    const stockLocationsResponse = await fetch(`${clBaseUrl}/api/stock_locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    })

    console.log("📦 Stock locations response status:", stockLocationsResponse.status)

    if (!stockLocationsResponse.ok) {
      const errorText = await stockLocationsResponse.text()
      console.error("❌ Stock locations fetch failed:", stockLocationsResponse.status, errorText)
      return NextResponse.json(
        {
          error: "Failed to fetch stock locations",
          status: stockLocationsResponse.status,
          response: errorText,
          message: "Could not retrieve stock locations from Commerce Layer",
        },
        { status: 500 },
      )
    }

    const stockLocationsData = await stockLocationsResponse.json()
    console.log("📦 Stock locations data:", JSON.stringify(stockLocationsData, null, 2))

    // Step 3: Test each stock location scope
    const stockLocationTests: any[] = []

    if (stockLocationsData.data && Array.isArray(stockLocationsData.data)) {
      console.log(`🧪 Step 3: Testing ${stockLocationsData.data.length} stock locations...`)

      for (const stockLocation of stockLocationsData.data) {
        const stockLocationId = stockLocation.id
        const stockLocationName = stockLocation.attributes?.name || "Unknown"

        console.log(`🧪 Testing stock location: ${stockLocationName} (${stockLocationId})`)

        try {
          // Test token with this stock location
          const testScope = `market:${clMarketId} stock_location:${stockLocationId}`
          const testTokenPayload = {
            grant_type: "client_credentials",
            client_id: clClientId,
            client_secret: clClientSecret,
            scope: testScope,
          }

          const testTokenResponse = await fetch(`${clBaseUrl}/oauth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(testTokenPayload),
          })

          const testResult = {
            id: stockLocationId,
            name: stockLocationName,
            scope: testScope,
            success: testTokenResponse.ok,
            status: testTokenResponse.status,
          }

          if (testTokenResponse.ok) {
            console.log(`✅ Stock location ${stockLocationName} (${stockLocationId}) - SUCCESS`)
            testResult.message = "✅ This stock location works!"
          } else {
            const errorText = await testTokenResponse.text()
            console.log(
              `❌ Stock location ${stockLocationName} (${stockLocationId}) - FAILED: ${testTokenResponse.status}`,
            )
            testResult.message = `❌ Failed: ${testTokenResponse.status}`
            testResult.error = errorText
          }

          stockLocationTests.push(testResult)
        } catch (testError) {
          console.error(`❌ Error testing stock location ${stockLocationId}:`, testError)
          stockLocationTests.push({
            id: stockLocationId,
            name: stockLocationName,
            success: false,
            error: testError instanceof Error ? testError.message : "Unknown error",
          })
        }
      }
    }

    // Find working stock locations
    const workingStockLocations = stockLocationTests.filter((test) => test.success)

    return NextResponse.json({
      success: true,
      message: "Stock location debugging complete",
      marketScope: marketOnlyScope,
      marketAccess: "✅ Working",
      totalStockLocations: stockLocationsData.data?.length || 0,
      stockLocations:
        stockLocationsData.data?.map((sl: any) => ({
          id: sl.id,
          name: sl.attributes?.name || "Unknown",
          code: sl.attributes?.code || "No code",
        })) || [],
      stockLocationTests,
      workingStockLocations,
      recommendation:
        workingStockLocations.length > 0
          ? {
              message: `✅ Found ${workingStockLocations.length} working stock location(s)`,
              useThisScope: workingStockLocations[0]?.scope,
              stockLocationId: workingStockLocations[0]?.id,
              stockLocationName: workingStockLocations[0]?.name,
            }
          : {
              message: "❌ No working stock locations found",
              suggestion: "Check your Commerce Layer application permissions",
            },
      nextSteps:
        workingStockLocations.length > 0
          ? [
              `1. Use stock location ID: ${workingStockLocations[0]?.id}`,
              `2. Update your code to use scope: ${workingStockLocations[0]?.scope}`,
              "3. Test the payment flow again",
            ]
          : [
              "1. Go to Commerce Layer Dashboard > Settings > Applications",
              "2. Edit your application",
              "3. Ensure it has access to at least one stock location",
              "4. Try this debug endpoint again",
            ],
    })
  } catch (error) {
    console.error("❌ Stock location debugging failed:", error)
    return NextResponse.json(
      {
        error: "Stock location debugging failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
