"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Loader2, BookOpen, Target, Plus, Check, ChevronDown,
  Zap, BarChart3, FlaskConical, ShieldCheck, Link2, FileText,
  Info, Clock, X, ArrowRight, Copy, Bookmark, BookmarkCheck,
  ArrowLeftRight, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamingMarkdown } from "@/components/ui/streaming-markdown";
import type { Formulation } from "@/lib/formulations/types";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "ingredient" | "goal" | "compare";

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

interface DoseRange {
  min: number;
  max: number;
  effective: number;
  unit: string;
}

interface Slot {
  query: string;
  content: string;
  streaming: boolean;
  sections: ParsedSection[];
  grade: "A" | "B" | "C" | null;
  doseRange: DoseRange | null;
  synergies: string[];
  goalIngredients: string[];
  error: string | null;
}

function emptySlot(): Slot {
  return { query: "", content: "", streaming: false, sections: [], grade: null, doseRange: null, synergies: [], goalIngredients: [], error: null };
}

// ─── Parsing utilities ────────────────────────────────────────────────────────

function parseSections(content: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = content.split("\n");
  let heading = "";
  let body: string[] = [];
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (heading || body.some(l => l.trim())) sections.push({ heading, body: body.join("\n").trim() });
      heading = line.slice(3).trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  if (heading || body.some(l => l.trim())) sections.push({ heading, body: body.join("\n").trim() });
  return sections.filter(s => s.body.length > 0);
}

function extractEvidenceGrade(content: string): "A" | "B" | "C" | null {
  const overview = content.match(/## Overview\n([\s\S]*?)(?=\n##|$)/i)?.[1] ?? content.slice(0, 800);
  const patterns = [
    /evidence (?:quality|grade)[^.]*\b([ABC])\b/i,
    /grade[:\s]+\*?\*?([ABC])\b/i,
    /overall[^.]*?(?:grade|evidence)\s+([ABC])\b/i,
  ];
  for (const p of patterns) {
    const m = overview.match(p);
    if (m && ["A","B","C"].includes(m[1].toUpperCase())) return m[1].toUpperCase() as "A"|"B"|"C";
  }
  return null;
}

function extractDoseRange(content: string): DoseRange | null {
  const rangeM = content.match(/Studied range[^:\n]*:\s*\*?\*?(\d[\d,]*)\s*[–\-]\s*(\d[\d,]*)\s*(mg|mcg|g|IU|CFU)/i);
  if (!rangeM) return null;
  const effectiveM = content.match(/Most common effective dose[^:\n]*:\s*\*?\*?(\d[\d,]*)\s*(mg|mcg|g|IU|CFU)/i);
  return {
    min: parseInt(rangeM[1].replace(/,/g,"")),
    max: parseInt(rangeM[2].replace(/,/g,"")),
    effective: effectiveM ? parseInt(effectiveM[1].replace(/,/g,"")) : parseInt(rangeM[2].replace(/,/g,"")),
    unit: rangeM[3],
  };
}

function extractDoseSimple(content: string): { dose: string; unit: string } | null {
  const patterns = [
    /Most common effective dose[^:\n]*:\s*\*?\*?([0-9][0-9,]*)\s*(mg|mcg|g|IU|CFU)/i,
    /Studied range[^:\n]*:\s*\*?\*?([0-9][0-9,]*)\s*[–\-]/i,
  ];
  const unitM = content.match(/Studied range[^:\n]*:\s*\*?\*?[0-9–\-,\s]+(mg|mcg|g|IU|CFU)/i);
  for (const p of patterns) {
    const m = content.match(p);
    if (m) return { dose: m[1].replace(/,/g,""), unit: (m[2] ?? unitM?.[1] ?? "mg") };
  }
  return null;
}

function extractSynergies(content: string): string[] {
  const m = content.match(/## Synergies?[\s\S]*?\n([\s\S]*?)(?=\n## |$)/i);
  if (!m) return [];
  const bold = m[1].match(/\*\*([^*:—\n]{3,55}?)\*\*/g) ?? [];
  return [...new Set(bold.map(b => b.replace(/\*\*/g,"").split(":")[0].split("—")[0].trim()))].slice(0,6);
}

function extractGoalIngredients(content: string): string[] {
  const h3 = content.match(/^### (?:\d+\.\s+)?(.+)$/gm) ?? [];
  if (h3.length > 1) return h3.map(m => m.replace(/^### (?:\d+\.\s+)?/,"").trim()).slice(0,8);
  const bold = content.match(/^\d+\.\s+\*\*([^*]+)\*\*/gm) ?? [];
  return bold.map(m => m.replace(/^\d+\.\s+\*\*/,"").replace(/\*\*.*/,"").trim()).slice(0,8);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const GRADE_CONFIG = {
  A: { label: "Grade A", long: "Strong clinical evidence", cls: "bg-emerald-50 border-emerald-100 text-emerald-700" },
  B: { label: "Grade B", long: "Moderate evidence",       cls: "bg-amber-50 border-amber-100 text-amber-700" },
  C: { label: "Grade C", long: "Emerging / limited",      cls: "bg-gray-50 border-gray-200 text-gray-600" },
};

function GradeBadge({ grade }: { grade: "A"|"B"|"C" }) {
  const { label, long, cls } = GRADE_CONFIG[grade];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`} title={long}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function DoseViz({ range }: { range: DoseRange }) {
  const total = range.max - range.min;
  const pct = total > 0 ? ((range.effective - range.min) / total) * 100 : 50;
  const clamped = Math.max(4, Math.min(96, pct));
  return (
    <div className="mt-4 rounded-xl border border-brand/15 bg-brand/[0.03] p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-brand/60">Dose range visualization</p>
      <div className="relative h-2 rounded-full bg-brand/10">
        <div className="absolute inset-y-0 left-0 rounded-full bg-brand/25" style={{ width: `${clamped}%` }} />
        <div className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-white bg-brand shadow-sm shadow-brand/20"
          style={{ left: `${clamped}%` }} />
      </div>
      <div className="mt-2.5 flex items-end justify-between text-[11px]">
        <div>
          <p className="text-gray-400">Min studied</p>
          <p className="font-semibold text-gray-700">{range.min} {range.unit}</p>
        </div>
        <div className="text-center">
          <p className="text-brand/60">Most effective</p>
          <p className="text-[14px] font-bold text-brand">{range.effective} {range.unit}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Max studied</p>
          <p className="font-semibold text-gray-700">{range.max} {range.unit}</p>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      type="button"
      onClick={copy}
      className={cn("rounded p-1 transition hover:bg-gray-100", className)}
      title="Copy section"
    >
      {copied
        ? <Check className="size-3 text-emerald-600" />
        : <Copy className="size-3 text-gray-400" />}
    </button>
  );
}

// ─── Section config ───────────────────────────────────────────────────────────

const SECTION_CONFIG: Record<string, { icon: LucideIcon; badge: string; accent: string; wide?: boolean }> = {
  "Overview":                   { icon: Info,        badge: "bg-gray-100 text-gray-500",        accent: "border-black/[0.06] bg-gray-50/40", wide: true },
  "Mechanisms of Action":       { icon: Zap,         badge: "bg-purple-50 text-purple-600",     accent: "border-black/[0.06] bg-white" },
  "Clinical Evidence":          { icon: BarChart3,   badge: "bg-emerald-50 text-emerald-600",   accent: "border-black/[0.06] bg-white" },
  "Evidence-Backed Dose Range": { icon: FlaskConical, badge: "bg-brand/10 text-brand",          accent: "border-brand/15 bg-brand/[0.02]", wide: true },
  "Safety & Tolerability":      { icon: ShieldCheck, badge: "bg-amber-50 text-amber-600",      accent: "border-black/[0.06] bg-white" },
  "Synergies":                  { icon: Link2,       badge: "bg-indigo-50 text-indigo-600",     accent: "border-black/[0.06] bg-white" },
  "FDA Compliance Notes":       { icon: FileText,    badge: "bg-orange-50 text-orange-600",     accent: "border-black/[0.06] bg-white", wide: true },
};

function getSectionCfg(heading: string) {
  const key = Object.keys(SECTION_CONFIG).find(k =>
    heading.toLowerCase().startsWith(k.toLowerCase().split(" ").slice(0, 2).join(" ").toLowerCase())
  );
  return SECTION_CONFIG[key ?? ""] ?? { icon: BookOpen as LucideIcon, badge: "bg-gray-100 text-gray-500", accent: "border-black/[0.06] bg-white", wide: false };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[{ wide: true }, { wide: false }, { wide: false }, { wide: true }, { wide: false }, { wide: false }, { wide: true }].map((s, i) => (
        <div key={i} className={cn("rounded-xl border border-black/[0.06] bg-white p-5", s.wide ? "col-span-2" : "col-span-1")}>
          <div className="mb-4 flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-gray-100" />
            <div className="h-3 w-28 rounded-full bg-gray-100" />
          </div>
          <div className="space-y-2">
            <div className="h-2.5 w-full rounded-full bg-gray-100" />
            <div className="h-2.5 w-5/6 rounded-full bg-gray-100" />
            <div className="h-2.5 w-4/6 rounded-full bg-gray-100" />
            {i % 3 === 0 && <div className="h-2.5 w-3/4 rounded-full bg-gray-100" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────

interface ResultPanelProps {
  slot: Slot;
  label?: string;
  accent?: string;
  onAddToFormulation: () => void;
  addOpen: boolean;
  addPanel: React.ReactNode;
  onResearchSynergy: (name: string) => void;
  onResearchGoalIngredient: (name: string) => void;
}

function ResultPanel({ slot, label, accent = "brand", onAddToFormulation, addOpen, addPanel, onResearchSynergy, onResearchGoalIngredient }: ResultPanelProps) {
  const { query, streaming, content, sections, grade, doseRange, synergies, goalIngredients, error } = slot;

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
        <p className="text-[13px] font-medium text-red-700">Research failed</p>
        <p className="mt-1 text-[12px] text-red-500">
          {error.includes("API key") ? "AI research is temporarily unavailable." : error}
        </p>
      </div>
    );
  }

  if (!content && !streaming) return null;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10">
            <BookOpen className="size-3.5 text-brand" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="truncate text-[13px] font-semibold text-gray-900">{query}</p>
              {label && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{label}</span>}
              {grade && !streaming && <GradeBadge grade={grade} />}
            </div>
            <p className="text-[11px] text-gray-400">
              {streaming ? "Analyzing clinical evidence…" : "Ingredient analysis · FormLayer Research"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {streaming && (
            <div className="flex items-center gap-1.5 text-[11px] text-brand">
              <span className="size-1.5 animate-pulse rounded-full bg-brand" />
              Streaming
            </div>
          )}
          {!streaming && content && (
            <>
              <CopyButton text={content} className="text-gray-400" />
              <button
                type="button"
                onClick={onAddToFormulation}
                className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/[0.04] px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand/[0.08]"
              >
                <Plus className="size-3.5" />
                Add to formulation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add panel */}
      {addOpen && !streaming && addPanel}

      {/* Content */}
      <div className="p-5">
        {streaming ? (
          content ? <StreamingMarkdown content={content} /> : <SkeletonCards />
        ) : sections.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {sections.map((section, i) => {
                const cfg = getSectionCfg(section.heading);
                const Icon = cfg.icon;
                const isSynergies = section.heading.toLowerCase().includes("syner");
                const isDose = section.heading.toLowerCase().includes("dose");
                const isWide = cfg.wide ?? false;

                return (
                  <div
                    key={i}
                    className={cn("group rounded-xl border p-5", cfg.accent, isWide ? "col-span-2" : "col-span-1")}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("flex size-7 items-center justify-center rounded-lg", cfg.badge)}>
                          <Icon className="size-3.5" />
                        </div>
                        <h3 className="text-[13px] font-semibold text-gray-900">{section.heading}</h3>
                      </div>
                      <CopyButton text={section.body} className="opacity-0 group-hover:opacity-100" />
                    </div>

                    <StreamingMarkdown content={section.body} />

                    {/* Dose visualization */}
                    {isDose && doseRange && <DoseViz range={doseRange} />}

                    {/* Synergy pills */}
                    {isSynergies && synergies.length > 0 && (
                      <div className="mt-4 border-t border-black/[0.05] pt-4">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Quick-research a synergy</p>
                        <div className="flex flex-wrap gap-1.5">
                          {synergies.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => onResearchSynergy(s)}
                              className="flex items-center gap-1 rounded-full border border-brand/20 bg-brand/[0.04] px-2.5 py-1 text-[11px] font-medium text-brand transition hover:bg-brand/10"
                            >
                              {s} <ArrowRight className="size-3" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Goal mode: ingredient pills */}
            {goalIngredients.length > 0 && (
              <div className="mt-4 rounded-xl border border-black/[0.06] bg-gray-50/60 p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Research individual ingredients</p>
                <div className="flex flex-wrap gap-2">
                  {goalIngredients.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onResearchGoalIngredient(name)}
                      className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition hover:border-brand/30 hover:bg-brand/[0.04] hover:text-brand"
                    >
                      <BookOpen className="size-3" />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <StreamingMarkdown content={content} />
        )}
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = "fl_research_history";
const PINNED_KEY  = "fl_research_pinned";
const UNIT_OPTIONS = ["mg", "mcg", "g", "IU", "CFU", "mL", "%DV"];

const EXAMPLE_INGREDIENTS = [
  "L-Theanine", "Ashwagandha KSM-66", "Lion's Mane", "Creatine Monohydrate",
  "Magnesium Glycinate", "Vitamin D3 + K2", "Rhodiola Rosea", "Berberine",
  "Alpha GPC", "Coenzyme Q10", "NMN", "Quercetin + Bromelain",
];
const EXAMPLE_GOALS = [
  "Cognitive performance and focus", "Sleep quality and recovery",
  "Athletic endurance", "Stress and cortisol management",
  "Gut health and microbiome", "Longevity and cellular health",
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [mode, setMode] = useState<Mode>("ingredient");
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [main, setMain] = useState<Slot>(emptySlot());
  const [compare, setCompare] = useState<Slot>(emptySlot());
  const [compareQuery, setCompareQuery] = useState("");

  const mainAbort = useRef<AbortController | null>(null);
  const compareAbort = useRef<AbortController | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add-to-formulation state
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

  // History + pinned
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pinned, setPinned] = useState<HistoryEntry[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const h = localStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h));
      const p = localStorage.getItem(PINNED_KEY);
      if (p) setPinned(JSON.parse(p));
    } catch {}
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function saveHistory(entry: HistoryEntry) {
    setHistory(prev => {
      const next = [entry, ...prev.filter(h => !(h.query === entry.query && h.mode === entry.mode))].slice(0, 10);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function togglePin(entry: HistoryEntry) {
    setPinned(prev => {
      const isPinned = prev.some(p => p.id === entry.id);
      const next = isPinned ? prev.filter(p => p.id !== entry.id) : [entry, ...prev].slice(0, 5);
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function restoreEntry(entry: HistoryEntry) {
    setQuery(entry.query);
    setMode(entry.mode === "compare" ? "ingredient" : entry.mode);
    setHasSearched(true);
    setAddOpen(false);
    const parsed = parseSections(entry.content);
    setMain({
      query: entry.query,
      content: entry.content,
      streaming: false,
      sections: parsed,
      grade: extractEvidenceGrade(entry.content),
      doseRange: extractDoseRange(entry.content),
      synergies: extractSynergies(entry.content),
      goalIngredients: extractGoalIngredients(entry.content),
      error: null,
    });
    setCompare(emptySlot());
  }

  async function runSlotSearch(
    slot: "main" | "compare",
    searchQuery: string,
    searchMode: Mode,
  ) {
    const abortRef = slot === "main" ? mainAbort : compareAbort;
    const setSlot = slot === "main" ? setMain : setCompare;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setSlot(s => ({ ...s, query: searchQuery, streaming: true, content: "", sections: [], grade: null, doseRange: null, synergies: [], goalIngredients: [], error: null }));

    let accumulated = "";
    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, type: searchMode === "compare" ? "ingredient" : searchMode }),
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
        setSlot(s => ({ ...s, content: accumulated }));
      }

      const parsed = parseSections(accumulated);
      const grade = extractEvidenceGrade(accumulated);
      const doseRange = extractDoseRange(accumulated);
      const synergies = searchMode !== "goal" ? extractSynergies(accumulated) : [];
      const goalIngredients = searchMode === "goal" ? extractGoalIngredients(accumulated) : [];

      // Pre-fill dose for add panel
      if (slot === "main" && searchMode !== "goal") {
        const d = extractDoseSimple(accumulated);
        if (d) { setAddDose(d.dose); setAddUnit(d.unit); }
      }

      setSlot(s => ({ ...s, streaming: false, sections: parsed, grade, doseRange, synergies, goalIngredients }));
      saveHistory({ id: crypto.randomUUID(), query: searchQuery, mode: searchMode, content: accumulated, timestamp: Date.now() });

    } catch (e: unknown) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        const msg = getErrorMessage(e, "Research failed");
        setSlot(s => ({ ...s, streaming: false, error: msg }));
      } else {
        setSlot(s => ({ ...s, streaming: false }));
      }
    }
  }

  async function handleSearch(q?: string, m?: Mode) {
    const sq = (q ?? query).trim();
    const sm = m ?? mode;
    if (!sq) return;
    if (q) setQuery(q);
    if (m && m !== "compare") setMode(m);
    setHasSearched(true);
    setAddOpen(false);
    setAddSuccess(false);
    setAddedFormulationId(null);
    await runSlotSearch("main", sq, sm);
  }

  async function handleCompareSearch() {
    if (!query.trim() || !compareQuery.trim()) return;
    setHasSearched(true);
    setAddOpen(false);
    runSlotSearch("main", query.trim(), "compare");
    runSlotSearch("compare", compareQuery.trim(), "compare");
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
    setAddOpen(v => !v);
    setAddSuccess(false);
    setAddedFormulationId(null);
    setAddError(null);
    loadFormulations();
  }

  async function handleAddToFormulation() {
    if (!addFormulationId || adding) return;
    setAdding(true);
    setAddError(null);
    const formulation = formulations.find(f => f.id === addFormulationId);
    if (!formulation) { setAdding(false); return; }
    const updated = [...(formulation.ingredients ?? []), {
      id: crypto.randomUUID(),
      name: main.query,
      dose: addDose,
      unit: addUnit,
    }];
    try {
      const res = await fetch(`/api/formulations/${addFormulationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setAddSuccess(true);
      setAddedFormulationId(addFormulationId);
    } catch (e: unknown) {
      setAddError(getErrorMessage(e, "Failed to add ingredient"));
    } finally {
      setAdding(false);
    }
  }

  const examples = mode === "goal" ? EXAMPLE_GOALS : EXAMPLE_INGREDIENTS;
  const isPinnedCurrent = pinned.some(p => p.query === main.query && p.content === main.content);

  const addPanel = (
    <div className="border-b border-black/[0.05] bg-gray-50/60 px-5 py-4">
      <p className="mb-3 text-[12px] font-semibold text-gray-700">
        Add <span className="text-brand">{main.query}</span> to a formulation
      </p>
      {addSuccess ? (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-emerald-600">
          <Check className="size-4 shrink-0" />
          <span>Added.</span>
          {addedFormulationId && (
            <a href={`/dashboard/formulations/${addedFormulationId}`} className="font-medium underline underline-offset-2 hover:text-emerald-700">
              Open formulation →
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500">Formulation</label>
            {formulations.length === 0 ? (
              <p className="text-[12px] italic text-gray-400">No formulations yet.</p>
            ) : (
              <div className="relative">
                <select
                  value={addFormulationId}
                  onChange={e => setAddFormulationId(e.target.value)}
                  className="h-9 min-w-[180px] appearance-none rounded-lg border border-black/[0.08] bg-white pl-3 pr-8 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                >
                  {formulations.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500">
              Dose {addDose && <span className="text-emerald-600">(from research)</span>}
            </label>
            <input
              type="text"
              value={addDose}
              onChange={e => setAddDose(e.target.value)}
              placeholder="e.g. 300"
              className="h-9 w-24 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-500">Unit</label>
            <select
              value={addUnit}
              onChange={e => setAddUnit(e.target.value)}
              className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
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
            {adding ? "Adding…" : "Add"}
          </button>
        </div>
      )}
      {addError && <p className="mt-2 text-[12px] text-red-500">{addError}</p>}
    </div>
  );

  return (
    <div className="flex gap-5 items-start">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside className="w-[240px] shrink-0 sticky top-12 max-h-[calc(100vh-56px)] overflow-y-auto space-y-4 pb-6">

        {/* Header */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI Research</p>
          <h1 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-gray-950">Ingredient Research</h1>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg bg-gray-100 p-0.5 text-[11px]">
          {(["ingredient", "goal", "compare"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                if (m !== "compare") {
                  setMain(emptySlot());
                  setCompare(emptySlot());
                  setHasSearched(false);
                  setQuery("");
                  setCompareQuery("");
                  setAddOpen(false);
                }
              }}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 font-medium capitalize transition",
                mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {m === "ingredient" && <BookOpen className="size-3" />}
              {m === "goal"       && <Target   className="size-3" />}
              {m === "compare"    && <ArrowLeftRight className="size-3" />}
              {m === "ingredient" ? "Ingredient" : m === "goal" ? "Goal" : "Compare"}
            </button>
          ))}
        </div>

        {/* Search inputs */}
        {mode !== "compare" ? (
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={mode === "ingredient" ? "Ingredient name…" : "Health goal…"}
                className="h-9 w-full rounded-lg border border-black/[0.08] bg-white pl-8 pr-7 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="size-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || main.streaming}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-950 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
            >
              {main.streaming ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
              {main.streaming ? "Analyzing…" : "Research"}
            </button>
            <p className="text-center text-[10px] text-gray-400">
              <span className="rounded border border-gray-200 px-1 py-0.5 font-mono text-[9px]">⌘K</span> to focus
            </p>
          </form>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold text-gray-400">Ingredient A</p>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. L-Theanine"
                  className="h-9 w-full rounded-lg border border-brand/30 bg-white px-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold text-gray-400">Ingredient B</p>
              <div className="relative">
                <input
                  type="text"
                  value={compareQuery}
                  onChange={e => setCompareQuery(e.target.value)}
                  placeholder="e.g. Caffeine"
                  className="h-9 w-full rounded-lg border border-purple-200 bg-white px-3 text-[13px] outline-none placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCompareSearch}
              disabled={!query.trim() || !compareQuery.trim() || main.streaming || compare.streaming}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-950 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
            >
              {(main.streaming || compare.streaming) ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowLeftRight className="size-3.5" />}
              Compare both
            </button>
          </div>
        )}

        {/* Example chips */}
        {!hasSearched && mode !== "compare" && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Try an example</p>
            <div className="flex flex-col gap-1">
              {examples.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => handleSearch(ex)}
                  className="rounded-lg px-2.5 py-1.5 text-left text-[12px] text-gray-600 transition hover:bg-brand/[0.05] hover:text-brand"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pinned */}
        {pinned.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Pinned</p>
            <div className="space-y-0.5">
              {pinned.map(entry => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => restoreEntry(entry)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50"
                >
                  <BookmarkCheck className="size-3 shrink-0 text-brand" />
                  <span className="truncate text-[12px] font-medium text-gray-700">{entry.query}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Recent</p>
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  try { localStorage.removeItem(HISTORY_KEY); } catch {}
                }}
                className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="space-y-0.5">
              {history.map(entry => {
                const Icon = entry.mode === "goal" ? Target : BookOpen;
                const isActive = entry.query === main.query && !main.streaming;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => restoreEntry(entry)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                      isActive ? "bg-brand/[0.06] text-brand" : "hover:bg-gray-50 text-gray-600"
                    )}
                  >
                    <Icon className="size-3 shrink-0 opacity-60" />
                    <span className="truncate text-[12px]">{entry.query}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN AREA ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Empty state */}
        {!hasSearched && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Ingredient Research</p>
              <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.025em] text-gray-950 leading-tight">
                Clinical evidence on demand.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-gray-500 max-w-xl">
                Search any ingredient or health goal and get a structured research brief — mechanisms, RCT-backed dose ranges, safety data, synergies, and FDA-defensible claims. No PubMed tab-switching required.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Info,        title: "Mechanisms",        desc: "Receptor targets, pathways, biological mechanisms." },
                  { icon: BarChart3,   title: "Clinical evidence", desc: "Key RCTs with n-sizes, doses, and effect sizes." },
                  { icon: FlaskConical,title: "Dose ranges",       desc: "Effective doses from published human trials." },
                  { icon: ShieldCheck, title: "Safety data",       desc: "ULs, contraindications, drug interactions." },
                  { icon: Link2,       title: "Synergies",         desc: "Stacking combinations with mechanistic rationale." },
                  { icon: FileText,    title: "FDA claims",        desc: "Compliant structure/function claim language." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-black/[0.05] bg-gray-50/60 p-4">
                    <div className="mb-2 flex size-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <Icon className="size-3.5" />
                    </div>
                    <p className="text-[12px] font-semibold text-gray-900">{title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pin button for current result */}
        {hasSearched && (main.content || main.streaming) && !main.streaming && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const entry = history.find(h => h.query === main.query);
                if (entry) togglePin(entry);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition",
                isPinnedCurrent
                  ? "border-brand/20 bg-brand/[0.04] text-brand"
                  : "border-black/[0.08] bg-white text-gray-500 hover:text-gray-800"
              )}
            >
              {isPinnedCurrent ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
              {isPinnedCurrent ? "Pinned" : "Pin to sidebar"}
            </button>
          </div>
        )}

        {/* Results — single or compare */}
        {mode === "compare" && (compare.content || compare.streaming || main.content || main.streaming) ? (
          <div className="grid grid-cols-2 gap-4">
            <ResultPanel
              slot={main}
              label="A"
              onAddToFormulation={openAddPanel}
              addOpen={addOpen}
              addPanel={addPanel}
              onResearchSynergy={name => handleSearch(name, "ingredient")}
              onResearchGoalIngredient={name => handleSearch(name, "ingredient")}
            />
            <ResultPanel
              slot={compare}
              label="B"
              onAddToFormulation={openAddPanel}
              addOpen={false}
              addPanel={null}
              onResearchSynergy={name => handleSearch(name, "ingredient")}
              onResearchGoalIngredient={name => handleSearch(name, "ingredient")}
            />
          </div>
        ) : (
          <ResultPanel
            slot={main}
            onAddToFormulation={openAddPanel}
            addOpen={addOpen}
            addPanel={addPanel}
            onResearchSynergy={name => handleSearch(name, "ingredient")}
            onResearchGoalIngredient={name => handleSearch(name, "ingredient")}
          />
        )}
      </div>
    </div>
  );
}
