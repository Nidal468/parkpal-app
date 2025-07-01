import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Add debugging as suggested by ChatGPT
    console.log("✅ Incoming request body:", body)
    console.log("✅ Environment check:", {
      clClientId: process.env.COMMERCE_LAYER_CLIENT_ID ? "set" : "missing",
      clClientSecret: process.env.COMMERCE_LAYER_CLIENT_SECRET ? "set" : "missing",
      clBaseUrl: process.env.COMMERCE_LAYER_BASE_URL,
      clMarketId: process.env.COMMERCE_LAYER_MARKET_ID,
      stripeKey: process.env.STRIPE_SECRET_KEY ? "set" : "missing",
    })

    console.log("🚀 Commerce Layer - Create order request:", body)

    const { sku, quantity = 1, customerDetails, bookingDetails } = body

    // Validate required fields
    if (!sku) {
      console.error("❌ Missing SKU in request")
      return NextResponse.json({ error: "SKU is required" }, { status: 400 })
    }

    if (!customerDetails?.name || !customerDetails?.email) {
      console.error("❌ Missing customer details")
      return NextResponse.json({ error: "Customer name and email are required" }, { status: 400 })
    }

    // Check Commerce Layer environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    console.log("🔧 Environment check:", {
      hasClientId: !!clClientId,
      hasClientSecret: !!clClientSecret,
      baseUrl: clBaseUrl,
      marketId: clMarketId,
    })

    if (!clClientId || !clClientSecret) {
      console.error("❌ Missing Commerce Layer credentials")
      return NextResponse.json(
        {
          error: "Commerce Layer not configured",
          details: "Missing COMMERCE_LAYER_CLIENT_ID or COMMERCE_LAYER_CLIENT_SECRET",
        },
        { status: 500 },
      )
    }

    if (!clBaseUrl) {
      console.error("❌ Missing Commerce Layer base URL")
      return NextResponse.json(
        {
          error: "Commerce Layer base URL not configured",
          details: "Missing COMMERCE_LAYER_BASE_URL",
        },
        { status: 500 },
      )
    }

    if (!clMarketId) {
      console.error("❌ Missing Commerce Layer market ID")
      return NextResponse.json(
        {
          error: "Commerce Layer market not configured",
          details: "Missing COMMERCE_LAYER_MARKET_ID",
        },
        { status: 500 },
      )
    }

    // Validate Stripe credentials are TEST keys
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (stripeSecretKey && !stripeSecretKey.startsWith("sk_test_")) {
      console.error("❌ Using live Stripe secret key with test Commerce Layer!")
      return NextResponse.json(
        {
          error: "Invalid Stripe configuration",
          details: "Please use Stripe TEST credentials (sk_test_...) not live credentials",
        },
        { status: 500 },
      )
    }

    if (stripePublishableKey && !stripePublishableKey.startsWith("pk_test_")) {
      console.error("❌ Using live Stripe publishable key with test Commerce Layer!")
      return NextResponse.json(
        {
          error: "Invalid Stripe configuration",
          details: "Please use Stripe TEST credentials (pk_test_...) not live credentials",
        },
        { status: 500 },
      )
    }

    // Get Commerce Layer access token with market scope
    console.log("🔑 Getting access token...")
    let accessToken: string
    try {
      accessToken = await getAccessTokenWithMarketScope(clClientId, clClientSecret, clBaseUrl, clMarketId)
      console.log("✅ Commerce Layer access token obtained")
    } catch (tokenError) {
      console.error("❌ Failed to get access token:", tokenError)
      return NextResponse.json(
        {
          error: "Failed to authenticate with Commerce Layer",
          details: tokenError instanceof Error ? tokenError.message : "Unknown authentication error",
        },
        { status: 500 },
      )
    }

    // Initialize Commerce Layer API base URL
    const apiBase = `${clBaseUrl}/api`

    // Step 1: Create or get customer
    let customer: any
    try {
      console.log("👤 Creating/finding customer...")

      // Try to find existing customer by email
      const customersResponse = await fetch(
        `${apiBase}/customers?filter[email_eq]=${encodeURIComponent(customerDetails.email)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        },
      )

      if (!customersResponse.ok) {
        const errorText = await customersResponse.text()
        console.error("❌ Customer search failed:", customersResponse.status, errorText)
        throw new Error(`Customer search failed: ${customersResponse.status} ${errorText}`)
      }

      const customersData = await customersResponse.json()
      console.log("👤 Customer search response:", customersData)

      if (customersData.data && customersData.data.length > 0) {
        customer = customersData.data[0]
        console.log("✅ Found existing customer:", customer.id)
      } else {
        // Create new customer
        const customerPayload = {
          data: {
            type: "customers",
            attributes: {
              email: customerDetails.email,
              first_name: customerDetails.name.split(" ")[0] || customerDetails.name,
              last_name: customerDetails.name.split(" ").slice(1).join(" ") || "",
              metadata: {
                vehicle_registration: bookingDetails?.vehicleReg || "",
                source: "parkpal_booking",
                market_id: clMarketId,
              },
            },
          },
        }

        console.log("👤 Creating customer with payload:", customerPayload)

        const createCustomerResponse = await fetch(`${apiBase}/customers`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify(customerPayload),
        })

        if (!createCustomerResponse.ok) {
          const errorText = await createCustomerResponse.text()
          console.error("❌ Customer creation failed:", createCustomerResponse.status, errorText)
          throw new Error(`Customer creation failed: ${createCustomerResponse.status} ${errorText}`)
        }

        const customerData = await createCustomerResponse.json()
        console.log("👤 Customer creation response:", customerData)

        customer = customerData.data
        console.log("✅ Created new customer:", customer.id)
      }
    } catch (customerError) {
      console.error("❌ Customer creation error:", customerError)
      return NextResponse.json(
        {
          error: "Failed to create/find customer",
          details: customerError instanceof Error ? customerError.message : "Unknown customer error",
        },
        { status: 500 },
      )
    }

    // Step 2: Create order with market association
    let order: any
    try {
      console.log("📦 Creating order...")

      const orderPayload = {
        data: {
          type: "orders",
          attributes: {
            currency_code: "GBP",
            language_code: "en",
            metadata: {
              booking_type: "parking",
              vehicle_registration: bookingDetails?.vehicleReg || "",
              start_date: bookingDetails?.startDate || new Date().toISOString().split("T")[0],
              start_time: bookingDetails?.startTime || "09:00",
              customer_name: customerDetails.name,
              source: "parkpal_booking",
              market_id: clMarketId,
            },
          },
          relationships: {
            customer: {
              data: {
                type: "customers",
                id: customer.id,
              },
            },
            market: {
              data: {
                type: "markets",
                id: clMarketId,
              },
            },
          },
        },
      }

      console.log("📦 Creating order with payload:", orderPayload)

      const createOrderResponse = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(orderPayload),
      })

      if (!createOrderResponse.ok) {
        const errorText = await createOrderResponse.text()
        console.error("❌ Order creation failed:", createOrderResponse.status, errorText)
        throw new Error(`Order creation failed: ${createOrderResponse.status} ${errorText}`)
      }

      const orderData = await createOrderResponse.json()
      console.log("📦 Order creation response:", orderData)

      order = orderData.data
      console.log("✅ Created order:", order.id)
    } catch (orderError) {
      console.error("❌ Order creation error:", orderError)
      return NextResponse.json(
        {
          error: "Failed to create order",
          details: orderError instanceof Error ? orderError.message : "Unknown order error",
        },
        { status: 500 },
      )
    }

    // Step 3: Add line item (SKU) to order
    try {
      console.log("🛒 Adding line item with SKU:", sku)

      const lineItemPayload = {
        data: {
          type: "line_items",
          attributes: {
            sku_code: sku,
            quantity: quantity,
            metadata: {
              vehicle_registration: bookingDetails?.vehicleReg || "",
              booking_duration: sku.includes("hour") ? "1 hour" : sku.includes("day") ? "1 day" : "1 month",
              market_id: clMarketId,
            },
          },
          relationships: {
            order: {
              data: {
                type: "orders",
                id: order.id,
              },
            },
          },
        },
      }

      console.log("🛒 Line item payload:", lineItemPayload)

      const createLineItemResponse = await fetch(`${apiBase}/line_items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(lineItemPayload),
      })

      if (!createLineItemResponse.ok) {
        const errorText = await createLineItemResponse.text()
        console.error("❌ Line item creation failed:", createLineItemResponse.status, errorText)
        throw new Error(`Line item creation failed: ${createLineItemResponse.status} ${errorText}`)
      }

      const lineItemData = await createLineItemResponse.json()
      console.log("🛒 Line item response:", lineItemData)

      console.log("✅ Added line item:", lineItemData.data.id, "SKU:", sku)
    } catch (lineItemError) {
      console.error("❌ Line item creation error:", lineItemError)
      return NextResponse.json(
        {
          error: "Failed to add SKU to order",
          details: lineItemError instanceof Error ? lineItemError.message : "Unknown line item error",
          sku: sku,
          market: clMarketId,
          message: `Make sure SKU '${sku}' exists in your Commerce Layer catalog and is available in market '${clMarketId}'`,
        },
        { status: 500 },
      )
    }

    // Step 4: Get updated order with totals
    let updatedOrder: any
    try {
      console.log("🔄 Fetching updated order...")
      const updatedOrderResponse = await fetch(
        `${apiBase}/orders/${order.id}?include=line_items,line_items.item,market`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
        },
      )

      if (!updatedOrderResponse.ok) {
        const errorText = await updatedOrderResponse.text()
        console.error("❌ Failed to fetch updated order:", updatedOrderResponse.status, errorText)
        throw new Error(`Failed to fetch updated order: ${updatedOrderResponse.status} ${errorText}`)
      }

      const updatedOrderData = await updatedOrderResponse.json()
      console.log("🔄 Updated order response:", updatedOrderData)
      updatedOrder = updatedOrderData.data
    } catch (fetchError) {
      console.error("❌ Failed to fetch updated order:", fetchError)
      return NextResponse.json(
        {
          error: "Failed to fetch updated order",
          details: fetchError instanceof Error ? fetchError.message : "Unknown fetch error",
        },
        { status: 500 },
      )
    }

    // Step 5: Create Stripe Payment Intent for the order total
    let paymentIntent: any = null
    let clientSecret: string | null = null

    if (stripeSecretKey && updatedOrder.attributes.total_amount_cents > 0) {
      try {
        console.log("💳 Creating Stripe Payment Intent...")
        const Stripe = (await import("stripe")).default
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: "2024-12-18.acacia",
        })

        paymentIntent = await stripe.paymentIntents.create({
          amount: updatedOrder.attributes.total_amount_cents,
          currency: updatedOrder.attributes.currency_code.toLowerCase(),
          metadata: {
            commerce_layer_order_id: order.id,
            commerce_layer_market_id: clMarketId,
            customer_id: customer.id,
            sku: sku,
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            vehicle_reg: bookingDetails?.vehicleReg || "",
          },
        })

        clientSecret = paymentIntent.client_secret
        console.log("✅ Stripe Payment Intent created:", paymentIntent.id)
      } catch (stripeError) {
        console.error("❌ Stripe Payment Intent creation error:", stripeError)
        return NextResponse.json(
          {
            error: "Failed to create Stripe Payment Intent",
            details: stripeError instanceof Error ? stripeError.message : "Unknown Stripe error",
          },
          { status: 500 },
        )
      }
    } else {
      console.log("ℹ️ No Stripe payment required - order total is 0 or Stripe not configured")
    }

    // Step 6: Store booking in database
    let bookingId: string | null = null
    try {
      console.log("💾 Storing booking in database...")
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
            total_price: Number.parseFloat(updatedOrder.attributes.total_amount_cents) / 100,
            status: "pending",
            commerce_layer_order_id: order.id,
            commerce_layer_customer_id: customer.id,
            commerce_layer_market_id: clMarketId,
            stripe_payment_intent_id: paymentIntent?.id || null,
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
      marketId: clMarketId,
      amount: Number.parseFloat(updatedOrder.attributes.total_amount_cents) / 100,
      currency: updatedOrder.attributes.currency_code,
      sku: sku,
      status: updatedOrder.attributes.status,
      paymentRequired: updatedOrder.attributes.total_amount_cents > 0,
      clientSecret: clientSecret,
      paymentIntentId: paymentIntent?.id || null,
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

// Helper function to get Commerce Layer access token with market scope
async function getAccessTokenWithMarketScope(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
  marketId: string,
): Promise<string> {
  console.log("🔑 Requesting access token with market scope...")
  console.log("🔑 Token request details:", {
    baseUrl,
    marketId,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
  })

  const tokenPayload = {
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: `market:${marketId}`,
  }

  console.log("🔑 Token payload:", { ...tokenPayload, client_secret: "[REDACTED]" })

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tokenPayload),
  })

  console.log("🔑 Token response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("🔑 Token error response:", errorText)
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  console.log("✅ Access token obtained successfully")
  return data.access_token
}
