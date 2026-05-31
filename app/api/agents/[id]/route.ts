import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserSubscription } from "@/lib/billing/subscription";
import { canUseAgents } from "@/lib/billing/plans";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const nullableStr = (schema: z.ZodString) => schema.nullable().optional();

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: nullableStr(z.string().max(500)),
  model: z.string().min(1).optional(),
  persona: nullableStr(z.string().max(2000)),
  target_population: nullableStr(z.string().max(100)),
  product_type: nullableStr(z.string()),
  auto_enrich: z.boolean().optional(),
});

async function getAuthedAgent(supabase: Awaited<ReturnType<typeof createClient>>, agentId: string, userId: string) {
  const { data } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(user.id);
  if (!canUseAgents(sub.plan)) return NextResponse.json({ error: "Pro plan required", upgrade: true }, { status: 403 });

  const agent = await getAuthedAgent(supabase, id, user.id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch recent runs
  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, goal, status, formulation_id, created_at")
    .eq("agent_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ agent, runs: runs ?? [] });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(user.id);
  if (!canUseAgents(sub.plan)) return NextResponse.json({ error: "Pro plan required", upgrade: true }, { status: 403 });

  const agent = await getAuthedAgent(supabase, id, user.id);
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const { data, error } = await supabase
    .from("agents")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
