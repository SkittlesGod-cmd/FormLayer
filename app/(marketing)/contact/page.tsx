import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact – FormLayer",
  description: "Get in touch with the FormLayer team.",
};

const CONTACT_CARDS = [
  {
    label: "General inquiries",
    email: "support@formlayer.co",
    description: "Questions about the platform, your account, or billing.",
  },
  {
    label: "Security",
    email: "security@formlayer.co",
    description: "Responsible vulnerability disclosure and security questions.",
  },
  {
    label: "Partnerships",
    email: "partnerships@formlayer.co",
    description: "Manufacturer integrations, agency partnerships, and press.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[720px] px-5 py-16 md:py-24">
      <div className="mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Get in touch
        </p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.03em] text-gray-950 md:text-[40px]">
          Contact
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-500">
          We&apos;re a small team building fast. We read every message.
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {CONTACT_CARDS.map(({ label, email, description }) => (
          <div
            key={label}
            className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              {label}
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-2 block text-[13px] font-semibold text-gray-950 hover:text-brand transition-colors"
            >
              {email}
            </a>
            <p className="mt-2 text-[12px] leading-relaxed text-gray-500">{description}</p>
          </div>
        ))}
      </div>

      {/* Book a demo */}
      <div className="mt-14 rounded-2xl border border-black/[0.06] bg-gray-50 px-8 py-10">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-gray-950">
          Book a demo
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-gray-600 max-w-lg">
          If you&apos;re evaluating FormLayer for your team, we&apos;re happy to walk you through
          the platform. Email us at{" "}
          <a
            href="mailto:support@formlayer.co"
            className="font-medium text-gray-950 underline hover:text-brand transition-colors"
          >
            support@formlayer.co
          </a>{" "}
          and we&apos;ll set something up.
        </p>
        <a
          href="mailto:support@formlayer.co"
          className="mt-6 inline-flex items-center rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Send us an email
        </a>
      </div>

      <div className="mt-16 border-t border-black/[0.06] pt-8">
        <p className="text-[13px] text-gray-400">
          © 2026 FormLayer, Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
