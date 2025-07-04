import { NextResponse } from "next/server"
import { DeployedDemoStoreIntegration, type ParkpalBookingRequest } from "@/lib/deployed-demo-store-integration"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    console.log("🚗 Processing Parkpal booking via deployed demo-store-core...")
    console.log("🌐 Backend: park-pal-core-website-prnz.vercel.app")

    const bookingData: ParkpalBookingRequest = await request.json()

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

    const missingFields = requiredFields.filter((field) => !bookingData[field as keyof ParkpalBookingRequest])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
          receivedData: Object.keys(bookingData),
        },
        { status: 400 },
      )
    }

    // Initialize deployed demo store integration
    const deployedDemoStore = new DeployedDemoStoreIntegration()

    // Get integration status first
    console.log("🔍 Checking integration status...")
    const status = await deployedDemoStore.getStatus()

    console.log("📊 Integration status:", {
      backend: status.backend.connected ? "✅ Connected" : "❌ Disconnected",
      commerceLayer: status.commerceLayer.authenticated ? "✅ Authenticated" : "❌ Failed",
      skus: status.skus.verified ? "✅ Verified" : "❌ Failed",
      overall: status.overall,
    })

    if (status.overall === "FAILED") {
      return NextResponse.json(
        {
          error: "Integration not ready",
          status,
          message: "Commerce Layer authentication or SKU verification failed",
        },
        { status: 503 },
      )
    }

    // Create booking through Commerce Layer (direct approach due to backend issues)
    const order = await deployedDemoStore.createParkingBooking({
      ...bookingData,
      startDate: new Date(bookingData.startDate),
      endDate: new Date(bookingData.endDate),
      quantity: bookingData.quantity || 1,
    })

    console.log("✅ Order created:", order.id)

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
            deployed_demo_store_integration: true,
            deployed_backend_url: "park-pal-core-website-prnz.vercel.app",
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
      message: "Parkpal booking created successfully",
      integration: {
        backend: {
          url: "park-pal-core-website-prnz.vercel.app",
          connected: status.backend.connected,
          status: status.backend.connected ? "Connected" : "Using fallback",
        },
        commerceLayer: {
          authenticated: status.commerceLayer.authenticated,
        },
        skus: {
          verified: status.skus.verified,
        },
        overall: status.overall,
      },
      booking: {
        id: supabaseBookingId,
        deployedDemoStoreOrderId: order.id,
        customerId: order.customerId,
        total: order.total,
        currency: order.currency,
        status: order.status,
        checkoutUrl: order.checkoutUrl,
        paymentUrl: order.paymentUrl,
        lineItems: order.lineItems,
      },
    })
  } catch (error) {
    console.error("❌ Deployed demo store booking creation failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: errorMessage,
        backend: {
          url: "park-pal-core-website-prnz.vercel.app",
          connected: false,
        },
        details: errorStack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Parkpal deployed demo-store-core booking integration",
    usage: "POST /api/parkpal/deployed-booking",
    deployedBackend: {
      url: "park-pal-core-website-prnz.vercel.app",
      repo: "https://github.com/MRPEATWORLWIDE/park-pal-core",
    },
    integration: "Uses your deployed demo-store-core backend with Commerce Layer fallback",
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
