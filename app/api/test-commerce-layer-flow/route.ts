import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 Running full Commerce Layer test suite...")

    const results = {
      spaceMapping: { success: false, error: null, data: null },
      orderCreation: { success: false, error: null, orders: [] },
      databaseVerification: { success: false, error: null, bookings: [] },
    }

    // Test 1: Space Mapping
    console.log("📍 Testing space mapping...")
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      )

      const SPACE_IDS = {
        HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
        DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
        MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
      }

      const spaceIds = Object.values(SPACE_IDS)
      const { data: spaces, error } = await supabase.from("spaces").select("id, name").in("id", spaceIds)

      if (error) throw error

      results.spaceMapping.success = true
      results.spaceMapping.data = {
        hardcodedIds: SPACE_IDS,
        foundSpaces: spaces?.length || 0,
        allExist: spaces?.length === 3,
      }
      console.log("✅ Space mapping test passed")
    } catch (error) {
      results.spaceMapping.error = error instanceof Error ? error.message : "Space mapping failed"
      console.error("❌ Space mapping test failed:", error)
    }

    // Test 2: Order Creation (test each SKU)
    console.log("🛒 Testing order creation...")
    const testSkus = ["parking-hour", "parking-day", "parking-month"]

    for (const sku of testSkus) {
      try {
        console.log(`📦 Testing SKU: ${sku}`)

        // Call our create-order endpoint directly
        const orderResult = await createTestOrder(sku, `test-${sku}@example.com`, `Test User ${sku}`)

        results.orderCreation.orders.push({
          sku,
          success: true,
          orderId: orderResult.orderId,
          bookingId: orderResult.bookingId,
          spaceId: orderResult.spaceId,
        })

        console.log(`✅ ${sku} order created successfully`)
      } catch (error) {
        results.orderCreation.orders.push({
          sku,
          success: false,
          error: error instanceof Error ? error.message : "Order creation failed",
        })
        console.error(`❌ ${sku} order creation failed:`, error)
      }
    }

    results.orderCreation.success = results.orderCreation.orders.some((order) => order.success)

    // Test 3: Database Verification
    console.log("💾 Verifying database records...")
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
      )

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("id, space_id, sku, customer_email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error

      results.databaseVerification.success = true
      results.databaseVerification.bookings = bookings || []
      console.log("✅ Database verification passed")
    } catch (error) {
      results.databaseVerification.error = error instanceof Error ? error.message : "Database verification failed"
      console.error("❌ Database verification failed:", error)
    }

    const overallSuccess =
      results.spaceMapping.success && results.orderCreation.success && results.databaseVerification.success

    return NextResponse.json({
      success: overallSuccess,
      timestamp: new Date().toISOString(),
      testResults: results,
      summary: {
        spaceMappingPassed: results.spaceMapping.success,
        ordersCreated: results.orderCreation.orders.filter((o) => o.success).length,
        totalOrdersAttempted: results.orderCreation.orders.length,
        databaseVerified: results.databaseVerification.success,
        recentBookings: results.databaseVerification.bookings.length,
      },
      message: overallSuccess ? "All tests passed!" : "Some tests failed - check individual results",
    })
  } catch (error) {
    console.error("❌ Test suite failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test suite failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to create test orders
async function createTestOrder(sku: string, email: string, name: string) {
  const { getCommerceLayerAccessToken } = await import("@/lib/commerce-layer-auth")

  const SPACE_IDS = {
    HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
    DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
    MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
  }

  const SKU_TO_SPACE: Record<string, string> = {
    "parking-hour": SPACE_IDS.HOURLY,
    "parking-day": SPACE_IDS.DAILY,
    "parking-month": SPACE_IDS.MONTHLY,
  }

  const spaceId = SKU_TO_SPACE[sku] || SPACE_IDS.HOURLY

  // Get environment variables
  const clientId = process.env.NEXT_PUBLIC_CL_CLIENT_ID!
  const clientSecret = process.env.NEXT_PUBLIC_CL_CLIENT_SECRET!
  const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID!
  const stockLocationId = process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID!
  const baseUrl = process.env.COMMERCE_LAYER_BASE_URL!

  // Get access token
  const accessToken = await getCommerceLayerAccessToken(clientId, clientSecret, marketId, stockLocationId)

  // Create customer
  const customerResponse = await fetch(`${baseUrl}/api/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "customers",
        attributes: {
          email: email,
          metadata: {
            name: name,
            source: "test_suite",
          },
        },
      },
    }),
  })

  if (!customerResponse.ok) {
    const error = await customerResponse.text()
    throw new Error(`Customer creation failed: ${customerResponse.status} ${error}`)
  }

  const customerData = await customerResponse.json()
  const customerId = customerData.data.id

  // Create order
  const orderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "orders",
        attributes: {
          metadata: {
            sku: sku,
            customer_name: name,
            space_id: spaceId,
            source: "test_suite",
          },
        },
        relationships: {
          market: {
            data: {
              type: "markets",
              id: marketId,
            },
          },
          customer: {
            data: {
              type: "customers",
              id: customerId,
            },
          },
        },
      },
    }),
  })

  if (!orderResponse.ok) {
    const error = await orderResponse.text()
    throw new Error(`Order creation failed: ${orderResponse.status} ${error}`)
  }

  const orderData = await orderResponse.json()
  const orderId = orderData.data.id

  // Store booking in Supabase
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  )

  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      space_id: spaceId,
      customer_email: email,
      customer_name: name,
      sku: sku,
      quantity: 1,
      status: "pending",
      commerce_layer_order_id: orderId,
      commerce_layer_customer_id: customerId,
      metadata: {
        source: "test_suite",
        created_via: "full_test_suite",
      },
    })
    .select()
    .single()

  if (bookingError) {
    throw new Error(`Booking storage failed: ${bookingError.message}`)
  }

  return {
    orderId,
    customerId,
    bookingId: bookingData.id,
    spaceId,
  }
}
