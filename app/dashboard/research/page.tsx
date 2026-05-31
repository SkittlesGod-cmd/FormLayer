"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Loader2, BookOpen, Target, Plus, Check, ChevronDown,
  Zap, BarChart3, FlaskConical, ShieldCheck, Link2, FileText,
  Info, Clock, X, ArrowRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import type { Formulation } from "@/lib/formulations/types";
import { getErrorMessage } from "@/lib/errors";

type Mode = "ingredient" | "goal";

interface HistoryEntry {
  id: string;
  query: string;
  mode: Mode;
  content: string;
  timestamp: number;
}

interface ParsedSection {
  heading: string;
  body: string;
}

// ─── Parsing utilities ────────────────────────────────────────────────────────

function parseSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n");
  let currentHeading = "";
  let bodyLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentHeading || bodyLines.some((l) => l.trim())) {
        sections.push({ heading: currentHeading, body: bodyLines.join("\n").trim() });
      }
      currentHeading = line.slice(3).trim();
      bodyLines = [];
    } else {
      bodyLines.push(line);
    }
  }
  if (currentHeading || bodyLines.some((l) => l.trim())) {
    sections.push({ heading: currentHeading, body: bodyLines.join("\n").trim() });
  }
  return sections.filter((s) => s.body.length > 0);
}

function extractDose(content: string): { dose: string; unit: string } | null {
  const units = "(mg|mcg|g|IU|CFU)";
  const patterns = [
    new RegExp(`Most common effective dose[^\\n]*?([0-9][0-9,]*)\\s*${units}`, "i"),
    new RegExp(`Studied range[^\\n]*?([0-9][0-9,]*)\\s*[–\\-].*?${units}`, "i"),
  ];
  for (const re of patterns) {
    const m = content.match(re);
    if (m) return { dose: m[1].replace(/,/g, ""), unit: m[2] };
  }
  return null;
}

function extractSynergies(content: string): string[] {
  const m = content.match(/## Synergies?[\s\S]*?\n([\s\S]*?)(?=\n## |$)/i);
  if (!m) return [];
  const bold = m[1].match(/\*\*([^*:—\n]{3,55}?)\*\*/g) ?? [];
  return [...new Set(bold.map((b) => b.replace(/\*\*/g, "").split(":")[0].split("—")[0].trim()))].slice(0, 6);
}

function extractGoalIngredients(content: string): string[] {
  // Numbered headings like "### 1. Ingredient Name" or "**1. Name**"
  const h3 = content.match(/^### (?:\d+\.\s+)?(.+)$/gm) ?? [];
  if (h3.length > 1) return h3.map((m) => m.replace(/^### (?:\d+\.\s+)?/, "").trim()).slice(0, 8);
  const bold = content.match(/^\d+\.\s+\*\*([^*]+)\*\*/gm) ?? [];
  if (bold.length > 0) return bold.map((m) => m.replace(/^\d+\.\s+\*\*/, "").replace(/\*\*.*/, "").trim()).slice(0, 8);
  return [];
}

// ─── Section card config ──────────────────────────────────────────────────────

const SECTION_CONFIG: Record<string, { icon: LucideIcon; badge: string; accent: string }> = {
  "Overview":                  { icon: Info,       badge: "bg-gray-100 text-gray-600",           accent: "" },
  "Mechanisms of Action":      { icon: Zap,        badge: "bg-purple-50 text-purple-600",        accent: "" },
  "Clinical Evidence":         { icon: BarChart3,  badge: "bg-emerald-50 text-emerald-600",      accent: "" },
  "Evidence-Backed Dose Range":{ icon: FlaskConical, badge: "bg-brand/10 text-brand",            accent: "border-brand/15 bg-brand/[0.03]" },
  "Safety & Tolerability":     { icon: ShieldCheck, badge: "bg-amber-50 text-amber-600",        accent: "" },
  "Synergies":                 { icon: Link2,      badge: "bg-indigo-50 text-indigo-600",        accent: "" },
  "FDA Compliance Notes":      { icon: FileText,   badge: "bg-orange-50 text-orange-600",        accent: "" },
};

function getSection(heading: string): { icon: LucideIcon; badge: string; accent: string } {
  const key = Object.keys(SECTION_CONFIG).find((k) =>
    heading.toLowerCase().includes(k.toLowerCase().split(" ").slice(0, 2).join(" ").toLowerCase())
  );
  return SECTION_CONFIG[key ?? ""] ?? { icon: BookOpen, badge: "bg-gray-100 text-gray-600", accent: "" };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = "fl_research_history";
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [mode, setMode] = useState<Mode>("ingredient");
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Parsed state (populated after streaming completes)
  const [sections, setSections] = useState<ParsedSection[]>([]);
  const [synergies, setSynergies] = useState<string[]>([]);
  const [goalIngredients, setGoalIngredients] = useState<string[]>([]);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Add-to-formulation
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addDose, setAddDose] = useState("");
  const [addUnit, setAddUnit] = useState("mg");
  const [addFormulationId, setAddFormulationId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addedFormulationId, setAddedFormulationId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [formulationsLoaded, setFormulationsLoaded] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  function saveToHistory(entry: HistoryEntry) {
    setHistory((prev) => {
      const filtered = prev.filter((h) => !(h.query === entry.query && h.mode === entry.mode));
      const next = [entry, ...filtered].slice(0, 8);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(HISTORY_KEY); } catch {}
    setShowHistory(false);
  }

  function restoreFromHistory(entry: HistoryEntry) {
    setQuery(entry.query);
    setMode(entry.mode);
    setContent(entry.content);
    setHasSearched(true);
    setAddOpen(false);
    setAddSuccess(false);
    setAddedFormulationId(null);
    const parsed = parseSections(entry.content);
    setSections(parsed);
    setSynergies(extractSynergies(entry.content));
    setGoalIngredients(entry.mode === "goal" ? extractGoalIngredients(entry.content) : []);
    setShowHistory(false);
  }

  async function runSearch(q?: string, m?: Mode) {
    const searchQuery = (q ?? query).trim();
    const searchMode = m ?? mode;
    if (!searchQuery || streaming) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStreaming(true);
    setContent("");
    setSections([]);
    setSynergies([]);
    setGoalIngredients([]);
    setError(null);
    setHasSearched(true);
    setAddOpen(false);
    setAddSuccess(false);
    if (q) setQuery(q);
    if (m) setMode(m);

    let accumulated = "";

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, type: searchMode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setContent(accumulated);
      }

      // Parse after stream completes
      const parsed = parseSections(accumulated);
      setSections(parsed);
      setSynergies(searchMode === "ingredient" ? extractSynergies(accumulated) : []);
      setGoalIngredients(searchMode === "goal" ? extractGoalIngredients(accumulated) : []);

      // Pre-fill dose
      if (searchMode === "ingredient") {
        const doseInfo = extractDose(accumulated);
        if (doseInfo) {
          setAddDose(doseInfo.dose);
          setAddUnit(doseInfo.unit);
        }
      }

      // Save to history
      saveToHistory({ id: crypto.randomUUID(), query: searchQuery, mode: searchMode, content: accumulated, timestamp: Date.now() });

    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError(getErrorMessage(e, "Research failed"));
      }
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
      if ((json.formulations ?? []).length > 0) setAddFormulationId(json.formulations[0].id);
      setFormulationsLoaded(true);
    } catch {}
  }

  function openAddPanel() {
    setAddOpen(true);
    setAddSuccess(false);
    setAddedFormulationId(null);
    setAddError(null);
    loadFormulations();
  }

  async function handleAddToFormulation() {
    if (!addFormulationId || adding) return;
    setAdding(true);
    setAddError(null);
    const formulation = formulations.find((f) => f.id === addFormulationId);
    if (!formulation) { setAdding(false); return; }

    const newIngredient = {
      id: crypto.randomUUID(),
      name: query,
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
      setAddedFormulationId(addFormulationId);
    } catch (e: unknown) {
      setAddError(getErrorMessage(e, "Failed to add ingredient"));
    } finally {
      setAdding(false);
    }
  }

  const examples = mode === "ingredient" ? EXAMPLE_INGREDIENTS : EXAMPLE_GOALS;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">AI Research</p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
            Ingredient Research
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Evidence-backed analysis from peer-reviewed clinical data.
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition",
              showHistory
                ? "border-brand/20 bg-brand/[0.04] text-brand"
                : "border-black/[0.08] bg-white text-gray-500 hover:text-gray-800"
            )}
          >
            <Clock className="size-3.5" />
            History ({history.length})
          </button>
        )}
      </div>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Recent searches</p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-1.5">
            {history.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => restoreFromHistory(entry)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50"
              >
                <div className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md",
                  entry.mode === "ingredient" ? "bg-brand/10 text-brand" : "bg-amber-50 text-amber-600"
                )}>
                  {entry.mode === "ingredient" ? <BookOpen className="size-3.5" /> : <Target className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-gray-800">{entry.query}</p>
                  <p className="text-[11px] text-gray-400">
                    {entry.mode === "ingredient" ? "Ingredient" : "Health goal"} ·{" "}
                    {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search card */}
      <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Mode toggle */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit mb-4">
          {(["ingredient", "goal"] as const).map((key) => {
            const Icon = key === "ingredient" ? BookOpen : Target;
            const label = key === "ingredient" ? "Ingredient" : "Health goal";
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setContent("");
                  setSections([]);
                  setSynergies([]);
                  setGoalIngredients([]);
                  setHasSearched(false);
                  setQuery("");
                  setAddOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition",
                  mode === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <form onSubmit={(e) => { e.preventDefault(); runSearch(); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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

        {/* Example chips */}
        {!hasSearched && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
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
          <p className="mt-1 text-[12px] text-red-500">
            {error.includes("OPENROUTER_API_KEY") || error.includes("API key")
              ? "AI research is temporarily unavailable. Please try again shortly or contact support@formlayer.co."
              : error}
          </p>
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
                <div className="flex flex-wrap items-center gap-2 text-[13px] text-emerald-600">
                  <Check className="size-4 shrink-0" />
                  <span>Added to formulation.</span>
                  {addedFormulationId && (
                    <a
                      href={`/dashboard/formulations/${addedFormulationId}`}
                      className="font-medium underline underline-offset-2 hover:text-emerald-700"
                    >
                      Open formulation →
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Formulation</label>
                    {formulations.length === 0 ? (
                      <p className="text-[12px] italic text-gray-400">No formulations yet — create one first.</p>
                    ) : (
                      <div className="relative">
                        <select
                          value={addFormulationId}
                          onChange={(e) => setAddFormulationId(e.target.value)}
                          className="h-9 appearance-none rounded-lg border border-black/[0.08] bg-white pl-3 pr-8 text-[13px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 min-w-[180px]"
                        >
                          {formulations.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">
                      Dose
                      {addDose && <span className="ml-1 text-emerald-600">(from research)</span>}
                    </label>
                    <input
                      type="text"
                      value={addDose}
                      onChange={(e) => setAddDose(e.target.value)}
                      placeholder="e.g. 300"
                      className="h-9 w-24 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-gray-500">Unit</label>
                    <select
                      value={addUnit}
                      onChange={(e) => setAddUnit(e.target.value)}
                      className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                    >
                      {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
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

          {/* Content: streaming → raw markdown; done → parsed sections */}
          <div className="px-5 py-5">
            {streaming ? (
              <>
                {content ? (
                  <StreamingMarkdown content={content} />
                ) : (
                  <div className="flex items-center gap-2 text-[12px] text-gray-400">
                    <Loader2 className="size-3.5 animate-spin" />
                    Retrieving clinical evidence…
                  </div>
                )}
              </>
            ) : sections.length > 0 ? (
              <div className="space-y-3">
                {sections.map((section, i) => {
                  const cfg = getSection(section.heading);
                  const Icon = cfg.icon;
                  const isSynergies = section.heading.toLowerCase().includes("syner");
                  const isDose = section.heading.toLowerCase().includes("dose");

                  return (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl border p-5",
                        cfg.accent || "border-black/[0.06] bg-white"
                      )}
                    >
                      <div className="mb-3 flex items-center gap-2.5">
                        <div className={cn("flex size-7 items-center justify-center rounded-lg text-xs", cfg.badge)}>
                          <Icon className="size-3.5" />
                        </div>
                        <h3 className="text-[13px] font-semibold text-gray-900">{section.heading}</h3>
                      </div>
                      <StreamingMarkdown content={section.body} />

                      {/* Synergy quick-research pills */}
                      {isSynergies && synergies.length > 0 && (
                        <div className="mt-4 border-t border-black/[0.05] pt-4">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                            Research a synergy
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {synergies.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => runSearch(s, "ingredient")}
                                className="flex items-center gap-1 rounded-full border border-brand/20 bg-brand/[0.04] px-2.5 py-1 text-[11px] font-medium text-brand transition hover:bg-brand/[0.1]"
                              >
                                {s}
                                <ArrowRight className="size-3" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dose range — show add button inline if not already open */}
                      {isDose && !addOpen && !streaming && mode === "ingredient" && (
                        <div className="mt-4 border-t border-brand/10 pt-4">
                          <button
                            type="button"
                            onClick={openAddPanel}
                            className="flex items-center gap-1.5 text-[12px] font-medium text-brand hover:text-brand/80 transition-colors"
                          >
                            <Plus className="size-3.5" />
                            Add to formulation with this dose
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Fallback: plain markdown (shouldn't normally be reached)
              <StreamingMarkdown content={content} />
            )}

            {/* Goal mode: ingredient quick-research pills */}
            {!streaming && mode === "goal" && goalIngredients.length > 0 && (
              <div className="mt-5 rounded-xl border border-black/[0.06] bg-gray-50/60 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Research individual ingredients
                </p>
                <div className="flex flex-wrap gap-2">
                  {goalIngredients.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => runSearch(name, "ingredient")}
                      className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition hover:border-brand/30 hover:bg-brand/[0.04] hover:text-brand"
                    >
                      <BookOpen className="size-3" />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state — what this covers */}
      {!hasSearched && (
        <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
            What this covers
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Info, title: "Mechanisms of action", desc: "How the ingredient works at the cellular and systemic level — receptor targets, enzymatic pathways, signaling cascades." },
              { icon: BarChart3, title: "Clinical evidence", desc: "Key human RCTs: population, n-size, dose, duration, primary endpoints, and effect sizes." },
              { icon: FlaskConical, title: "Evidence-backed dosing", desc: "Effective dose ranges from the most relevant clinical studies, including form, timing, and loading protocols." },
              { icon: ShieldCheck, title: "Safety & tolerability", desc: "Tolerable upper intake levels, contraindications, known drug interactions, and adverse event data." },
              { icon: Link2, title: "Synergistic stacking", desc: "Ingredients that potentiate or complement the compound — with mechanistic rationale and one-click research." },
              { icon: FileText, title: "FDA compliance notes", desc: "Defensible structure/function claims and prohibited language to avoid on your label." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-black/[0.05] bg-gray-50/60 p-4">
                <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                  <Icon className="size-3.5" />
                </div>
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
