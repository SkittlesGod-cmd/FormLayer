"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setEmail(data.email);
    const supabase = createBrowserClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setIsSuccess(true);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to send reset email"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <div className="mx-auto size-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="size-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-3 text-sm text-gray-500">
            We sent a password reset link to <span className="font-medium text-gray-700">{email}</span>
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Click the link in the email to reset your password.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-brand hover:underline"
            >
              try again
            </button>
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-5">
          <span className="size-2 rounded-full bg-brand" />
          <span className="font-semibold text-gray-900">FormLayer</span>
        </Link>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Forgot password?</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className={cn(
                  "pl-10 h-11",
                  errors.email ? "border-red-400" : ""
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full mt-2 flex items-center justify-center gap-2",
              "rounded-xl bg-brand text-white font-semibold text-sm py-2.5",
              "hover:bg-brand-dark transition-all hover:opacity-90 shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link href="/sign-in" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
