import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-[80px] font-semibold leading-none tracking-tight text-gray-200 md:text-[120px]">
        404
      </p>
      <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.02em] text-gray-950">
        Page not found
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-gray-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-gray-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition hover:border-black/20 hover:bg-black/[0.02]"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
