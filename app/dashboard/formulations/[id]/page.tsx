"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  Download,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { FormulationForm, type FormulationFormValues } from "@/components/formulations/FormulationForm";
import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import {
  FORMULATION_STATUSES,
  STATUS_BADGE_CLASSES,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  type Formulation,
  type FormulationStatus,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";

type Tab = "overview" | "research" | "compliance" | "edit";

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
  if (diffD === 0) return "today";
  if (diffD === 1) return "yesterday";
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Compliance result types ──────────────────────────────────────────────────
interface ComplianceIssue {
  severity: "high" | "medium" | "low";
  ingredient: string | null;
  issue: string;
  detail: string;
}
interface ComplianceResult {
  score: number;
  summary: string;
  issues: ComplianceIssue[];
  compliant_claims: string[];
  risky_claims: string[];
  recommendations: string[];
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ formulation }: { formulation: Formulation }) {
  return (
    <div className="space-y-4">
      {/* Specs */}
      {[formulation.description, formulation.target_dose, formulation.serving_size, formulation.capsule_size, formulation.capsules_per_serving].some(Boolean) && (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.05] px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-gray-900">Specifications</h2>
          </div>
          <dl className="grid gap-4 p-5 sm:grid-cols-2">
            {([
              ["Description", formulation.description],
              ["Target dose", formulation.target_dose],
              ["Serving size", formulation.serving_size],
              ["Capsule size", formulation.capsule_size],
              ["Capsules / serving", formulation.capsules_per_serving != null ? String(formulation.capsules_per_serving) : null],
            ] as [string, string | null | undefined][]).filter(([, v]) => v != null && String(v).length > 0).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</dt>
                <dd className="mt-1 text-[13px] text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Ingredients */}
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">
            Ingredients
            <span className="ml-2 font-mono text-[11px] text-gray-400">
              {formulation.ingredients.length}
            </span>
          </h2>
        </div>
        {formulation.ingredients.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13px] text-gray-400">No ingredients yet.</p>
        ) : (
          <div>
            <div className="grid grid-cols-[1fr_auto] border-b border-black/[0.05] px-5 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Ingredient</span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Dose</span>
            </div>
            <ul className="divide-y divide-black/[0.04]">
              {formulation.ingredients.map((ing) => (
                <li key={ing.id} className="grid grid-cols-[1fr_auto] items-center px-5 py-3">
                  <p className="text-[13px] font-medium text-gray-900">{ing.name || "—"}</p>
                  <p className="font-mono text-[12px] text-gray-500">
                    {ing.dose ? `${ing.dose}${ing.unit ? ` ${ing.unit}` : ""}` : "—"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Notes */}
      {formulation.notes && (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="border-b border-black/[0.05] px-5 py-3.5">
            <h2 className="text-[13px] font-semibold text-gray-900">Notes</h2>
          </div>
          <p className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed text-gray-700">
            {formulation.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Research Tab ──────────────────────────────────────────────────────────────
function ResearchTab({ formulation }: { formulation: Formulation }) {
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function analyze() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setStreaming(true);
    setContent("");
    setError(null);
    setStarted(true);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: formulation.name,
          type: "formulation",
          context: {
            name: formulation.name,
            description: formulation.description,
            ingredients: formulation.ingredients,
            target_dose: formulation.target_dose,
            serving_size: formulation.serving_size,
            capsule_size: formulation.capsule_size,
            capsules_per_serving: formulation.capsules_per_serving,
            notes: formulation.notes,
          },
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message);
    } finally {
      setStreaming(false);
    }
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
            <svg className="size-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-gray-900">AI Formulation Analysis</p>
          <p className="mt-1.5 max-w-sm mx-auto text-[12px] leading-relaxed text-gray-500">
            Get a comprehensive evidence-based review of your entire stack — dose assessment, synergies, evidence gaps, and optimization suggestions.
          </p>
          <button
            onClick={analyze}
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 mx-auto"
          >
            Analyze formulation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
            <svg className="size-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-gray-900">Formulation Analysis</p>
          {streaming && (
            <span className="flex items-center gap-1 text-[11px] text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              Analyzing
            </span>
          )}
        </div>
        {!streaming && content && (
          <button
            onClick={analyze}
            className="flex items-center gap-1 text-[11px] text-gray-400 transition hover:text-gray-700"
          >
            <RotateCcw className="size-3" />
            Re-analyze
          </button>
        )}
      </div>
      <div className="px-5 py-5">
        {error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-[12px] text-red-600">{error}</p>
            {error.includes("ANTHROPIC_API_KEY") && (
              <p className="mt-1 text-[11px] text-red-400">
                Add <code className="rounded bg-red-100 px-1 font-mono">ANTHROPIC_API_KEY=sk-ant-…</code> to{" "}
                <code className="rounded bg-red-100 px-1 font-mono">.env.local</code>
              </p>
            )}
          </div>
        ) : (
          <>
            <StreamingMarkdown content={content} />
            {streaming && !content && (
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="size-3.5 animate-spin" />
                Retrieving clinical evidence…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Compliance Tab ────────────────────────────────────────────────────────────
function ComplianceTab({ formulation, onScoreUpdate }: { formulation: Formulation; onScoreUpdate: (score: number) => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulation_id: formulation.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Compliance check failed");
      setResult(json as ComplianceResult);
      if (typeof json.score === "number") onScoreUpdate(json.score);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const severityColor = (s: string) =>
    s === "high" ? "text-red-600 bg-red-50 border-red-100" :
    s === "medium" ? "text-amber-600 bg-amber-50 border-amber-100" :
    "text-blue-600 bg-blue-50 border-blue-100";

  const scoreColor = (n: number) =>
    n >= 90 ? "text-emerald-600" : n >= 70 ? "text-amber-600" : "text-red-600";

  if (!result && !loading) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-black/[0.06] bg-gray-50">
            <ShieldCheck className="size-5 text-brand" />
          </div>
          <p className="text-[13px] font-semibold text-gray-900">FDA Compliance Review</p>
          <p className="mt-1.5 max-w-sm mx-auto text-[12px] leading-relaxed text-gray-500">
            Analyze your formulation against DSHEA guidelines — structure/function claims, ingredient safety, prohibited disease claims, and required disclaimers.
          </p>
          <button
            onClick={runCheck}
            className="mt-5 flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-gray-800 mx-auto"
          >
            <ShieldCheck className="size-3.5" />
            Run compliance check
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-10 text-center shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <Loader2 className="size-5 animate-spin text-brand mx-auto" />
          <p className="mt-3 text-[13px] text-gray-500">Running compliance analysis…</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-[13px] font-medium text-red-700">Compliance check failed</p>
          <p className="mt-1 text-[12px] text-red-500">{error}</p>
        </div>
      )}

      {result && (
        <>
          {/* Score card */}
          <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-gray-900">Compliance Score</h2>
              <button
                onClick={runCheck}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition"
              >
                <RotateCcw className="size-3" />
                Re-run
              </button>
            </div>
            <div className="flex items-center gap-6 p-5">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-gray-100">
                <span className={cn("font-mono text-2xl font-bold", scoreColor(result.score))}>
                  {result.score}
                </span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-900">
                  {result.score >= 90 ? "Fully compliant" :
                   result.score >= 70 ? "Minor issues" :
                   result.score >= 50 ? "Requires review" : "Major concerns"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">
                  Issues
                  <span className="ml-2 font-mono text-[11px] text-gray-400">{result.issues.length}</span>
                </h2>
              </div>
              <ul className="divide-y divide-black/[0.04] p-2">
                {result.issues.map((issue, i) => (
                  <li key={i} className="rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5", severityColor(issue.severity))}>
                        {issue.severity}
                      </span>
                      <div>
                        <p className="text-[12px] font-semibold text-gray-900">{issue.issue}</p>
                        {issue.ingredient && (
                          <p className="mt-0.5 text-[11px] text-brand">{issue.ingredient}</p>
                        )}
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{issue.detail}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Claims */}
          <div className="grid gap-4 sm:grid-cols-2">
            {result.compliant_claims.length > 0 && (
              <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="border-b border-black/[0.05] px-5 py-3.5">
                  <h2 className="text-[13px] font-semibold text-gray-900">Defensible Claims</h2>
                </div>
                <ul className="space-y-2 p-4">
                  {result.compliant_claims.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="mt-0.5 size-4 shrink-0 rounded-full bg-emerald-100 text-center text-[9px] font-bold text-emerald-600 leading-4">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.risky_claims.length > 0 && (
              <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="border-b border-black/[0.05] px-5 py-3.5">
                  <h2 className="text-[13px] font-semibold text-gray-900">Claims to Avoid</h2>
                </div>
                <ul className="space-y-2 p-4">
                  {result.risky_claims.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                      <span className="mt-0.5 size-4 shrink-0 rounded-full bg-red-100 text-center text-[9px] font-bold text-red-600 leading-4">✗</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="border-b border-black/[0.05] px-5 py-3.5">
                <h2 className="text-[13px] font-semibold text-gray-900">Recommendations</h2>
              </div>
              <ul className="space-y-2.5 p-5">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[12px] text-gray-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FormulationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [formulation, setFormulation] = useState<Formulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/formulations/${id}`, { cache: "no-store" });
        if (res.status === 404) { if (!cancelled) setError("Formulation not found"); return; }
        if (!res.ok) throw new Error("Failed to load");
        const json = (await res.json()) as { formulation: Formulation };
        if (!cancelled) setFormulation(json.formulation);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleUpdate(values: FormulationFormValues) {
    const res = await fetch(`/api/formulations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to update");
    }
    const json = (await res.json()) as { formulation: Formulation };
    setFormulation(json.formulation);
    setTab("overview");
    toast.success("Formulation updated");
  }

  async function handleStatusChange(next: FormulationStatus) {
    if (!formulation || formulation.status === next) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/formulations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { formulation: Formulation };
      setFormulation(json.formulation);
      toast.success(`Moved to ${STATUS_LABELS[next]}`);
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/formulations/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
      toast.success("Formulation deleted");
      router.push("/dashboard/formulations");
      router.refresh();
    } catch (e) {
      toast.error("Failed to delete");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  function exportDossier() {
    if (!formulation) return;
    const lines = [
      `# ${formulation.name}`,
      `Status: ${STATUS_LABELS[formulation.status]}`,
      `Updated: ${new Date(formulation.updated_at).toLocaleDateString()}`,
      formulation.compliance_score != null ? `Compliance score: ${formulation.compliance_score}/100` : "",
      "",
      formulation.description ? `## Description\n${formulation.description}` : "",
      "",
      "## Specifications",
      formulation.target_dose ? `Target dose: ${formulation.target_dose}` : "",
      formulation.serving_size ? `Serving size: ${formulation.serving_size}` : "",
      formulation.capsule_size ? `Capsule size: ${formulation.capsule_size}` : "",
      formulation.capsules_per_serving != null ? `Capsules per serving: ${formulation.capsules_per_serving}` : "",
      "",
      "## Ingredient Stack",
      ...formulation.ingredients.map(i => `- ${i.name}: ${i.dose || "?"}${i.unit || " mg"}`),
      "",
      formulation.notes ? `## Notes\n${formulation.notes}` : "",
    ].filter(l => l !== undefined).join("\n").trim();

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formulation.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-dossier.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !formulation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[13px] font-medium text-gray-900">{error ?? "Formulation not found"}</p>
        <Link href="/dashboard/formulations" className="mt-3 inline-block text-[12px] text-brand hover:underline">
          Back to formulations
        </Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "research", label: "Research" },
    { key: "compliance", label: `Compliance${formulation.compliance_score != null ? ` · ${formulation.compliance_score}` : ""}` },
    { key: "edit", label: "Edit" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/dashboard/formulations"
            className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
          >
            <ChevronLeft className="size-3.5" />
            Formulations
          </Link>
          <div className="mt-2 flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-gray-950">{formulation.name}</h1>
            <StatusBadge status={formulation.status} />
          </div>
          <p className="mt-1 text-[12px] text-gray-400">
            Updated {relativeDate(formulation.updated_at)}
            {formulation.compliance_score != null && ` · Compliance ${formulation.compliance_score}/100`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportDossier}
            className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
          >
            <Download className="size-3.5" />
            Export
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-[12px] font-medium text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mr-1">Status</span>
        {FORMULATION_STATUSES.map(s => (
          <button
            key={s}
            type="button"
            disabled={statusBusy || formulation.status === s}
            onClick={() => handleStatusChange(s)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium transition border",
              formulation.status === s
                ? "bg-gray-950 text-white border-gray-950"
                : "bg-white text-gray-500 border-black/[0.08] hover:border-black/20 hover:text-gray-900"
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-black/[0.06]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "relative px-3 py-2 text-[13px] font-medium transition",
              tab === key ? "text-gray-950" : "text-gray-400 hover:text-gray-700"
            )}
          >
            {label}
            {tab === key && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-brand" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab formulation={formulation} />}
      {tab === "research" && <ResearchTab formulation={formulation} />}
      {tab === "compliance" && (
        <ComplianceTab
          formulation={formulation}
          onScoreUpdate={score => setFormulation(f => f ? { ...f, compliance_score: score } : f)}
        />
      )}
      {tab === "edit" && (
        <FormulationForm
          submitLabel="Save changes"
          showStatus
          defaultValues={{
            name: formulation.name,
            description: formulation.description ?? "",
            status: formulation.status,
            target_dose: formulation.target_dose ?? "",
            serving_size: formulation.serving_size ?? "",
            capsule_size: formulation.capsule_size ?? "",
            capsules_per_serving: formulation.capsules_per_serving,
            notes: formulation.notes ?? "",
            ingredients: formulation.ingredients ?? [],
          }}
          onSubmit={handleUpdate}
          onCancel={() => setTab("overview")}
        />
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)]">
            <h3 className="text-[15px] font-semibold text-gray-950">Delete formulation?</h3>
            <p className="mt-1.5 text-[13px] text-gray-500">
              "{formulation.name}" will be permanently removed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded-lg border border-black/[0.08] px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:bg-black/[0.02]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="size-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
