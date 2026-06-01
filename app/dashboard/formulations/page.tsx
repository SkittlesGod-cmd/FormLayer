"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Check, Copy, FlaskConical, LayoutGrid,
  LayoutList, Loader2, Plus, Search, ShieldCheck, Sparkles, Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  FORMULATION_STATUSES,
  PRODUCT_TYPE_LABELS,
  STATUS_LABELS,
  type Formulation,
  type FormulationIngredient,
  type FormulationStatus,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meta { count: number; limit: number; plan: string; canCreate: boolean; }
type ViewMode = "grid" | "list";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diffD = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffD === 0) return "Today";
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function scoreColor(s: number | null) {
  if (s === null) return "#9ca3af";
  if (s >= 80) return "#10b981";
  if (s >= 60) return "#f59e0b";
  return "#ef4444";
}

const STATUS_GLOW: Record<FormulationStatus, string> = {
  compliant:   "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
  in_progress: "bg-brand shadow-[0_0_8px_rgba(91,110,225,0.7)]",
  review:      "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
  draft:       "bg-zinc-400",
};

const STATUS_TEXT: Record<FormulationStatus, string> = {
  compliant:   "text-emerald-400",
  in_progress: "text-brand",
  review:      "text-amber-400",
  draft:       "text-zinc-400",
};

const STATUS_FILTER_ACTIVE: Record<FormulationStatus | "all", string> = {
  all:         "bg-white text-gray-950 shadow-sm",
  draft:       "bg-white text-zinc-700 shadow-sm",
  in_progress: "bg-white text-brand shadow-sm",
  review:      "bg-white text-amber-600 shadow-sm",
  compliant:   "bg-white text-emerald-700 shadow-sm",
};

// ─── Evidence segment bar ─────────────────────────────────────────────────────

function EvidenceBar({ ingredients }: { ingredients: FormulationIngredient[] }) {
  if (!ingredients.length) return null;
  const GAP = 2;
  return (
    <div className="flex w-full overflow-hidden rounded-full" style={{ gap: GAP, height: 6 }}>
      {ingredients.map((ing, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-full transition-all",
            ing.evidence_grade === "A" ? "bg-emerald-400" :
            ing.evidence_grade === "B" ? "bg-amber-400" :
            ing.evidence_grade === "C" ? "bg-orange-400" :
            "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Large compliance score arc ───────────────────────────────────────────────

function ScoreArc({ score }: { score: number | null }) {
  if (score === null) return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-[11px] text-white/20">—</span>
    </div>
  );
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="relative flex items-center justify-center">
      <svg width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
        <circle
          cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - dash}
          style={{ transformOrigin: "22px 22px", transform: "rotate(-90deg)" }}
        />
      </svg>
      <span className="absolute font-mono text-[11px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── Grade distribution pills ─────────────────────────────────────────────────

function GradePills({ ingredients }: { ingredients: FormulationIngredient[] }) {
  const c = ingredients.reduce((a, i) => {
    if (i.evidence_grade) a[i.evidence_grade] = (a[i.evidence_grade] ?? 0) + 1;
    return a;
  }, {} as Record<string, number>);
  if (!c.A && !c.B && !c.C) return null;
  return (
    <div className="flex items-center gap-1">
      {c.A ? <span className="rounded-md bg-emerald-400/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">{c.A}A</span> : null}
      {c.B ? <span className="rounded-md bg-amber-400/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-400">{c.B}B</span> : null}
      {c.C ? <span className="rounded-md bg-orange-400/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-orange-400">{c.C}C</span> : null}
    </div>
  );
}

// ─── Formula card (grid) ──────────────────────────────────────────────────────

function FormulaCard({
  f, onDuplicate, duplicating, index,
}: {
  f: Formulation; onDuplicate: (e: React.MouseEvent, id: string) => void;
  duplicating: string | null; index: number;
}) {
  const ings = f.ingredients ?? [];
  const first3 = ings.slice(0, 3);
  const extra = Math.max(0, ings.length - 3);
  const productLabel = f.product_type
    ? (PRODUCT_TYPE_LABELS[f.product_type as keyof typeof PRODUCT_TYPE_LABELS] ?? f.product_type)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        href={`/dashboard/formulations/${f.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/20 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
      >
        {/* Card header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex flex-col gap-1.5">
            {productLabel && (
              <span className="w-fit rounded-md border border-black/[0.06] bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {productLabel}
              </span>
            )}
            {ings.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="font-mono font-semibold text-gray-700">{ings.length}</span>
                ingredient{ings.length !== 1 ? "s" : ""}
                <GradePills ingredients={ings} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", STATUS_GLOW[f.status])} />
              <span className={cn("text-[11px] font-semibold", STATUS_TEXT[f.status])}>
                {STATUS_LABELS[f.status]}
              </span>
            </div>
            {f.compliance_score !== null && (
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: scoreColor(f.compliance_score) }}
              >
                {f.compliance_score}/100
              </span>
            )}
          </div>
        </div>

        {/* Name + description */}
        <div className="flex-1 px-6 pb-5">
          <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-gray-950 transition-colors group-hover:text-brand">
            {f.name}
          </h3>
          {f.description && (
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-gray-500">
              {f.description}
            </p>
          )}
        </div>

        {/* Evidence bar */}
        {ings.length > 0 && (
          <div className="px-6 pb-4">
            <EvidenceBar ingredients={ings} />
          </div>
        )}

        {/* Ingredient pills */}
        {ings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-6 pb-5">
            {first3.map((ing, i) => (
              <span
                key={i}
                className="rounded-full border border-black/[0.06] bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600"
              >
                {ing.name}
              </span>
            ))}
            {extra > 0 && (
              <span className="rounded-full border border-black/[0.06] bg-gray-50 px-2.5 py-1 text-[11px] text-gray-400">
                +{extra} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/[0.05] bg-gray-50/80 px-6 py-3">
          <span className="text-[11px] text-gray-400">{relativeDate(f.updated_at)}</span>
          <div className="flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
            <button
              type="button"
              onClick={e => onDuplicate(e, f.id)}
              disabled={duplicating === f.id}
              title="Duplicate"
              className="flex size-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
            >
              {duplicating === f.id ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
            </button>
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-brand">
              Open <ArrowRight className="size-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Formula row (list) ───────────────────────────────────────────────────────

function FormulaRow({
  f, onDuplicate, duplicating,
}: {
  f: Formulation; onDuplicate: (e: React.MouseEvent, id: string) => void; duplicating: string | null;
}) {
  const ings = f.ingredients ?? [];
  const productLabel = f.product_type
    ? (PRODUCT_TYPE_LABELS[f.product_type as keyof typeof PRODUCT_TYPE_LABELS] ?? f.product_type)
    : null;

  return (
    <Link
      href={`/dashboard/formulations/${f.id}`}
      className="group flex items-center gap-5 border-b border-black/[0.04] px-6 py-4 transition last:border-0 hover:bg-black/[0.015]"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
        <FlaskConical className="size-4 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14px] font-semibold text-gray-950 transition group-hover:text-brand">
            {f.name}
          </p>
          {productLabel && (
            <span className="hidden shrink-0 rounded border border-black/[0.06] bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:inline-block">
              {productLabel}
            </span>
          )}
        </div>
        {f.description && (
          <p className="mt-0.5 truncate text-[12px] text-gray-400">{f.description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-6">
        <span className="hidden font-mono text-[12px] text-gray-400 sm:block">{ings.length} ing.</span>
        <div className="hidden items-center gap-2 sm:flex">
          <span className={cn("size-1.5 rounded-full shrink-0", STATUS_GLOW[f.status])} />
          <span className={cn("text-[12px] font-medium", STATUS_TEXT[f.status])}>{STATUS_LABELS[f.status]}</span>
        </div>
        {f.compliance_score !== null && (
          <span
            className="hidden font-mono text-[13px] font-bold sm:block"
            style={{ color: scoreColor(f.compliance_score) }}
          >
            {f.compliance_score}/100
          </span>
        )}
        <span className="hidden text-[12px] text-gray-400 sm:block">{relativeDate(f.updated_at)}</span>
        <button
          type="button"
          onClick={e => onDuplicate(e, f.id)}
          disabled={duplicating === f.id}
          title="Duplicate"
          className="flex size-7 items-center justify-center rounded-lg border border-transparent text-gray-300 opacity-0 transition hover:border-black/[0.08] hover:bg-gray-50 hover:text-gray-600 group-hover:opacity-100 disabled:opacity-40"
        >
          {duplicating === f.id ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
        </button>
      </div>
    </Link>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyLibrary({ hasFilter, atLimit }: { hasFilter: boolean; atLimit: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="relative mb-8">
        <div className="flex size-20 items-center justify-center rounded-3xl border border-black/[0.06] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <FlaskConical className="size-9 text-gray-200" />
        </div>
        <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-brand shadow-[0_0_12px_rgba(91,110,225,0.5)]">
          <Sparkles className="size-3 text-white" />
        </div>
      </div>
      <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-gray-950">
        {hasFilter ? "No formulas match" : "Your formula library awaits"}
      </h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-gray-400">
        {hasFilter
          ? "Try a different search term or remove the status filter."
          : "Build your first AI-powered supplement formulation. Clinical research, dosing, and compliance — all automated."
        }
      </p>
      {!hasFilter && !atLimit && (
        <Link
          href="/dashboard/formulations/new"
          className="mt-8 flex items-center gap-2.5 rounded-2xl bg-gray-950 px-7 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-gray-800"
        >
          <Sparkles className="size-4 text-brand" />
          Build your first formula
        </Link>
      )}
    </motion.div>
  );
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────

function CardSkeleton({ i }: { i: number }) {
  return (
    <div className="flex flex-col rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ animationDelay: `${i * 80}ms` }}>
      <div className="px-6 pt-6 pb-4">
        <div className="flex justify-between">
          <div className="h-4 w-16 animate-pulse rounded-md bg-gray-100" />
          <div className="h-4 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
      <div className="flex-1 space-y-2 px-6 pb-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100/70" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100/50" />
      </div>
      <div className="px-6 pb-4">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="flex gap-1.5 px-6 pb-5">
        {[60, 48, 52].map((w, j) => <div key={j} className="h-6 animate-pulse rounded-full bg-gray-100" style={{ width: w }} />)}
      </div>
      <div className="border-t border-black/[0.04] bg-gray-50/80 px-6 py-3">
        <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FormulationsListPage() {
  const router = useRouter();
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FormulationStatus | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/formulations", { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then(json => {
        if (!cancelled) { setFormulations(json.formulations); setMeta(json.meta); }
      })
      .catch(e => { if (!cancelled) setError(e.message ?? "Something went wrong"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Focus search on /
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    let list = formulations;
    if (statusFilter !== "all") list = list.filter(f => f.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(f =>
      f.name.toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q)
    );
    return list;
  }, [formulations, statusFilter, search]);

  const stats = useMemo(() => {
    const compliant = formulations.filter(f => f.status === "compliant").length;
    const inPipeline = formulations.filter(f => f.status === "in_progress" || f.status === "review").length;
    const scored = formulations.filter(f => f.compliance_score !== null);
    const avg = scored.length
      ? Math.round(scored.reduce((s, f) => s + (f.compliance_score ?? 0), 0) / scored.length)
      : null;
    const counts: Record<FormulationStatus, number> = { draft: 0, in_progress: 0, review: 0, compliant: 0 };
    for (const f of formulations) counts[f.status]++;
    return { compliant, inPipeline, avg, counts };
  }, [formulations]);

  async function handleDuplicate(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(id);
    try {
      const res = await fetch(`/api/formulations/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.limit ? "Formulation limit reached. Upgrade your plan." : (json.error ?? "Failed to duplicate"));
        return;
      }
      toast.success("Formulation duplicated");
      router.push(`/dashboard/formulations/${json.formulation.id}`);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, "Failed to duplicate"));
    } finally {
      setDuplicating(null);
    }
  }

  const atLimit = Boolean(meta && !meta.canCreate);
  const hasFilter = Boolean(search.trim()) || statusFilter !== "all";
  const showStats = !loading && !error && formulations.length > 0;

  return (
    <div className="space-y-0">

      {/* ── Dark hero ─────────────────────────────────────────────────────── */}
      <div className="-mx-5 -mt-8 mb-0 overflow-hidden bg-gray-950">
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative px-5 pt-10 pb-8">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/30">
                Formula Library
              </p>
              <h1 className="mt-2 text-[36px] font-bold tracking-[-0.03em] text-white leading-none">
                Formulations
              </h1>
              <p className="mt-2.5 text-[14px] text-white/40 max-w-md">
                Build, validate, and iterate on supplement formulations with AI-powered research and compliance.
              </p>
            </div>

            {/* New formula CTA */}
            {atLimit ? (
              <Link
                href="/dashboard/billing"
                className="shrink-0 flex items-center gap-2 rounded-2xl bg-brand/20 border border-brand/30 px-5 py-2.5 text-[13px] font-semibold text-brand transition hover:bg-brand/30"
              >
                <Zap className="size-4" />
                Upgrade
              </Link>
            ) : (
              <Link
                href="/dashboard/formulations/new"
                className="group shrink-0 flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3 text-[14px] font-bold text-gray-950 shadow-[0_4px_20px_rgba(255,255,255,0.1)] transition hover:bg-white/90"
              >
                <Plus className="size-4" />
                New formula
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {/* Stats row */}
          {showStats && (
            <div className="mt-8 flex items-end gap-8 border-t border-white/[0.06] pt-6">
              <div>
                <p className="font-mono text-[32px] font-bold leading-none text-white">
                  {formulations.length}
                </p>
                <p className="mt-1 text-[11px] font-medium text-white/30">Total</p>
              </div>
              {stats.compliant > 0 && (
                <div>
                  <p className="font-mono text-[32px] font-bold leading-none text-emerald-400">
                    {stats.compliant}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-white/30">Compliant</p>
                </div>
              )}
              {stats.inPipeline > 0 && (
                <div>
                  <p className="font-mono text-[32px] font-bold leading-none text-brand">
                    {stats.inPipeline}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-white/30">In pipeline</p>
                </div>
              )}
              {stats.avg !== null && (
                <div>
                  <p
                    className="font-mono text-[32px] font-bold leading-none"
                    style={{ color: scoreColor(stats.avg) }}
                  >
                    {stats.avg}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-white/30">Avg. compliance</p>
                </div>
              )}
              {meta && meta.limit !== -1 && (
                <div className="ml-auto flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-white/40 transition-all"
                        style={{ width: `${Math.min(100, (meta.count / meta.limit) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-white/30">{meta.count}/{meta.limit}</span>
                  </div>
                  {atLimit && (
                    <p className="text-[11px] text-amber-400">Limit reached — <Link href="/dashboard/billing" className="underline">upgrade</Link></p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search + filter strip inside the dark hero */}
        <div className="border-t border-white/[0.06] bg-gray-900/60 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search formulas… (/)'
                className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.06] pl-9 pr-3 text-[13px] text-white outline-none transition placeholder:text-white/25 focus:border-white/20 focus:bg-white/10"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Status filter */}
              <div className="flex items-center rounded-xl bg-white/[0.06] p-1 gap-0.5">
                {(["all", ...FORMULATION_STATUSES] as const).map(s => {
                  const count = s === "all" ? formulations.length : stats.counts[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                        statusFilter === s
                          ? STATUS_FILTER_ACTIVE[s]
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {s === "all" ? "All" : STATUS_LABELS[s]}
                      {count > 0 && (
                        <span className={cn("ml-1.5 font-mono text-[10px]", statusFilter === s ? "opacity-60" : "opacity-40")}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* View toggle */}
              <div className="flex overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "flex size-9 items-center justify-center transition",
                    viewMode === "grid" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "flex size-9 items-center justify-center transition",
                    viewMode === "list" ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"
                  )}
                >
                  <LayoutList className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="pt-8">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-[13px] text-red-600">{error}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} i={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <EmptyLibrary hasFilter={hasFilter} atLimit={atLimit} />
        )}

        {/* Grid / List */}
        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtered.map((f, i) => (
                  <FormulaCard
                    key={f.id} f={f} index={i}
                    onDuplicate={handleDuplicate} duplicating={duplicating}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              >
                <div className="grid items-center gap-5 border-b border-black/[0.05] bg-gray-50/80 px-6 py-3"
                  style={{ gridTemplateColumns: "auto 1fr auto auto auto auto auto" }}>
                  <span className="w-9" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</span>
                  <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">Ingredients</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
                  <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">Score</span>
                  <span className="hidden text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:block">Updated</span>
                  <span className="w-7" />
                </div>
                {filtered.map(f => (
                  <FormulaRow key={f.id} f={f} onDuplicate={handleDuplicate} duplicating={duplicating} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
