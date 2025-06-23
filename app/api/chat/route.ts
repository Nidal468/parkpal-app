import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseServer } from "@/lib/supabase-server"
import { searchMockParkingSpaces } from "@/lib/mock-data"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
}

// Simplified and more robust search function
async function searchParkingSpaces(searchParams: any) {
  try {
    console.log("🔍 Starting parking space search with params:", searchParams)

    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      // Simplified search - just get available spaces first
      console.log("📊 Searching your actual database spaces...")

      // First, get ALL available spaces to see what we have
      const { data: allAvailable, error: allError } = await supabaseServer
        .from("spaces")
        .select("*")
        .eq("is_available", true)
        .order("price_per_day", { ascending: true })

      if (allError) {
        console.error("❌ Error getting available spaces:", allError)
        return searchMockParkingSpaces(searchParams).slice(0, 3)
      }

      console.log(`✅ Found ${allAvailable?.length || 0} available spaces in database`)

      if (!allAvailable || allAvailable.length === 0) {
        console.log("📭 No available spaces found, using mock data")
        return searchMockParkingSpaces(searchParams).slice(0, 3)
      }

      // If we have a location filter, try to match it
      let filteredSpaces = allAvailable
      if (searchParams.location) {
        const locationTerm = searchParams.location.toLowerCase()
        filteredSpaces = allAvailable.filter(
          (space) =>
            (space.location && space.location.toLowerCase().includes(locationTerm)) ||
            (space.address && space.address.toLowerCase().includes(locationTerm)) ||
            (space.postcode && space.postcode.toLowerCase().includes(locationTerm)) ||
            (space.title && space.title.toLowerCase().includes(locationTerm)),
        )

        // If no location matches, return all available spaces
        if (filteredSpaces.length === 0) {
          console.log("📍 No location matches, showing all available spaces")
          filteredSpaces = allAvailable
        }
      }

      // Transform the data
      const transformedSpaces = filteredSpaces.map((space) => ({
        ...space,
        features:
          typeof space.features === "string"
            ? space.features
                .split(",")
                .map((f) => f.trim())
                .filter((f) => f.length > 0)
            : space.features || [],
        host: {
          id: space.host_id || "host-1",
          name: "Space Owner",
          email: "owner@example.com",
        },
      }))

      console.log(`🎯 Returning ${transformedSpaces.length} spaces from YOUR database`)
      return transformedSpaces.slice(0, 3)
    }

    // Fallback to mock data
    console.log("🎭 Using mock data (Supabase not configured)")
    return searchMockParkingSpaces(searchParams).slice(0, 3)
  } catch (error) {
    console.error("💥 Search function error:", error)
    console.log("🎭 Falling back to mock data due to error")
    return searchMockParkingSpaces(searchParams).slice(0, 3)
  }
}

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
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      location = match[1].trim()
      console.log(`📍 Extracted location: "${location}"`)
      break
    }
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
    const { message, conversation } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("💬 Received message:", message)
    console.log("🔧 Supabase configured:", isSupabaseConfigured())

    // Extract search parameters from the user's message
    const searchParams = extractSearchParams(message)

    // Search for parking spaces if it's a parking query
    let parkingSpaces: any[] = []
    let hasSearchResults = false

    const isParkingQuery =
      searchParams.location ||
      message.toLowerCase().includes("parking") ||
      message.toLowerCase().includes("space") ||
      message.toLowerCase().includes("park")

    if (isParkingQuery) {
      console.log("🎯 This is a parking query, starting search...")
      parkingSpaces = await searchParkingSpaces(searchParams)
      hasSearchResults = true
      console.log(`🏁 Search completed. Found ${parkingSpaces.length} spaces`)
    }

    // Enhanced system prompt
    const systemPrompt = `You are a helpful Parking Assistant for Parkpal. Your primary role is to help users find and book parking spaces in London.

CORE ASSISTANT LOGIC:
When users ask for parking, you search the Supabase spaces table and return matches based on:
- Location proximity (especially for SE1, SE17, Kennington, Borough, Southwark areas)
- Availability and pricing
- Features and requirements

SEARCH BEHAVIOR:
- Display up to 3 best matches with title, price per day, location, and key features
- Order results by best value (price) and proximity
- If no matches found, suggest nearby areas or alternatives

RESPONSE GUIDELINES:
- Be conversational, helpful, and parking-focused
- Present available spaces naturally with key details
- Include specific information: location, price, features
- Use UK pricing (£) and London locations
- Use emojis sparingly but effectively (🚗, 📍, £, 🔒)

CURRENT SEARCH CONTEXT:
${
  hasSearchResults
    ? `
- User query: "${message}"
- Search parameters: ${JSON.stringify(searchParams)}
- Found ${parkingSpaces.length} available spaces
- Data source: ${isSupabaseConfigured() ? "Live Supabase database" : "Demo data"}

${
  parkingSpaces.length > 0
    ? `
AVAILABLE SPACES (up to 3 best matches):
${parkingSpaces
  .map(
    (space, index) => `
${index + 1}. ${space.title || "Parking Space"} in ${space.location || "Location"}
   Price: £${space.price_per_day || "N/A"}/day
   Address: ${space.address || "No address"}
   Postcode: ${space.postcode || "No postcode"}
   Features: ${Array.isArray(space.features) ? space.features.join(", ") : space.features || "Standard parking"}
   Description: ${space.description || "No description available"}
`,
  )
  .join("\n")}

Present these spaces in a friendly way and mention that detailed cards will be shown below your response.
`
    : `
No spaces found matching the criteria. Respond with helpful suggestions for nearby areas like:
- For SE17/Kennington: try Elephant & Castle, Borough, Waterloo, or Southwark
- Different dates or price ranges
- Alternative search terms
`
}
`
    : "No parking search performed - respond to general queries and guide towards parking assistance."
}

IMPORTANT: Always be helpful and suggest alternatives if no exact matches are found.`

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
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const botResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't process that request."

    // Store the conversation in Supabase (only if configured)
    if (isSupabaseConfigured()) {
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
    }

    // Return response with parking spaces data if available
    return NextResponse.json({
      message: botResponse,
      timestamp: new Date().toISOString(),
      parkingSpaces: hasSearchResults && parkingSpaces.length > 0 ? parkingSpaces : undefined,
      searchParams: hasSearchResults ? searchParams : undefined,
      totalFound: parkingSpaces.length,
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
