import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer, isSupabaseConfigured } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Supabase Configuration")

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseConfigured: isSupabaseConfigured(),
    }

    console.log("Environment variables:", envCheck)

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          envCheck,
          message: "Environment variables missing",
        },
        { status: 500 },
      )
    }

    // Test database connection by fetching spaces
    console.log("🔍 Testing database connection...")

    const { data: allSpaces, error: allError } = await supabaseServer.from("spaces").select("*").limit(5)

    if (allError) {
      console.error("❌ Error fetching spaces:", allError)
      return NextResponse.json(
        {
          error: allError.message,
          envCheck,
          supabaseError: allError,
        },
        { status: 500 },
      )
    }

    console.log(`✅ Found ${allSpaces?.length || 0} spaces in database`)

    // Test search functionality
    const { data: searchResults, error: searchError } = await supabaseServer
      .from("spaces")
      .select("*")
      .eq("is_available", true)
      .limit(3)

    if (searchError) {
      console.error("❌ Search error:", searchError)
      return NextResponse.json(
        {
          error: searchError.message,
          envCheck,
          allSpaces: allSpaces || [],
          supabaseError: searchError,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      envCheck,
      totalSpaces: allSpaces?.length || 0,
      availableSpaces: searchResults?.length || 0,
      sampleSpaces: allSpaces?.slice(0, 3) || [],
      availableSpacesSample: searchResults || [],
      message: "Supabase connection working correctly",
    })
  } catch (error) {
    console.error("❌ Debug API error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
