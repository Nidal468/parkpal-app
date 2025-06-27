import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { supabaseServer } from "@/lib/supabase-server"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log("🤖 Chat API called")

    const { message } = await request.json()
    console.log("📝 User message:", message)

    // Store user message in database
    try {
      const { error: userMessageError } = await supabaseServer.from("messages").insert({
        content: message,
        role: "user",
        created_at: new Date().toISOString(),
      })

      if (userMessageError) {
        console.error("❌ Failed to store user message:", userMessageError)
      } else {
        console.log("✅ User message stored successfully")
      }
    } catch (dbError) {
      console.error("❌ Database error storing user message:", dbError)
    }

    // Search for parking spaces
    let parkingSpaces = []
    try {
      const { data: spaces, error: spacesError } = await supabaseServer.from("spaces").select("*").limit(10)

      if (spacesError) {
        console.error("❌ Error fetching spaces:", spacesError)
      } else {
        parkingSpaces = spaces || []
        console.log("🅿️ Found spaces:", parkingSpaces.length)
      }
    } catch (spacesError) {
      console.error("❌ Database error fetching spaces:", spacesError)
    }

    // Create system prompt with parking data
    const systemPrompt = `You are Parkpal, a helpful parking assistant for London. 
    
Available parking spaces: ${JSON.stringify(parkingSpaces)}

Help users find parking by:
1. Understanding their location needs
2. Suggesting relevant parking spaces
3. Providing pricing and availability information
4. Being friendly and conversational

If no specific spaces match their query, suggest general areas or ask for more details.`

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I could not process your request."
    console.log("🤖 AI response:", aiResponse)

    // Store AI response in database
    try {
      const { error: aiMessageError } = await supabaseServer.from("messages").insert({
        content: aiResponse,
        role: "assistant",
        created_at: new Date().toISOString(),
      })

      if (aiMessageError) {
        console.error("❌ Failed to store AI message:", aiMessageError)
      } else {
        console.log("✅ AI message stored successfully")
      }
    } catch (dbError) {
      console.error("❌ Database error storing AI message:", dbError)
    }

    return NextResponse.json({
      message: aiResponse,
      spaces: parkingSpaces,
    })
  } catch (error) {
    console.error("❌ Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}
