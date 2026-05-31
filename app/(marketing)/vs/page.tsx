import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "FormLayer vs. Spreadsheets & Manual Research",
  description: "See how FormLayer compares to managing supplement formulation in Google Sheets, Notion, and scattered PubMed tabs.",
};

const COMPARISONS = [
  {
    feature: "AI-drafted ingredient stack from a health goal",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Clinical dose ranges from published RCTs",
    formLayer: true,
    sheets: false,
    manual: "hours of work",
  },
  {
    feature: "Evidence grade per ingredient (A/B/C)",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "FDA compliance score with specific issue flags",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Auto-fix compliance issues below 75/100",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Supplement Facts panel generator",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Print-ready PDF dossier export",
    formLayer: true,
    sheets: "manual design",
    manual: false,
  },
  {
    feature: "Public share link for manufacturers",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Version history with restore",
    formLayer: true,
    sheets: "manual copies",
    manual: false,
  },
  {
    feature: "AI manufacturer brief generator",
    formLayer: true,
    sheets: false,
    manual: false,
  },
  {
    feature: "Multi-product workspace",
    formLayer: true,
    sheets: "messy tabs",
    manual: false,
  },
  {
    feature: "Time to first complete formulation",
    formLayer: "< 5 minutes",
    sheets: "days",
    manual: "weeks",
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-emerald-600" />;
  if (value === false) return <X className="mx-auto size-4 text-gray-300" />;
  return <span className="text-[12px] text-amber-600">{value}</span>;
}

export default function VsPage() {
  return (
    <div className="mx-auto max-w-[860px] px-5 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Comparison</p>
        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[42px]">
          FormLayer vs. doing it manually
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-500">
          Most supplement teams manage formulation in Google Sheets, Notion docs, and scattered PubMed tabs. Here's what that costs you.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] border-b border-black/[0.06] bg-gray-50 px-5 py-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Feature</span>
          <span className="w-28 text-center text-[11px] font-semibold uppercase tracking-widest text-brand">FormLayer</span>
          <span className="w-28 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Spreadsheets</span>
          <span className="w-28 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Manual</span>
        </div>

        {/* Rows */}
        {COMPARISONS.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center border-b border-black/[0.04] px-5 py-3.5 last:border-0"
          >
            <span className="text-[13px] text-gray-700">{row.feature}</span>
            <span className="w-28 text-center">
              {row.formLayer === true ? (
                <Check className="mx-auto size-4 text-emerald-600" />
              ) : (
                <span className="text-[12px] font-semibold text-emerald-600">{row.formLayer}</span>
              )}
            </span>
            <span className="w-28 text-center"><Cell value={row.sheets} /></span>
            <span className="w-28 text-center"><Cell value={row.manual} /></span>
          </div>
        ))}
      </div>

      {/* Pain points */}
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h2 className="text-[15px] font-semibold text-gray-950">The spreadsheet problem</h2>
          <ul className="mt-4 space-y-2.5 text-[13px] text-gray-600">
            {[
              "No clinical evidence context — you're guessing at doses",
              "Copy-pasting between PubMed, Notion, and Excel loses citation trail",
              "No compliance check until legal review, which is expensive and late",
              "Sharing a spec sheet means emailing a file that gets stale immediately",
              "Version history is manual copies named 'final_v3_REAL_THIS_ONE.xlsx'",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <X className="mt-0.5 size-3.5 shrink-0 text-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-brand/20 bg-brand/[0.03] p-6">
          <h2 className="text-[15px] font-semibold text-gray-950">The FormLayer difference</h2>
          <ul className="mt-4 space-y-2.5 text-[13px] text-gray-600">
            {[
              "AI drafts a clinically-dosed stack in under 60 seconds",
              "Every ingredient shows its evidence grade and published dose range",
              "Compliance check runs before anything leaves your workspace",
              "Share links give manufacturers a live, branded view of your formulation",
              "Every save creates a version — restore any prior state in one click",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-gray-950 p-8 text-center text-white">
        <h2 className="text-[22px] font-semibold tracking-[-0.02em]">Ready to stop managing supplements in spreadsheets?</h2>
        <p className="mt-3 text-[14px] text-gray-400">Free plan includes 3 formulations. No credit card required.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-full bg-white px-6 py-3 text-[13px] font-medium text-gray-950 transition hover:bg-gray-100"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-white/20 px-6 py-3 text-[13px] font-medium text-white transition hover:border-white/40"
          >
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
