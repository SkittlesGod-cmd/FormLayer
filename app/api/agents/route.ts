import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserSubscription } from "@/lib/billing/subscription";
import { canUseAgents } from "@/lib/billing/plans";
import { DEFAULT_MODEL } from "@/lib/agents/models";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  model: z.string().min(1),
  persona: z.string().max(2000).nullable().optional(),
  target_population: z.string().max(100).nullable().optional(),
  product_type: z.string().nullable().optional(),
  auto_enrich: z.boolean().optional().default(false),
});

export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(user.id);
  if (!canUseAgents(sub.plan)) {
    return NextResponse.json({ error: "Pro plan required", upgrade: true }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agents: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(user.id);
  if (!canUseAgents(sub.plan)) {
    return NextResponse.json({ error: "Pro plan required", upgrade: true }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id: user.id,
      ...parsed.data,
      model: parsed.data.model || DEFAULT_MODEL,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data }, { status: 201 });
}
