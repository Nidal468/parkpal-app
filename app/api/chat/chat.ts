import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, conversation } = body;

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are Parkpal, an AI parking assistant helping users book parking around London." },
      ...(conversation || []),
      { role: "user", content: message },
    ],
    stream: false, // can change to true if using streaming
  });

  const reply = response.data.choices[0].message?.content ?? "Sorry, I didn’t understand that.";

  return new Response(JSON.stringify({ message: reply }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
