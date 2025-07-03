import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

// SKU to Space mapping
const SKU_TO_SPACE_MAP = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

async function getCommerceLayerToken() {
  try {
    const clientId = process.env.COMMERCE_LAYER_CLIENT_ID || process.env.NEXT_PUBLIC_CL_CLIENT_ID
    const clientSecret = process.env.COMMERCE_LAYER_CLIENT_SECRET || process.env.NEXT_PUBLIC_CL_CLIENT_SECRET
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const scope = process.env.COMMERCE_LAYER_SCOPE || process.env.NEXT_PUBLIC_CL_SCOPE

    if (!clientId || !clientSecret || !baseUrl) {
      throw new Error("Missing Commerce Layer credentials")
    }

    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: scope,
      }),
    })

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status}`)
    }

    const authData = await authResponse.json()
    return authData.access_token
  } catch (error) {
    throw new Error(`Commerce Layer auth failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

async function createTestOrder(sku: string, customerDetails: any, bookingDetails: any) {
  try {
    const token = await getCommerceLayerToken()
    const baseUrl = process.env.COMMERCE_LAYER_BASE_URL
    const marketId = process.env.NEXT_PUBLIC_CL_MARKET_ID
    const stockLocationId = process.env.COMMERCE_LAYER_STOCK_LOCATION_ID || process.env.NEXT_PUBLIC_CL_STOCK_LOCATION_ID

    // Get space ID for this SKU
    const spaceId = SKU_TO_SPACE_MAP[sku as keyof typeof SKU_TO_SPACE_MAP] || SPACE_IDS.HOURLY

    // Create customer
    const customerResponse = await fetch(`${baseUrl}/api/customers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "customers",
          attributes: {
            email: customerDetails.email,
            metadata: {
              name: customerDetails.name,
              phone: customerDetails.phone,
            },
          },
        },
      }),
    })

    if (!customerResponse.ok) {
      throw new Error(`Customer creation failed: ${customerResponse.status}`)
    }

    const customerData = await customerResponse.json()
    const customerId = customerData.data.id

    // Create order
    const orderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "orders",
          attributes: {
            metadata: {
              sku: sku,
              spaceId: spaceId,
              bookingDetails: bookingDetails,
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
      throw new Error(`Order creation failed: ${orderResponse.status}`)
    }

    const orderData = await orderResponse.json()
    const orderId = orderData.data.id

    // Create booking in database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        space_id: spaceId,
        customer_email: customerDetails.email,
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        vehicle_registration: bookingDetails.vehicleReg,
        vehicle_type: bookingDetails.vehicleType,
        start_date: bookingDetails.startDate,
        start_time: bookingDetails.startTime,
        special_requests: bookingDetails.specialRequests,
        status: "confirmed",
        sku: sku,
        commerce_layer_order_id: orderId,
        commerce_layer_customer_id: customerId,
      })
      .select()
      .single()

    if (bookingError) {
      throw new Error(`Database booking creation failed: ${bookingError.message}`)
    }

    return {
      success: true,
      orderId: orderId,
      customerId: customerId,
      spaceId: spaceId,
      bookingId: booking.id,
      amount: "10.00", // Default amount for testing
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function GET() {
  try {
    console.log("🧪 Starting Commerce Layer flow test...")

    // Test 1: Check space mapping
    console.log("📍 Testing space mapping...")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the specific spaces by their UUIDs
    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id, name, location, hourly_rate, daily_rate, monthly_rate, space_type, description")
      .in("id", Object.values(SPACE_IDS))

    if (spacesError) {
      throw new Error(`Space mapping test failed: ${spacesError.message}`)
    }

    console.log("✅ Space mapping test passed")

    // Test 2: Test order creation for each SKU type
    const testOrders = []
    const skuTypes = ["parking-hour", "parking-day", "parking-month"]

    for (const sku of skuTypes) {
      console.log(`📦 Testing order creation for SKU: ${sku}`)

      const customerDetails = {
        name: `Test Customer ${sku}`,
        email: `test-${sku}-${Date.now()}@parkpal.com`,
        phone: "+44 7700 900123",
      }

      const bookingDetails = {
        vehicleReg: "TEST123",
        vehicleType: "car",
        startDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        specialRequests: `Test booking for ${sku}`,
      }

      const orderResult = await createTestOrder(sku, customerDetails, bookingDetails)
      testOrders.push({
        sku: sku,
        ...orderResult,
      })

      console.log(
        `${orderResult.success ? "✅" : "❌"} Order test for ${sku}: ${orderResult.success ? "SUCCESS" : "FAILED"}`,
      )
    }

    // Test 3: Verify database records
    console.log("💾 Testing database records...")
    const { data: recentBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, space_id, sku, customer_email, created_at")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .order("created_at", { ascending: false })

    const databaseTest = {
      success: !bookingsError,
      error: bookingsError?.message || null,
      bookingCount: recentBookings?.length || 0,
    }

    // Compile test results
    const testResults = {
      timestamp: new Date().toISOString(),
      overallSuccess: !spacesError && testOrders.every((order) => order.success) && databaseTest.success,
      tests: {
        spaceMapping: {
          success: !spacesError,
          hardcodedSpaceIds: SPACE_IDS,
          skuMapping: SKU_TO_SPACE_MAP,
          spacesFound: spaces?.length || 0,
          spaces: spaces,
        },
        orderCreation: {
          success: testOrders.every((order) => order.success),
          results: testOrders,
          successCount: testOrders.filter((order) => order.success).length,
          totalCount: testOrders.length,
        },
        database: databaseTest,
      },
      nextSteps: [
        "Check the browser console for detailed logs",
        "Try manual order creation via the booking interface",
        "Check Supabase bookings table for new records",
        "Verify Commerce Layer dashboard for new orders",
      ],
    }

    console.log("🎯 Test Results:", JSON.stringify(testResults, null, 2))

    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ Commerce Layer flow test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Test failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return NextResponse.json({
    message:
      "Use GET to run the test suite. This endpoint tests the complete Commerce Layer flow with hardcoded space UUIDs.",
    usage: "GET /api/test-commerce-layer-flow",
  })
}
