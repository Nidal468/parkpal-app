import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const all = searchParams.get("all")

    console.log("🔍 Test Search API called with:", { location, all })

    let query = supabaseServer.from("spaces").select("*")

    if (all === "true") {
      // Get all spaces to see what's in the database
      console.log("📊 Fetching ALL spaces from database...")
    } else if (location) {
      // Test location search
      console.log(`📍 Searching for location: "${location}"`)
      query = query.ilike("location", `%${location}%`)
    }

    const { data, error } = await query.limit(10)

    if (error) {
      console.error("❌ Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Found ${data?.length || 0} spaces`)

    // Log detailed info about each space
    data?.forEach((space, index) => {
      console.log(`Space ${index + 1}:`)
      console.log(`  - ID: ${space.id}`)
      console.log(`  - Title: ${space.title}`)
      console.log(`  - Location: ${space.location}`)
      console.log(`  - Available: ${space.is_available} (type: ${typeof space.is_available})`)
      console.log(`  - Price: ${space.price_per_day} (type: ${typeof space.price_per_day})`)
      console.log(`  - Available from: ${space.available_from}`)
      console.log(`  - Available to: ${space.available_to}`)
      console.log(`  - Features: ${space.features} (type: ${typeof space.features})`)
      console.log("")
    })

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("❌ Test search error:", error)
    return NextResponse.json({ error: "Test search failed" }, { status: 500 })
  }
}
