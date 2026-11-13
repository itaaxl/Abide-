import type { Metadata } from "next";
import Link from "next/link";
import { GenerateCards } from "@/components/flashcards/GenerateCards";
import { VerseCarousel, type CarouselCard } from "@/components/flashcards/VerseCarousel";
import { getEdition } from "@/lib/bible/provider";
import { getTopics } from "@/lib/content";
import { aiConfig } from "@/lib/guidance/config";
import { getSessionUser } from "@/lib/auth";
import { isIsoDate, ROTATION_EPOCH, todayFor } from "@/lib/daily";
import { buildFace, type CardRow } from "@/lib/flashcards";
import { getDictionary, getPrefs } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buildVerseCards } from "@/lib/verse-cards";

export const metadata: Metadata = { title: "Flashcards" };

/**
 * Verse cards: today's verse first, then a curated selection. "Saved" shows
 * the person's existing flashcards (nothing is deleted or migrated).
 */
export default async function FlashcardsPage({ searchParams }: PageProps<"/flashcards">) {
  const sp = await searchParams;
  const tab = sp.tab === "saved" ? "saved" : "verses";
  const [{ t }, prefs, user, today] = await Promise.all([getDictionary(), getPrefs(), getSessionUser(), todayFor()]);
  const c = t.cards;
  const canSave = Boolean(user?.emailVerified);
  const labels = {
    reflection: c.reflection,
    save: c.save,
    saved: c.savedLabel,
    share: c.share,
    readChapter: c.readChapter,
    previous: c.previous,
    next: c.next,
    signInToSave: c.signInToSave,
    linkCopied: c.linkCopied,
    copyFailed: c.copyFailed,
    of: c.of,
    yourCard: c.yourCard,
    aiReflection: c.aiReflection,
    image: { downloadImage: c.downloadImage, square: c.square, story: c.story, imageFailed: c.imageFailed, excerpt: c.excerpt },
  };

  let body: React.ReactNode;
  if (tab === "verses") {
    // ?date= keeps old /daily/<date> links working: that day's verse comes first.
    const requested = typeof sp.date === "string" && isIsoDate(sp.date) && sp.date >= ROTATION_EPOCH && sp.date <= today.date ? sp.date : today.date;
    const cards = await buildVerseCards(requested, prefs.edition, 15);
    const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
    const items: CarouselCard[] = cards.map((v, i) => ({
      id: `${v.id}-${v.date}`,
      tag: i === 0 ? (v.date === today.date ? c.today : fmt.format(new Date(`${v.date}T12:00:00Z`))) : undefined,
      text: v.text,
      reference: v.reference,
      editionId: v.editionId,
      editionAbbr: v.editionAbbr,
      editionName: v.editionName,
      direction: v.direction,
      language: v.language,
      reflection: v.reflection ?? undefined,
      chapterHref: v.chapterHref,
      shareKey: v.shareKey,
      passage: { book: v.book, chapter: v.chapter, verseStart: v.verseStart, verseEnd: v.verseEnd },
      note: v.fallbackNote,
    }));
    const [edition, topics] = await Promise.all([getEdition(prefs.edition), getTopics()]);
    body = (
      <>
        {edition && (
          <GenerateCards
            edition={edition.id}
            topics={topics.map((x) => ({ slug: x.slug, label: x.label }))}
            books={edition.books.map((b) => ({ id: b.id, name: b.name, chapters: b.chapters.length }))}
            canUse={canSave}
            available={aiConfig().enabled && edition.license.aiProcessingAllowed}
            labels={labels}
          />
        )}
        <VerseCarousel cards={items} labels={labels} canSave={canSave} ariaLabel={c.carousel} />
      </>
    );
  } else if (!canSave) {
    body = (
      <div className="rounded-[28px] border border-rule bg-surface p-8 text-center">
        <p className="text-muted">{isSupabaseConfigured() ? c.signInSaved : t.common.unavailable}</p>
        {isSupabaseConfigured() && (
          <Link href="/auth/sign-in?next=/flashcards?tab=saved" className="btn btn-primary mt-4">
            {t.nav.signIn}
          </Link>
        )}
      </div>
    );
  } else {
    const supabase = (await createClient())!;
    const { data } = await supabase.from("cards").select("*").order("created_at", { ascending: false }).limit(100);
    const faces = (await Promise.all(((data ?? []) as CardRow[]).map(buildFace))).filter((f) => f !== null);
    const items: CarouselCard[] = faces.map((f) =>
      f.scripture
        ? {
            id: f.id,
            text: f.kind === "text_to_ref" ? f.front : f.kind === "ref_to_text" ? f.back : f.back,
            reference: f.reference!,
            editionId: f.edition,
            editionAbbr: f.editionAbbr,
            direction: f.direction,
            chapterHref: f.href,
          }
        : { id: f.id, text: f.front, answer: f.back, reference: "", direction: "ltr", custom: true },
    );
    body = items.length ? (
      <>
        <VerseCarousel cards={items} labels={labels} canSave={canSave} showSave={false} ariaLabel={c.savedCarousel} />
        <nav aria-label={c.saved} className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
          <Link className="underline-offset-4 hover:underline" href="/flashcards/review?mode=practice">{c.practise}</Link>
          <Link className="underline-offset-4 hover:underline" href="/flashcards/review">{c.review}</Link>
          <Link className="underline-offset-4 hover:underline" href="/flashcards/decks">{c.decks}</Link>
        </nav>
      </>
    ) : (
      <div className="rounded-[28px] border border-rule bg-surface p-8 text-center text-muted">{c.emptySaved}</div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-6 pt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
        <div role="tablist" aria-label={c.title} className="flex rounded-full border border-rule bg-surface p-1 text-sm">
          <Link role="tab" aria-selected={tab === "verses"} href="/flashcards" className={`rounded-full px-3.5 py-1.5 font-semibold ${tab === "verses" ? "bg-gold text-[var(--on-accent)]" : "text-muted"}`}>
            {c.verses}
          </Link>
          <Link role="tab" aria-selected={tab === "saved"} href="/flashcards?tab=saved" className={`rounded-full px-3.5 py-1.5 font-semibold ${tab === "saved" ? "bg-gold text-[var(--on-accent)]" : "text-muted"}`}>
            {c.saved}
          </Link>
        </div>
      </div>
      {body}
    </div>
  );
}
