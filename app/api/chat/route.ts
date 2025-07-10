import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"
import { searchParkingSpaces, extractSearchParams } from "@/lib/parking-search"

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "", // Rename your env var if needed
  baseURL: "https://openrouter.ai/api/v1", // <- Required for OpenRouter
})

export async function POST(request: NextRequest) {
  try {
    const { message, conversation } = await request.json()

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("💬 Received message:", message)
    console.log("🔧 Supabase configured:", isSupabaseConfigured())

    // Check if user is asking for date selection
    if (message.toLowerCase().trim() === "date") {
      console.log("📅 Date request detected, returning calendar response")
      return NextResponse.json({
        message: "Please select your booking dates using the calendar below:",
        timestamp: new Date().toISOString(),
        showCalendar: true,
      })
    }

    // Extract search parameters from the user's message
    const searchParams = extractSearchParams(message)

    // Search for parking spaces if it's a parking query
    let parkingSpaces: any[] = []
    let hasSearchResults = false

    const isParkingQuery =
      searchParams.location ||
      message.toLowerCase().includes("parking") ||
      message.toLowerCase().includes("space") ||
      message.toLowerCase().includes("park") ||
      message.toLowerCase().includes("near me")

    if (isParkingQuery) {
      console.log("🎯 This is a parking query, starting search...")
      parkingSpaces = await searchParkingSpaces(searchParams)
      hasSearchResults = true
      console.log(`🏁 Search completed. Found ${parkingSpaces.length} spaces`)
    }

    // Enhanced system prompt with availability messaging
    const systemPrompt = `You are a helpful Parking Assistant for Parkpal. Your primary role is to help users find and book parking spaces in London.

CORE ASSISTANT LOGIC:
When users ask for parking, you search the Supabase spaces table and return matches based on:
- Location proximity (especially for SE1, SE17, Kennington, Borough, Southwark areas)
- Availability and capacity (only show spaces with available spots)
- Pricing and features

AVAILABILITY LOGIC:
- Only show spaces that have available capacity (total_spaces > booked_spaces)
- If all spaces in an area are fully booked, suggest nearby alternatives
- Mention when spaces have limited availability (e.g., "Only 2 spots left!")

RESPONSE GUIDELINES:
- Be brief and conversational - users can see details in the cards below
- For parking searches, use a short intro like "Here are some available parking spaces for you:" or "I found these options:"
- Don't repeat detailed information that's shown in the parking cards
- Keep responses to 1-2 sentences maximum for parking results
- Use minimal emojis (🚗 or 📍 occasionally)

CURRENT SEARCH CONTEXT:
${
  hasSearchResults
    ? `
- User query: "${message}"
- Search parameters: ${JSON.stringify(searchParams)}
- Found ${parkingSpaces.length} available spaces with capacity
- Data source: ${isSupabaseConfigured() ? "Live Supabase database" : "Demo data"}

${
  parkingSpaces.length > 0
    ? `
AVAILABLE SPACES (up to 3 best matches with capacity):
Present these spaces with just a brief intro like "Here are some available parking spaces for you:" or "I found these options near [location]:" - don't repeat the detailed information since it's shown in the cards below.
`
    : `
No spaces found with available capacity. Respond with helpful suggestions:
- "All spaces in that area are currently fully booked. Let me suggest some nearby alternatives:"
- Suggest nearby areas like Elephant & Castle, Borough, Waterloo, or Southwark for SE17 searches
- Offer to check different dates or price ranges
- Mention they can try "Park me asap" for the quickest available options
`
}
`
    : "No parking search performed - respond to general queries and guide towards parking assistance."
}

IMPORTANT: Always be helpful and suggest alternatives if no spaces with capacity are found.`

    // Convert conversation to OpenAI format
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      ...conversation.map((msg: any) => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ]

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const botResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't process that request."

    // Determine if we should add follow-up message
    const shouldAddFollowUp = hasSearchResults && parkingSpaces.length > 0
    console.log("🔄 Should add follow-up message:", shouldAddFollowUp, "Spaces found:", parkingSpaces.length)

    // Store the conversation in Supabase with proper error handling and logging
    if (isSupabaseConfigured()) {
      try {
        console.log("💾 Attempting to store message in Supabase...")

        const { data, error: supabaseError } = await supabaseServer
          .from("messages")
          .insert({
            user_message: message,
            bot_response: botResponse,
            created_at: new Date().toISOString(),
          })
          .select()

        if (supabaseError) {
          console.error("❌ Supabase storage error:", supabaseError)
          console.error("Error details:", {
            code: supabaseError.code,
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint,
          })
        } else {
          console.log("✅ Message stored successfully in Supabase:", data)
        }
      } catch (dbError) {
        console.error("💥 Database storage exception:", dbError)
      }
    } else {
      console.log("⚠️ Supabase not configured - message not stored")
    }

    // Return response with parking spaces data if available
    const response = {
      message: botResponse,
      timestamp: new Date().toISOString(),
      parkingSpaces: hasSearchResults && parkingSpaces.length > 0 ? parkingSpaces : undefined,
      searchParams: hasSearchResults ? searchParams : undefined,
      totalFound: parkingSpaces.length,
      followUpMessage: shouldAddFollowUp ? "Type 'date' to set your booking duration." : undefined,
    }

    console.log("📤 API Response:", {
      hasSpaces: !!response.parkingSpaces,
      spacesCount: parkingSpaces.length,
      hasFollowUp: !!response.followUpMessage,
      followUpText: response.followUpMessage,
      supabaseConfigured: isSupabaseConfigured(),
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("Chat API error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process chat message. Please try again.",
      },
      { status: 500 },
    )
  }
}
