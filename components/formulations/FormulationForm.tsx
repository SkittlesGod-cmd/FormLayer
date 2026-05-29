"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Sparkles, Loader2, X, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createFormulationSchema,
  FORMULATION_STATUSES,
  STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPE_SERVING,
  type CreateFormulationInput,
  type FormulationIngredient,
  type ProductType,
} from "@/lib/formulations/types";

export type FormulationFormValues = CreateFormulationInput & {
  ingredients: FormulationIngredient[];
};

interface Props {
  defaultValues?: Partial<FormulationFormValues>;
  submitLabel: string;
  showStatus?: boolean;
  onSubmit: (values: FormulationFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

function newIngredient(): FormulationIngredient {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: "",
    dose: "",
    unit: "mg",
  };
}

const fieldClass = "h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15";
const labelClass = "text-[12px] font-medium text-gray-600";

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1 text-[11px] leading-snug text-gray-400">
      <Info className="mt-px size-3 shrink-0" />
      {children}
    </p>
  );
}

const UNIT_OPTIONS = ["mg", "mcg", "g", "IU", "CFU", "mL", "%DV", "mg NE", "mg ATE"];

export function FormulationForm({ defaultValues, submitLabel, showStatus = false, onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestGoal, setSuggestGoal] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<FormulationFormValues>({
    resolver: zodResolver(createFormulationSchema) as any,
    defaultValues: {
      name: "", description: "", product_type: null, status: "draft",
      target_dose: "", serving_size: "", capsule_size: "",
      capsules_per_serving: null, notes: "", ingredients: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });
  const watchedIngredients = watch("ingredients");
  const watchedProductType = watch("product_type") as ProductType | null | undefined;

  const showCapsuleFields = !watchedProductType ||
    watchedProductType === "capsule" ||
    watchedProductType === "softgel";

  const servingPlaceholder = watchedProductType
    ? PRODUCT_TYPE_SERVING[watchedProductType as ProductType] ?? "e.g. 2 capsules"
    : "e.g. 2 capsules";

  async function runSuggest() {
    if (!suggestGoal.trim() || suggesting) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const existing = (watchedIngredients ?? []).map(i => i.name).filter(Boolean);
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: suggestGoal, existing_ingredients: existing }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Suggestion failed");
      const suggestions: Array<{ name: string; dose: string; unit: string }> = data.suggestions ?? [];
      suggestions.forEach(s => {
        append({ id: crypto.randomUUID(), name: s.name, dose: s.dose ?? "", unit: s.unit ?? "mg" });
      });
      setSuggestOpen(false);
      setSuggestGoal("");
    } catch (e: any) {
      setSuggestError(e.message ?? "Suggestion failed");
    } finally {
      setSuggesting(false);
    }
  }

  const internalSubmit = handleSubmit(async values => {
    setSubmitting(true);
    try { await onSubmit(values); } finally { setSubmitting(false); }
  });

  return (
    <form onSubmit={internalSubmit} className="space-y-5">

      {/* Product type badge (read-only display if set from wizard) */}
      {watchedProductType && (
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-brand/20 bg-brand/[0.05] px-3 py-1 text-[12px] font-medium text-brand">
            {PRODUCT_TYPE_LABELS[watchedProductType as ProductType] ?? watchedProductType}
          </span>
          <span className="text-[12px] text-gray-400">delivery format</span>
        </div>
      )}

      <input type="hidden" {...register("product_type")} />

      {/* Basic info */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Product identity</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">Name and intended purpose of this formulation.</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="name" className={labelClass}>
              Product name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Focus Stack Pro, Daily Calm Capsule, Recovery Blend"
              className={cn(fieldClass, errors.name && "border-red-400")}
            />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            <FieldHint>Use a name that reflects the product's primary benefit or SKU identifier.</FieldHint>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="description" className={labelClass}>Health claim / intended purpose</Label>
            <textarea
              id="description"
              {...register("description")}
              rows={3}
              placeholder="Describe what this product is designed to do — e.g. 'Supports cognitive performance and sustained focus in healthy adults.' This text informs compliance review and label copy."
              className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none"
            />
            <FieldHint>Keep to structure/function claims only. Avoid disease claims (e.g. "treats", "cures").</FieldHint>
          </div>

          {showStatus && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status" className={labelClass}>Pipeline status</Label>
              <select id="status" {...register("status")} className={fieldClass}>
                {FORMULATION_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <FieldHint>Track where this formula sits in your R&D pipeline.</FieldHint>
            </div>
          )}
        </div>
      </section>

      {/* Dosage & format */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Dosage & format specs</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Manufacturing parameters used in the Supplement Facts panel and bill of materials.
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="serving_size" className={labelClass}>Serving size</Label>
            <Input
              id="serving_size"
              {...register("serving_size")}
              placeholder={servingPlaceholder}
              className={fieldClass}
            />
            <FieldHint>
              {watchedProductType === "powder"
                ? "Typically one scoop — include gram weight (e.g. 1 scoop / 5g)."
                : watchedProductType === "liquid"
                ? "Dropper size or volume in mL (e.g. 1 mL, 30 drops)."
                : "Number of units per serving as it will appear on the label."}
            </FieldHint>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="target_dose" className={labelClass}>Total active dose per serving</Label>
            <Input
              id="target_dose"
              {...register("target_dose")}
              placeholder="e.g. 850 mg total actives"
              className={fieldClass}
            />
            <FieldHint>Sum of all active ingredient weights — used to estimate fill weight and capsule count.</FieldHint>
          </div>

          {showCapsuleFields && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="capsule_size" className={labelClass}>
                  {watchedProductType === "softgel" ? "Softgel size" : "Capsule size"}
                </Label>
                <select id="capsule_size" {...register("capsule_size")} className={fieldClass}>
                  <option value="">— Select —</option>
                  {watchedProductType === "softgel"
                    ? ["Mini (0.3 mL)", "Small (0.5 mL)", "Medium (1.0 mL)", "Large (1.5 mL)", "Jumbo (2.0 mL)"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))
                    : ["#000 (1.37 mL)", "#00 (0.91 mL)", "#0 (0.68 mL)", "#1 (0.50 mL)", "#2 (0.37 mL)", "#3 (0.30 mL)", "#4 (0.21 mL)"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))
                  }
                </select>
                <FieldHint>
                  {watchedProductType === "softgel"
                    ? "Softgel fill volume determines maximum liquid payload per unit."
                    : "#00 (~500–600 mg fill) is the most common retail capsule. #000 holds ~800–1000 mg."}
                </FieldHint>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="capsules_per_serving" className={labelClass}>
                  {watchedProductType === "softgel" ? "Softgels per serving" : "Capsules per serving"}
                </Label>
                <Input
                  id="capsules_per_serving"
                  type="number"
                  min={1}
                  max={20}
                  {...register("capsules_per_serving", {
                    setValueAs: v => (v === "" || v == null) ? null : Number(v),
                  })}
                  placeholder="e.g. 2"
                  className={cn(fieldClass, errors.capsules_per_serving && "border-red-400")}
                />
                {errors.capsules_per_serving && (
                  <p className="text-[11px] text-red-500">{errors.capsules_per_serving.message}</p>
                )}
                <FieldHint>Higher counts allow more total fill weight but affect consumer compliance.</FieldHint>
              </div>
            </>
          )}

          {watchedProductType === "tablet" && (
            <div className="md:col-span-2">
              <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-700">
                Tablet specs (compression force, hardness, disintegration time) are managed in the manufacturing dossier. Record your total tablet weight in "Total active dose" above.
              </div>
            </div>
          )}

          {(watchedProductType === "gummy") && (
            <div className="md:col-span-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-blue-700">
                Gummy specs (pectin vs gelatin, sugar content, moisture) are handled in the manufacturing spec sheet. Use "Serving size" for gummies per serving and "Total active dose" for total actives.
              </div>
            </div>
          )}

          {(watchedProductType === "powder") && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="target_dose" className={labelClass}>Scoop / sachet weight</Label>
              <Input
                id="serving_size"
                {...register("serving_size")}
                placeholder="e.g. 5g per scoop"
                className={fieldClass}
              />
              <FieldHint>Total powder weight per serving including excipients and flavors.</FieldHint>
            </div>
          )}
        </div>
      </section>

      {/* Ingredients */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3.5">
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900">Active ingredients</h2>
            <p className="text-[11px] text-gray-400">Each compound, its dose, and unit — as they appear in the Supplement Facts panel.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setSuggestOpen(v => !v); setSuggestError(null); }}
              className="flex items-center gap-1.5 rounded-md border border-brand/20 bg-brand/[0.04] px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-brand/[0.08]"
            >
              <Sparkles className="size-3.5" />
              AI suggest
            </button>
            <button
              type="button"
              onClick={() => append(newIngredient())}
              className="flex items-center gap-1.5 rounded-md border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* AI suggest panel */}
        {suggestOpen && (
          <div className="border-b border-black/[0.05] bg-brand/[0.02] px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand/10 mt-0.5">
                <Sparkles className="size-3.5 text-brand" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">AI ingredient suggestions</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Describe the health goal — AI returns evidence-backed compounds with clinical doses.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={suggestGoal}
                    onChange={e => setSuggestGoal(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), runSuggest())}
                    placeholder="e.g. Cognitive performance, sleep quality, stress resilience…"
                    className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={runSuggest}
                    disabled={!suggestGoal.trim() || suggesting}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-950 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-40"
                  >
                    {suggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    {suggesting ? "Thinking…" : "Suggest"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSuggestOpen(false); setSuggestGoal(""); setSuggestError(null); }}
                    className="flex size-9 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-gray-400 transition hover:text-gray-700"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                {suggestError && <p className="text-[12px] text-red-500">{suggestError}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/[0.08] py-10 text-center">
              <p className="text-[12px] font-medium text-gray-500">No ingredients yet</p>
              <p className="mt-1 text-[11px] text-gray-400">
                Use "AI suggest" to auto-populate from a health goal, or add manually.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 px-1">
                <span className="col-span-12 text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:col-span-5">Ingredient / compound</span>
                <span className="col-span-5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:col-span-3">Dose per serving</span>
                <span className="col-span-5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 md:col-span-3">Unit</span>
              </div>
              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-black/[0.06] bg-gray-50/50 p-2.5">
                  <Controller
                    control={control}
                    name={`ingredients.${idx}.id`}
                    render={({ field: f }) => <input type="hidden" {...f} value={f.value ?? ""} />}
                  />
                  <div className="col-span-12 md:col-span-5">
                    <Input
                      {...register(`ingredients.${idx}.name`)}
                      placeholder="e.g. L-Theanine, Ashwagandha KSM-66®"
                      className={cn(fieldClass, "h-8")}
                    />
                  </div>
                  <div className="col-span-5 md:col-span-3">
                    <Input
                      {...register(`ingredients.${idx}.dose`)}
                      placeholder="200"
                      className={cn(fieldClass, "h-8")}
                    />
                  </div>
                  <div className="col-span-5 md:col-span-3">
                    <select
                      {...register(`ingredients.${idx}.unit`)}
                      className={cn(fieldClass, "h-8")}
                    >
                      {UNIT_OPTIONS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      aria-label="Remove"
                      className="flex size-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="pt-1 text-[11px] text-gray-400">
                {fields.length} ingredient{fields.length !== 1 ? "s" : ""} — list all actives exactly as they will appear in the Supplement Facts panel, including proprietary blends by name.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="border-b border-black/[0.05] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-gray-900">Internal notes</h2>
          <p className="mt-0.5 text-[11px] text-gray-400">Sourcing preferences, manufacturing constraints, claim ideas, open questions.</p>
        </div>
        <div className="p-5">
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="e.g. Prefer KSM-66® ashwagandha from Ixoreal. Target MSRP $49.99. Considering 'promotes calm focus' as primary claim. Need to verify magnesium glycinate vs threonate dosing…"
            className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 resize-none"
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-black/[0.08] bg-white px-4 py-2 text-[13px] font-medium text-gray-700 transition hover:border-black/20 hover:bg-black/[0.02]"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-gray-950 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
