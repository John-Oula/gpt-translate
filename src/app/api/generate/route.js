// api/generate/route.js
import { OpenAIStream } from "../../lib/OpenAIStream";

export const config = {
  runtime: "edge",
};

export async function POST(req) {
  const { prompt } = await req.json();

  const payload = {
    messages: prompt,
    max_tokens: 100,
    temperature: 0.7,
    n: 1,
    model: "gpt-4",
    stream: true,
  };

  const stream = await OpenAIStream(payload);

  const res = new Response(stream);

  return res;
}
