"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@/utils/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isNewUser: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isNewUser: false,
  });

  const supabase = createBrowserClient();

  const fetchSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching session:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!active) return;
        if (error) throw error;
        setState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isLoading: false,
        }));
      })
      .catch(() => {
        if (active) setState((prev) => ({ ...prev, isLoading: false }));
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        isLoading: false,
        isNewUser: event === "SIGNED_IN" && prev.user === null,
      }));

      if (event === "SIGNED_IN") {
        // Redirect handled by middleware
      } else if (event === "SIGNED_OUT") {
        window.location.href = "/sign-in";
      } else if (event === "USER_UPDATED") {
        fetchSession();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchSession]);

  return state;
}

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  const signInWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (password) {
        // Sign in with password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        return { error: null };
      } else {
        // Sign in with magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        toast.success("Check your email for the magic link!");
        return { sent: true };
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Sign in failed");
      toast.error(message);
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithEmail, isLoading };
}

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  const signUp = async (
    email: string,
    password: string,
    metadata: {
      full_name: string;
      company: string;
    }
  ) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      });
      if (error) throw error;
      toast.success("Account created! Check your email to verify.");
      return { success: true };
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Sign up failed");
      toast.error(message);
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return { signUp, isLoading };
}

export function useSignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      window.location.href = "/";
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Sign out failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return { signOut, isLoading };
}

export function useUpdateProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createBrowserClient();

  const updateProfile = async (data: {
    full_name?: string;
    company?: string;
    website?: string;
  }) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated!");
      return { success: true };
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Update failed");
      toast.error(message);
      return { error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, isLoading };
}
