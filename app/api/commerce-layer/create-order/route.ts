import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting Commerce Layer order creation (Integration app with full permissions)...")

    const body = await request.json()
    console.log("📦 Request body:", JSON.stringify(body, null, 2))

    const { sku, quantity = 1, customerDetails, bookingDetails, spaceId } = body

    // Validate required fields
    if (!sku || !customerDetails?.email || !customerDetails?.name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: sku, customerDetails.email, and customerDetails.name" },
        { status: 400 },
      )
    }

    // Get environment variables
    const clClientId = process.env.COMMERCE_LAYER_CLIENT_ID
    const clClientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET
    const clBaseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const clMarketId = process.env.COMMERCE_LAYER_MARKET_ID
    const clStockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID

    if (!clClientId || !clClientSecret || !clBaseUrl || !clMarketId) {
      console.error("❌ Missing Commerce Layer environment variables")
      return NextResponse.json({ success: false, error: "Commerce Layer configuration incomplete" }, { status: 500 })
    }

    // Construct API base URL
    const apiBase = `${clBaseUrl}/api`
    console.log("🔧 Using API base URL:", apiBase)

    // Get access token using centralized function
    const accessToken = await getCommerceLayerAccessToken(clClientId, clClientSecret, clMarketId, clStockLocationId)

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    }

    // Step 1: Search for existing customer (Integration app has full permissions)
    console.log("👤 Searching for existing customer (Integration app)...")
    // Fix the filter syntax - use proper Commerce Layer filter format
    const customerSearchUrl = `${apiBase}/customers?filter[q][email_eq]=${encodeURIComponent(customerDetails.email)}`
    console.log("🔍 Customer search URL:", customerSearchUrl)

    const customersResponse = await fetch(customerSearchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    })

    let customer = null

    if (customersResponse.ok) {
      const customersData = await customersResponse.json()
      console.log("📋 Customer search response:", JSON.stringify(customersData, null, 2))

      if (customersData.data && customersData.data.length > 0) {
        customer = customersData.data[0]
        console.log("✅ Found existing customer:", customer.id)

        // Update existing customer with latest information
        try {
          const customerUpdateUrl = `${apiBase}/customers/${customer.id}`
          const customerUpdatePayload = {
            data: {
              type: "customers",
              id: customer.id,
              attributes: {
                first_name: customerDetails.name?.split(" ")[0] || customer.attributes.first_name,
                last_name: customerDetails.name?.split(" ").slice(1).join(" ") || customer.attributes.last_name,
                phone: customerDetails.phone || customer.attributes.phone,
                metadata: {
                  ...customer.attributes.metadata,
                  vehicle_registration: bookingDetails?.vehicleReg || "",
                  vehicle_type: bookingDetails?.vehicleType || "car",
                  booking_start_date: bookingDetails?.startDate || "",
                  booking_start_time: bookingDetails?.startTime || "",
                  special_requests: bookingDetails?.specialRequests || "",
                  space_id: spaceId || "",
                  last_booking_update: new Date().toISOString(),
                },
              },
            },
          }

          const updateResponse = await fetch(customerUpdateUrl, {
            method: "PATCH",
            headers,
            body: JSON.stringify(customerUpdatePayload),
          })

          if (updateResponse.ok) {
            const updatedCustomerData = await updateResponse.json()
            customer = updatedCustomerData.data
            console.log("✅ Updated existing customer with latest booking details")
          } else {
            const updateError = await updateResponse.text()
            console.warn("⚠️ Could not update customer:", updateResponse.status, updateError)
          }
        } catch (updateError) {
          console.warn("⚠️ Customer update failed, proceeding with existing data:", updateError)
        }
      }
    } else if (customersResponse.status === 404 || customersResponse.status === 422) {
      console.log("ℹ️ No existing customer found, will create new one")
    } else {
      const errorText = await customersResponse.text()
      console.error("❌ Customer search failed:", customersResponse.status, errorText)
      // Don't throw error, continue to create customer
      console.log("🔄 Continuing to customer creation despite search failure")
    }

    // Step 2: Create customer if not found (Integration app can create customers)
    if (!customer) {
      console.log("👤 Creating new customer (Integration app)...")
      const customerCreateUrl = `${apiBase}/customers`
      console.log("🔧 Customer create URL:", customerCreateUrl)

      const customerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: customerDetails.email,
            first_name: customerDetails.name?.split(" ")[0] || "Customer",
            last_name: customerDetails.name?.split(" ").slice(1).join(" ") || "",
            phone: customerDetails.phone || null,
            metadata: {
              vehicle_registration: bookingDetails?.vehicleReg || "",
              vehicle_type: bookingDetails?.vehicleType || "car",
              booking_start_date: bookingDetails?.startDate || "",
              booking_start_time: bookingDetails?.startTime || "",
              special_requests: bookingDetails?.specialRequests || "",
              space_id: spaceId || "",
              source: "parkpal_integration_app",
              created_at: new Date().toISOString(),
            },
          },
        },
      }

      console.log("👤 Creating customer with payload:", JSON.stringify(customerPayload, null, 2))

      const customerResponse = await fetch(customerCreateUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(customerPayload),
      })

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text()
        console.error("❌ Customer creation failed:", customerResponse.status, errorText)

        // Try to parse the error for more details
        try {
          const errorData = JSON.parse(errorText)
          console.error("❌ Customer creation error details:", errorData)
        } catch {
          // Error text is not JSON
        }

        throw new Error(`Customer creation failed: ${customerResponse.status} ${errorText}`)
      }

      const customerData = await customerResponse.json()
      customer = customerData.data
      console.log("✅ Created new customer:", customer.id)
    }

    // Step 3: Create order with customer relationship (Integration app has full access)
    console.log("📦 Creating order (Integration app with full permissions)...")
    const orderCreateUrl = `${apiBase}/orders`
    console.log("🔧 Order create URL:", orderCreateUrl)

    const orderPayload = {
      data: {
        type: "orders",
        attributes: {
          currency_code: "GBP",
          language_code: "en",
          customer_email: customerDetails.email,
          metadata: {
            customer_name: customerDetails.name,
            customer_phone: customerDetails.phone || "",
            vehicle_registration: bookingDetails?.vehicleReg || "",
            vehicle_type: bookingDetails?.vehicleType || "car",
            booking_start_date: bookingDetails?.startDate || "",
            booking_start_time: bookingDetails?.startTime || "",
            special_requests: bookingDetails?.specialRequests || "",
            space_id: spaceId || "",
            source: "parkpal_integration_app",
            created_at: new Date().toISOString(),
          },
        },
        relationships: {
          market: {
            data: {
              type: "markets",
              id: clMarketId,
            },
          },
          customer: {
            data: {
              type: "customers",
              id: customer.id,
            },
          },
        },
      },
    }

    console.log("📦 Creating order with payload:", JSON.stringify(orderPayload, null, 2))

    const orderResponse = await fetch(orderCreateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(orderPayload),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error("❌ Order creation failed:", orderResponse.status, errorText)

      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(errorText)
        console.error("❌ Order creation error details:", errorData)
      } catch {
        // Error text is not JSON
      }

      throw new Error(`Order creation failed: ${orderResponse.status} ${errorText}`)
    }

    const orderData = await orderResponse.json()
    const order = orderData.data
    console.log("✅ Created order:", order.id)

    // Step 4: Add line item to order
    console.log("📝 Adding line item...")
    const lineItemCreateUrl = `${apiBase}/line_items`
    console.log("🔧 Line item create URL:", lineItemCreateUrl)

    const lineItemPayload = {
      data: {
        type: "line_items",
        attributes: {
          quantity: quantity,
          sku_code: sku,
          metadata: {
            vehicle_registration: bookingDetails?.vehicleReg || "",
            booking_duration: sku.includes("hour") ? "1 hour" : sku.includes("day") ? "1 day" : "1 month",
            space_id: spaceId || "",
            customer_id: customer.id,
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

    console.log("📝 Adding line item with payload:", JSON.stringify(lineItemPayload, null, 2))

    const lineItemResponse = await fetch(lineItemCreateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(lineItemPayload),
    })

    if (!lineItemResponse.ok) {
      const errorText = await lineItemResponse.text()
      console.error("❌ Line item creation failed:", lineItemResponse.status, errorText)

      // Try to parse the error for more details
      try {
        const errorData = JSON.parse(errorText)
        console.error("❌ Line item creation error details:", errorData)
      } catch {
        // Error text is not JSON
      }

      throw new Error(`Line item creation failed: ${lineItemResponse.status} ${errorText}`)
    }

    const lineItemData = await lineItemResponse.json()
    console.log("✅ Added line item:", lineItemData.data.id)

    // Step 5: Fetch updated order with comprehensive includes
    console.log("🔄 Fetching updated order with full details...")
    const orderFetchUrl = `${apiBase}/orders/${order.id}?include=line_items,line_items.item,customer,market`
    console.log("🔧 Order fetch URL:", orderFetchUrl)

    const updatedOrderResponse = await fetch(orderFetchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.api+json",
      },
    })

    if (!updatedOrderResponse.ok) {
      const errorText = await updatedOrderResponse.text()
      console.error("❌ Order fetch failed:", updatedOrderResponse.status, errorText)
      throw new Error(`Order fetch failed: ${updatedOrderResponse.status} ${errorText}`)
    }

    const updatedOrderData = await updatedOrderResponse.json()
    const updatedOrder = updatedOrderData.data
    console.log("📋 Updated order with full details:", JSON.stringify(updatedOrder, null, 2))

    // Check if payment is required
    const totalAmountCents = updatedOrder.attributes.total_amount_cents || 0
    const formattedTotal = updatedOrder.attributes.formatted_total_amount || "£0.00"

    console.log(`💰 Order total: ${formattedTotal} (${totalAmountCents} cents)`)

    // Step 6: Create Stripe Payment Intent if payment is required
    let clientSecret = null
    let paymentIntentId = null

    if (totalAmountCents > 0) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY

      if (stripeSecretKey && stripeSecretKey.startsWith("sk_test_")) {
        try {
          console.log("💳 Creating Stripe Payment Intent...")
          const Stripe = (await import("stripe")).default
          const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2024-12-18.acacia",
          })

          const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmountCents,
            currency: "gbp",
            metadata: {
              commerce_layer_order_id: order.id,
              commerce_layer_customer_id: customer.id,
              commerce_layer_market_id: clMarketId,
              customer_email: customerDetails.email,
              customer_name: customerDetails.name,
              sku: sku,
              vehicle_reg: bookingDetails?.vehicleReg || "",
              space_id: spaceId || "",
              source: "parkpal_integration_app",
            },
          })

          clientSecret = paymentIntent.client_secret
          paymentIntentId = paymentIntent.id
          console.log("✅ Stripe Payment Intent created:", paymentIntentId)
        } catch (stripeError) {
          console.error("❌ Stripe Payment Intent creation error:", stripeError)
          // Continue without Stripe - order is still created
        }
      } else {
        console.log("⚠️ Stripe not configured or using live keys - skipping payment intent creation")
      }
    }

    // Step 7: Store booking in database
    let bookingId = null
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
            space_id: spaceId || "test-space-1",
            customer_name: customerDetails.name,
            customer_email: customerDetails.email,
            customer_phone: customerDetails.phone || null,
            vehicle_registration: bookingDetails?.vehicleReg || null,
            vehicle_type: bookingDetails?.vehicleType || "car",
            total_price: totalAmountCents / 100,
            status: "pending",
            commerce_layer_order_id: order.id,
            commerce_layer_customer_id: customer.id,
            commerce_layer_market_id: clMarketId,
            stripe_payment_intent_id: paymentIntentId,
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
      // Continue without database - order is still created
    }

    // Return comprehensive success response
    const response = {
      success: true,
      orderId: order.id,
      bookingId: bookingId,
      commerceLayerOrderId: order.id,
      customerId: customer.id,
      customerEmail: customer.attributes.email,
      marketId: clMarketId,
      amount: totalAmountCents / 100,
      currency: "GBP",
      sku: sku,
      status: updatedOrder.attributes.status,
      paymentRequired: totalAmountCents > 0,
      clientSecret: clientSecret,
      paymentIntentId: paymentIntentId,
      appType: "integration",
      capabilities: {
        customerSearch: true,
        customerUpdate: true,
        fullOrderManagement: true,
        comprehensiveIncludes: true,
      },
      message:
        totalAmountCents > 0
          ? "Order created successfully with Integration app - payment required"
          : "Order created successfully with Integration app - no payment required",
      customerStatus: customer.attributes.metadata?.source?.includes("parkpal") ? "returning" : "new",
    }

    console.log("✅ Commerce Layer order created successfully (Integration app):", JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ Commerce Layer order creation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
        appType: "integration",
      },
      { status: 500 },
    )
  }
}

// Ensure GET method returns 405 Method Not Allowed
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST to create orders." }, { status: 405 })
}
