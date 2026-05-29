"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const schema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    company: z.string().min(1, "Company name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "One uppercase letter")
      .regex(/[a-z]/, "One lowercase letter")
      .regex(/[0-9]/, "One number"),
    confirmPassword: z.string().min(1, "Required"),
    terms: z.boolean().refine(v => v === true, "You must accept the terms"),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const PW_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /[0-9]/.test(p) },
];

export default function SignUpPage() {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const password = watch("password", "");

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) { toast.error(error.message); setOauthLoading(null); }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const supabase = createBrowserClient();
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name, company: data.company },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (e: any) {
      toast.error(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15";
  const labelClass = "text-[12px] font-medium text-gray-600";

  if (success) {
    return (
      <div className="w-full max-w-[360px]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center">
          <div className="mx-auto mb-5 flex size-10 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100">
            <Check className="size-4 text-emerald-600" />
          </div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-gray-950">Check your email</h2>
          <p className="mt-2 text-[13px] text-gray-500">
            We sent a confirmation link. Click it to activate your account.
          </p>
          <Link href="/sign-in" className="mt-5 inline-block text-[12px] font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <Link href="/" className="mb-6 flex lg:hidden items-center gap-2">
        <span className="size-1.5 rounded-full bg-brand" />
        <span className="text-[13px] font-semibold text-gray-950">NutraCloud</span>
      </Link>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-950">Create account</h1>
        <p className="mt-1.5 text-[13px] text-gray-500">Start your free trial today</p>

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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name" className={labelClass}>Full name <span className="text-red-400">*</span></Label>
              <Input {...register("full_name")} id="full_name" type="text" placeholder="Alex Rivera" autoComplete="name" className={cn(inputClass, errors.full_name && "border-red-400")} />
              {errors.full_name && <p className="text-[11px] text-red-500">{errors.full_name.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company" className={labelClass}>Company <span className="text-red-400">*</span></Label>
              <Input {...register("company")} id="company" type="text" placeholder="NutriVive Co." autoComplete="organization" className={cn(inputClass, errors.company && "border-red-400")} />
              {errors.company && <p className="text-[11px] text-red-500">{errors.company.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className={labelClass}>Email address <span className="text-red-400">*</span></Label>
            <Input {...register("email")} id="email" type="email" placeholder="alex@company.com" autoComplete="email" className={cn(inputClass, errors.email && "border-red-400")} />
            {errors.email && <p className="text-[11px] text-red-500">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className={labelClass}>Password <span className="text-red-400">*</span></Label>
            <div className="relative">
              <Input {...register("password")} id="password" type={showPw ? "text" : "password"} placeholder="Create a strong password" autoComplete="new-password" className={cn(inputClass, "pr-10", errors.password && "border-red-400")} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {password && (
              <div className="grid grid-cols-2 gap-1 pt-1">
                {PW_RULES.map(r => (
                  <div key={r.label} className={cn("flex items-center gap-1.5 text-[11px]", r.test(password) ? "text-emerald-600" : "text-gray-400")}>
                    {r.test(password) ? <Check className="size-3" /> : <X className="size-3" />}
                    {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className={labelClass}>Confirm password <span className="text-red-400">*</span></Label>
            <Input {...register("confirmPassword")} id="confirmPassword" type={showPw ? "text" : "password"} placeholder="Confirm your password" autoComplete="new-password" className={cn(inputClass, errors.confirmPassword && "border-red-400")} />
            {errors.confirmPassword && <p className="text-[11px] text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <div className="flex items-start gap-2.5 pt-0.5">
            <input type="checkbox" {...register("terms")} id="terms" className="mt-0.5 size-3.5 rounded border-gray-300 accent-brand" />
            <label htmlFor="terms" className="text-[12px] text-gray-500">
              I agree to the{" "}
              <Link href="/terms" className="text-brand hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>
            </label>
          </div>
          {errors.terms && <p className="text-[11px] text-red-500">{errors.terms.message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-gray-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
