import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the specific spaces by their UUIDs
    const { data: spaces, error } = await supabase
      .from("spaces")
      .select("id, name, location, hourly_rate, daily_rate, monthly_rate, space_type, description")
      .in("id", Object.values(SPACE_IDS))

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch spaces" }, { status: 500 })
    }

    // Create mapping between space IDs and their details
    const spaceDetails =
      spaces?.reduce(
        (acc, space) => {
          acc[space.id] = space
          return acc
        },
        {} as Record<string, any>,
      ) || {}

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hardcodedSpaceIds: SPACE_IDS,
      spaces: {
        all: spaces,
        hourly: spaceDetails[SPACE_IDS.HOURLY] || null,
        daily: spaceDetails[SPACE_IDS.DAILY] || null,
        monthly: spaceDetails[SPACE_IDS.MONTHLY] || null,
      },
      skuMapping: {
        "parking-hour": {
          spaceId: SPACE_IDS.HOURLY,
          details: spaceDetails[SPACE_IDS.HOURLY] || null,
        },
        "parking-day": {
          spaceId: SPACE_IDS.DAILY,
          details: spaceDetails[SPACE_IDS.DAILY] || null,
        },
        "parking-month": {
          spaceId: SPACE_IDS.MONTHLY,
          details: spaceDetails[SPACE_IDS.MONTHLY] || null,
        },
      },
      usage: {
        description: "Each Commerce Layer SKU is mapped to a specific parking space",
        examples: [
          "parking-hour → " + SPACE_IDS.HOURLY,
          "parking-day → " + SPACE_IDS.DAILY,
          "parking-month → " + SPACE_IDS.MONTHLY,
        ],
      },
    })
  } catch (error) {
    console.error("Error fetching test spaces:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
