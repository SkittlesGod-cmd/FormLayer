"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock, Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch("password", "");

  useEffect(() => {
    // Check URL for error params
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "野猪" || params.get("error") === "invalid") {
      setIsInvalid(true);
    }
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    const supabase = createBrowserClient();

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) {
        if (error.message.includes("expired")) {
          setIsExpired(true);
          return;
        }
        throw error;
      }

      setIsSuccess(true);
      toast.success("Password updated successfully!");
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reset password"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isInvalid) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <div className="mx-auto size-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="size-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Invalid or expired link</h2>
          <p className="mt-3 text-sm text-gray-500">
            This password reset link has expired or is invalid.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Please request a new password reset email.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <div className="mx-auto size-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertCircle className="size-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Link expired</h2>
          <p className="mt-3 text-sm text-gray-500">
            This password reset link has expired. Links are valid for 1 hour.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-dark"
          >
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <div className="mx-auto size-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Check className="size-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Password updated!</h2>
          <p className="mt-3 text-sm text-gray-500">
            Your password has been successfully reset.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Redirecting to sign in...
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            Sign in now
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
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Create a strong password for your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              New password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={cn(
                  "pl-10 pr-10 h-11",
                  errors.password ? "border-red-400" : ""
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Password requirements */}
          {password && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <div
                  key={req.label}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    req.test(password) ? "text-green-600" : "text-gray-400"
                  )}
                >
                  {req.test(password) ? (
                    <Check className="size-3" />
                  ) : (
                    <X className="size-3" />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("confirmPassword")}
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={cn(
                  "pl-10 h-11",
                  errors.confirmPassword ? "border-red-400" : ""
                )}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
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
                Updating password...
              </>
            ) : (
              "Update password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
