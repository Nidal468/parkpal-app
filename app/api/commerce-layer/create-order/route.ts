import { type NextRequest, NextResponse } from "next/server"
import { getCommerceLayerAccessToken } from "@/lib/commerce-layer-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting Commerce Layer order creation...")

    const body = await request.json()
    console.log("📦 Request body:", JSON.stringify(body, null, 2))

    const { sku, quantity = 1, customerDetails, bookingDetails, spaceId } = body

    // Validate required fields
    if (!sku || !customerDetails?.email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: sku and customerDetails.email" },
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

    // Step 1: Search for existing customer
    console.log("👤 Searching for existing customer...")
    const customerSearchUrl = `${apiBase}/customers?filter[email_eq]=${encodeURIComponent(customerDetails.email)}`
    console.log("🔍 Customer search URL:", customerSearchUrl)

    const customersResponse = await fetch(customerSearchUrl, {
      method: "GET",
      headers,
    })

    let customer = null

    if (customersResponse.status === 404) {
      console.warn("⚠️ Customer not found — proceeding to create a new one")
    } else if (!customersResponse.ok) {
      const errorText = await customersResponse.text()
      console.error("❌ Customer search failed:", customersResponse.status, errorText)
      throw new Error(`Customer search failed: ${customersResponse.status} ${errorText}`)
    } else {
      const customersData = await customersResponse.json()
      console.log("📋 Customer search response:", JSON.stringify(customersData, null, 2))

      if (customersData.data && customersData.data.length > 0) {
        customer = customersData.data[0]
        console.log("✅ Found existing customer:", customer.id)
      }
    }

    // Step 2: Create customer if not found
    if (!customer) {
      console.log("👤 Creating new customer...")
      const customerCreateUrl = `${apiBase}/customers`
      console.log("🔧 Customer create URL:", customerCreateUrl)

      const customerPayload = {
        data: {
          type: "customers",
          attributes: {
            email: customerDetails.email,
            first_name: customerDetails.name?.split(" ")[0] || "Customer",
            last_name: customerDetails.name?.split(" ").slice(1).join(" ") || "",
            phone: customerDetails.phone || "",
            metadata: {
              vehicle_registration: bookingDetails?.vehicleReg || "",
              vehicle_type: bookingDetails?.vehicleType || "car",
              booking_start_date: bookingDetails?.startDate || "",
              booking_start_time: bookingDetails?.startTime || "",
              special_requests: bookingDetails?.specialRequests || "",
              space_id: spaceId || "",
            },
          },
        },
      }

      const customerResponse = await fetch(customerCreateUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(customerPayload),
      })

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text()
        console.error("❌ Customer creation failed:", customerResponse.status, errorText)
        throw new Error(`Customer creation failed: ${customerResponse.status} ${errorText}`)
      }

      const customerData = await customerResponse.json()
      customer = customerData.data
      console.log("✅ Created new customer:", customer.id)
    }

    // Step 3: Create order
    console.log("📦 Creating order...")
    const orderCreateUrl = `${apiBase}/orders`
    console.log("🔧 Order create URL:", orderCreateUrl)

    const orderPayload = {
      data: {
        type: "orders",
        attributes: {
          currency_code: "GBP",
          language_code: "en",
          customer_email: customerDetails.email,
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

    const orderResponse = await fetch(orderCreateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(orderPayload),
    })

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text()
      console.error("❌ Order creation failed:", orderResponse.status, errorText)
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

    const lineItemResponse = await fetch(lineItemCreateUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(lineItemPayload),
    })

    if (!lineItemResponse.ok) {
      const errorText = await lineItemResponse.text()
      console.error("❌ Line item creation failed:", lineItemResponse.status, errorText)
      throw new Error(`Line item creation failed: ${lineItemResponse.status} ${errorText}`)
    }

    const lineItemData = await lineItemResponse.json()
    console.log("✅ Added line item:", lineItemData.data.id)

    // Step 5: Fetch updated order with payment details
    console.log("🔄 Fetching updated order...")
    const orderFetchUrl = `${apiBase}/orders/${order.id}?include=line_items,payment_method,payment_source`
    console.log("🔧 Order fetch URL:", orderFetchUrl)

    const updatedOrderResponse = await fetch(orderFetchUrl, {
      method: "GET",
      headers,
    })

    if (!updatedOrderResponse.ok) {
      const errorText = await updatedOrderResponse.text()
      console.error("❌ Order fetch failed:", updatedOrderResponse.status, errorText)
      throw new Error(`Order fetch failed: ${updatedOrderResponse.status} ${errorText}`)
    }

    const updatedOrderData = await updatedOrderResponse.json()
    const updatedOrder = updatedOrderData.data
    console.log("📋 Updated order:", JSON.stringify(updatedOrder, null, 2))

    // Check if payment is required
    const totalAmountCents = updatedOrder.attributes.total_amount_cents
    const formattedTotal = updatedOrder.attributes.formatted_total_amount

    console.log(`💰 Order total: ${formattedTotal} (${totalAmountCents} cents)`)

    if (totalAmountCents === 0) {
      console.log("🆓 Order total is zero - no payment required")
      return NextResponse.json({
        success: true,
        orderId: order.id,
        customerId: customer.id,
        total: formattedTotal,
        totalCents: totalAmountCents,
        paymentRequired: false,
        message: "Order created successfully - no payment required",
      })
    }

    // For orders requiring payment, we would need to set up Stripe payment intent
    // This would require additional Commerce Layer payment method configuration
    console.log("💳 Payment required - Stripe integration needed")

    return NextResponse.json({
      success: true,
      orderId: order.id,
      customerId: customer.id,
      total: formattedTotal,
      totalCents: totalAmountCents,
      paymentRequired: true,
      message: "Order created - payment setup required",
      // clientSecret would be provided here for Stripe integration
    })
  } catch (error) {
    console.error("❌ Commerce Layer order creation failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
