import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug endpoint called")

    // Test Supabase connection
    const { data: testData, error: testError } = await supabaseServer.from("messages").select("count").limit(1)

    if (testError) {
      console.error("Supabase connection error:", testError)
      return NextResponse.json({
        status: "error",
        message: "Supabase connection failed",
        error: testError.message,
      })
    }

    // Test message insertion
    const testMessage = {
      content: `Debug test message - ${new Date().toISOString()}`,
      role: "user",
      created_at: new Date().toISOString(),
    }

    const { data: insertData, error: insertError } = await supabaseServer
      .from("messages")
      .insert([testMessage])
      .select()
      .single()

    if (insertError) {
      console.error("Message insertion error:", insertError)
      return NextResponse.json({
        status: "error",
        message: "Message insertion failed",
        error: insertError.message,
      })
    }

    // Get recent messages
    const { data: recentMessages, error: fetchError } = await supabaseServer
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (fetchError) {
      console.error("Message fetch error:", fetchError)
      return NextResponse.json({
        status: "error",
        message: "Message fetch failed",
        error: fetchError.message,
      })
    }

    return NextResponse.json({
      status: "success",
      message: "All tests passed",
      data: {
        supabaseConnection: "OK",
        messageInsertion: "OK",
        insertedMessage: insertData,
        recentMessages: recentMessages,
        messageCount: recentMessages.length,
      },
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({
      status: "error",
      message: "Debug endpoint failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
