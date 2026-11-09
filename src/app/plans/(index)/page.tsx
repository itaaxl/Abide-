import type { Metadata } from "next";
import Link from "next/link";
import { getPlans } from "@/lib/content";
import { getEdition } from "@/lib/bible/provider";
import { getPrefs } from "@/lib/request";

export const metadata: Metadata = { title: "Reading Plans", description: "Short reading plans through John, the Psalms, and the New Testament." };

export default async function PlansPage() {
  const [plans, prefs] = await Promise.all([getPlans(), getPrefs()]);
  const edition = await getEdition(prefs.edition);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Reading Plans</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Each plan is a set of real passages, one small portion a day. Read at your own pace — you can pause, catch up, or shift the schedule at any time.
      </p>
      <ul className="mt-8 grid gap-6 md:grid-cols-2">
        {plans.map((p) => (
          <li key={p.slug} className="card flex flex-col p-6">
            <h2 className="text-lg font-semibold tracking-tight">{p.title}</h2>
            <p className="mt-1 text-sm text-gold">
              {p.days.length} days · about {p.minutesPerDay} min a day · {edition?.abbreviation}
            </p>
            <p className="mt-3 flex-1 text-muted">{p.description}</p>
            <Link href={`/plans/${p.slug}`} className="btn mt-4 w-fit">
              View plan
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
