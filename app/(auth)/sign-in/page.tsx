"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const GoogleIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

type FormData = z.infer<typeof schema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";

  const [showPw, setShowPw] = useState(false);
  const [magicMode, setMagicMode] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const email = watch("email");

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextUrl)}` },
    });
    if (error) {
      toast.error(error.message);
      setOauthLoading(null);
    } else {
      // Reset after 10s in case redirect doesn't happen (popup blocked, etc.)
      setTimeout(() => setOauthLoading(null), 10_000);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextUrl)}` },
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link resent — check your inbox.");
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const supabase = createBrowserClient();
    try {
      if (magicMode || !data.password) {
        const { error } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextUrl)}` },
        });
        if (error) throw error;
        setMagicSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) throw error;
        window.location.href = nextUrl.startsWith("/") ? nextUrl : "/dashboard";
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Sign in failed"));
    } finally {
      setLoading(false);
    }
  };

  if (magicSent) {
    return (
      <div className="w-full max-w-[360px]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-full border border-black/[0.06] bg-gray-50">
            <svg className="size-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-950">Check your email</h2>
          <p className="mt-2 text-[13px] text-gray-500">
            We sent a sign-in link to <span className="font-medium text-gray-900">{email}</span>.
            The link expires in 60 minutes.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="rounded-lg border border-black/[0.08] px-4 py-2 text-[12px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {resending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend link"}
            </button>
            <button onClick={() => setMagicSent(false)} className="text-[12px] text-gray-400 hover:text-gray-700">
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[360px]">
      <Link href="/" className="mb-6 flex lg:hidden items-center gap-2">
        <span className="size-1.5 rounded-full bg-brand" />
        <span className="text-[13px] font-semibold text-gray-950">FormLayer</span>
      </Link>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-950">Welcome back</h1>
        <p className="mt-1.5 text-[13px] text-gray-500">Sign in to your workspace</p>

        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading || loading}
          className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-black/[0.08] bg-white py-2.5 text-[13px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02] disabled:opacity-50"
        >
          {oauthLoading === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/[0.06]" />
          <span className="text-[11px] text-gray-400">or</span>
          <div className="h-px flex-1 bg-black/[0.06]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[12px] font-medium text-gray-600">Email address</Label>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className={cn(
                "h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15",
                errors.email && "border-red-400"
              )}
            />
            {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
          </div>

          {!magicMode && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[12px] font-medium text-gray-600">Password</Label>
                <Link href="/forgot-password" className="text-[12px] text-brand hover:underline">Forgot?</Link>
              </div>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "h-9 rounded-lg border border-black/[0.08] bg-white px-3 pr-10 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15",
                    errors.password && "border-red-400"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            {magicMode ? "Send magic link" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMagicMode(v => !v)}
          className="mt-3.5 w-full text-center text-[12px] text-gray-400 transition hover:text-gray-700"
        >
          {magicMode ? "Use password instead" : "Sign in with a magic link"}
        </button>

        <p className="mt-6 text-center text-[12px] text-gray-500">
          No account?{" "}
          <Link href="/sign-up" className="font-medium text-brand hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-[360px]" />}>
      <SignInForm />
    </Suspense>
  );
}
