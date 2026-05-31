"use client";

import Link from "next/link";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    number: 1,
    title: "Research an ingredient",
    description:
      "Use the Research tab to pull clinical evidence, dose ranges, and safety data for any compound.",
  },
  {
    number: 2,
    title: "Build a formulation",
    description:
      "Start a new formulation and let AI draft an evidence-backed ingredient stack from your health goal.",
  },
  {
    number: 3,
    title: "Run compliance",
    description:
      "Once your stack is ready, run the FDA compliance checker and get your score with specific fixes.",
  },
];

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.14)]">
        <div className="px-8 pb-8 pt-8">
          <h2
            id="onboarding-title"
            className="text-[22px] font-semibold tracking-[-0.02em] text-gray-950"
          >
            Welcome to FormLayer
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            You&apos;re set up. Here&apos;s how to get the most out of the platform.
          </p>

          <div className="mt-8 space-y-4">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex items-start gap-4 rounded-xl border border-black/[0.06] bg-gray-50 p-5"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-950 text-[13px] font-semibold text-white">
                  {step.number}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-gray-950">{step.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/dashboard/formulations/new"
              onClick={onClose}
              className="w-full rounded-full bg-gray-950 px-6 py-3 text-center text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Start your first formulation &rarr;
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="text-[13px] text-gray-400 transition hover:text-gray-600"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
