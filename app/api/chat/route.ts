import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { searchParkingSpaces } from "@/lib/parking-search"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Enhanced search parameter extraction
function extractSearchParams(message: string) {
  const lowerMessage = message.toLowerCase()
  console.log("🔤 Extracting search params from:", message)

  // Extract location with improved patterns
  let location = null
  const locationPatterns = [
    /(?:in|near|at|around)\s+([a-zA-Z0-9\s]+?)(?:\s+area|\s+from|\s+for|\s+under|\s*$)/i,
    /parking\s+(?:in|at|near)\s+([a-zA-Z0-9\s]+)/i,
    /([a-zA-Z0-9\s]+)\s+parking/i,
    /(?:find|book|need)\s+(?:parking\s+)?(?:in|at|near)\s+([a-zA-Z0-9\s]+)/i,
    /park\s+me\s+(?:in|near)\s+([a-zA-Z0-9\s]+)/i,
    /spaces\s+(?:in|near|at|around)\s+([a-zA-Z0-9\s]+)/i,
    /spaces\s+near\s+me/i, // Handle "spaces near me"
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      location = match[1].trim()
      console.log(`📍 Extracted location: "${location}"`)
      break
    }
  }

  // Handle "spaces near me" or "near me" - show all available spaces
  if (lowerMessage.includes("near me") || lowerMessage.includes("spaces near me")) {
    location = null // Show all available spaces
    console.log("📍 'Near me' request - showing all available spaces")
  }

  // Handle "park me asap" - no specific location
  if (lowerMessage.includes("park me asap") || lowerMessage.includes("asap")) {
    location = null // Show all available spaces
    console.log("⚡ ASAP request - showing all available spaces")
  }

  // Extract price constraints
  const priceMatch = lowerMessage.match(/(?:under|below|max|maximum|budget)\s*£?(\d+)/i)
  const maxPrice = priceMatch ? Number.parseInt(priceMatch[1]) : null
  if (maxPrice) {
    console.log(`💰 Extracted max price: £${maxPrice}`)
  }

  const extractedParams = {
    location,
    maxPrice,
    features: undefined,
  }

  console.log("✅ Final extracted params:", extractedParams)
  return extractedParams
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()
    const userMessage = messages[messages.length - 1]?.content || ""

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("💬 Received message:", userMessage)
    console.log("🔧 Supabase configured:", isSupabaseConfigured())

    // Check if user is asking for date selection
    if (userMessage.toLowerCase().trim() === "date") {
      console.log("📅 Date request detected, returning calendar response")
      return NextResponse.json({
        message: "Please select your booking dates using the calendar below:",
        timestamp: new Date().toISOString(),
        showCalendar: true,
      })
    }

    // Extract search parameters from the user's message
    const searchParams = extractSearchParams(userMessage)

    // Search for parking spaces if it's a parking query
    let parkingSpaces: any[] = []
    let hasSearchResults = false

    const isParkingQuery =
      searchParams.location ||
      userMessage.toLowerCase().includes("parking") ||
      userMessage.toLowerCase().includes("space") ||
      userMessage.toLowerCase().includes("park") ||
      userMessage.toLowerCase().includes("near me")

    if (isParkingQuery) {
      console.log("🎯 This is a parking query, starting search...")
      parkingSpaces = await searchParkingSpaces(searchParams)
      hasSearchResults = true
      console.log(`🏁 Search completed. Found ${parkingSpaces.length} spaces`)
    }

    let contextInfo = ""
    if (hasSearchResults && parkingSpaces.length > 0) {
      contextInfo = `\n\nAvailable parking spaces:\n${parkingSpaces
        .map(
          (space) =>
            `- ${space.title} in ${space.location} (${space.postcode}) - £${space.price_per_day}/day - ${space.features}`,
        )
        .join("\n")}`
    }

    // Save conversation to database
    if (isSupabaseConfigured()) {
      try {
        await supabaseServer.from("messages").insert({
          user_message: userMessage,
          bot_response: "Response will be generated...",
        })
      } catch (error) {
        console.error("Error saving message:", error)
      }
    }

    const result = await streamText({
      model: openai("gpt-4o"),
      system: `You are Parkpal, a helpful AI assistant for finding parking spaces in London. 
      
      You help users find and book parking spaces. Be friendly, concise, and helpful.
      
      When users ask about parking, provide information about available spaces and help them with booking.
      
      If you have parking space data, present it clearly with prices and locations.
      
      ${contextInfo}`,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Error processing request", { status: 500 })
  }
}
