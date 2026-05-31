import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL } from "@/lib/ai/client";
import { SUGGEST_SYSTEM } from "@/lib/ai/prompts";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ratelimit";

const bodySchema = z.object({
  goal: z.string().min(1).max(1000),
  existing_ingredients: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id);
  if (!allowed) return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { goal, existing_ingredients } = parsed.data;

  const prompt = `Goal: ${goal}${
    existing_ingredients && existing_ingredients.length > 0
      ? `\n\nAlready included ingredients (do not suggest these again): ${existing_ingredients.join(", ")}`
      : ""
  }`;

  try {
    const ai = getAIClient();
    const message = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: SUGGEST_SYSTEM },
        { role: "user", content: prompt },
      ],
    });

    const raw = message.choices[0]?.message?.content ?? "";
    let result: any;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return NextResponse.json({ error: "AI returned malformed response" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "AI request failed" }, { status: 500 });
  }
}
