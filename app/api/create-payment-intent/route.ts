import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, currency, customerEmail } = await request.json()

    console.log("Creating payment intent for order:", orderId, "amount:", amount)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: customerEmail,
      metadata: {
        order_id: orderId,
      },
    })

    console.log("Payment intent created:", paymentIntent.id)

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
