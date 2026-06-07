import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Roast feature not configured" },
      { status: 503 },
    );
  }

  const { title, amount } = await request.json();
  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `You are an extremely aggressive, profane, and brutally honest drill sergeant / motivational roaster. Someone committed to: "${title}" with $${amount ?? "??"} on the line. Generate a short (2-3 sentences max) motivational roast that will shame them into action RIGHT NOW. Be crude, be mean, be funny. Use profanity liberally. The goal is to make them laugh and then immediately go do the thing. Do NOT use slurs or hateful language. Just raw, unfiltered drill sergeant energy. Output ONLY the roast, nothing else.`,
  });

  const text = response.text ?? "";

  return Response.json({ roast: text });
}
