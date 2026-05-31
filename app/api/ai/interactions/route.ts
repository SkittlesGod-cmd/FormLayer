import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, MODEL_COMPLIANCE as MODEL } from "@/lib/ai/client";
import { checkRateLimit } from "@/lib/ratelimit";
import { z } from "zod";
import { parseJsonObject } from "@/lib/ai/json";
import { getErrorMessage } from "@/lib/errors";
import type { FormulationIngredient } from "@/lib/formulations/types";

const bodySchema = z.object({ formulation_id: z.string().uuid() });

const SYSTEM = `You are a clinical pharmacologist specializing in nutraceutical ingredient interactions. Analyze all ingredient pairs in a formulation for absorption, metabolism, receptor, and safety interactions.

Return ONLY a JSON object in this exact shape:
{
  "overall_assessment": "1-2 sentences on the overall interaction profile of this stack",
  "synergies": [
    {
      "ingredients": ["Ingredient A", "Ingredient B"],
      "type": "absorption" | "pharmacodynamic" | "metabolic",
      "effect": "Brief description of the synergistic effect",
      "magnitude": "strong" | "moderate" | "mild",
      "mechanism": "Specific biological mechanism"
    }
  ],
  "antagonisms": [
    {
      "ingredients": ["Ingredient A", "Ingredient B"],
      "type": "absorption" | "pharmacodynamic" | "metabolic" | "safety",
      "effect": "Brief description of the interference",
      "severity": "high" | "medium" | "low",
      "recommendation": "Specific actionable fix — e.g. 'Take 2 hours apart' or 'Reduce dose of X'"
    }
  ],
  "timing_recommendations": [
    {
      "ingredient": "Ingredient name",
      "timing": "e.g. 'Take with food — fat-soluble', 'Take on empty stomach', 'Take 30 min pre-workout'"
    }
  ],
  "population_notes": "Any interaction considerations specific to the target population (if provided)"
}

Rules:
- Only report interactions that are supported by human data or well-established pharmacology.
- Do NOT fabricate interactions. If you are uncertain, exclude it.
- Be specific: cite the mechanism, not just "may interact".
- If the stack is clean with no significant issues, say so clearly in overall_assessment and return empty arrays.`;

const interactionResultSchema = z.object({
  overall_assessment: z.string().default("Interaction analysis complete."),
  synergies: z.array(z.record(z.string(), z.unknown())).default([]),
  antagonisms: z.array(z.record(z.string(), z.unknown())).default([]),
  timing_recommendations: z.array(z.record(z.string(), z.unknown())).default([]),
  population_notes: z.string().default(""),
});

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

  const { data: formulation } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", parsed.data.formulation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!formulation) return NextResponse.json({ error: "Formulation not found" }, { status: 404 });

  const ingredients = Array.isArray(formulation.ingredients)
    ? (formulation.ingredients as FormulationIngredient[])
    : [];
  if (ingredients.length < 2) {
    return NextResponse.json({
      overall_assessment: "Not enough ingredients to analyze interactions. Add at least 2 ingredients.",
      synergies: [], antagonisms: [], timing_recommendations: [], population_notes: "",
    });
  }

  const ingredientList = ingredients
    .map((i) => `- ${i.name}: ${i.dose || "?"}${i.unit || "mg"}`)
    .join("\n");

  const prompt = `Analyze interactions for this formulation:

Name: ${formulation.name}
Description: ${formulation.description ?? "Not specified"}
Target population: ${formulation.target_population ?? "General healthy adults"}

Ingredients:
${ingredientList}

Return ONLY the JSON object.`;

  try {
    const ai = getAIClient();
    const message = await ai.chat.completions.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
    });

    const raw = message.choices[0]?.message?.content ?? "";
    const parsedResult = interactionResultSchema.safeParse(parseJsonObject(raw));

    if (!parsedResult.success) {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
    }

    return NextResponse.json(parsedResult.data);
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err, "AI request failed") }, { status: 500 });
  }
}
