import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📝 Create order request:", body)

    const { sku, quantity = 1, customerDetails, bookingDetails } = body

    // Validate required fields
    if (!sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 })
    }

    if (!customerDetails?.name || !customerDetails?.email) {
      return NextResponse.json(
        {
          error: "Customer name and email are required",
        },
        { status: 400 },
      )
    }

    // SKU to price mapping - these should match your Commerce Layer products
    const skuPrices: Record<string, number> = {
      parking_hour_test: 8,
      parking_day_test: 45,
      parking_month_test: 280,
      // Add your real Commerce Layer SKUs here
      "parking-hour": 8,
      "parking-day": 45,
      "parking-month": 280,
    }

    const price = skuPrices[sku]
    if (!price) {
      return NextResponse.json(
        {
          error: `Unknown SKU: ${sku}. Available SKUs: ${Object.keys(skuPrices).join(", ")}`,
        },
        { status: 400 },
      )
    }

    const totalAmount = price * quantity

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("⚠️ Stripe not configured - simulating order creation")

      // Simulate successful order creation for testing
      const mockOrderId = `test_order_${Date.now()}`
      const mockPaymentIntentId = `pi_test_${Date.now()}`

      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        paymentIntentId: mockPaymentIntentId,
        clientSecret: `${mockPaymentIntentId}_secret_test`,
        amount: totalAmount,
        currency: "gbp",
        sku,
        message: "Test mode - Stripe not configured",
      })
    }

    // Initialize Stripe dynamically
    const Stripe = (await import("stripe")).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert to pence
      currency: "gbp",
      metadata: {
        sku,
        quantity: quantity.toString(),
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        vehicleReg: bookingDetails?.vehicleReg || "",
      },
    })

    // Try to store in database if configured
    let bookingId = null
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data, error } = await supabase
          .from("bookings")
          .insert({
            user_id: "test-user",
            space_id: "test-space-1",
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone || null,
            vehicle_registration: bookingDetails?.vehicleReg || null,
            vehicle_type: bookingDetails?.vehicleType || "car",
            total_price: totalAmount,
            status: "pending",
            payment_intent_id: paymentIntent.id,
            sku: sku,
            duration_type: sku.includes("hour") ? "hour" : sku.includes("day") ? "day" : "month",
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("❌ Database error:", error)
        } else {
          bookingId = data?.id
          console.log("✅ Booking stored in database:", bookingId)
        }
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
    }

    const response = {
      success: true,
      orderId: bookingId || `order_${Date.now()}`,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      currency: "gbp",
      sku,
    }

    console.log("✅ Create order response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Create order error:", error)
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}
