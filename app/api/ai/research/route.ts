import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL, MAX_TOKENS } from "@/lib/ai/client";
import { INGREDIENT_RESEARCH_SYSTEM, FORMULATION_ANALYSIS_SYSTEM } from "@/lib/ai/prompts";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ratelimit";
import { getErrorMessage } from "@/lib/errors";
import type { Formulation, FormulationIngredient } from "@/lib/formulations/types";

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  type: z.union([z.literal("ingredient"), z.literal("goal"), z.literal("formulation")]).default("ingredient"),
  context: z.record(z.string(), z.unknown()).optional(),
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

  const { query, type, context } = parsed.data;

  let systemPrompt = INGREDIENT_RESEARCH_SYSTEM;
  let userMessage = "";

  if (type === "formulation") {
    systemPrompt = FORMULATION_ANALYSIS_SYSTEM;
    const f = (context ?? {}) as Partial<Formulation>;
    const ingredients = Array.isArray(f.ingredients)
      ? (f.ingredients as FormulationIngredient[])
      : [];
    userMessage = `Analyze this supplement formulation:

Name: ${f?.name ?? "Unnamed"}
Goal/Description: ${f?.description ?? "Not specified"}
Target dose: ${f?.target_dose ?? "Not specified"}
Serving size: ${f?.serving_size ?? "Not specified"}
Capsule size: ${f?.capsule_size ?? "Not specified"}
Capsules per serving: ${f?.capsules_per_serving ?? "Not specified"}

Ingredients:
${ingredients.length > 0
  ? ingredients.map((ing) => `- ${ing.name}: ${ing.dose || "?"}${ing.unit || "mg"}`).join("\n")
  : "No ingredients listed yet"}

Notes: ${f?.notes ?? "None"}`;
  } else if (type === "goal") {
    userMessage = `Research the best evidence-backed ingredients for this health goal:\n\n${query}`;
  } else {
    userMessage = `Research this supplement ingredient comprehensively:\n\n${query}`;
  }

  try {
    const ai = getAIClient();
    const stream = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(enc.encode(text));
          }
        } finally {
          controller.close();
        }
      },
      cancel() {
        stream.controller.abort();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const msg = getErrorMessage(err, "AI request failed");
    const isConfig = msg.includes("OPENROUTER_API_KEY");
    return NextResponse.json({ error: msg }, { status: isConfig ? 503 : 500 });
  }
}
