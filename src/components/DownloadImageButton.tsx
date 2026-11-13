"use client";

import { useEffect, useRef, useState } from "react";
import { imageFilename, renderVerseImage, saveBlob, type ImageFormat, type VerseImageInput } from "@/lib/verse-image";

export interface DownloadImageLabels {
  downloadImage: string;
  square: string;
  story: string;
  imageFailed: string;
  excerpt: string;
}

/** "Download image" with a small choice of Square or Story (vertical) format. */
export function DownloadImageButton({
  verse,
  labels,
  className = "btn btn-sm btn-ghost",
}: {
  verse: Omit<VerseImageInput, "excerptLabel">;
  labels: DownloadImageLabels;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ImageFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function make(format: ImageFormat) {
    setBusy(format);
    setError(null);
    try {
      const blob = await renderVerseImage({ ...verse, excerptLabel: labels.excerpt }, format);
      saveBlob(blob, imageFilename(verse.reference, format));
      setOpen(false);
    } catch {
      setError(labels.imageFailed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" className={className} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12M7 10l5 5 5-5M5 19h14" />
        </svg>
        {labels.downloadImage}
      </button>
      {open && (
        <div role="group" aria-label={labels.downloadImage} className="absolute bottom-full start-0 z-20 mb-2 flex gap-1 rounded-2xl border border-rule bg-surface p-1.5 shadow-lg">
          {(["square", "story"] as const).map((f) => (
            <button key={f} type="button" className="btn btn-sm whitespace-nowrap" onClick={() => make(f)} disabled={busy !== null} aria-busy={busy === f}>
              <span aria-hidden="true" className={`inline-block rounded-[3px] border-2 border-current ${f === "square" ? "h-3.5 w-3.5" : "h-4 w-2.5"}`} />
              {f === "square" ? labels.square : labels.story}
            </button>
          ))}
        </div>
      )}
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
