import { NextResponse } from "next/server"

// Hardcoded space UUIDs from Supabase
const SPACE_IDS = {
  HOURLY: "5a4addb0-e463-49c9-9c18-74a25e29127b",
  DAILY: "73bef0f1-d91c-49b4-9520-dcf43f976250",
  MONTHLY: "9aa9af0f-ac4b-4cb0-ae43-49e21bb43ffd",
}

const SKU_TO_SPACE_MAP = {
  "parking-hour": SPACE_IDS.HOURLY,
  "parking-day": SPACE_IDS.DAILY,
  "parking-month": SPACE_IDS.MONTHLY,
}

export async function POST(request: Request) {
  try {
    console.log("🧪 Manual test order creation...")

    const body = await request.json()
    const { sku = "parking-hour", customerName = "Manual Test User", customerEmail = "manual-test@example.com" } = body

    console.log("📋 Test parameters:", { sku, customerName, customerEmail })

    // Call our create-order endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const createOrderUrl = `${baseUrl}/api/commerce-layer/create-order`

    console.log("📞 Calling create-order endpoint:", createOrderUrl)

    const orderResponse = await fetch(createOrderUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sku,
        customerName,
        customerEmail,
        quantity: 1,
      }),
    })

    const orderResult = await orderResponse.json()

    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${orderResult.error || orderResponse.statusText}`)
    }

    console.log("✅ Manual test order created successfully")

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      testType: "manual_order",
      input: { sku, customerName, customerEmail },
      result: orderResult,
      message: "Manual test order created successfully",
    })
  } catch (error) {
    console.error("❌ Manual test order failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Manual test order failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Manual test order endpoint",
    usage: "POST /api/manual-test-order",
    payload: {
      sku: "parking-hour | parking-day | parking-month",
      customerName: "Your Name",
      customerEmail: "your@email.com",
    },
    examples: [
      {
        description: "Test hourly parking",
        payload: { sku: "parking-hour", customerName: "John Doe", customerEmail: "john@example.com" },
      },
      {
        description: "Test daily parking",
        payload: { sku: "parking-day", customerName: "Jane Smith", customerEmail: "jane@example.com" },
      },
      {
        description: "Test monthly parking",
        payload: { sku: "parking-month", customerName: "Bob Wilson", customerEmail: "bob@example.com" },
      },
    ],
  })
}
