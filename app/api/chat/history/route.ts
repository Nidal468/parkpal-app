import { NextResponse } from "next/server"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 })
  }

  try {
    const { data: messages, error } = await supabaseServer
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching chat history:", error)
      return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 })
    }

    return NextResponse.json({ messages: messages.reverse() })
  } catch (error) {
    console.error("Chat history API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
