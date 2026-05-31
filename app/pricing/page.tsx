"use client";

import { Check, ArrowRight, Zap, Plus, Minus, Shield, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    pitch: "Try the core workflow before you commit.",
    cta: "Start for free",
    ctaSecondary: "No credit card required",
    highlighted: false,
    features: [
      { text: "3 formulations", note: "permanent, not a trial" },
      { text: "AI ingredient research", note: "mechanisms, RCT dosing, safety" },
      { text: "Auto-generated Supplement Facts panel" },
      { text: "FDA compliance score", note: "100-point with issue flags" },
      { text: "Evidence grades per ingredient", note: "A / B / C from published RCTs" },
    ],
    missing: [
      "PDF dossier export",
      "Compliance auto-fix",
      "Manufacturer handoff",
      "AI Agent Builder",
      "Version history",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    pitch: "For founders and operators building their first products.",
    cta: "Get Starter",
    ctaSecondary: "7-day money-back guarantee",
    highlighted: true,
    features: [
      { text: "15 formulations" },
      { text: "Everything in Free" },
      { text: "Full AI formulation builder", note: "health goal → complete stack in minutes" },
      { text: "Compliance auto-fix", note: "one-click fixes for issues below 75/100" },
      { text: "PDF dossier export", note: "print-ready with clinical rationale" },
      { text: "Research-to-formulate flow", note: "ingredient research feeds directly into your stack" },
      { text: "Priority AI processing" },
    ],
    missing: [
      "AI Agent Builder",
      "Manufacturer handoff & RFQ brief",
      "Version history & restore",
      "Team collaboration",
      "Public share links",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    pitch: "For R&D teams and agencies managing multiple products.",
    cta: "Get Pro",
    ctaSecondary: "7-day money-back guarantee",
    highlighted: false,
    features: [
      { text: "Unlimited formulations" },
      { text: "Everything in Starter" },
      { text: "AI Agent Builder", note: "custom agents that create full formulations autonomously" },
      { text: "Manufacturer handoff & RFQ brief", note: "live share links + one-click PDF brief" },
      { text: "Formulation version history", note: "every save versioned, restore any prior state" },
      { text: "Public share links", note: "branded read-only view for manufacturers" },
      { text: "Team collaboration", note: "invite collaborators per formulation" },
    ],
    missing: [],
  },
];

const COMPARE_ROWS = [
  { label: "Formulations", free: "3", starter: "15", pro: "Unlimited" },
  { label: "AI ingredient research", free: true, starter: true, pro: true },
  { label: "Evidence grades (A / B / C)", free: true, starter: true, pro: true },
  { label: "Supplement Facts panel", free: true, starter: true, pro: true },
  { label: "FDA compliance score", free: true, starter: true, pro: true },
  { label: "Compliance auto-fix", free: false, starter: true, pro: true },
  { label: "Full AI formulation builder", free: false, starter: true, pro: true },
  { label: "PDF dossier export", free: false, starter: true, pro: true },
  { label: "Priority AI processing", free: false, starter: true, pro: true },
  { label: "AI Agent Builder", free: false, starter: false, pro: true },
  { label: "Manufacturer handoff & RFQ brief", free: false, starter: false, pro: true },
  { label: "Version history & restore", free: false, starter: false, pro: true },
  { label: "Public share links", free: false, starter: false, pro: true },
  { label: "Team collaboration", free: false, starter: false, pro: true },
];

const FAQS = [
  {
    q: "What counts as a formulation?",
    a: "Each unique product concept is one formulation — a pre-workout, a sleep stack, a probiotic blend. You can have unlimited ingredients, revisions, and saves within one formulation. The limit is on how many separate products you can work on simultaneously.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your billing dashboard at any moment. You keep full access until the end of your current billing period — no proration, no surprises.",
  },
  {
    q: "What is the 7-day money-back guarantee?",
    a: "If you upgrade to Starter or Pro and decide it's not right for you within 7 days of your first payment, email support@formlayer.co for a full refund. No questions asked.",
  },
  {
    q: "Is my formulation data private?",
    a: "Yes. Every formulation is protected by Row Level Security — only your account can read or write your data. We never use your formulation data to train AI models.",
  },
  {
    q: "What AI models does FormLayer use?",
    a: "FormLayer routes through OpenRouter, which gives us access to models from Anthropic, OpenAI, Google, and others. We use the best available model for each task and update as new options improve accuracy. Your data is never used for training.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Free plan is permanently free with 3 formulations — it's a real taste of the product, not a 14-day clock. When you're ready to scale, the 7-day money-back guarantee on paid plans means you can try without risk.",
  },
  {
    q: "Do you offer discounts for agencies or larger teams?",
    a: "The Pro plan is built for agencies managing multiple client formulations. If you're running more than 5 brands and need something custom, email support@formlayer.co.",
  },
];

function CheckCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="mx-auto size-4 text-emerald-500" />;
  if (value === false) return <span className="mx-auto block size-1.5 rounded-full bg-gray-200 mx-auto" />;
  return <span className="text-[12px] font-semibold text-gray-900">{value}</span>;
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleCheckout(planId: string) {
    if (planId === "free") {
      router.push(user ? "/dashboard" : "/sign-up");
      return;
    }
    if (user) {
      router.push(`/dashboard/billing?upgrade=${planId}`);
    } else {
      router.push(`/sign-up?next=/dashboard/billing?upgrade=${planId}`);
    }
  }

  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <div className="mx-auto max-w-5xl px-6 pt-20 pb-14 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand">Pricing</p>
        <h1 className="mt-3 text-[36px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[44px]">
          Start free. Scale when it clicks.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-gray-500 max-w-md mx-auto">
          Three plans. No hidden fees. Payments handled by Paddle — your Merchant of Record for global tax compliance.
        </p>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-5 lg:grid-cols-3 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-7",
                plan.highlighted
                  ? "border-brand bg-white shadow-[0_0_0_1px_var(--color-brand),0_8px_40px_rgba(91,110,225,0.12)]"
                  : "border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                    <Zap className="size-3" />
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan name + pitch */}
              <div>
                <p className={cn(
                  "text-[12px] font-semibold uppercase tracking-widest",
                  plan.highlighted ? "text-brand" : "text-gray-400"
                )}>
                  {plan.name}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-[38px] font-semibold tracking-tight text-gray-950">
                    ${plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-[13px] text-gray-400 mb-1">/month</span>
                  )}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{plan.pitch}</p>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={() => handleCheckout(plan.id)}
                className={cn(
                  "mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition",
                  plan.highlighted
                    ? "bg-brand text-white hover:bg-brand/90 shadow-sm"
                    : plan.id === "free"
                    ? "border border-black/[0.08] bg-gray-50 text-gray-700 hover:bg-gray-100"
                    : "bg-gray-950 text-white hover:bg-gray-800"
                )}
              >
                {plan.cta}
                {plan.id !== "free" && <ArrowRight className="size-3.5" />}
              </button>
              <p className="mt-2 text-center text-[11px] text-gray-400">{plan.ctaSecondary}</p>

              {/* Divider */}
              <div className="my-6 border-t border-black/[0.06]" />

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    <Check className={cn(
                      "mt-0.5 size-4 shrink-0",
                      plan.highlighted ? "text-brand" : "text-emerald-500"
                    )} />
                    <div>
                      <span className="text-[13px] font-medium text-gray-900">{f.text}</span>
                      {f.note && (
                        <span className="text-[12px] text-gray-400"> — {f.note}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Not included */}
              {plan.missing.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-300">
                      <span className="size-4 shrink-0 flex items-center justify-center">
                        <span className="size-1.5 rounded-full bg-gray-200 block" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Trust bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[12px] text-gray-400">
          {[
            { icon: Shield, text: "7-day money-back on paid plans" },
            { icon: Zap, text: "Cancel anytime — no lock-in" },
            { icon: Bot, text: "Row Level Security on all formulation data" },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-gray-300" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Full comparison table */}
      <div className="border-t border-black/[0.05] bg-gray-50/60 py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-[22px] font-semibold tracking-[-0.02em] text-gray-950 mb-2">
            Full feature comparison
          </h2>
          <p className="text-center text-[13px] text-gray-400 mb-10">Everything included in each plan at a glance.</p>

          <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px] border-b border-black/[0.06] bg-gray-50/80 px-5 py-3">
              <span />
              <span className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-400">Free</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-widest text-brand">Starter</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-widest text-gray-600">Pro</span>
            </div>

            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={cn(
                  "grid grid-cols-[1fr_80px_80px_80px] items-center border-b border-black/[0.04] px-5 py-3 last:border-0",
                  i % 2 === 1 && "bg-gray-50/40"
                )}
              >
                <span className="text-[13px] text-gray-700">{row.label}</span>
                <span className="text-center"><CheckCell value={row.free} /></span>
                <span className="text-center"><CheckCell value={row.starter} /></span>
                <span className="text-center"><CheckCell value={row.pro} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="text-center text-[22px] font-semibold tracking-[-0.02em] text-gray-950 mb-2">
          Questions
        </h2>
        <p className="text-center text-[13px] text-gray-400 mb-10">
          Anything else? Email <a href="mailto:support@formlayer.co" className="text-brand hover:underline">support@formlayer.co</a>
        </p>

        <div className="divide-y divide-black/[0.06] rounded-2xl border border-black/[0.06] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          {FAQS.map((faq, i) => (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                aria-expanded={openFaq === i}
              >
                <span className="text-[14px] font-medium text-gray-950">{faq.q}</span>
                {openFaq === i
                  ? <Minus className="size-4 shrink-0 text-gray-400" />
                  : <Plus className="size-4 shrink-0 text-gray-400" />
                }
              </button>
              <div className={cn(
                "overflow-hidden transition-all duration-200",
                openFaq === i ? "max-h-48" : "max-h-0"
              )}>
                <p className="px-6 pb-5 text-[13px] leading-relaxed text-gray-600">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-black/[0.05] bg-gray-950 py-16">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-white">
            Start with 3 free formulations.
          </h2>
          <p className="mt-3 text-[14px] text-gray-400">
            No credit card. No time limit. Upgrade when your pipeline grows.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleCheckout("free")}
              className="rounded-full bg-white px-7 py-3 text-[13px] font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Create free account
            </button>
            <button
              onClick={() => handleCheckout("starter")}
              className="rounded-full border border-white/20 px-7 py-3 text-[13px] font-medium text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Get Starter — $49/mo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
