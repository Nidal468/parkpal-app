import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { Message } from "@/app/chat/airline-chat-interface"
import { ISpaces } from "@/model/spaces"

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseURL: "https://openrouter.ai/api/v1",
})

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversation,
      location,
      spaces,
    }: {
      message: string
      conversation: Message[]
      location: { latitude: number; longitude: number }
      spaces: ISpaces[]
    } = await request.json()

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const userLat = location.latitude
    const userLon = location.longitude
    const messageLower = message.toLowerCase()

    // Extract keywords from spaces data
    const locationKeywordsSet = new Set<string>()
    spaces.forEach((space) => {
      if (space.location) {
        space.location.toLowerCase().split(/[\s,]+/).forEach((w) => locationKeywordsSet.add(w))
      }
      if (space.address) {
        space.address.toLowerCase().split(/[\s,]+/).forEach((w) => locationKeywordsSet.add(w))
      }
      if (space.postcode) {
        space.postcode.toLowerCase().split(/[\s,]+/).forEach((w) => locationKeywordsSet.add(w))
      }
    })
    const locationKeywords = Array.from(locationKeywordsSet)
    const matchedKeywords = locationKeywords.filter((keyword) => messageLower.includes(keyword))

    // Filter and sort spaces by proximity or keyword match
    const filteredSpaces = spaces
      .map((space) => ({
        ...space,
        distance: haversineDistance(
          userLat,
          userLon,
          parseFloat(space.latitude as string),
          parseFloat(space.longitude as string)
        ),
      }))
      .filter((space) => {
        const isNearby = space.distance <= 10
        const matchesKeyword = matchedKeywords.some((keyword) =>
          (space.location?.toLowerCase() || "").includes(keyword) ||
          (space.address?.toLowerCase() || "").includes(keyword) ||
          (space.postcode?.toLowerCase() || "").includes(keyword)
        )
        return isNearby || matchesKeyword
      })
      .sort((a, b) => a.distance - b.distance)

    const nearestSpaces = filteredSpaces.slice(0, 3)

    const spacesSummary = nearestSpaces.length
      ? nearestSpaces
        .map(
          (s, i) =>
            `${i + 1}. ${s.title} — £${s.price_per_day}/day — ${s.address} — ${s.distance.toFixed(
              1
            )} km away`
        )
        .join("\n")
      : "There are no available spaces near the user's location or mentioned area."

    const systemPrompt = `You are a helpful assistant for Parkpal. The user is asking for parking help.

Their current location is:
- Latitude: ${location.latitude}
- Longitude: ${location.longitude}

Nearby available parking spaces:
${spacesSummary}

Your job:
- If there are spaces, briefly guide the user toward them.
- If none are available, politely inform them and suggest trying a different location or checking back later.
- Never mention "fetching" or "searching" — all data is already provided.
- Be helpful, concise, and friendly. Use 1–2 sentences max.`

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversation.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: message },
      ],
      max_tokens: 800,
      temperature: 0.7,
    })

    const botResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't understand that."

    return NextResponse.json({
      message: botResponse,
      timestamp: new Date().toISOString(),
      parkingSpaces: nearestSpaces,
      totalFound: nearestSpaces.length,
    })
  } catch (error) {
    console.error("❌ Chat API error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process chat message.",
      },
      { status: 500 }
    )
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // distance in km
}
