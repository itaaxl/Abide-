import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { getEdition } from "@/lib/bible/provider";
import { getPrefs } from "@/lib/request";
import { getReadingPosition } from "@/lib/user-data";

/** "Bible" opens the reader where the user left off, or at the starting point. */
export default async function BiblePage() {
  const pos = await getReadingPosition();
  if (pos) redirect(`/bible/${pos.edition}/${pos.book}/${pos.chapter}`);
  const prefs = await getPrefs();
  const edition = (await getEdition(prefs.edition)) ?? (await getEdition(site.defaultEdition))!;
  const book = edition.books.some((b) => b.id === site.startingPoint.book) ? site.startingPoint.book : edition.books[0].id;
  redirect(`/bible/${edition.id}/${book}/1`);
}
