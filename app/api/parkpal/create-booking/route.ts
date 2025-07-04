import { NextResponse } from "next/server"
import { CommerceLayerService, type ParkingBookingData } from "@/lib/commerce-layer-service"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const bookingData: ParkingBookingData = await request.json()

    console.log("🚗 Creating Parkpal booking...")
    console.log("📋 Booking details:", {
      sku: bookingData.sku,
      customer: bookingData.customerEmail,
      vehicle: bookingData.vehicleRegistration,
      dates: `${bookingData.startDate} - ${bookingData.endDate}`,
      times: `${bookingData.startTime} - ${bookingData.endTime}`,
    })

    // Validate required fields
    const requiredFields = [
      "sku",
      "customerName",
      "customerEmail",
      "vehicleRegistration",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
    ]

    for (const field of requiredFields) {
      if (!bookingData[field as keyof ParkingBookingData]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Initialize Commerce Layer service
    const clService = new CommerceLayerService()

    // Create the booking in Commerce Layer
    const order = await clService.createParkingBooking(bookingData)

    console.log("✅ Commerce Layer order created:", order.id)

    // Store booking in Supabase for our records
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
            quantity: bookingData.quantity,
            total_amount: order.total,
            currency: order.currency,
            commerce_layer_order_id: order.id,
            commerce_layer_customer_id: order.customerId,
            status: "pending_payment",
            special_requests: bookingData.specialRequests,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (bookingError) {
          console.error("❌ Supabase booking creation failed:", bookingError)
        } else {
          console.log("✅ Supabase booking created:", booking?.id)
          supabaseBookingId = booking?.id
        }
      }
    } catch (dbError) {
      console.error("❌ Database error (non-fatal):", dbError)
    }

    return NextResponse.json({
      success: true,
      message: "Parking booking created successfully",
      booking: {
        id: supabaseBookingId,
        commerceLayerOrderId: order.id,
        customerId: order.customerId,
        total: order.total,
        currency: order.currency,
        status: order.status,
        checkoutUrl: order.checkoutUrl,
      },
    })
  } catch (error) {
    console.error("❌ Parkpal booking creation failed:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Booking creation failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Parkpal booking creation endpoint",
    usage: "POST /api/parkpal/create-booking",
    requiredFields: [
      "sku",
      "customerName",
      "customerEmail",
      "vehicleRegistration",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
    ],
    optionalFields: ["vehicleType", "specialRequests", "quantity"],
    supportedSKUs: ["HOUR", "DAY", "MONTH"],
    example: {
      sku: "DAY",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      vehicleRegistration: "AB12 CDE",
      vehicleType: "car",
      startDate: "2025-07-05T00:00:00.000Z",
      endDate: "2025-07-06T00:00:00.000Z",
      startTime: "09:00",
      endTime: "17:00",
      quantity: 1,
      specialRequests: "Near entrance please",
    },
  })
}
