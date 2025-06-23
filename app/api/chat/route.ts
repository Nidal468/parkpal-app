import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, conversation } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured")
    }

    // Convert conversation to OpenAI format
    const messages = [
      {
        role: "system" as const,
        content: `You are Parkpal, a helpful AI assistant specialized in finding parking solutions. You help users find parking spots, provide pricing information, suggest alternatives, and answer parking-related questions. 

Key guidelines:
- Always be friendly and helpful
- Focus on parking-related solutions
- Provide specific, actionable advice
- Include pricing when possible (use realistic UK prices)
- Suggest alternatives when needed
- Use emojis to make responses engaging
- Keep responses concise but informative

If users ask about non-parking topics, politely redirect them back to parking assistance.`,
      },
      // Add conversation history
      ...conversation.map((msg: any) => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      })),
      // Add current message
      {
        role: "user" as const,
        content: message,
      },
    ]

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the more cost-effective model
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content || "Sorry, I couldn't process that request."

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat API error:", error)

    // Provide helpful error messages
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        {
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to process chat message. Please try again.",
      },
      { status: 500 },
    )
  }
}
