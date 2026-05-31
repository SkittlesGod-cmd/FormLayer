import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL_COMPLIANCE as MODEL } from "@/lib/ai/client";
import { COMPLIANCE_SYSTEM } from "@/lib/ai/prompts";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ratelimit";
import { parseJsonObject } from "@/lib/ai/json";
import { complianceResultSchema } from "@/lib/ai/schemas";
import { getErrorMessage } from "@/lib/errors";
import type { FormulationIngredient } from "@/lib/formulations/types";

const bodySchema = z.object({
  formulation_id: z.string().uuid(),
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

  const { formulation_id } = parsed.data;

  const { data: formulation, error: fetchErr } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", formulation_id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !formulation) {
    return NextResponse.json({ error: "Formulation not found" }, { status: 404 });
  }

  const ingredients = Array.isArray(formulation.ingredients)
    ? (formulation.ingredients as FormulationIngredient[])
    : [];

  const ingredientList = ingredients.length > 0
    ? ingredients.map((ing) => `- ${ing.name}: ${ing.dose || "?"}${ing.unit || "mg"}`).join("\n")
    : "No ingredients specified";

  const prompt = `Analyze this formulation for FDA compliance:

Name: ${formulation.name}
Description: ${formulation.description ?? "Not specified"}
Serving size: ${formulation.serving_size ?? "Not specified"}

Ingredients:
${ingredientList}

Notes / Intended claims: ${formulation.notes ?? "None"}

Return ONLY the JSON object. Start with { and end with }.`;

  try {
    const ai = getAIClient();
    const message = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: COMPLIANCE_SYSTEM },
        { role: "user", content: prompt },
      ],
    });

    const raw = message.choices[0]?.message?.content ?? "";
    const parsedResult = complianceResultSchema.safeParse(parseJsonObject(raw));

    if (!parsedResult.success) {
      await supabase
        .from("formulations")
        .update({ compliance_score: null, updated_at: new Date().toISOString() })
        .eq("id", formulation_id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          error: "Compliance analysis returned an invalid structure. Please run it again or review manually.",
          manual_review_required: true,
        },
        { status: 502 }
      );
    }

    const result = parsedResult.data;
    await supabase
      .from("formulations")
      .update({ compliance_score: result.score, updated_at: new Date().toISOString() })
      .eq("id", formulation_id)
      .eq("user_id", user.id);

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err, "AI request failed") }, { status: 500 });
  }
}
