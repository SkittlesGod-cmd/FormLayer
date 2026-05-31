import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserSubscription, getFormulationCount } from "@/lib/billing/subscription";
import { canCreateFormulation } from "@/lib/billing/plans";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sub, count] = await Promise.all([
    getUserSubscription(user.id),
    getFormulationCount(user.id),
  ]);
  if (!canCreateFormulation(sub.plan, count)) {
    return NextResponse.json(
      { error: "Formulation limit reached. Upgrade your plan to create more.", limit: true },
      { status: 403 }
    );
  }

  const { data: source, error: fetchErr } = await supabase
    .from("formulations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("formulations")
    .insert({
      user_id: user.id,
      name: `Copy of ${source.name}`,
      description: source.description,
      product_type: source.product_type,
      status: "draft",
      ingredients: source.ingredients ?? [],
      target_dose: source.target_dose,
      serving_size: source.serving_size,
      capsule_size: source.capsule_size,
      capsules_per_serving: source.capsules_per_serving,
      notes: source.notes,
      compliance_score: null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to duplicate" }, { status: 500 });
  return NextResponse.json({ formulation: data }, { status: 201 });
}
