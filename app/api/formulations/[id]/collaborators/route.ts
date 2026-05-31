import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: formulation } = await supabase
    .from("formulations").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!formulation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: collaborators } = await supabase
    .from("formulation_collaborators")
    .select("id, invited_email, role, user_id, created_at")
    .eq("formulation_id", id)
    .eq("owner_id", user.id)
    .order("created_at");

  return NextResponse.json({ collaborators: collaborators ?? [] });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["viewer", "editor"]).default("editor"),
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: formulation } = await supabase
    .from("formulations").select("id, name").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!formulation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const { email, role } = parsed.data;

  if (email.toLowerCase() === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
  }

  // Look up if that email already has an account
  const service = serviceClient();
  const { data: users } = await service.auth.admin.listUsers();
  const invitedUser = users?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  const { data, error } = await supabase
    .from("formulation_collaborators")
    .upsert({
      formulation_id: id,
      owner_id: user.id,
      invited_email: email.toLowerCase(),
      user_id: invitedUser?.id ?? null,
      role,
    }, { onConflict: "formulation_id,invited_email" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ collaborator: data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email query param required" }, { status: 400 });

  const { error } = await supabase
    .from("formulation_collaborators")
    .delete()
    .eq("formulation_id", id)
    .eq("owner_id", user.id)
    .eq("invited_email", email.toLowerCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
