import type { Metadata } from "next";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>Terms of use</h1>
      <p className="rounded-lg border border-rule bg-gold-soft/30 p-3 text-sm">
        Draft — operator details and governing law must be completed and reviewed by the operator before launch.
      </p>
      <p>Operator: {site.operator.name} · Contact: {site.operator.contactEmail} · Operator location: {site.operator.location}</p>
      <h2>Using the site</h2>
      <p>{site.name} is offered free of charge for personal reading and study. Please use it lawfully and don’t attempt to access other people’s data or disrupt the service.</p>
      <h2>Scripture and content</h2>
      <p>Bible texts are public domain editions credited on the Credits page. Editorial content (reflections, notes, plans) is provided for personal use.</p>
      <h2>AI suggestions</h2>
      <p>
        Find Guidance uses an AI model to suggest passages and short explanations. Explanations may be imperfect and are not professional, medical,
        legal, or pastoral advice. If you are in danger, contact local emergency services.
      </p>
      <h2>External links</h2>
      <p>Links to films and series go to their official providers, whose own terms apply. We are not affiliated with those producers.</p>
      <h2>Accounts</h2>
      <p>Keep your password safe. You may delete your account at any time from Account settings.</p>
      <h2>No warranty</h2>
      <p>The service is provided “as is” without warranties. To the extent permitted by law, the operator is not liable for indirect damages arising from its use.</p>
    </article>
  );
}
