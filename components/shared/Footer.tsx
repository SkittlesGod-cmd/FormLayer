"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "For agencies", href: "/for-agencies" },
      { label: "Changelog", href: "/changelog" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Security", href: "/security" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Get started", href: "/sign-up" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="border-t border-black/6 bg-[rgba(255,255,255,0.7)]">
      <div className="page-shell py-10 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/" className="text-[15px] font-semibold tracking-[-0.02em] text-gray-950">
              FormLayer
            </Link>
            <p className="mt-3 fine-print">
              Evidence-backed product development for supplement brands and
              agencies. Research, compliance, and manufacturing in one workflow.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-12 gap-y-8">
            {FOOTER_COLUMNS.map(({ heading, links }) => (
              <div key={heading}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  {heading}
                </p>
                <nav className="flex flex-col gap-2">
                  {links.map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-[13px] text-gray-500 transition-colors hover:text-gray-950"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-black/6 pt-6 text-[12px] text-gray-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 FormLayer, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="transition-colors hover:text-gray-600">{label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
