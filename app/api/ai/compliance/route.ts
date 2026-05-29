import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL } from "@/lib/ai/client";
import { COMPLIANCE_SYSTEM } from "@/lib/ai/prompts";
import { z } from "zod";

const bodySchema = z.object({
  formulation_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const prompt = `Perform a compliance analysis on this dietary supplement formulation:

Name: ${formulation.name}
Description: ${formulation.description ?? "Not specified"}
Target dose: ${formulation.target_dose ?? "Not specified"}
Serving size: ${formulation.serving_size ?? "Not specified"}

Ingredients:
${Array.isArray(formulation.ingredients) && formulation.ingredients.length > 0
  ? formulation.ingredients.map((ing: any) => `- ${ing.name}: ${ing.dose || "?"}${ing.unit || "mg"}`).join("\n")
  : "No ingredients specified"}

Notes / Intended claims: ${formulation.notes ?? "None"}`;

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
    let result: any;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      return NextResponse.json({ error: "AI returned malformed response" }, { status: 502 });
    }

    const score = typeof result.score === "number" ? Math.round(Math.min(100, Math.max(0, result.score))) : null;

    if (score !== null) {
      await supabase
        .from("formulations")
        .update({ compliance_score: score, updated_at: new Date().toISOString() })
        .eq("id", formulation_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({ ...result, score });
  } catch (err: any) {
    const msg = err?.message ?? "AI request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
