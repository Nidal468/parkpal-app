import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  try {
    console.log("🔍 Testing Supabase connection...")

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabaseServer
      .from("messages")
      .select("count")
      .limit(1)

    if (connectionError) {
      console.error("❌ Connection test failed:", connectionError)
      return NextResponse.json({
        status: "error",
        message: "Failed to connect to Supabase",
        error: connectionError,
        env_check: {
          SUPABASE_URL: !!process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        },
      })
    }

    // Test message insertion
    console.log("💾 Testing message insertion...")
    const testMessage = {
      user_message: "Test message from debug endpoint",
      bot_response: "Test response from debug endpoint",
      created_at: new Date().toISOString(),
    }

    const { data: insertData, error: insertError } = await supabaseServer.from("messages").insert(testMessage).select()

    if (insertError) {
      console.error("❌ Insert test failed:", insertError)
      return NextResponse.json({
        status: "error",
        message: "Failed to insert test message",
        error: insertError,
        connection_ok: true,
      })
    }

    // Get recent messages
    const { data: recentMessages, error: selectError } = await supabaseServer
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    console.log("✅ Debug test completed successfully")

    return NextResponse.json({
      status: "success",
      message: "Supabase connection and operations working correctly",
      test_insert: insertData,
      recent_messages: recentMessages,
      total_messages: recentMessages?.length || 0,
      env_check: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    console.error("💥 Debug endpoint error:", error)
    return NextResponse.json({
      status: "error",
      message: "Debug endpoint failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
