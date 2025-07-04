import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

// SKU to Space mapping
const SKU_TO_SPACE_MAP = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

export async function GET() {
  try {
    console.log("🗺️ Getting test spaces and mappings...")

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Supabase configuration missing",
          hardcodedSpaceIds: SPACE_IDS,
          skuMapping: SKU_TO_SPACE_MAP,
        },
        { status: 500 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the specific spaces by their UUIDs
    const spaceIds = Object.values(SPACE_IDS)
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id, name, location, hourly_rate, daily_rate, monthly_rate, space_type, description")
      .in("id", spaceIds)

    if (spacesError) {
      console.error("❌ Error fetching spaces:", spacesError)
      return NextResponse.json(
        {
          success: false,
          error: spacesError.message,
          hardcodedSpaceIds: SPACE_IDS,
          skuMapping: SKU_TO_SPACE_MAP,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Found ${spaces?.length || 0} spaces`)

    // Create detailed mapping information
    const detailedMapping = Object.entries(SKU_TO_SPACE_MAP).map(([sku, spaceId]) => {
      const space = spaces?.find((s) => s.id === spaceId)
      return {
        sku,
        spaceId,
        spaceExists: !!space,
        spaceName: space?.name || "Not found",
        spaceLocation: space?.location || "Unknown",
        rates: space
          ? {
              hourly: space.hourly_rate,
              daily: space.daily_rate,
              monthly: space.monthly_rate,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hardcodedSpaceIds: SPACE_IDS,
      skuMapping: SKU_TO_SPACE_MAP,
      detailedMapping,
      spacesFound: spaces?.length || 0,
      totalSpacesExpected: Object.keys(SPACE_IDS).length,
      allSpacesExist: spaces?.length === Object.keys(SPACE_IDS).length,
      spaces: spaces || [],
      message:
        spaces?.length === Object.keys(SPACE_IDS).length
          ? "All hardcoded space UUIDs exist in database"
          : "Some hardcoded space UUIDs are missing from database",
    })
  } catch (error) {
    console.error("❌ Error in get-test-spaces:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hardcodedSpaceIds: SPACE_IDS,
        skuMapping: SKU_TO_SPACE_MAP,
      },
      { status: 500 },
    )
  }
}
