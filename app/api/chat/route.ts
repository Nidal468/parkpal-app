import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, conversation } = await request.json()

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Generate parking-specific responses based on user input
    const response = generateParkingResponse(message)

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}

function generateParkingResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Location-based responses
  if (lowerMessage.includes("london") || lowerMessage.includes("central")) {
    return "🏙️ Great choice! London has many parking options. I found several spots in Central London:\n\n📍 **NCP Car Park** - £4.50/hour\n📍 **Q-Park** - £5.20/hour\n📍 **Street parking** - £3.60/hour (2hr max)\n\nWhich area specifically? I can show you the closest available spots!"
  }

  if (lowerMessage.includes("airport")) {
    return "✈️ Airport parking sorted! Here are your options:\n\n🅿️ **Short Stay** - £6/hour (perfect for pickups)\n🅿️ **Long Stay** - £12/day (great for holidays)\n🅿️ **Premium** - £18/day (covered, closest to terminal)\n\nHow long will you be parking for?"
  }

  if (lowerMessage.includes("cheap") || lowerMessage.includes("affordable")) {
    return "💰 Budget-friendly options coming up!\n\n🆓 **Free street parking** - Residential areas (2hr limit)\n💷 **Council car parks** - £8/day\n🚌 **Park & Ride** - £3/day + free bus\n\nWhere do you need to be? I'll find the cheapest option nearby!"
  }

  if (lowerMessage.includes("restaurant") || lowerMessage.includes("dinner")) {
    return "🍽️ Perfect for dining out! Restaurant parking options:\n\n✅ **Validated parking** - Many restaurants offer 2-3 hours free\n🏢 **Evening rates** - Most car parks cheaper after 6pm\n🚶 **Walk-friendly spots** - I can find parking within 5 minutes walk\n\nWhich restaurant or area are you heading to?"
  }

  if (lowerMessage.includes("urgent") || lowerMessage.includes("asap") || lowerMessage.includes("now")) {
    return "🚨 Urgent parking needed! Let me find immediate availability:\n\n⚡ **Live spots available:**\n📍 City Centre Multi-storey - 23 spaces free\n📍 High Street Car Park - 8 spaces free\n📍 Station Road - 3 street spaces\n\nI can reserve one for you right now! Which location works best?"
  }

  if (lowerMessage.includes("shopping") || lowerMessage.includes("mall")) {
    return "🛍️ Shopping trip parking sorted!\n\n🏬 **Shopping centre parking** - First 2 hours free with purchase\n🅿️ **Nearby alternatives** - £2/hour if centre is full\n🎫 **Validation deals** - Spend £20+ get 4 hours free\n\nWhich shopping area are you visiting?"
  }

  // Default helpful response
  return `I'd love to help you find parking! Based on "${message}", let me ask a few quick questions:\n\n📍 **Where** exactly do you need to park?\n⏰ **How long** will you be there?\n💰 **Any budget** preferences?\n🚗 **Special requirements** (covered, disabled access, etc.)?\n\nThe more details you give me, the better I can help! 🚗`
}
