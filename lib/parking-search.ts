import { supabaseServer } from "./supabase-server"
import type { ParkingSpaceDisplay, SearchParams } from "./supabase-types"

export async function searchParkingSpaces(params: SearchParams): Promise<ParkingSpaceDisplay[]> {
  try {
    console.log("🔍 Searching with params:", params)

    // Build the query with host information
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

    // Filter by location (search in title, location, address, postcode)
    if (params.location) {
      const locationTerm = `%${params.location}%`
      query = query.or(
        `title.ilike.${locationTerm},location.ilike.${locationTerm},address.ilike.${locationTerm},postcode.ilike.${locationTerm}`,
      )
    }

    // Filter by specific postcode
    if (params.postcode) {
      query = query.ilike("postcode", `%${params.postcode}%`)
    }

    // Filter by what3words
    if (params.what3words) {
      query = query.ilike("what3words", `%${params.what3words}%`)
    }

    // Filter by price
    if (params.maxPrice) {
      console.log(`💰 Adding price filter: <= £${params.maxPrice}`)
      query = query.lte("price_per_day", params.maxPrice)
    }

    // Filter by date availability
    if (params.startDate && params.endDate) {
      console.log(`📅 Adding date filter: ${params.startDate} to ${params.endDate}`)
      query = query
        .or(`available_from.is.null,available_from.lte.${params.startDate}`)
        .or(`available_to.is.null,available_to.gte.${params.endDate}`)
    }

    // Filter by features
    if (params.features && params.features.length > 0) {
      console.log(`🏷️ Adding features filter: ${params.features.join(", ")}`)
      // Search for any of the requested features in the features string
      const featureQueries = params.features.map((feature) => `features.ilike.%${feature}%`)
      query = query.or(featureQueries.join(","))
    }

    const { data, error } = await query.order("price_per_day", { ascending: true }).limit(6)

    if (error) {
      console.error("Supabase query error:", error)
      return []
    }

    // Transform data for frontend (parse features string to array)
    const transformedData: ParkingSpaceDisplay[] = (data || []).map((space: any) => ({
      ...space,
      features: space.features
        ? space.features
            .split(",")
            .map((f: string) => f.trim())
            .filter((f: string) => f.length > 0)
        : [],
      host: space.host || undefined,
    }))

    console.log(`✅ Found ${transformedData.length} spaces`)
    return transformedData
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}

export function extractSearchParams(message: string): SearchParams {
  const params: SearchParams = {}

  // Extract location (enhanced patterns for UK locations)
  const locationPatterns = [
    /(?:in|at|near|around)\s+([a-zA-Z\s]+?)(?:\s+from|\s+for|\s+under|\s*$)/i,
    /parking\s+(?:in|at|near)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+)\s+parking/i,
    /(?:find|book|need)\s+(?:parking\s+)?(?:in|at|near)\s+([a-zA-Z\s]+)/i,
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      params.location = match[1].trim()
      break
    }
  }

  // Extract postcode (UK format)
  const postcodeMatch = message.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i)
  if (postcodeMatch) {
    params.postcode = postcodeMatch[1].toUpperCase()
  }

  // Extract what3words (///word.word.word format)
  const what3wordsMatch = message.match(/\/\/\/([a-z]+\.[a-z]+\.[a-z]+)/i)
  if (what3wordsMatch) {
    params.what3words = what3wordsMatch[1]
  }

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
    "accessibility",
    "valet",
    "premium",
    "luxury",
    "budget",
    "cheap",
    "affordable",
  ]

  const extractedFeatures: string[] = []
  const messageLower = message.toLowerCase()

  featureKeywords.forEach((keyword) => {
    if (messageLower.includes(keyword)) {
      // Map keywords to database feature names
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
        accessibility: "Disabled Access",
        valet: "Valet Service",
        premium: "Premium",
        luxury: "Premium",
        budget: "Budget Friendly",
        cheap: "Budget Friendly",
        affordable: "Budget Friendly",
      }

      const mappedFeature = featureMap[keyword]
      if (mappedFeature && !extractedFeatures.includes(mappedFeature)) {
        extractedFeatures.push(mappedFeature)
      }
    }
  })

  if (extractedFeatures.length > 0) {
    params.features = extractedFeatures
  }

  // Extract dates (various formats)
  const datePatterns = [
    /from\s+([a-zA-Z]+\s+\d{1,2})(?:\s*[-–]\s*([a-zA-Z]+\s+\d{1,2}))?/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})(?:\s*[-–]\s*(\d{1,2}\/\d{1,2}\/\d{4}))?/i,
    /(\d{4}-\d{2}-\d{2})(?:\s*[-–]\s*(\d{4}-\d{2}-\d{2}))?/i,
  ]

  for (const pattern of datePatterns) {
    const match = message.match(pattern)
    if (match) {
      if (match[1]) params.startDate = parseDate(match[1])
      if (match[2]) params.endDate = parseDate(match[2])
      break
    }
  }

  // Extract price constraints
  const pricePatterns = [
    /under\s+£?(\d+)/i,
    /less\s+than\s+£?(\d+)/i,
    /budget\s+of\s+£?(\d+)/i,
    /max\s+£?(\d+)/i,
    /maximum\s+£?(\d+)/i,
  ]

  for (const pattern of pricePatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      params.maxPrice = Number.parseInt(match[1])
      break
    }
  }

  return params
}

function parseDate(dateStr: string): string {
  try {
    // Handle "June 23" format (assume current year)
    if (/^[a-zA-Z]+\s+\d{1,2}$/.test(dateStr.trim())) {
      const currentYear = new Date().getFullYear()
      const date = new Date(`${dateStr} ${currentYear}`)
      return date.toISOString().split("T")[0]
    }

    // Handle other date formats
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]
    }
  } catch (error) {
    console.error("Date parsing error:", error)
  }

  return ""
}

// User management functions
export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabaseServer.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("User fetch error:", error)
    return null
  }
}

export async function getUserVehicles(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("vehicles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching vehicles:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Vehicles fetch error:", error)
    return []
  }
}

export async function getUserSpaces(hostId: string) {
  try {
    const { data, error } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user spaces:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("User spaces fetch error:", error)
    return []
  }
}
