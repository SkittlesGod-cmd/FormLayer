import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security – FormLayer",
  description: "How FormLayer protects your formulation data.",
};

const STAT_CHIPS = [
  "TLS 1.2+ Encryption",
  "AES-256 at rest",
  "Row Level Security",
  "SOC 2 infrastructure",
];

const SECTIONS = [
  {
    title: "Infrastructure",
    body: "FormLayer is hosted on Vercel (edge CDN) with data stored in Supabase-managed PostgreSQL databases in the United States. Supabase maintains SOC 2 Type II certification and encrypts all data at rest using AES-256.",
  },
  {
    title: "Encryption",
    body: "All data transmitted between your browser and FormLayer is encrypted using TLS 1.2+. Database data is encrypted at rest. API keys are stored as environment secrets and never exposed to the client.",
  },
  {
    title: "Authentication",
    body: "Authentication is handled by Supabase Auth with support for Google OAuth and email/password. Sessions use short-lived JWTs. Password resets require email verification. We do not store passwords in plain text.",
  },
  {
    title: "Access Control",
    body: "Formulation data is protected by Row Level Security (RLS) — your data is only accessible to your account. Our team cannot view your formulation data without explicit access grants. AI processing uses your data only to generate responses and does not train models.",
  },
  {
    title: "AI & Third-Party Processing",
    body: "FormLayer uses AI models via OpenRouter. When you submit a formulation for AI analysis, that data is transmitted to OpenRouter and its underlying model providers. We recommend using descriptive ingredient names rather than proprietary trade secrets in plain text. Payment processing is handled by Paddle (Merchant of Record).",
  },
  {
    title: "Reporting a Vulnerability",
    body: "If you discover a security vulnerability, please email security@formlayer.co. We will respond within 48 hours and work to resolve confirmed issues promptly. We do not currently offer a bug bounty program but appreciate responsible disclosure.",
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 md:py-24">
      <div className="mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Trust &amp; Safety
        </p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[40px]">
          Security
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
          How FormLayer protects your formulation data.
        </p>
      </div>

      {/* Stat chips */}
      <div className="mb-10 flex flex-wrap gap-2">
        {STAT_CHIPS.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center rounded-full border border-black/[0.08] bg-gray-50 px-3.5 py-1.5 text-[12px] font-medium text-gray-700"
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Summary box */}
      <div className="mb-10 rounded-xl border border-black/[0.06] bg-gray-50 px-6 py-5">
        <p className="text-[13px] leading-relaxed text-gray-600">
          FormLayer is built on enterprise-grade infrastructure. Your formulation data is encrypted
          at rest and in transit. We follow security best practices and work with trusted vendors
          who maintain their own compliance programs.
        </p>
      </div>

      <div className="space-y-10">
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-[16px] font-semibold text-gray-950">{title}</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-600">{body}</p>
          </section>
        ))}
      </div>

      <div className="mt-16 border-t border-black/[0.06] pt-8">
        <p className="text-[13px] text-gray-400">
          © 2026 FormLayer, Inc. All rights reserved.{" "}
          <a href="/privacy" className="underline hover:text-gray-600">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
