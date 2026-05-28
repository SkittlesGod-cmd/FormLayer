"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Microscope, 
  ShieldCheck, 
  Factory, 
  Plus, 
  TrendingUp, 
  Beaker, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Flame,
  Target,
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface Formulation {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  formulations: number;
  inProgress: number;
  reviews: number;
  compliant: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [stats, setStats] = useState<Stats>({ formulations: 0, inProgress: 0, reviews: 0, compliant: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch user's formulations (with error handling for missing table)
        try {
          const { data: formulationsData, error } = await supabase
            .from("formulations")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (!error && formulationsData) {
            setFormulations(formulationsData);
            
            // Calculate stats
            const inProgress = formulationsData.filter(f => f.status === "in_progress" || f.status === "draft").length;
            const reviews = formulationsData.filter(f => f.status === "review").length;
            const compliant = formulationsData.filter(f => f.status === "compliant").length;
            
            setStats({
              formulations: formulationsData.length,
              inProgress,
              reviews,
              compliant
            });
          }
        } catch (err) {
          console.log("Formulations table not ready yet:", err);
        }

        // Fetch recent activity from profiles updates
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("updated_at")
            .eq("id", user.id)
            .single();

          if (profile) {
            setRecentActivity([
              { type: "welcome", message: "Welcome to NutraCloud!", time: new Date().toISOString() },
              { type: "profile", message: "Profile created", time: profile.updated_at }
            ]);
          }
        } catch (err) {
          console.log("Profile fetch error:", err);
        }
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || "there";
  const avatarUrl = user?.user_metadata?.picture || user?.user_metadata?.avatar_url || null;
  const firstName = userName.split(' ')[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="size-4 text-gray-400" />;
      case "in_progress":
        return <Flame className="size-4 text-orange-500" />;
      case "review":
        return <AlertCircle className="size-4 text-amber-500" />;
      case "compliant":
        return <CheckCircle className="size-4 text-green-500" />;
      default:
        return <Clock className="size-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-600",
      in_progress: "bg-orange-100 text-orange-700",
      review: "bg-amber-100 text-amber-700",
      compliant: "bg-green-100 text-green-700"
    };
    return styles[status] || styles.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Draft",
      in_progress: "In Progress",
      review: "In Review",
      compliant: "Compliant"
    };
    return labels[status] || "Unknown";
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="size-10 mx-auto animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
          <p className="mt-4 text-sm text-gray-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{getGreeting()}, {firstName} 👋</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-1">
                Your Workspace
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="size-8 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-brand text-sm text-white">
                  {userName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {/* Welcome card with quick actions */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold">Welcome to NutraCloud, {firstName}! 🎉</h2>
              <p className="mt-2 text-sm text-white/80 max-w-xl">
                Build evidence-backed supplement formulations with AI-powered research, 
                compliance checking, and manufacturer connections.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/dashboard/new"
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand shadow-sm hover:bg-gray-50 transition"
                >
                  <Plus className="size-4" />
                  New Formulation
                </Link>
                <Link
                  href="/dashboard/research"
                  className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition"
                >
                  <Microscope className="size-4" />
                  Start Research
                </Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Target className="size-12 text-white/20" />
            </div>
          </div>
        </div>

        {/* Stats overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-brand/30 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 group-hover:bg-brand/20 transition">
                  <Beaker className="size-5 text-brand" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.formulations}</p>
                  <p className="text-xs text-gray-500">Formulations</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-gray-400 group-hover:text-brand transition" />
            </div>
          </div>

          <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-500/30 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 group-hover:bg-orange-100 transition">
                  <Flame className="size-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-gray-400 group-hover:text-orange-500 transition" />
            </div>
          </div>

          <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-amber-500/30 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-100 transition">
                  <Calendar className="size-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
                  <p className="text-xs text-gray-500">In Review</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-gray-400 group-hover:text-amber-500 transition" />
            </div>
          </div>

          <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all hover:border-green-500/30 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-100 transition">
                  <ShieldCheck className="size-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.compliant}</p>
                  <p className="text-xs text-gray-500">Compliant</p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-gray-400 group-hover:text-green-500 transition" />
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Formulations */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FileText className="size-5 text-brand" />
                  <h2 className="text-lg font-semibold text-gray-900">Recent Formulations</h2>
                </div>
                <Link href="/dashboard/formulations" className="flex items-center gap-1 text-sm text-brand hover:underline">
                  View all <ChevronRight className="size-4" />
                </Link>
              </div>
              
              {formulations.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {formulations.map((formulation) => (
                    <Link 
                      key={formulation.id} 
                      href={`/dashboard/formulations/${formulation.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10">
                          <Beaker className="size-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{formulation.name}</p>
                          <p className="text-xs text-gray-500">Updated {formatDate(formulation.updated_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(formulation.status)}`}>
                          {getStatusIcon(formulation.status)}
                          {getStatusLabel(formulation.status)}
                        </span>
                        <ChevronRight className="size-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="mx-auto size-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Beaker className="size-8 text-gray-400" />
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
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 group-hover:bg-brand/20 transition">
                    <Microscope className="size-6 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Research</h3>
                    <p className="text-xs text-gray-500">Powered by AI</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Search clinical studies and build evidence-based formulations with RAG-powered research.
                </p>
                <Link
                  href="/dashboard/research"
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                >
                  Start researching <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-100 transition">
                    <ShieldCheck className="size-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Compliance</h3>
                    <p className="text-xs text-gray-500">FDA ready</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Review claims and ensure FDA compliance before launching your supplement.
                </p>
                <Link
                  href="/dashboard/compliance"
                  className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline"
                >
                  Review compliance <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-purple-50 group-hover:bg-purple-100 transition">
                    <Factory className="size-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manufacturing</h3>
                    <p className="text-xs text-gray-500">Connect</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Connect with manufacturers and manage RFQs for your formulations.
                </p>
                <Link
                  href="/dashboard/manufacturers"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:underline"
                >
                  Find manufacturers <ArrowRight className="size-4" />
                </Link>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50 group-hover:bg-amber-100 transition">
                    <Users className="size-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Team</h3>
                    <p className="text-xs text-gray-500">Collaborate</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Invite team members to collaborate on your formulations.
                </p>
                <Link
                  href="/dashboard/team"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:underline"
                >
                  Manage team <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="text-center">
                <div className="relative mx-auto w-fit">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={userName} 
                      className="size-20 rounded-full object-cover ring-4 ring-gray-100" 
                    />
                  ) : (
                    <div className="size-20 flex items-center justify-center rounded-full bg-brand text-2xl text-white ring-4 ring-brand/20">
                      {userName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{userName}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Getting Started */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Getting Started</h3>
              <div className="space-y-3">
                {[
                  { icon: Plus, text: "Create your first formulation", done: stats.formulations > 0 },
                  { icon: Microscope, text: "Research ingredients", done: false },
                  { icon: ShieldCheck, text: "Check compliance", done: false },
                  { icon: Factory, text: "Connect manufacturer", done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`flex size-6 items-center justify-center rounded-full ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {item.done ? (
                        <CheckCircle className="size-3.5 text-green-600" />
                      ) : (
                        <span className="text-xs text-gray-400">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/docs" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                  <span>Documentation</span>
                  <ArrowUpRight className="size-4" />
                </Link>
                <Link href="/pricing" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                  <span>Upgrade Plan</span>
                  <ArrowUpRight className="size-4" />
                </Link>
                <Link href="/support" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                  <span>Get Support</span>
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Coming soon banner */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Platform in Development</p>
              <p className="mt-1 text-sm text-amber-700">
                RAG-powered research, compliance checking, and manufacturer connections are coming soon. 
                Create formulations and we'll notify you when new features are available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}