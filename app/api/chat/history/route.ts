import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const { data: messages, error } = await supabaseServer
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })
    }

    // Convert to chat format
    const chatHistory =
      messages
        ?.flatMap((msg) => [
          {
            role: "user" as const,
            content: msg.user_message,
            timestamp: new Date(msg.created_at).toLocaleTimeString(),
          },
          {
            role: "assistant" as const,
            content: msg.bot_response,
            timestamp: new Date(msg.created_at).toLocaleTimeString(),
          },
        ])
        .reverse() || []

    return NextResponse.json({ messages: chatHistory })
  } catch (error) {
    console.error("Chat history API error:", error)
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })
  }
}
