import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const user = data.user;
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Get avatar from provider metadata (Google uses 'picture', GitHub uses 'avatar_url')
        const avatarUrl = user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        const company = user.user_metadata?.company || "";

        // Create profile with avatar
        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          company: company,
          avatar_url: avatarUrl,
        });
      } else if (user.user_metadata?.picture || user.user_metadata?.avatar_url) {
        // Profile exists but no avatar - update it
        await supabase
          .from("profiles")
          .update({ 
            avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url 
          })
          .eq("id", user.id);
      }
    }

    // Redirect to dashboard
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // No code, redirect to sign-in
  const redirectUrl = new URL("/sign-in", request.url);
  return NextResponse.redirect(redirectUrl);
}