import type { Metadata } from "next";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineList } from "@/components/pwa/OfflineList";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Offline reading", robots: { index: false } };

/**
 * Public page (no account data) — the service worker keeps a copy fetched
 * without cookies and shows it when a page isn't available offline.
 */
export default async function OfflinePage() {
  const { T } = await getT();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{T("Offline reading", "Lecture hors ligne", "القراءة دون اتصال")}</h1>
      <p className="mt-2 text-muted">
        {T(
          "Chapters you download are stored on this device and open without an internet connection. They contain Bible text only — your highlights, notes, and account aren’t included and appear again when you’re back online.",
          "Les chapitres téléchargés sont stockés sur cet appareil et s’ouvrent sans Internet. Ils contiennent uniquement le texte biblique — vos surlignages, notes et compte n’y sont pas et réapparaissent une fois en ligne.",
          "تُخزّن الأصحاحات المنزّلة على هذا الجهاز وتُفتح دون اتصال. تحتوي على نص الكتاب المقدس فقط — لا تتضمن تظليلاتك وملاحظاتك وحسابك، وتعود عند الاتصال.",
        )}
      </p>
      <div className="mt-6">
        <OfflineList />
      </div>
      <h2 className="mt-10 text-lg font-semibold tracking-tight">{T("Needs an internet connection", "Nécessite Internet", "يحتاج إلى اتصال بالإنترنت")}</h2>
      <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
        <li>{T("Chapters you haven’t downloaded, and search", "Les chapitres non téléchargés et la recherche", "الأصحاحات غير المنزّلة والبحث")}</li>
        <li>{T("Verse cards, Find Guidance, and AI card generation", "Les cartes de versets, l’aide et la génération de cartes", "بطاقات الآيات والإرشاد وإنشاء البطاقات")}</li>
        <li>{T("Signing in, saving, your Library, journal, and reading plans", "La connexion, l’enregistrement, la bibliothèque, le journal et les plans", "تسجيل الدخول والحفظ والمكتبة والدفتر وخطط القراءة")}</li>
        <li>{T("Listening (read aloud) works offline if your device has a voice installed", "La lecture à voix haute fonctionne hors ligne si une voix est installée", "الاستماع (القراءة بصوت عالٍ) يعمل دون اتصال إن كان على جهازك صوت مثبّت")}</li>
      </ul>
      <h2 className="mt-10 text-lg font-semibold tracking-tight">{T("Install Abide", "Installer Abide", "ثبّت Abide")}</h2>
      <p className="mt-2 text-muted">{T("Add Abide to your home screen to open it like an app.", "Ajoutez Abide à l’écran d’accueil pour l’ouvrir comme une app.", "أضف Abide إلى الشاشة الرئيسية لتفتحه كتطبيق.")}</p>
      <div className="mt-3">
        <InstallPrompt always />
      </div>
    </div>
  );
}
