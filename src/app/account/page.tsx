import type { Metadata } from "next";
import Link from "next/link";
import { DeleteAccountForm, SettingsForm } from "@/components/AccountForms";
import { gate, PrivateBadge } from "@/components/Gate";
import { listEditions } from "@/lib/bible/provider";
import { getPrefs } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const g = await gate("/account", "Account settings");
  if (!g.user) return g.panel;
  const sp = await searchParams;
  const supabase = (await createClient())!;
  const [{ data: profile }, prefs, editions] = await Promise.all([
    supabase.from("profiles").select("display_name, timezone, daily_review_target").eq("id", g.user.id).maybeSingle(),
    getPrefs(),
    listEditions(),
  ]);
  const timezones = Intl.supportedValuesOf("timeZone");
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-4xl">Account settings</h1>
        <PrivateBadge />
      </div>
      {sp.reset === "1" && <p role="status" className="card p-4 text-success">Your password was updated.</p>}
      <section className="card p-6">
        <h2 className="mb-1 font-serif text-2xl">Profile and reading</h2>
        <p className="mb-4 text-sm text-muted">Signed in as {g.user.email}. These preferences sync to every device you sign in on.</p>
        <SettingsForm
          defaults={{
            displayName: profile?.display_name ?? "",
            locale: prefs.locale,
            edition: prefs.edition,
            theme: prefs.theme,
            fontSize: prefs.fontSize,
            timezone: profile?.timezone ?? prefs.timezone,
            dailyTarget: profile?.daily_review_target ?? 20,
          }}
          editions={editions.map((e) => ({ id: e.id, label: `${e.languageName} — ${e.name}` }))}
          timezones={timezones}
        />
      </section>
      <section className="card p-6">
        <h2 className="font-serif text-2xl">Your data</h2>
        <p className="mt-2 text-sm text-muted">
          Download everything you have saved (bookmarks, highlights, notes, flashcards and reviews, plan progress, journal entries, saved
          guidance, watchlist) as a JSON file. <Link href="/privacy" className="underline">What we store</Link>
        </p>
        <a href="/account/export" className="btn mt-4" download>
          Export my data
        </a>
      </section>
      <section className="card border-danger/40 p-6">
        <h2 className="font-serif text-2xl text-danger">Delete account</h2>
        <div className="mt-3">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}
