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
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID

    if (!clClientId || !clClientSecret) {
      return NextResponse.json(
        {
          error: "Commerce Layer not configured",
          details: "Missing COMMERCE_LAYER_CLIENT_ID or COMMERCE_LAYER_CLIENT_SECRET",
        },
        { status: 500 },
      )
    }

    if (!clMarketId) {
      return NextResponse.json(
        {
          error: "Commerce Layer market not configured",
          details: "Missing COMMERCE_LAYER_MARKET_ID - This is required for multi-market setups",
        },
        { status: 500 },
      )
    }

    // Get Commerce Layer access token with market scope
    const accessToken = await getAccessTokenWithMarketScope(clClientId, clClientSecret, clBaseUrl, clMarketId)
    console.log("✅ Commerce Layer access token obtained with market scope:", clMarketId)

    // Initialize Commerce Layer API base URL
    const apiBase = `${clBaseUrl}/api`

    // Step 1: Create or get customer
    let customer
    try {
      // Try to find existing customer by email
      const customersResponse = await fetch(`${apiBase}/customers?filter[email_eq]=${customerDetails.email}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      })

      const customersData = await customersResponse.json()

      if (customersData.data && customersData.data.length > 0) {
        customer = customersData.data[0]
        console.log("✅ Found existing customer:", customer.id)
      } else {
        // Create new customer
        const createCustomerResponse = await fetch(`${apiBase}/customers`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
          body: JSON.stringify({
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
          }),
        })

        const customerData = await createCustomerResponse.json()
        if (!createCustomerResponse.ok) {
          throw new Error(`Customer creation failed: ${JSON.stringify(customerData)}`)
        }
        customer = customerData.data
        console.log("✅ Created new customer:", customer.id, "in market:", clMarketId)
      }
    } catch (customerError) {
      console.error("❌ Customer creation error:", customerError)
      return NextResponse.json({ error: "Failed to create/find customer", details: customerError }, { status: 500 })
    }

    // Step 2: Create order with market association
    let order
    try {
      const createOrderResponse = await fetch(`${apiBase}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "orders",
            attributes: {
              currency_code: "GBP", // This should match your market's currency
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
        }),
      })

      const orderData = await createOrderResponse.json()
      if (!createOrderResponse.ok) {
        throw new Error(`Order creation failed: ${JSON.stringify(orderData)}`)
      }
      order = orderData.data
      console.log("✅ Created order:", order.id, "in market:", clMarketId)
    } catch (orderError) {
      console.error("❌ Order creation error:", orderError)
      return NextResponse.json({ error: "Failed to create order", details: orderError }, { status: 500 })
    }

    // Step 3: Add line item (SKU) to order
    try {
      const createLineItemResponse = await fetch(`${apiBase}/line_items`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
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
        }),
      })

      const lineItemData = await createLineItemResponse.json()
      if (!createLineItemResponse.ok) {
        throw new Error(`Line item creation failed: ${JSON.stringify(lineItemData)}`)
      }
      console.log("✅ Added line item:", lineItemData.data.id, "SKU:", sku, "in market:", clMarketId)
    } catch (lineItemError) {
      console.error("❌ Line item creation error:", lineItemError)
      return NextResponse.json(
        {
          error: "Failed to add SKU to order",
          details: lineItemError,
          sku: sku,
          market: clMarketId,
          message: `Make sure SKU '${sku}' exists in your Commerce Layer catalog and is available in market '${clMarketId}'`,
        },
        { status: 500 },
      )
    }

    // Step 4: Get updated order with totals
    const updatedOrderResponse = await fetch(
      `${apiBase}/orders/${order.id}?include=line_items,line_items.item,market`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.api+json",
        },
      },
    )

    const updatedOrderData = await updatedOrderResponse.json()
    const updatedOrder = updatedOrderData.data

    // Step 5: Create Stripe Payment Intent for the order total
    let paymentIntent = null
    let clientSecret = null

    if (process.env.STRIPE_SECRET_KEY && updatedOrder.attributes.total_amount_cents > 0) {
      try {
        const Stripe = (await import("stripe")).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
        console.log("✅ Stripe Payment Intent created:", paymentIntent.id, "for market:", clMarketId)
      } catch (stripeError) {
        console.error("❌ Stripe Payment Intent creation error:", stripeError)
        // Continue without Stripe - order is still created in Commerce Layer
      }
    }

    // Step 6: Store booking in database
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
          console.log("✅ Booking stored in database:", bookingId, "for market:", clMarketId)
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

    console.log("✅ Commerce Layer order created successfully with market scope:", response)
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
        scope: `market:${marketId}`, // This is the key addition for market scoping
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(
        `Failed to get access token: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`,
      )
    }

    const data = await response.json()
    console.log("✅ Commerce Layer access token obtained with market scope:", marketId)
    return data.access_token
  } catch (error) {
    console.error("❌ Failed to get Commerce Layer access token with market scope:", error)
    throw error
  }
}
