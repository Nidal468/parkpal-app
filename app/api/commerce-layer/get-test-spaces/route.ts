import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

const SKU_TO_SPACE_MAP = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

export async function GET() {
  try {
    console.log("🗺️ Fetching test spaces and mappings...")

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    )

    // Fetch actual space details from Supabase
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id, name, location, hourly_rate, daily_rate, monthly_rate, latitude, longitude")
      .in("id", Object.values(SPACE_IDS))

    if (spacesError) {
      console.error("❌ Error fetching spaces:", spacesError)
      return NextResponse.json(
        {
          success: false,
          error: spacesError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Create mapping with space details
    const detailedMapping = Object.entries(SKU_TO_SPACE_MAP).map(([sku, spaceId]) => {
      const spaceDetails = spaces?.find((space) => space.id === spaceId)
      return {
        sku,
        spaceId,
        spaceDetails: spaceDetails || { error: "Space not found in database" },
      }
    })

    console.log("✅ Successfully fetched space mappings")

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hardcodedSpaceIds: SPACE_IDS,
      skuToSpaceMapping: SKU_TO_SPACE_MAP,
      detailedMapping,
      spacesFound: spaces?.length || 0,
      totalSpacesExpected: Object.keys(SPACE_IDS).length,
      allSpacesFound: spaces?.length === Object.keys(SPACE_IDS).length,
    })
  } catch (error) {
    console.error("❌ Get test spaces failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get test spaces",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
