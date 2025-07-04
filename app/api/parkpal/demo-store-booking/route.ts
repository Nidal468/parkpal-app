import { NextResponse } from "next/server"
import { DemoStoreIntegration, type ParkpalBookingRequest } from "@/lib/demo-store-integration"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const bookingData: ParkpalBookingRequest = await request.json()

    console.log("🚗 Processing Parkpal booking via demo-store-core...")

    // Validate required fields
    const requiredFields = [
      "customerName",
      "customerEmail",
      "vehicleRegistration",
      "sku",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
    ]

    for (const field of requiredFields) {
      if (!bookingData[field as keyof ParkpalBookingRequest]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Initialize demo store integration
    const demoStore = new DemoStoreIntegration()

    // Create booking through demo-store-core
    const order = await demoStore.createParkingBooking({
      ...bookingData,
      startDate: new Date(bookingData.startDate),
      endDate: new Date(bookingData.endDate),
      quantity: bookingData.quantity || 1,
    })

    console.log("✅ Demo store order created:", order.id)

    // Store in Supabase for our records (optional)
    let supabaseBookingId = null
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .insert({
            customer_name: bookingData.customerName,
            customer_email: bookingData.customerEmail,
            vehicle_registration: bookingData.vehicleRegistration,
            vehicle_type: bookingData.vehicleType,
            start_date: bookingData.startDate,
            end_date: bookingData.endDate,
            start_time: bookingData.startTime,
            end_time: bookingData.endTime,
            sku: bookingData.sku,
            quantity: bookingData.quantity || 1,
            total_amount: order.total,
            currency: order.currency,
            commerce_layer_order_id: order.id,
            commerce_layer_customer_id: order.customerId,
            status: "pending_payment",
            special_requests: bookingData.specialRequests,
            demo_store_integration: true,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (bookingError) {
          console.error("❌ Supabase booking creation failed:", bookingError)
        } else {
          console.log("✅ Supabase booking record created:", booking?.id)
          supabaseBookingId = booking?.id
        }
      }
    } catch (dbError) {
      console.error("❌ Database error (non-fatal):", dbError)
    }

    return NextResponse.json({
      success: true,
      message: "Parkpal booking created via demo-store-core",
      booking: {
        id: supabaseBookingId,
        demoStoreOrderId: order.id,
        customerId: order.customerId,
        total: order.total,
        currency: order.currency,
        status: order.status,
        checkoutUrl: order.checkoutUrl,
        lineItems: order.lineItems,
      },
    })
  } catch (error) {
    console.error("❌ Demo store booking creation failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Demo store booking creation failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Parkpal demo-store-core booking integration",
    usage: "POST /api/parkpal/demo-store-booking",
    demoStoreRepo: "https://github.com/MRPEATWORLWIDE/park-pal-core",
    integration: "Uses forked demo-store-core backend structure",
    requiredFields: [
      "customerName",
      "customerEmail",
      "vehicleRegistration",
      "sku",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
    ],
    supportedSKUs: {
      HOUR: "nOpOSOOmjP (parking-hour)",
      DAY: "nzPQSQQljQ (parking-day)",
      MONTH: "ZrxeSjjmvm (parking-month)",
    },
  })
}
