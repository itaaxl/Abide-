"use client";

import Link from "next/link";

/** Generic error boundary. Never displays error details that could include personal data. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-4xl">Something went wrong</h1>
      <p className="mt-3 text-muted">This may be a temporary network problem. Your saved data is safe.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={reset}>Try again</button>
        <Link className="btn" href="/">Home</Link>
      </div>
    </div>
  );
}
