"use client";

import { useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "fl_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage may be unavailable in some environments
      return false;
    }
  });

  function dismiss() {
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
      aria-describedby="cookie-desc"
    >
      <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
        <p id="cookie-desc" className="text-[13px] leading-relaxed text-gray-600">
          We use essential cookies for authentication and session management only — no advertising or tracking cookies.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full bg-gray-950 px-5 py-2 text-[13px] font-medium text-white transition hover:bg-gray-800"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-full border border-black/[0.08] px-5 py-2 text-[13px] font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Decline non-essential
          </button>
          <Link
            href="/privacy"
            className="text-[13px] text-gray-400 transition hover:text-gray-700"
          >
            Privacy policy
          </Link>
        </div>
      </div>
    </div>
  );
}
