"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, Plus, Search, Zap } from "lucide-react";
import { toast } from "sonner";

import {
  FORMULATION_STATUSES,
  STATUS_BADGE_CLASSES,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  type Formulation,
  type FormulationStatus,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";

interface Meta {
  count: number;
  limit: number;
  plan: string;
  canCreate: boolean;
}

function StatusBadge({ status }: { status: FormulationStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", STATUS_BADGE_CLASSES[status])}>
      <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASSES[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diffD = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffD === 0) return "Today";
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FormulationsListPage() {
  const router = useRouter();
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormulationStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/formulations${params.toString() ? `?${params}` : ""}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json() as { formulations: Formulation[]; meta: Meta };
        if (!cancelled) {
          setFormulations(json.formulations);
          setMeta(json.meta);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? formulations.filter(f => f.name.toLowerCase().includes(q)) : formulations;
  }, [formulations, search]);

  async function handleDuplicate(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(id);
    try {
      const res = await fetch(`/api/formulations/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.limit) {
          toast.error("Formulation limit reached. Upgrade your plan.");
        } else {
          throw new Error(json.error ?? "Failed to duplicate");
        }
        return;
      }
      toast.success("Formulation duplicated");
      router.push(`/dashboard/formulations/${json.formulation.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to duplicate");
    } finally {
      setDuplicating(null);
    }
  }

  const atLimit = meta && !meta.canCreate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Workspace</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">Formulations</h1>
        </div>
        {atLimit ? (
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-brand-dark"
          >
            <Zap className="size-3.5" />
            Upgrade to add more
          </Link>
        ) : (
          <Link
            href="/dashboard/formulations/new"
            className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
          >
            <Plus className="size-3.5" />
            New
          </Link>
        )}
      </div>

      {/* Plan limit banner */}
      {atLimit && meta && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-amber-900">
              {meta.limit === 0 ? "No formulations" : `${meta.count}/${meta.limit} formulations used`} on {meta.plan} plan
            </p>
            <p className="mt-0.5 text-[12px] text-amber-700">Upgrade to create more formulations and unlock advanced features.</p>
          </div>
          <Link
            href="/dashboard/billing"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-amber-700"
          >
            Upgrade plan
          </Link>
        </div>
      )}

      {/* Usage indicator (not at limit) */}
      {meta && !atLimit && meta.limit !== -1 && (
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.min(100, (meta.count / meta.limit) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] text-gray-400">{meta.count}/{meta.limit} formulations</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search formulations…"
            className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["all", ...FORMULATION_STATUSES] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                statusFilter === s
                  ? "bg-gray-950 text-white"
                  : "bg-white border border-black/[0.08] text-gray-500 hover:border-black/20 hover:text-gray-900"
              )}
            >
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-black/[0.04] px-5 py-4 last:border-0">
              <div className="h-3.5 w-40 animate-pulse rounded bg-gray-100" />
              <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-[13px] text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.08] bg-white py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
            <svg className="size-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9m-9 0V3m0 6h6M9 3l6 6" />
            </svg>
          </div>
          <p className="text-[13px] font-medium text-gray-900">
            {search || statusFilter !== "all" ? "No matches found" : "No formulations yet"}
          </p>
          <p className="mt-1 text-[12px] text-gray-400">
            {search || statusFilter !== "all" ? "Try adjusting your search or filter." : "Create your first formulation to get started."}
          </p>
          {!(search || statusFilter !== "all") && !atLimit && (
            <Link
              href="/dashboard/formulations/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
            >
              <Plus className="size-3.5" />
              New formulation
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-black/[0.05] px-5 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Name</span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:block">Ingredients</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gray-400 sm:block">Updated</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400"></span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-black/[0.04]">
            {filtered.map(f => (
              <Link
                key={f.id}
                href={`/dashboard/formulations/${f.id}`}
                className="group grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition hover:bg-black/[0.02]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-gray-900 group-hover:text-brand transition-colors">
                    {f.name}
                  </p>
                  {f.description && (
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">{f.description}</p>
                  )}
                </div>
                <span className="hidden font-mono text-[12px] text-gray-400 sm:block">
                  {Array.isArray(f.ingredients) ? f.ingredients.length : 0}
                </span>
                <StatusBadge status={f.status} />
                <span className="hidden text-[12px] text-gray-400 sm:block">
                  {relativeDate(f.updated_at)}
                </span>
                <button
                  type="button"
                  onClick={e => handleDuplicate(e, f.id)}
                  disabled={duplicating === f.id}
                  title="Duplicate formulation"
                  className="flex size-7 items-center justify-center rounded-md border border-transparent text-gray-300 opacity-0 transition hover:border-black/[0.08] hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 disabled:opacity-40"
                >
                  <Copy className="size-3.5" />
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
