import { supabaseServer } from "./supabase-server"
import type { ParkingSpace } from "./supabase-types"

export interface SearchParams {
  location?: string
  startDate?: string
  endDate?: string
  maxPrice?: number
}

export async function searchParkingSpaces(params: SearchParams): Promise<ParkingSpace[]> {
  try {
    let query = supabaseServer.from("spaces").select("*").eq("is_available", true)

    // Filter by location if provided
    if (params.location) {
      query = query.ilike("location", `%${params.location}%`)
    }

    // Filter by price if provided
    if (params.maxPrice) {
      query = query.lte("price_per_day", params.maxPrice)
    }

    // Add date filtering if dates are provided
    if (params.startDate && params.endDate) {
      query = query
        .or(`available_from.is.null,available_from.lte.${params.startDate}`)
        .or(`available_to.is.null,available_to.gte.${params.endDate}`)
    }

    const { data, error } = await query.order("price_per_day", { ascending: true }).limit(6)

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

export function extractSearchParams(message: string): SearchParams {
  const params: SearchParams = {}

  // Extract location (common patterns)
  const locationPatterns = [
    /(?:in|at|near)\s+([a-zA-Z\s]+?)(?:\s+from|\s+for|\s*$)/i,
    /parking\s+(?:in|at|near)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+)\s+parking/i,
  ]

  for (const pattern of locationPatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      params.location = match[1].trim()
      break
    }
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
  const pricePatterns = [/under\s+£?(\d+)/i, /less\s+than\s+£?(\d+)/i, /budget\s+of\s+£?(\d+)/i, /max\s+£?(\d+)/i]

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
