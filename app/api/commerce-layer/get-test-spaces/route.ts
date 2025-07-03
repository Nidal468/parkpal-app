import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Getting test spaces and mappings...")

    // Hardcoded space IDs from Supabase
    const SPACE_IDS = {
      HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
      DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
      MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
    }

    // SKU to Space mapping
    const SKU_TO_SPACE = {
      "parking-hour": SPACE_IDS.HOURLY,
      "parking-day": SPACE_IDS.DAILY,
      "parking-month": SPACE_IDS.MONTHLY,
    }

    // Get actual space details from Supabase
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    )

    const spaceIds = Object.values(SPACE_IDS)
    const { data: spaces, error } = await supabase.from("spaces").select("*").in("id", spaceIds)

    if (error) {
      console.error("❌ Failed to fetch spaces:", error)
      throw new Error(`Failed to fetch spaces: ${error.message}`)
    }

    console.log("✅ Fetched spaces:", spaces?.length || 0)

    // Create mapping with space details
    const mappingWithDetails = Object.entries(SKU_TO_SPACE).map(([sku, spaceId]) => {
      const spaceDetails = spaces?.find((space) => space.id === spaceId)
      return {
        sku,
        spaceId,
        spaceExists: !!spaceDetails,
        spaceDetails: spaceDetails
          ? {
              name: spaceDetails.name,
              location: spaceDetails.location,
              hourly_rate: spaceDetails.hourly_rate,
              daily_rate: spaceDetails.daily_rate,
              monthly_rate: spaceDetails.monthly_rate,
            }
          : null,
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      hardcodedSpaceIds: SPACE_IDS,
      skuToSpaceMapping: SKU_TO_SPACE,
      mappingWithDetails,
      totalSpacesFound: spaces?.length || 0,
      allSpacesExist: mappingWithDetails.every((m) => m.spaceExists),
      message: "Space mapping and details retrieved successfully",
    })
  } catch (error) {
    console.error("❌ Failed to get test spaces:", error)
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
