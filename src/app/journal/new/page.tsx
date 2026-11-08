import type { Metadata } from "next";
import Link from "next/link";
import { gate, PrivateBadge } from "@/components/Gate";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { todayFor } from "@/lib/daily";

export const metadata: Metadata = { title: "New journal entry", robots: { index: false, follow: false } };

export default async function NewEntryPage() {
  const g = await gate("/journal/new", "Prayer Journal");
  if (!g.user) return g.panel;
  const { date } = await todayFor();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/journal" className="text-sm text-muted underline">← Journal</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-3xl">New entry</h1>
        <PrivateBadge />
      </div>
      <div className="mt-6">
        <EntryEditor userId={g.user.id} today={date} />
      </div>
    </div>
  );
}
