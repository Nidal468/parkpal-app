import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseServer } from "@/lib/supabase-server"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simple search function (we'll improve this based on your actual table structure)
async function searchParkingSpaces(searchParams: any) {
  try {
    let query = supabaseServer.from("spaces").select("*")

    // Add basic filters
    if (searchParams.location) {
      query = query.ilike("location", `%${searchParams.location}%`)
    }

    if (searchParams.maxPrice) {
      query = query.lte("price_per_day", searchParams.maxPrice)
    }

    // Only show available spaces
    query = query.eq("is_available", true)

    const { data, error } = await query.limit(6)

    if (error) {
      console.error("Supabase query error:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

// Extract search parameters from user message
function extractSearchParams(message: string) {
  const lowerMessage = message.toLowerCase()

  // Extract location
  const locationMatch = lowerMessage.match(/(?:in|near|at)\s+([a-zA-Z\s]+?)(?:\s|$|from|for|under|\d)/i)
  const location = locationMatch ? locationMatch[1].trim() : null

  // Extract price
  const priceMatch = lowerMessage.match(/(?:under|below|max|maximum)\s*£?(\d+)/i)
  const maxPrice = priceMatch ? Number.parseInt(priceMatch[1]) : null

  // Extract dates (basic pattern)
  const dateMatch = lowerMessage.match(/(\w+\s+\d{1,2})(?:\s*[-–]\s*(\w+\s+\d{1,2}))?/i)
  const startDate = dateMatch ? dateMatch[1] : null
  const endDate = dateMatch ? dateMatch[2] : null

  return {
    location,
    maxPrice,
    startDate,
    endDate,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Extract search parameters from the user's message
    const searchParams = extractSearchParams(message)

    // Search for parking spaces if location is mentioned
    let parkingSpaces: any[] = []
    let hasSearchResults = false

    if (searchParams.location) {
      parkingSpaces = await searchParkingSpaces(searchParams)
      hasSearchResults = true
    }

    // Enhanced system prompt
    const systemPrompt = `You are Parkpal, a smart parking booking platform and assistant. You help users find and book parking spaces in real-time.

CORE RESPONSIBILITIES:
- When users provide location and dates, you have access to live parking space data
- Present available spaces naturally with key details: location, price, features
- If no spaces match their criteria, politely explain and suggest alternatives
- Always be helpful, friendly, and parking-focused
- Use UK pricing (£) and locations

RESPONSE GUIDELINES:
- Keep responses conversational and helpful
- Include specific details about available spaces when found
- Mention key features like security, covered parking, accessibility
- Provide pricing clearly (per day rates)
- If no results, suggest nearby areas or different dates
- Use emojis sparingly but effectively

CURRENT SEARCH CONTEXT:
${
  hasSearchResults
    ? `
- User searched for: ${searchParams.location || "parking"}
- Found ${parkingSpaces.length} available spaces
- Date range: ${searchParams.startDate || "not specified"} to ${searchParams.endDate || "not specified"}
- Max budget: ${searchParams.maxPrice ? `£${searchParams.maxPrice}` : "not specified"}

AVAILABLE SPACES DATA:
${parkingSpaces
  .map(
    (space) => `
- ${space.title || "Parking Space"} in ${space.location || "Location"}
  Price: £${space.price_per_day || "N/A"}/day
  Features: ${Array.isArray(space.features) ? space.features.join(", ") : space.features || "Standard parking"}
  Description: ${space.description || "No description available"}
`,
  )
  .join("\n")}
`
    : "No specific location search performed."
}

If users ask non-parking questions, politely redirect them back to parking assistance.`

    // Convert conversation to OpenAI format
    const messages = [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      // Add conversation history
      ...conversation.map((msg: any) => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      })),
      // Add current message
      {
        role: "user" as const,
        content: message,
      },
    ]

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const botResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't process that request."

    // Store the conversation in Supabase
    try {
      const { error: supabaseError } = await supabaseServer.from("messages").insert({
        user_message: message,
        bot_response: botResponse,
      })

      if (supabaseError) {
        console.error("Supabase error:", supabaseError)
      }
    } catch (dbError) {
      console.error("Database storage error:", dbError)
    }

    // Return response with parking spaces data if available
    return NextResponse.json({
      message: botResponse,
      timestamp: new Date().toISOString(),
      parkingSpaces: hasSearchResults ? parkingSpaces : undefined,
      searchParams: hasSearchResults ? searchParams : undefined,
    })
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
