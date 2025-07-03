import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku = "parking-hour", customerName = "Test User", customerEmail = "test@example.com" } = body

    console.log(`🧪 Manual test order creation for SKU: ${sku}`)

    const orderPayload = {
      sku: sku,
      quantity: 1,
      customerDetails: {
        name: customerName,
        email: customerEmail,
        phone: "+44 7700 900123",
      },
      bookingDetails: {
        vehicleReg: "TEST123",
        vehicleType: "car",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "10:00",
        specialRequests: `Manual test booking for ${sku} at ${new Date().toISOString()}`,
      },
    }

    // Call the create-order endpoint
    const orderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/commerce-layer/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      },
    )

    const orderData = await orderResponse.json()

    // Check database for the booking
    let bookingRecord = null
    if (orderData.bookingId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseKey) {
          const { createClient } = await import("@supabase/supabase-js")
          const supabase = createClient(supabaseUrl, supabaseKey)

          const { data: booking, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("id", orderData.bookingId)
            .single()

          if (!error && booking) {
            bookingRecord = booking
          }
        }
      } catch (dbError) {
        console.error("Error fetching booking record:", dbError)
      }
    }

    return NextResponse.json({
      success: orderResponse.ok,
      status: orderResponse.status,
      orderData: orderData,
      bookingRecord: bookingRecord,
      testPayload: orderPayload,
      timestamp: new Date().toISOString(),
      message: orderResponse.ok
        ? `✅ Order created successfully! Order ID: ${orderData.orderId}, Space ID: ${orderData.spaceId}`
        : `❌ Order creation failed: ${orderData.error}`,
    })
  } catch (error) {
    console.error("Manual test order failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Manual test order endpoint",
    usage: "POST /api/manual-test-order",
    payload: {
      sku: "parking-hour | parking-day | parking-month",
      customerName: "Your Name",
      customerEmail: "your@email.com",
    },
    examples: [
      {
        description: "Test hourly parking",
        payload: { sku: "parking-hour", customerName: "John Doe", customerEmail: "john@example.com" },
      },
      {
        description: "Test daily parking",
        payload: { sku: "parking-day", customerName: "Jane Smith", customerEmail: "jane@example.com" },
      },
      {
        description: "Test monthly parking",
        payload: { sku: "parking-month", customerName: "Bob Wilson", customerEmail: "bob@example.com" },
      },
    ],
  })
}
