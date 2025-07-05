import { supabaseServer, isSupabaseConfigured } from "./supabase-server"
import type { SearchParams } from "./supabase-types"
import type { ParkingSpace } from "./supabase-types"

export async function searchParkingSpaces(query: string): Promise<ParkingSpace[]> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, returning empty results")
    return []
  }

  try {
    const searchTerm = `%${query}%`

    const { data: spaces, error } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)
      .or(
        `title.ilike.${searchTerm},location.ilike.${searchTerm},address.ilike.${searchTerm},postcode.ilike.${searchTerm}`,
      )
      .limit(10)

    if (error) {
      console.error("Error searching parking spaces:", error)
      return []
    }

    return spaces || []
  } catch (error) {
    console.error("Error in searchParkingSpaces:", error)
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
    if (!isSupabaseConfigured()) {
      return null
    }

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
    if (!isSupabaseConfigured()) {
      return []
    }

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
    if (!isSupabaseConfigured()) {
      return []
    }

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
