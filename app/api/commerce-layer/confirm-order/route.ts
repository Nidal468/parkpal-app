import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Confirm order request:", body)

    const { orderId, paymentIntentId } = body

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        {
          error: "Missing orderId or paymentIntentId",
        },
        { status: 400 },
      )
    }

    // Update booking status in database if configured
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { error } = await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", orderId)

        if (error) {
          console.error("❌ Database update error:", error)
        } else {
          console.log("✅ Booking confirmed in database:", orderId)
        }
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
    }

    const response = {
      success: true,
      message: "Order confirmed successfully",
      orderId,
      paymentIntentId,
      bookingReference: `PK${orderId.toString().padStart(6, "0")}`,
    }

    console.log("✅ Confirm order response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Confirm order error:", error)
    return NextResponse.json(
      {
        error: "Failed to confirm order",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
