"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

interface Last {
  edition: string;
  book: string;
  chapter: number;
  bookName?: string;
}

function read(): string | null {
  try {
    return localStorage.getItem("abide:last");
  } catch {
    return null;
  }
}

/** Guest "continue reading" from this device; signed-in users get a server-rendered link. */
export function ContinueReading({ label, fallbackLabel, fallbackHref }: { label: string; fallbackLabel: string; fallbackHref: string }) {
  const raw = useSyncExternalStore(
    () => () => {},
    read,
    () => null,
  );
  let last: Last | null = null;
  try {
    last = raw ? (JSON.parse(raw) as Last) : null;
  } catch {
    last = null;
  }
  if (last && /^[a-z]{3}-[a-z0-9-]+$/.test(last.edition) && /^[A-Z0-9]{3}$/.test(last.book) && Number.isInteger(last.chapter)) {
    return (
      <Link href={`/bible/${last.edition}/${last.book}/${last.chapter}`} className="btn btn-primary">
        {label}: {last.bookName ?? last.book} {last.chapter}
      </Link>
    );
  }
  return (
    <Link href={fallbackHref} className="btn btn-primary">
      {fallbackLabel}
    </Link>
  );
}
