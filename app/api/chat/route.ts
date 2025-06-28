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

// Enhanced search function with availability checking
async function searchParkingSpaces(searchParams: any) {
  try {
    console.log("🔍 Starting parking space search with params:", searchParams)

    if (isSupabaseConfigured()) {
      console.log("📊 Searching your actual database spaces...")

      // Get spaces that are available AND have capacity
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

      // Filter out spaces that are fully booked
      const spacesWithCapacity = allAvailable.filter((space) => {
        const totalSpaces = space.total_spaces || 1
        const bookedSpaces = space.booked_spaces || 0
        const availableSpaces = totalSpaces - bookedSpaces

        console.log(`Space "${space.title}": ${availableSpaces}/${totalSpaces} available`)
        return availableSpaces > 0
      })

      console.log(`🎯 ${spacesWithCapacity.length} spaces have available capacity`)

      if (spacesWithCapacity.length === 0) {
        console.log("🚫 All spaces are fully booked")
        return []
      }

      // Apply location filtering if specified
      let filteredSpaces = spacesWithCapacity
      if (searchParams.location) {
        const locationTerm = searchParams.location.toLowerCase()
        filteredSpaces = spacesWithCapacity.filter(
          (space) =>
            (space.location && space.location.toLowerCase().includes(locationTerm)) ||
            (space.address && space.address.toLowerCase().includes(locationTerm)) ||
            (space.postcode && space.postcode.toLowerCase().includes(locationTerm)) ||
            (space.title && space.title.toLowerCase().includes(locationTerm)),
        )

        // If no location matches, return all available spaces
        if (filteredSpaces.length === 0) {
          console.log("📍 No location matches, showing all available spaces")
          filteredSpaces = spacesWithCapacity
        }
      }

      // Transform the data with availability info
      const transformedSpaces = filteredSpaces.map((space) => {
        const totalSpaces = space.total_spaces || 1
        const bookedSpaces = space.booked_spaces || 0
        const availableSpaces = totalSpaces - bookedSpaces

        return {
          ...space,
          available_spaces: availableSpaces,
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
        }
      })

      console.log(`🎯 Returning ${transformedSpaces.length} spaces with available capacity`)
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
    /park\s+me\s+asap/i, // Handle "park me asap"
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      location = match[1].trim()
      console.log(`📍 Extracted location: "${location}"`)
      break
    }
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
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const botResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't process that request."

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
