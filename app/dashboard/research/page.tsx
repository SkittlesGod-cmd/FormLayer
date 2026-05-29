"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, BookOpen, Target, Plus, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import type { Formulation } from "@/lib/formulations/types";

type Mode = "ingredient" | "goal";

const EXAMPLE_INGREDIENTS = [
  "L-Theanine", "Ashwagandha KSM-66", "Lion's Mane", "Creatine Monohydrate",
  "Magnesium Glycinate", "Vitamin D3 + K2", "Rhodiola Rosea", "Berberine",
  "Alpha GPC", "Coenzyme Q10", "NMN", "Quercetin + Bromelain",
];

const EXAMPLE_GOALS = [
  "Cognitive performance and focus",
  "Sleep quality and recovery",
  "Athletic endurance",
  "Stress and cortisol management",
  "Gut health and microbiome",
  "Longevity and cellular health",
];

const UNIT_OPTIONS = ["mg", "mcg", "g", "IU", "CFU", "mL", "%DV"];

export default function ResearchPage() {
  const [mode, setMode] = useState<Mode>("ingredient");
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Add-to-formulation state
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addDose, setAddDose] = useState("");
  const [addUnit, setAddUnit] = useState("mg");
  const [addFormulationId, setAddFormulationId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [formulationsLoaded, setFormulationsLoaded] = useState(false);

  async function runSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim() || streaming) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStreaming(true);
    setContent("");
    setError(null);
    setHasSearched(true);
    setAddOpen(false);
    setAddSuccess(false);
    if (q) setQuery(q);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, type: mode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
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
      if (e.name !== "AbortError") setError(e.message ?? "Research failed");
    } finally {
      setStreaming(false);
    }
  }

  async function loadFormulations() {
    if (formulationsLoaded) return;
    try {
      const res = await fetch("/api/formulations");
      if (!res.ok) return;
      const json = await res.json();
      setFormulations(json.formulations ?? []);
      if ((json.formulations ?? []).length > 0) {
        setAddFormulationId(json.formulations[0].id);
      }
      setFormulationsLoaded(true);
    } catch {}
  }

  function openAddPanel() {
    setAddOpen(true);
    setAddSuccess(false);
    setAddError(null);
    loadFormulations();
  }

  async function handleAddToFormulation() {
    if (!addFormulationId || adding) return;
    setAdding(true);
    setAddError(null);

    const formulation = formulations.find(f => f.id === addFormulationId);
    if (!formulation) { setAdding(false); return; }

    const newIngredient = {
      id: crypto.randomUUID(),
      name: mode === "ingredient" ? query : query,
      dose: addDose,
      unit: addUnit,
    };

    const updated = [...(formulation.ingredients ?? []), newIngredient];

    try {
      const res = await fetch(`/api/formulations/${addFormulationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add ingredient");
      setAddSuccess(true);
      setAdding(false);
    } catch (e: any) {
      setAddError(e.message ?? "Failed to add ingredient");
      setAdding(false);
    }
  }

  const examples = mode === "ingredient" ? EXAMPLE_INGREDIENTS : EXAMPLE_GOALS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">AI Research</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
          Ingredient Research
        </h1>
        <p className="mt-1 text-[13px] text-gray-500">
          Evidence-backed analysis from peer-reviewed clinical data — mechanisms, dosing, safety, synergies.
        </p>
      </div>

      {/* Mode toggle + Search */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit mb-4">
          {([
            { key: "ingredient" as Mode, label: "Ingredient", icon: BookOpen },
            { key: "goal" as Mode, label: "Health goal", icon: Target },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setContent(""); setHasSearched(false); setQuery(""); setAddOpen(false); }}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                mode === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); runSearch(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={
                mode === "ingredient"
                  ? "e.g. Ashwagandha KSM-66, Creatine Monohydrate, Alpha GPC…"
                  : "e.g. Sleep quality, cognitive performance, stress resilience…"
              }
              className="h-10 w-full rounded-lg border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || streaming}
            className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
          >
            {streaming ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
            {streaming ? "Analyzing…" : "Research"}
          </button>
        </form>

        {!hasSearched && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {examples.slice(0, 8).map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => runSearch(ex)}
                className="rounded-full border border-black/[0.06] bg-gray-50 px-3 py-1 text-[11px] text-gray-600 transition hover:border-brand/30 hover:bg-brand/[0.04] hover:text-brand"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-[13px] font-medium text-red-700">Research failed</p>
          <p className="mt-1 text-[12px] text-red-500">{error}</p>
          {error.includes("OPENROUTER_API_KEY") && (
            <p className="mt-2 text-[12px] text-red-500">
              Add your OpenRouter API key to{" "}
              <code className="rounded bg-red-100 px-1 font-mono">.env.local</code> as{" "}
              <code className="rounded bg-red-100 px-1 font-mono">OPENROUTER_API_KEY=sk-or-…</code>
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {(content || streaming) && (
        <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {/* Result header */}
          <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-brand/10">
                <BookOpen className="size-3.5 text-brand" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{query}</p>
                <p className="text-[11px] text-gray-400">
                  {mode === "ingredient" ? "Ingredient analysis" : "Goal-based research"}
                  {streaming && " · analyzing…"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {streaming && (
                <div className="flex items-center gap-1.5 text-[11px] text-brand">
                  <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                  Streaming
                </div>
              )}
              {!streaming && content && mode === "ingredient" && (
                <button
                  type="button"
                  onClick={openAddPanel}
                  className="flex items-center gap-1.5 rounded-md border border-brand/20 bg-brand/[0.04] px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand/[0.08]"
                >
                  <Plus className="size-3.5" />
                  Add to formulation
                </button>
              )}
            </div>
          </div>

          {/* Add to formulation panel */}
          {addOpen && !streaming && (
            <div className="border-b border-black/[0.05] bg-gray-50/60 px-5 py-4">
              <p className="mb-3 text-[12px] font-semibold text-gray-700">
                Add <span className="text-brand">{query}</span> to a formulation
              </p>

              {addSuccess ? (
                <div className="flex items-center gap-2 text-[13px] text-emerald-600">
                  <Check className="size-4" />
                  Added successfully — open the formulation to review.
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  {/* Formulation picker */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Formulation</label>
                    {formulations.length === 0 ? (
                      <p className="text-[12px] text-gray-400 italic">No formulations yet — create one first.</p>
                    ) : (
                      <div className="relative">
                        <select
                          value={addFormulationId}
                          onChange={e => setAddFormulationId(e.target.value)}
                          className="h-9 appearance-none rounded-lg border border-black/[0.08] bg-white pl-3 pr-8 text-[13px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 min-w-[180px]"
                        >
                          {formulations.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Dose */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Dose</label>
                    <input
                      type="text"
                      value={addDose}
                      onChange={e => setAddDose(e.target.value)}
                      placeholder="e.g. 200"
                      className="h-9 w-24 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                  </div>

                  {/* Unit */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Unit</label>
                    <select
                      value={addUnit}
                      onChange={e => setAddUnit(e.target.value)}
                      className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                    >
                      {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToFormulation}
                    disabled={adding || formulations.length === 0}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-gray-950 px-4 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
                  >
                    {adding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                    {adding ? "Adding…" : "Add ingredient"}
                  </button>
                </div>
              )}

              {addError && <p className="mt-2 text-[12px] text-red-500">{addError}</p>}
            </div>
          )}

          <div className="px-5 py-5">
            <StreamingMarkdown content={content} />
            {streaming && !content && (
              <div className="flex items-center gap-2 text-[12px] text-gray-400">
                <Loader2 className="size-3.5 animate-spin" />
                Retrieving clinical evidence…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info grid — shown before first search */}
      {!hasSearched && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">What this covers</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Mechanisms of action", desc: "How the ingredient works at the cellular and systemic level — receptor targets, enzymatic pathways, signaling cascades." },
              { title: "Clinical evidence", desc: "Key human RCTs: population, n-size, dose, duration, primary endpoints, and effect sizes." },
              { title: "Evidence-backed dosing", desc: "Effective dose ranges from the most relevant clinical studies, including loading and maintenance protocols." },
              { title: "Safety & tolerability", desc: "Tolerable upper intake levels, contraindications, known drug interactions, and adverse event data." },
              { title: "Synergistic stacking", desc: "Ingredients that potentiate or complement the compound — with mechanistic rationale." },
              { title: "FDA compliance notes", desc: "Defensible structure/function claims and language to avoid on your label." },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-lg border border-black/[0.05] bg-gray-50/60 p-4">
                <p className="text-[12px] font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
