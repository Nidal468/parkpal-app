import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debug endpoint called")

    // Check environment variables
    const envCheck = {
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      SUPABASE_URL: process.env.SUPABASE_URL ? "✅ Set" : "❌ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Set" : "❌ Missing",

      // Commerce Layer
      COMMERCE_LAYER_CLIENT_ID: process.env.COMMERCE_LAYER_CLIENT_ID ? "✅ Set" : "❌ Missing",
      COMMERCE_LAYER_CLIENT_SECRET: process.env.COMMERCE_LAYER_CLIENT_SECRET ? "✅ Set" : "❌ Missing",
      COMMERCE_LAYER_BASE_URL: process.env.COMMERCE_LAYER_BASE_URL || "❌ Missing",
      COMMERCE_LAYER_MARKET_ID: process.env.COMMERCE_LAYER_MARKET_ID || "❌ Missing",

      // Stripe
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✅ Set" : "❌ Missing",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✅ Set" : "❌ Missing",

      // OpenAI
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Missing",
    }

    console.log("🔍 Environment variables:", envCheck)

    // Test Supabase connection
    let supabaseTest = "❌ Failed"
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase.from("spaces").select("count").limit(1)

        if (!error) {
          supabaseTest = "✅ Connected"
        } else {
          supabaseTest = `❌ Error: ${error.message}`
        }
      } else {
        supabaseTest = "❌ Missing credentials"
      }
    } catch (error) {
      supabaseTest = `❌ Exception: ${error instanceof Error ? error.message : "Unknown error"}`
    }

    const response = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: envCheck,
      supabaseConnection: supabaseTest,
      buildInfo: {
        nextVersion: "15.2.4",
        nodeVersion: process.version,
      },
    }

    console.log("🔍 Debug response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Debug endpoint error:", error)
    return NextResponse.json(
      {
        error: "Debug endpoint failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
