import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseServer } from "@/lib/supabase-server"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Updated search function based on actual schema
async function searchParkingSpaces(searchParams: any) {
  try {
    let query = supabaseServer.from("spaces").select("*")

    // Location filter - case insensitive search
    if (searchParams.location) {
      query = query.ilike("location", `%${searchParams.location}%`)
    }

    // Price filter - handle as NUMERIC type
    if (searchParams.maxPrice) {
      query = query.lte("price_per_day", searchParams.maxPrice)
    }

    // Availability filter - handle as BOOLEAN type
    query = query.eq("is_available", true)

    // Date filtering - handle as DATE types
    if (searchParams.startDate && searchParams.endDate) {
      // Space must be available from start date or earlier
      // Space must be available until end date or later
      query = query.lte("available_from", searchParams.startDate).gte("available_to", searchParams.endDate)
    }

    // Order by price (cheapest first)
    query = query.order("price_per_day", { ascending: true })

    const { data, error } = await query.limit(6)

    if (error) {
      console.error("Supabase query error:", error)
      console.error("Query details:", {
        location: searchParams.location,
        maxPrice: searchParams.maxPrice,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
      })
      return []
    }

    console.log(`Found ${data?.length || 0} spaces for search:`, searchParams)
    console.log("Raw data from Supabase:", data)

    // Transform features if they're stored as TEXT (comma-separated)
    const transformedData = (data || []).map((space) => ({
      ...space,
      features:
        typeof space.features === "string"
          ? space.features
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f.length > 0)
          : space.features || [],
    }))

    console.log("Transformed data:", transformedData)
    return transformedData
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

// Extract search parameters from user message
function extractSearchParams(message: string) {
  const lowerMessage = message.toLowerCase()

  // Extract location with improved patterns
  let location = null
  const locationPatterns = [
    /(?:in|near|at|around)\s+([a-zA-Z\s]+?)(?:\s+from|\s+for|\s+under|\s*$)/i,
    /parking\s+(?:in|at|near)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+)\s+parking/i,
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      location = match[1].trim()
      break
    }
  }

  // Extract price
  const priceMatch = lowerMessage.match(/(?:under|below|max|maximum|budget)\s*£?(\d+)/i)
  const maxPrice = priceMatch ? Number.parseInt(priceMatch[1]) : null

  // Extract dates - handle various formats
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
      }
    }

    if (dateRangeMatch[2]) {
      const end = new Date(`${dateRangeMatch[2]} ${currentYear}`)
      if (!isNaN(end.getTime())) {
        endDate = end.toISOString().split("T")[0]
      }
    }
  }

  const extractedParams = {
    location,
    maxPrice,
    startDate,
    endDate,
  }

  console.log("Extracted search params:", extractedParams)
  return extractedParams
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversation } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("Received message:", message)

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
      parkingSpaces = await searchParkingSpaces(searchParams)
      hasSearchResults = true
      console.log(`Search completed. Found ${parkingSpaces.length} spaces`)
    }

    // Enhanced system prompt
    const systemPrompt = `You are Parkpal, a smart parking booking platform and assistant. You help users find and book parking spaces in real-time.

CORE RESPONSIBILITIES:
- When users mention locations or ask about parking, you have access to live parking space data
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
- User query: "${message}"
- Search parameters: ${JSON.stringify(searchParams)}
- Found ${parkingSpaces.length} available spaces

${
  parkingSpaces.length > 0
    ? `
AVAILABLE SPACES DATA:
${parkingSpaces
  .map(
    (space) => `
- ${space.title || "Parking Space"} in ${space.location || "Location"}
  Price: £${space.price_per_day || "N/A"}/day
  Features: ${Array.isArray(space.features) ? space.features.join(", ") : space.features || "Standard parking"}
  Description: ${space.description || "No description available"}
  Available: ${space.available_from} to ${space.available_to}
`,
  )
  .join("\n")}

Present these spaces in a friendly way and mention that detailed cards will be shown below your response.
`
    : `
No spaces found matching the criteria. Suggest alternatives like:
- Different dates
- Nearby areas
- Different price range
`
}
`
    : "No parking search performed - respond to general queries and guide towards parking assistance."
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
      parkingSpaces: hasSearchResults && parkingSpaces.length > 0 ? parkingSpaces : undefined,
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
