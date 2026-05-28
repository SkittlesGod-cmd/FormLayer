"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Microscope, ShieldCheck, Factory, Plus, TrendingUp, Beaker, Calendar } from "lucide-react";
import { createBrowserClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "there";
  const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-8 px-5">
      <div className="mx-auto max-w-6xl">
        {/* Welcome header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{getGreeting()},</p>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName.split(' ')[0]} 👋</h1>
            <p className="mt-1 text-sm text-gray-500">
              Here's what's happening with your formulations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-6 rounded-full object-cover" />
              ) : (
                <div className="flex size-6 items-center justify-center rounded-full bg-brand text-xs text-white">
                  {userName[0]?.toUpperCase()}
                </div>
              )}
              Profile
            </Link>
            <Link
              href="/dashboard/new"
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Plus className="size-4" />
              New formulation
            </Link>
          </div>
        </div>

        {/* Stats overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand-50">
                <Beaker className="size-5 text-brand" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Formulations</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-50">
                <TrendingUp className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50">
                <Calendar className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Reviews</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50">
                <ShieldCheck className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-brand transition-colors">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand">
              <Microscope className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Research</h2>
            <p className="mt-2 text-sm text-gray-500">
              Search clinical studies and build evidence-based formulations
            </p>
            <Link
              href="/dashboard/research"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
            >
              Start researching <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-green-500 transition-colors">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-green-50 text-green-600">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Compliance</h2>
            <p className="mt-2 text-sm text-gray-500">
              Review claims and ensure FDA compliance before launch
            </p>
            <Link
              href="/dashboard/compliance"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
            >
              Review compliance <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:border-purple-500 transition-colors">
            <div className="inline-flex size-10 items-center justify-center rounded-full bg-purple-50 text-purple-600">
              <Factory className="size-5" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Manufacturing</h2>
            <p className="mt-2 text-sm text-gray-500">
              Connect with manufacturers and manage RFQs
            </p>
            <Link
              href="/dashboard/manufacturers"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:underline"
            >
              Find manufacturers <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Recent formulations */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Formulations</h2>
            <Link href="/dashboard/formulations" className="text-sm text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="p-12 text-center">
            <div className="mx-auto size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Microscope className="size-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No formulations yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Create your first formulation to start building evidence-backed supplements
            </p>
            <Link
              href="/dashboard/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
            >
              <Plus className="size-4" />
              Create formulation
            </Link>
          </div>
        </div>

        {/* Coming soon banner */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-medium text-amber-800">
            🚧 The full platform is coming soon. RAG-powered research, compliance checking, and manufacturer connections are in development.
          </p>
        </div>
      </div>
    </div>
  );
}