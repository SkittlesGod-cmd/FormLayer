import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getResend, FROM_EMAIL } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create the redirect response first so setAll can write cookies onto it
  const redirectTo = next.startsWith("/") ? next : "/dashboard";
  const successResponse = NextResponse.redirect(new URL(redirectTo, request.url));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          successResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/sign-in?error=auth_failed", request.url));
  }

  const user = data.user;

  // Upsert profile on first OAuth login
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .eq("id", user.id)
    .single();

  const avatarUrl =
    user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || "";
  const company = user.user_metadata?.company || "";

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      company,
      avatar_url: avatarUrl,
    });
    // Fire welcome email — non-blocking, failure is silent
    const resend = getResend();
    if (resend && user.email) {
      const { subject, html } = welcomeEmail(fullName);
      resend.emails.send({ from: FROM_EMAIL, to: user.email, subject, html }).catch(() => {});
    }
  } else if (avatarUrl && !profile.avatar_url) {
    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);
  }

  return successResponse;
}
