import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { generateText } from "ai"
import { openai as openaiSDK } from "@ai-sdk/openai"
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
    const { message } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("💬 Received message:", message)
    console.log("🔧 Supabase configured:", isSupabaseConfigured())

    // Store user message in Supabase
    const { data: userMessage, error: userError } = await supabaseServer
      .from("messages")
      .insert([
        {
          content: message,
          role: "user",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (userError) {
      console.error("Error storing user message:", userError)
    } else {
      console.log("User message stored successfully:", userMessage.id)
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
      message.toLowerCase().includes("park")

    if (isParkingQuery) {
      console.log("🎯 This is a parking query, starting search...")
      parkingSpaces = await searchParkingSpaces(searchParams)
      hasSearchResults = true
      console.log(`🏁 Search completed. Found ${parkingSpaces.length} spaces`)
    }

    // Generate AI response
    const { text } = await generateText({
      model: openaiSDK("gpt-4o"),
      system: `You are ParkPal's helpful parking assistant. You help users find and book parking spaces in London. 
      
      Key information:
      - We offer hourly (£3/hour), daily (£15/day), and monthly (£300/month) parking
      - We have spaces in SE1, SE17, and other London areas
      - Users can search by postcode or area
      - We provide secure, convenient parking solutions
      - Our booking system handles reservations and payments
      
      Be friendly, helpful, and focus on parking-related queries. If asked about non-parking topics, politely redirect to parking assistance.`,
      prompt: message,
    })

    console.log("Generated AI response:", text.substring(0, 100) + "...")

    // Store assistant response in Supabase
    const { data: assistantMessage, error: assistantError } = await supabaseServer
      .from("messages")
      .insert([
        {
          content: text,
          role: "assistant",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (assistantError) {
      console.error("Error storing assistant message:", assistantError)
    } else {
      console.log("Assistant message stored successfully:", assistantMessage.id)
    }

    return NextResponse.json({
      response: text,
      parkingSpaces: hasSearchResults && parkingSpaces.length > 0 ? parkingSpaces : undefined,
      searchParams: hasSearchResults ? searchParams : undefined,
      totalFound: parkingSpaces.length,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}
