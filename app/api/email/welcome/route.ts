import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getResend, FROM_EMAIL } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resend = getResend();
  if (!resend) return NextResponse.json({ ok: false, reason: "Email not configured" });

  const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const { subject, html } = welcomeEmail(name);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email!,
      subject,
      html,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
