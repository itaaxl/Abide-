import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { listEditions } from "@/lib/bible/provider";
import { PLANS } from "@/content/plans";
import { TOPICS } from "@/content/topics";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url;
  const pages = ["", "/daily", "/plans", "/discover", "/watch", "/guide", "/about", "/help", "/editions", "/credits", "/privacy", "/terms"].map((p) => ({ url: `${base}${p}` }));
  const editions = await listEditions();
  const chapters = editions.flatMap((e) => e.books.flatMap((b) => b.chapters.map((_, i) => ({ url: `${base}/bible/${e.id}/${b.id}/${i + 1}` }))));
  return [...pages, ...PLANS.map((p) => ({ url: `${base}/plans/${p.slug}` })), ...TOPICS.map((t) => ({ url: `${base}/discover/${t.slug}` })), ...chapters];
}
