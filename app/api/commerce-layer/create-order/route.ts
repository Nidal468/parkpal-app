import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("🚀 Commerce Layer - Create order request:", body)

    const { sku, quantity = 1, customerDetails, bookingDetails } = body

    // Validate required fields
    if (!sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 })
    }

    if (!customerDetails?.name || !customerDetails?.email) {
      return NextResponse.json({ error: "Customer name and email are required" }, { status: 400 })
    }

    // Check Commerce Layer environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL || "https://yourdomain.commercelayer.io"

    if (!clClientId || !clClientSecret) {
      return NextResponse.json(
        {
          error: "Commerce Layer not configured",
          details: "Missing COMMERCE_LAYER_CLIENT_ID or COMMERCE_LAYER_CLIENT_SECRET",
        },
        { status: 500 },
      )
    }

    // Import Commerce Layer SDK dynamically
    const { CommerceLayer, Order, LineItem, Customer }: any = null

    // Initialize Commerce Layer client
    const cl = CommerceLayer({
      organization: clBaseUrl.replace("https://", "").replace(".commercelayer.io", ""),
      accessToken: await getAccessToken(clClientId, clClientSecret, clBaseUrl),
    })

    console.log("✅ Commerce Layer client initialized")

    // Step 1: Create or get customer
    let customer
    try {
      // Try to find existing customer by email
      const existingCustomers = await cl.customers.list({
        filters: { email_eq: customerDetails.email },
      })

      if (existingCustomers.length > 0) {
        customer = existingCustomers[0]
        console.log("✅ Found existing customer:", customer.id)
      } else {
        // Create new customer
        customer = await cl.customers.create({
          email: customerDetails.email,
          first_name: customerDetails.name.split(" ")[0] || customerDetails.name,
          last_name: customerDetails.name.split(" ").slice(1).join(" ") || "",
          metadata: {
            vehicle_registration: bookingDetails?.vehicleReg || "",
            source: "parkpal_booking",
          },
        })
        console.log("✅ Created new customer:", customer.id)
      }
    } catch (customerError) {
      console.error("❌ Customer creation error:", customerError)
      return NextResponse.json({ error: "Failed to create/find customer", details: customerError }, { status: 500 })
    }

    // Step 2: Create order
    let order
    try {
      order = await cl.orders.create({
        customer: cl.customers.relationship(customer.id),
        currency_code: "GBP",
        language_code: "en",
        metadata: {
          booking_type: "parking",
          vehicle_registration: bookingDetails?.vehicleReg || "",
          start_date: bookingDetails?.startDate || new Date().toISOString().split("T")[0],
          start_time: bookingDetails?.startTime || "09:00",
          customer_name: customerDetails.name,
          source: "parkpal_test",
        },
      })
      console.log("✅ Created order:", order.id)
    } catch (orderError) {
      console.error("❌ Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order", details: orderError }, { status: 500 })
    }

    // Step 3: Add line item (SKU) to order
    try {
      const lineItem = await cl.line_items.create({
        order: cl.orders.relationship(order.id),
        sku_code: sku,
        quantity: quantity,
        metadata: {
          vehicle_registration: bookingDetails?.vehicleReg || "",
          booking_duration: sku.includes("hour") ? "1 hour" : sku.includes("day") ? "1 day" : "1 month",
        },
      })
      console.log("✅ Added line item:", lineItem.id, "SKU:", sku)
    } catch (lineItemError) {
      console.error("❌ Line item creation error:", lineItemError)
      return NextResponse.json(
        {
          error: "Failed to add SKU to order",
          details: lineItemError,
          sku: sku,
          message: "Make sure this SKU exists in your Commerce Layer catalog",
        },
        { status: 500 },
      )
    }

    // Step 4: Get updated order with totals
    const updatedOrder = await cl.orders.retrieve(order.id, {
      include: ["line_items", "line_items.item"],
    })

    // Step 5: Store booking in database
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
            user_id: customer.id,
            space_id: "test-space-1",
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone || null,
            vehicle_registration: bookingDetails?.vehicleReg || null,
            vehicle_type: bookingDetails?.vehicleType || "car",
            total_price: Number.parseFloat(updatedOrder.total_amount_cents) / 100,
            status: "pending",
            commerce_layer_order_id: order.id,
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
      orderId: order.id,
      bookingId: bookingId,
      commerceLayerOrderId: order.id,
      customerId: customer.id,
      amount: Number.parseFloat(updatedOrder.total_amount_cents) / 100,
      currency: updatedOrder.currency_code,
      sku: sku,
      status: updatedOrder.status,
      paymentRequired: updatedOrder.total_amount_cents > 0,
      // For Stripe integration, we'll need to create payment intent in next step
      clientSecret: null, // Will be set when payment method is added
    }

    console.log("✅ Commerce Layer order created successfully:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Commerce Layer create order error:", error)
    return NextResponse.json(
      {
        error: "Failed to create Commerce Layer order",
        details: error instanceof Error ? error.message : "Unknown error",
        success: false,
      },
      { status: 500 },
    )
  }
}

// Helper function to get Commerce Layer access token
async function getAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  try {
    const response = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("✅ Commerce Layer access token obtained")
    return data.access_token
  } catch (error) {
    console.error("❌ Failed to get Commerce Layer access token:", error)
    throw error
  }
}
