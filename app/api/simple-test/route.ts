import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test environment variables
    const envTest = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!(process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      commerceLayerClientId: !!(process.env.COMMERCE_LAYER_CLIENT_ID || process.env.NEXT_PUBLIC_CL_CLIENT_ID),
      commerceLayerClientSecret: !!(
        process.env.COMMERCE_LAYER_CLIENT_SECRET || process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
      ),
      commerceLayerBaseUrl: !!process.env.COMMERCE_LAYER_BASE_URL,
      commerceLayerMarketId: !!process.env.NEXT_PUBLIC_CL_MARKET_ID,
    }

    // Test Supabase connection
    const supabaseTest = { success: false, error: null, spacesCount: 0 }
    try {
      if (envTest.supabaseUrl && envTest.supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
        )

        const { data, error } = await supabase.from("spaces").select("id").limit(1)

        if (error) {
          supabaseTest.error = error.message
        } else {
          supabaseTest.success = true
          supabaseTest.spacesCount = data?.length || 0
        }
      }
    } catch (error) {
      supabaseTest.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Test Commerce Layer auth
    const commerceLayerTest = { success: false, error: null, hasToken: false }
    try {
      if (envTest.commerceLayerClientId && envTest.commerceLayerClientSecret && envTest.commerceLayerBaseUrl) {
        const authResponse = await fetch(`${process.env.COMMERCE_LAYER_BASE_URL}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: process.env.COMMERCE_LAYER_CLIENT_ID || process.env.NEXT_PUBLIC_CL_CLIENT_ID,
            client_secret: process.env.COMMERCE_LAYER_CLIENT_SECRET || process.env.NEXT_PUBLIC_CL_CLIENT_SECRET,
            scope: process.env.COMMERCE_LAYER_SCOPE || process.env.NEXT_PUBLIC_CL_SCOPE,
          }),
        })

        if (authResponse.ok) {
          const authData = await authResponse.json()
          commerceLayerTest.success = true
          commerceLayerTest.hasToken = !!authData.access_token
        } else {
          const errorText = await authResponse.text()
          commerceLayerTest.error = `${authResponse.status}: ${errorText}`
        }
      }
    } catch (error) {
      commerceLayerTest.error = error instanceof Error ? error.message : "Unknown error"
    }

    return NextResponse.json({
      success: envTest.supabaseUrl && envTest.supabaseKey && supabaseTest.success && commerceLayerTest.success,
      timestamp: new Date().toISOString(),
      tests: {
        environment: envTest,
        supabase: supabaseTest,
        commerceLayer: commerceLayerTest,
      },
      hardcodedSpaceIds: {
        HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
        DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
        MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
      },
      nextSteps: [
        "If environment test fails, check your environment variables",
        "If Supabase test fails, check your database connection",
        "If Commerce Layer test fails, check your API credentials",
        "All tests must pass before running the full test suite",
      ],
    })
  } catch (error) {
    console.error("Simple test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
