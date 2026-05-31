import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL, MAX_TOKENS } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ratelimit";
import { z } from "zod";

const bodySchema = z.object({
  ingredient_id: z.string(),
  formulation_id: z.string().uuid(),
});

const SYSTEM = `You are a clinical research scientist specializing in dietary supplement formulation. Return ONLY a JSON object, no other text.

Given an ingredient name, dose, and formulation context, return evidence enrichment data in this exact shape:
{
  "evidence_grade": "A" | "B" | "C",
  "clinical_dose_range": "string like '200–400 mg/day'",
  "dose_assessment": "at_studied_dose" | "below_studied_dose" | "above_studied_dose",
  "rationale": "1-2 sentences: primary mechanism, key evidence, dose context"
}

Evidence grade rules:
- A: ≥2 published RCTs showing efficacy in humans at the given indication
- B: 1 RCT or strong mechanistic evidence with human data
- C: Emerging, animal-only, or very limited human data

Dose assessment:
- at_studied_dose: the specified dose falls within the clinically studied range
- below_studied_dose: dose is lower than what was studied in RCTs
- above_studied_dose: dose exceeds the studied range (may be waste or safety concern)`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id);
  if (!allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ingredient_id, formulation_id } = parsed.data;

  const { data: formulation } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", formulation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!formulation) return NextResponse.json({ error: "Formulation not found" }, { status: 404 });

  const ingredient = (formulation.ingredients as any[])?.find((i: any) => i.id === ingredient_id);
  if (!ingredient) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });

  const prompt = `Ingredient: ${ingredient.name}
Dose: ${ingredient.dose || "unspecified"} ${ingredient.unit || "mg"}
Formulation context: ${formulation.name} — ${formulation.description ?? "no description"}
Target population: general healthy adults (unless otherwise noted)

Return the JSON object only.`;

  try {
    const ai = getAIClient();
    const response = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    let result: any = null;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1) result = JSON.parse(raw.slice(start, end + 1));
    } catch {}

    if (!result || !result.evidence_grade) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
    }

    // Patch the ingredient in the formulation
    const updatedIngredients = (formulation.ingredients as any[]).map((i: any) =>
      i.id === ingredient_id
        ? { ...i, ...result }
        : i
    );

    await supabase
      .from("formulations")
      .update({ ingredients: updatedIngredients, updated_at: new Date().toISOString() })
      .eq("id", formulation_id)
      .eq("user_id", user.id);

    return NextResponse.json({ ingredient: { ...ingredient, ...result } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "AI request failed" }, { status: 500 });
  }
}
