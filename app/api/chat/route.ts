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

// Enhanced search function with location proximity and availability logic
async function searchParkingSpaces(searchParams: any) {
  try {
    console.log("🔍 Starting parking space search with params:", searchParams)

    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      console.log("📊 Using Supabase database...")

      let query = supabaseServer
        .from("spaces")
        .select(`
          *,
          host:users!fk_host(
            id,
            name,
            email
          )
        `)
        .eq("is_available", true)

      // Location proximity search (search in multiple fields)
      if (searchParams.location) {
        console.log(`📍 Adding location proximity filter: "${searchParams.location}"`)
        const locationTerm = `%${searchParams.location}%`
        query = query.or(
          `title.ilike.${locationTerm},location.ilike.${locationTerm},address.ilike.${locationTerm},postcode.ilike.${locationTerm}`,
        )
      }

      // Availability date range filtering
      if (searchParams.startDate && searchParams.endDate) {
        console.log(`📅 Adding availability filter: ${searchParams.startDate} to ${searchParams.endDate}`)
        query = query
          .or(`available_from.is.null,available_from.lte.${searchParams.startDate}`)
          .or(`available_to.is.null,available_to.gte.${searchParams.endDate}`)
      }

      // Price filtering
      if (searchParams.maxPrice) {
        console.log(`💰 Adding price filter: <= £${searchParams.maxPrice}`)
        query = query.lte("price_per_day", searchParams.maxPrice)
      }

      // Features filtering
      if (searchParams.features && searchParams.features.length > 0) {
        console.log(`🏷️ Adding features filter: ${searchParams.features.join(", ")}`)
        const featureQueries = searchParams.features.map((feature: string) => `features.ilike.%${feature}%`)
        query = query.or(featureQueries.join(","))
      }

      // Order by price (best value first) and limit to 3 best matches
      const { data, error } = await query.order("price_per_day", { ascending: true }).limit(3)

      if (!error && data) {
        console.log(`✅ Supabase query found ${data.length} spaces`)
        return data.map((space) => ({
          ...space,
          features:
            typeof space.features === "string"
              ? space.features
                  .split(",")
                  .map((f) => f.trim())
                  .filter((f) => f.length > 0)
              : space.features || [],
          // Calculate distance if coordinates are available (simplified)
          distance:
            space.latitude && space.longitude
              ? calculateDistance(searchParams.userLat, searchParams.userLng, space.latitude, space.longitude)
              : null,
        }))
      } else {
        console.error("❌ Supabase query error:", error)
      }
    }

    // Fallback to mock data
    console.log("🎭 Using mock data (Supabase not configured or failed)")
    const mockResults = searchMockParkingSpaces(searchParams)
    console.log(`✅ Mock search found ${mockResults.length} spaces`)
    return mockResults.slice(0, 3) // Limit to 3 best matches
  } catch (error) {
    console.error("💥 Search function error:", error)
    console.log("🎭 Falling back to mock data")
    return searchMockParkingSpaces(searchParams).slice(0, 3)
  }
}

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null

  const R = 3959 // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // Round to 1 decimal place
}

// Enhanced search parameter extraction
function extractSearchParams(message: string) {
  const lowerMessage = message.toLowerCase()
  console.log("🔤 Extracting search params from:", message)

  // Extract location with improved UK-specific patterns
  let location = null
  const locationPatterns = [
    /(?:in|near|at|around)\s+([a-zA-Z\s]+?)(?:\s+from|\s+for|\s+under|\s*$)/i,
    /parking\s+(?:in|at|near)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+)\s+parking/i,
    /(?:find|book|need)\s+(?:parking\s+)?(?:in|at|near)\s+([a-zA-Z\s]+)/i,
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

  // Extract dates with enhanced patterns
  let startDate = null
  let endDate = null

  // Pattern for "June 23–July 1" or "June 23 - July 1"
  const dateRangeMatch = message.match(/(\w+\s+\d{1,2})(?:\s*[-–]\s*(\w+\s+\d{1,2}))/i)
  if (dateRangeMatch) {
    const currentYear = new Date().getFullYear()
    if (dateRangeMatch[1]) {
      const start = new Date(`${dateRangeMatch[1]} ${currentYear}`)
      if (!isNaN(start.getTime())) {
        startDate = start.toISOString().split("T")[0]
        console.log(`📅 Extracted start date: ${startDate}`)
      }
    }
    if (dateRangeMatch[2]) {
      const end = new Date(`${dateRangeMatch[2]} ${currentYear}`)
      if (!isNaN(end.getTime())) {
        endDate = end.toISOString().split("T")[0]
        console.log(`📅 Extracted end date: ${endDate}`)
      }
    }
  }

  // Extract day and time preferences
  const dayMatch = message.match(
    /(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend)/i,
  )
  const timeMatch = message.match(/(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i)

  // Extract features
  const featureKeywords = [
    "security",
    "secure",
    "cctv",
    "24/7",
    "covered",
    "underground",
    "indoor",
    "electric",
    "charging",
    "ev",
    "disabled",
    "accessible",
    "valet",
    "premium",
  ]

  const extractedFeatures: string[] = []
  featureKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) {
      const featureMap: { [key: string]: string } = {
        security: "24/7 Security",
        secure: "24/7 Security",
        cctv: "CCTV",
        "24/7": "24/7 Security",
        covered: "Covered",
        underground: "Underground",
        indoor: "Indoor",
        electric: "Electric Charging",
        charging: "Electric Charging",
        ev: "Electric Charging",
        disabled: "Disabled Access",
        accessible: "Disabled Access",
        valet: "Valet Service",
        premium: "Premium",
      }
      const mappedFeature = featureMap[keyword]
      if (mappedFeature && !extractedFeatures.includes(mappedFeature)) {
        extractedFeatures.push(mappedFeature)
      }
    }
  })

  const extractedParams = {
    location,
    maxPrice,
    startDate,
    endDate,
    features: extractedFeatures.length > 0 ? extractedFeatures : undefined,
    dayPreference: dayMatch ? dayMatch[1] : null,
    timePreference: timeMatch ? timeMatch[1] : null,
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

    // Search for parking spaces if location is mentioned OR if it's a general parking query
    let parkingSpaces: any[] = []
    let hasSearchResults = false

    // Search if location is mentioned OR if message contains parking-related keywords
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

    // Enhanced system prompt with your specified assistant logic
    const systemPrompt = `You are a helpful Parking Assistant for Parkpal. Your primary role is to help users find and book parking spaces.

CORE ASSISTANT LOGIC:
When users ask for parking, you search the Supabase spaces table and return matches based on:
- Location proximity (based on address, postcode, or lat/lng coordinates)
- Availability (checking available_from and available_to dates)
- Day and time ranges (if provided by user)
- Price constraints and feature requirements

SEARCH BEHAVIOR:
- Display up to 3 best matches with title, price per day, distance (if calculable), and image
- Order results by best value (price) and proximity when possible
- If no matches found, reply: "Sorry, no matching spaces right now — want to try a nearby location or different dates?"

RESPONSE GUIDELINES:
- Be conversational, helpful, and parking-focused
- Present available spaces naturally with key details
- Include specific information: location, price, features, availability
- Use UK pricing (£) and locations
- Mention key features like security, covered parking, accessibility
- If no results, suggest alternatives (nearby areas, different dates, price ranges)
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
   ${space.distance ? `Distance: ${space.distance} miles` : ""}
   Features: ${Array.isArray(space.features) ? space.features.join(", ") : space.features || "Standard parking"}
   Description: ${space.description || "No description available"}
   ${space.host?.name ? `Host: ${space.host.name}` : ""}
`,
  )
  .join("\n")}

Present these spaces in a friendly way and mention that detailed cards will be shown below your response.
`
    : `
No spaces found matching the criteria. Respond with: "Sorry, no matching spaces right now — want to try a nearby location or different dates?"

Then suggest alternatives like:
- Different dates (maybe shorter or longer stays)
- Nearby areas (for London: Elephant & Castle, Vauxhall, Waterloo for Kennington searches)
- Different price range
- Checking back later for new availability
- Different features or requirements
`
}
`
    : "No parking search performed - respond to general queries and guide towards parking assistance."
}

IMPORTANT: If users ask non-parking questions, politely redirect them back to parking assistance while being helpful.`

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
