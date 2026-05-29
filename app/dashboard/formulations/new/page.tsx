"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Sparkles, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { FormulationForm, type FormulationFormValues } from "@/components/formulations/FormulationForm";
import type { Formulation } from "@/lib/formulations/types";
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_DESC,
  type ProductType,
} from "@/lib/formulations/types";
import { cn } from "@/lib/utils";

const PRODUCT_TYPE_ICON: Record<ProductType, React.ReactNode> = {
  capsule: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C9.24 2 7 4.24 7 7v10c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5z" />
      <line x1="7" y1="12" x2="17" y2="12" strokeLinecap="round" />
    </svg>
  ),
  tablet: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="8" width="16" height="8" rx="2" />
    </svg>
  ),
  softgel: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <ellipse cx="12" cy="12" rx="7" ry="5" />
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  ),
  gummy: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" d="M12 4C8 4 5 7 5 11c0 2 .8 3.8 2 5l1 4h8l1-4c1.2-1.2 2-3 2-5 0-4-3-7-7-7z" />
    </svg>
  ),
  powder: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-8 4 8 4-8 4 8" />
      <line x1="4" y1="20" x2="20" y2="20" strokeLinecap="round" />
    </svg>
  ),
  liquid: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l1 6H8L9 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9v8a2 2 0 004 0v-1a2 2 0 014 0v1" />
    </svg>
  ),
  topical: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10v4H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8v8c0 1.1.9 2 2 2h2a2 2 0 002-2V8" />
    </svg>
  ),
  strip: (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="9" width="18" height="6" rx="1" />
      <line x1="8" y1="9" x2="8" y2="15" strokeLinecap="round" />
      <line x1="12" y1="9" x2="12" y2="15" strokeLinecap="round" />
      <line x1="16" y1="9" x2="16" y2="15" strokeLinecap="round" />
    </svg>
  ),
};

const CONSUMER_SEGMENTS = [
  "General wellness",
  "Athletic performance",
  "Cognitive health",
  "Women's health",
  "Men's health",
  "Senior health",
  "Weight management",
  "Gut & digestive health",
];

const GENERATING_MESSAGES = [
  "Scanning clinical literature…",
  "Selecting evidence-backed compounds…",
  "Calculating optimal dose ranges…",
  "Checking ingredient interactions…",
  "Drafting your starting stack…",
];

type Step = "type" | "goal" | "generating" | "form";

interface PrefillData {
  name: string;
  description: string;
  product_type: string;
  ingredients: Array<{ id: string; name: string; dose: string; unit: string }>;
}

export default function NewFormulationPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("type");
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [goal, setGoal] = useState("");
  const [consumer, setConsumer] = useState("");
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  const [genError, setGenError] = useState<string | null>(null);
  const [prefill, setPrefill] = useState<PrefillData | null>(null);

  async function handleGenerate() {
    if (!goal.trim()) return;
    setStep("generating");
    setGenError(null);
    setGenMsgIdx(0);

    const ticker = setInterval(() => {
      setGenMsgIdx(i => (i + 1) % GENERATING_MESSAGES.length);
    }, 1800);

    try {
      const fullGoal = consumer
        ? `${goal.trim()} — target consumer: ${consumer}`
        : goal.trim();

      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: fullGoal }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI generation failed");

      const suggestions: Array<{ name: string; dose: string; unit: string }> =
        data.suggestions ?? [];

      const label = PRODUCT_TYPE_LABELS[productType!] ?? productType;
      const goalShort = goal.trim().replace(/\.$/, "");

      setPrefill({
        name: `${goalShort} ${label}`,
        description: consumer
          ? `${goalShort} formulation for ${consumer.toLowerCase()}.`
          : `${goalShort} formulation.`,
        product_type: productType!,
        ingredients: suggestions.map((s, i) => ({
          id: `gen-${i}-${Date.now()}`,
          name: s.name,
          dose: s.dose ?? "",
          unit: s.unit ?? "mg",
        })),
      });

      setStep("form");
    } catch (e: any) {
      setGenError(e.message ?? "Generation failed");
      setStep("goal");
    } finally {
      clearInterval(ticker);
    }
  }

  async function handleCreate(values: FormulationFormValues) {
    const res = await fetch("/api/formulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Failed to create formulation");
    }

    const json = (await res.json()) as { formulation: Formulation };
    toast.success("Formulation created");
    router.push(`/dashboard/formulations/${json.formulation.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/formulations"
          className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
        >
          <ChevronLeft className="size-3.5" />
          Formulations
        </Link>
        <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
          {step === "form" ? (prefill?.name ?? "New formulation") : "New formulation"}
        </h1>
        {step !== "form" && (
          <p className="mt-1 text-[13px] text-gray-500">
            Tell us what you're making — AI will draft your starting stack.
          </p>
        )}
      </div>

      {/* Step: Product type */}
      {step === "type" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="border-b border-black/[0.05] px-5 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Step 1 of 2</p>
              <h2 className="mt-0.5 text-[15px] font-semibold text-gray-900">What delivery format are you formulating?</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
              {PRODUCT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setProductType(type); setStep("goal"); }}
                  className={cn(
                    "group flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition",
                    productType === type
                      ? "border-brand bg-brand/[0.04]"
                      : "border-black/[0.07] bg-gray-50/50 hover:border-black/20 hover:bg-white"
                  )}
                >
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    productType === type ? "bg-brand/10 text-brand" : "bg-white text-gray-400 group-hover:text-gray-600"
                  )}>
                    {PRODUCT_TYPE_ICON[type]}
                  </div>
                  <div>
                    <p className={cn(
                      "text-[13px] font-semibold",
                      productType === type ? "text-brand" : "text-gray-900"
                    )}>
                      {PRODUCT_TYPE_LABELS[type]}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-400">
                      {PRODUCT_TYPE_DESC[type]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-[12px] text-gray-400">
            Prefer to start from scratch?{" "}
            <button
              type="button"
              onClick={() => { setProductType(null); setStep("form"); setPrefill(null); }}
              className="font-medium text-brand hover:underline"
            >
              Open blank form
            </button>
          </p>
        </div>
      )}

      {/* Step: Goal */}
      {step === "goal" && productType && (
        <div className="space-y-4">
          <div className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 border-b border-black/[0.05] px-5 py-3.5">
              <button
                type="button"
                onClick={() => setStep("type")}
                className="flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
              >
                <ChevronLeft className="size-3.5" />
                Back
              </button>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Step 2 of 2</span>
              <span className="ml-auto flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                <span className="flex size-4 items-center justify-center text-gray-400">
                  {PRODUCT_TYPE_ICON[productType]}
                </span>
                {PRODUCT_TYPE_LABELS[productType]}
              </span>
            </div>

            <div className="space-y-5 p-5">
              {/* Goal */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-700">
                  What health goal does this product address?
                </label>
                <textarea
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  rows={3}
                  placeholder="e.g. Improve cognitive focus and mental clarity for knowledge workers…"
                  className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Cognitive focus & mental clarity",
                    "Sleep quality & recovery",
                    "Athletic endurance & performance",
                    "Stress & cortisol management",
                    "Gut health & microbiome support",
                    "Immune system support",
                    "Joint & mobility support",
                    "Longevity & cellular health",
                  ].map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setGoal(ex)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] transition",
                        goal === ex
                          ? "border-brand/30 bg-brand/[0.06] text-brand"
                          : "border-black/[0.06] bg-gray-50 text-gray-500 hover:border-brand/20 hover:text-gray-700"
                      )}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consumer segment */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-700">
                  Target consumer <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CONSUMER_SEGMENTS.map(seg => (
                    <button
                      key={seg}
                      type="button"
                      onClick={() => setConsumer(c => c === seg ? "" : seg)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                        consumer === seg
                          ? "border-brand/30 bg-brand/[0.06] text-brand"
                          : "border-black/[0.06] bg-gray-50 text-gray-500 hover:border-black/20 hover:text-gray-700"
                      )}
                    >
                      {seg}
                    </button>
                  ))}
                </div>
              </div>

              {genError && (
                <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                  {genError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-black/[0.05] px-5 py-4">
              <button
                type="button"
                onClick={() => { setProductType(null); setStep("form"); setPrefill(null); }}
                className="text-[12px] text-gray-400 hover:text-gray-700 transition"
              >
                Skip — blank form
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!goal.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
              >
                <Sparkles className="size-3.5" />
                Generate formulation
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === "generating" && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6">
          <div className="relative flex size-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/[0.04]">
            <Sparkles className="size-7 text-brand" />
            <span className="absolute -right-1 -top-1 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-40" />
              <span className="relative inline-flex size-3 rounded-full bg-brand" />
            </span>
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-gray-900">Drafting your formulation</p>
            <p className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-400">
              <Loader2 className="size-3.5 animate-spin" />
              {GENERATING_MESSAGES[genMsgIdx]}
            </p>
          </div>
          <div className="flex gap-1">
            {GENERATING_MESSAGES.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === genMsgIdx ? "w-6 bg-brand" : "w-1.5 bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Form */}
      {step === "form" && (
        <div className="space-y-4">
          {prefill && (
            <div className="flex items-center gap-2 rounded-xl border border-brand/15 bg-brand/[0.03] px-4 py-3">
              <Sparkles className="size-3.5 shrink-0 text-brand" />
              <p className="flex-1 text-[12px] text-gray-600">
                AI drafted{" "}
                <strong className="font-semibold text-gray-900">
                  {prefill.ingredients.length} ingredients
                </strong>{" "}
                based on your goal. Review and adjust before saving.
              </p>
              <button
                type="button"
                onClick={() => setStep("goal")}
                className="flex items-center gap-1 text-[12px] text-gray-400 transition hover:text-gray-700"
              >
                <RotateCcw className="size-3" />
                Regenerate
              </button>
            </div>
          )}
          <FormulationForm
            submitLabel="Create formulation"
            showStatus={false}
            defaultValues={
              prefill
                ? {
                    name: prefill.name,
                    description: prefill.description,
                    product_type: prefill.product_type,
                    ingredients: prefill.ingredients,
                  }
                : productType
                ? { product_type: productType }
                : undefined
            }
            onSubmit={handleCreate}
            onCancel={() => router.push("/dashboard/formulations")}
          />
        </div>
      )}
    </div>
  );
}
