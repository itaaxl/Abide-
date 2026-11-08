import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="eyebrow">Not found</p>
      <h1 className="mt-2 font-serif text-4xl">We couldn’t find that page</h1>
      <p className="mt-3 text-muted">The book, chapter, or page may not exist in this translation. Try searching, or browse the books.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link className="btn btn-primary" href="/bible">Open the Bible</Link>
        <Link className="btn" href="/search">Search</Link>
      </div>
    </div>
  );
}
