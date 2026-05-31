"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "fl_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
        <p className="text-[13px] leading-relaxed text-gray-600">
          We use essential cookies for authentication and session management. No advertising cookies.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={accept}
            className="rounded-full bg-gray-950 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
          >
            Accept
          </button>
          <Link
            href="/privacy"
            className="text-[13px] font-medium text-gray-500 transition hover:text-gray-950"
          >
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
