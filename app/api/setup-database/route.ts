import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Setting up database with real parking spaces...")

    // First, let's insert the host users
    const hostUsers = [
      { id: "host-001", email: "sarah@example.com", name: "Sarah Johnson", role: "host" },
      { id: "host-002", email: "mike@example.com", name: "Mike Chen", role: "host" },
      { id: "host-003", email: "emma@example.com", name: "Emma Williams", role: "host" },
      { id: "host-004", email: "david@example.com", name: "David Brown", role: "host" },
      { id: "host-005", email: "lisa@example.com", name: "Lisa Davis", role: "host" },
      { id: "host-006", email: "james@example.com", name: "James Wilson", role: "host" },
      { id: "host-007", email: "anna@example.com", name: "Anna Taylor", role: "host" },
      { id: "host-008", email: "tom@example.com", name: "Tom Anderson", role: "host" },
    ]

    // Insert hosts (ignore conflicts if they already exist)
    for (const host of hostUsers) {
      const { error: hostError } = await supabaseServer.from("users").upsert(host, { onConflict: "id" })

      if (hostError) {
        console.log(`Host ${host.id} might already exist:`, hostError.message)
      }
    }

    // Now insert the parking spaces
    const parkingSpaces = [
      {
        id: "space-se17-001",
        host_id: "host-001",
        title: "Secure Driveway - Kennington",
        location: "Kennington, SE17",
        address: "45 Kennington Road",
        postcode: "SE17 2BB",
        features: "Secure, CCTV, Residential",
        is_available: true,
        description: "Private driveway in quiet residential street. 5 minutes walk to Kennington tube station.",
        price_per_day: 15.0,
        available_from: "2024-01-01",
        available_to: "2024-12-31",
        latitude: 51.4879,
        longitude: -0.1059,
        what3words: "index.home.raft",
        available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        available_hours: "00:00-23:59",
      },
      {
        id: "space-se17-002",
        host_id: "host-002",
        title: "Covered Parking Bay - SE17",
        location: "Kennington, SE17",
        address: "78 Kennington Park Road",
        postcode: "SE17 3HD",
        features: "Covered, 24/7 Access",
        is_available: true,
        description: "Covered parking space in modern development. Perfect for daily commuters.",
        price_per_day: 12.0,
        available_from: "2024-01-01",
        available_to: "2024-12-31",
        latitude: 51.4901,
        longitude: -0.1089,
        what3words: "parks.lions.drums",
        available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        available_hours: "00:00-23:59",
      },
      {
        id: "space-se17-003",
        host_id: "host-003",
        title: "Underground Garage - Elephant & Castle",
        location: "Elephant & Castle, SE17",
        address: "12 New Kent Road",
        postcode: "SE17 1UE",
        features: "Underground, 24/7 Security, Electric Charging",
        is_available: true,
        description: "Secure underground parking with EV charging points. 2 minutes from Elephant & Castle station.",
        price_per_day: 20.0,
        available_from: "2024-01-01",
        available_to: "2024-12-31",
        latitude: 51.4946,
        longitude: -0.0999,
        what3words: "castle.trunk.spoon",
        available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        available_hours: "00:00-23:59",
      },
      {
        id: "space-se1-001",
        host_id: "host-004",
        title: "Private Garage - Borough",
        location: "Borough, SE1",
        address: "156 Borough High Street",
        postcode: "SE1 1LB",
        features: "Private Garage, Secure",
        is_available: true,
        description: "Private garage near Borough Market. Walking distance to London Bridge station.",
        price_per_day: 18.0,
        available_from: "2024-01-01",
        available_to: "2024-12-31",
        latitude: 51.5016,
        longitude: -0.0929,
        what3words: "market.fresh.bread",
        available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        available_hours: "00:00-23:59",
      },
      {
        id: "space-se1-002",
        host_id: "host-005",
        title: "Riverside Parking - London Bridge",
        location: "London Bridge, SE1",
        address: "89 Tooley Street",
        postcode: "SE1 2TF",
        features: "River Views, Premium Location",
        is_available: true,
        description: "Premium parking space with Thames views. Perfect for business meetings in the City.",
        price_per_day: 25.0,
        available_from: "2024-01-01",
        available_to: "2024-12-31",
        latitude: 51.5045,
        longitude: -0.0865,
        what3words: "bridge.water.tower",
        available_days: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
        available_hours: "06:00-22:00",
      },
    ]

    // Insert parking spaces
    const { data: insertedSpaces, error: spacesError } = await supabaseServer
      .from("spaces")
      .upsert(parkingSpaces, { onConflict: "id" })

    if (spacesError) {
      console.error("❌ Error inserting spaces:", spacesError)
      return NextResponse.json({
        success: false,
        error: "Failed to insert parking spaces",
        details: spacesError,
      })
    }

    // Verify the insertion
    const { data: allSpaces, error: verifyError } = await supabaseServer.from("spaces").select("*")

    if (verifyError) {
      console.error("❌ Error verifying spaces:", verifyError)
    }

    return NextResponse.json({
      success: true,
      message: "✅ Successfully inserted real parking spaces into your Supabase database!",
      spacesInserted: parkingSpaces.length,
      hostsInserted: hostUsers.length,
      totalSpacesInDB: allSpaces?.length || 0,
      sampleSpaces: allSpaces?.slice(0, 3) || [],
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Database setup error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
