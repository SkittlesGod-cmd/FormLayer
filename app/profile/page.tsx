"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User, Mail, Building, Globe, Check, Camera, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().min(1, "Company name is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  website: string | null;
  avatar_url: string | null;
  plan: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createBrowserClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Get avatar from user metadata (Google uses 'picture', GitHub uses 'avatar_url')
      const userAvatarUrl = user.user_metadata?.picture || user.user_metadata?.avatar_url || null;
      setAvatarUrl(userAvatarUrl);
      setUserEmail(user.email ?? "");
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
        // Use avatar from profile or fall back to user metadata (Google uses 'picture')
        if (profileData.avatar_url) {
          setAvatarUrl(profileData.avatar_url);
        } else if (user.user_metadata?.picture) {
          setAvatarUrl(user.user_metadata.picture);
        } else if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }
        setUserName(profileData.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "");
        reset({
          full_name: profileData.full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
          company: profileData.company || user.user_metadata?.company || "",
          website: profileData.website || "",
        });
      } else {
        // Profile doesn't exist yet - use user data from auth
        reset({
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          company: user.user_metadata?.company || "",
          website: "",
        });
      }

      setIsLoading(false);
    }

    fetchProfile();
  }, [reset, router]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    const supabase = createBrowserClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: data.full_name,
          company: data.company,
          website: data.website || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also update the user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          company: data.company,
        },
      });

      toast.success("Profile updated successfully!");
      reset(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const getPlanDisplay = (plan: string | undefined) => {
    switch (plan) {
      case "pro":
        return { label: "Pro", color: "bg-brand text-white" };
      case "agency":
        return { label: "Agency", color: "bg-purple-600 text-white" };
      default:
        return { label: "Starter", color: "bg-gray-200 text-gray-700" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12 px-5">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="eyebrow mb-3">Account settings</p>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your account information and preferences
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            {/* Avatar and plan badge */}
            <div className="mb-8 flex items-center gap-4 rounded-xl bg-gray-50 p-4">
              {/* Avatar */}
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="size-14 rounded-full object-cover ring-2 ring-white"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-brand text-white text-xl font-semibold ring-2 ring-white">
                    {userName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {userName || "Your Account"}
                </p>
                <p className="text-xs text-gray-500">
                  Member since{" "}
                  {profile?.created_at &&
                    new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                </p>
              </div>
              {profile?.plan && (
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    getPlanDisplay(profile.plan).color
                  )}
                >
                  {getPlanDisplay(profile.plan).label}
                </span>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                  Full name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    {...register("full_name")}
                    id="full_name"
                    type="text"
                    placeholder="Alex Rivera"
                    autoComplete="name"
                    className={cn(
                      "pl-10 h-11",
                      errors.full_name ? "border-red-400" : ""
                    )}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-xs text-red-500">{errors.full_name.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                  Company name
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    {...register("company")}
                    id="company"
                    type="text"
                    placeholder="NutriVive Co."
                    autoComplete="organization"
                    className={cn(
                      "pl-10 h-11",
                      errors.company ? "border-red-400" : ""
                    )}
                  />
                </div>
                {errors.company && (
                  <p className="text-xs text-red-500">{errors.company.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    disabled
                    className="pl-10 h-11 bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Contact support to change your email address
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                  Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    {...register("website")}
                    id="website"
                    type="url"
                    placeholder="https://yourcompany.com"
                    autoComplete="url"
                    className={cn(
                      "pl-10 h-11",
                      errors.website ? "border-red-400" : ""
                    )}
                  />
                </div>
                {errors.website && (
                  <p className="text-xs text-red-500">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className={cn(
                  "flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition shadow-sm",
                  "hover:bg-brand-dark",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Save changes
                  </>
                )}
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={() => reset()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Discard changes
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Password / Security section */}
        <PasswordSection />

        {/* Danger zone */}
        <DangerZone userEmail={userEmail} />
      </div>
    </div>
  );
}

function PasswordSection() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  async function sendReset() {
    if (!email) return;
    setLoading(true);
    const supabase = createBrowserClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
      <div className="flex items-center gap-3">
        <KeyRound className="size-5 text-gray-400" />
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Password</h2>
          <p className="text-[13px] text-gray-500">Send a password reset link to your email.</p>
        </div>
      </div>
      <div className="mt-5">
        {sent ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
            <Check className="size-4" />
            Reset link sent to {email}
          </div>
        ) : (
          <button
            type="button"
            onClick={sendReset}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[13px] font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            Send password reset email
          </button>
        )}
      </div>
    </div>
  );
}

function DangerZone({ userEmail }: { userEmail: string }) {
  const [confirm, setConfirm] = useState(false);
  const [input, setInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function deleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
      router.push("/?deleted=1");
    } catch {
      toast.error("Failed to delete account. Contact support@formlayer.co.");
      setDeleting(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-white p-8">
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-5 text-red-500" />
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Danger zone</h2>
          <p className="text-[13px] text-gray-500">Permanently delete your account and all formulation data.</p>
        </div>
      </div>
      <div className="mt-5">
        {!confirm ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-[13px] font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            Delete my account
          </button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-[13px] font-medium text-red-900">This will permanently delete your account and all formulations. This cannot be undone.</p>
            <p className="mt-2 text-[12px] text-red-600">Type <strong>{userEmail}</strong> to confirm:</p>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={userEmail}
              className="mt-2 h-9 w-full rounded-lg border border-red-200 bg-white px-3 text-[13px] outline-none focus:border-red-400"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={input !== userEmail || deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
              >
                {deleting && <Loader2 className="size-3.5 animate-spin" />}
                Delete account
              </button>
              <button
                type="button"
                onClick={() => { setConfirm(false); setInput(""); }}
                className="rounded-lg border border-black/[0.08] px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
