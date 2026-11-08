import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { gate, PrivateBadge } from "@/components/Gate";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { todayFor } from "@/lib/daily";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Journal entry", robots: { index: false, follow: false } };

export default async function EntryPage({ params }: PageProps<"/journal/[id]">) {
  const { id } = await params;
  const g = await gate(`/journal/${id}`, "Prayer Journal");
  if (!g.user) return g.panel;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const supabase = (await createClient())!;
  const { data: e } = await supabase.from("prayer_entries").select("*").eq("id", id).maybeSingle();
  if (!e) notFound();
  const { date } = await todayFor();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/journal" className="text-sm text-muted underline">← Journal</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Edit entry</h1>
        <PrivateBadge />
      </div>
      <div className="mt-6">
        <EntryEditor
          userId={g.user.id}
          today={date}
          initial={{ id: e.id, title: e.title, body: e.body, refs: e.refs, tags: e.tags, status: e.status, entryDate: e.entry_date }}
        />
      </div>
    </div>
  );
}
