import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { message } = await req.json();

  const messages = [
    {
      role: 'system',
      content: 'You are Parkpal, an AI assistant helping users find parking in London. Ask clear follow-up questions and help them book parking with confidence.',
    },
    {
      role: 'user',
      content: 'I need parking in Kennington from July 3rd to 6th, evenings.',
    },
    {
      role: 'assistant',
      content:
        "I'd love to help you find parking! Based on that, let me ask a few quick questions:\n📍 Where exactly?\n⏰ How long?\n💰 Budget?\n🚗 Special requirements?",
    },
    {
      role: 'user',
      content: message, // this is the NEW message sent from the user
    },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    stream: true,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
