import Link from "next/link";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your FormLayer account",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex">
      {/* Left panel */}
      <div className="relative hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col justify-between overflow-hidden bg-gray-950 p-12">

        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute -top-40 -right-40 size-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-20 size-72 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-brand" />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">FormLayer</span>
          </Link>

          <div className="mt-16">
            <h2 className="text-[28px] font-semibold leading-[1.2] tracking-[-0.03em] text-white">
              Evidence-backed<br />
              supplement formulation<br />
              from research to launch.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/50">
              Research, compliance, and manufacturer handoff — in one workflow.
            </p>
          </div>

          <ul className="mt-12 space-y-3.5">
            {[
              "RAG-powered ingredient research",
              "FDA compliance review",
              "Manufacturer handoff & RFQ",
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-[13px] text-white/60">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <svg className="size-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase tracking-widest text-white/20">
            FormLayer · 2026
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        {children}
      </div>
    </div>
  );
}
