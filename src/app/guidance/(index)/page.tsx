import type { Metadata } from "next";
import Link from "next/link";
import { GuidanceForm } from "@/components/guidance/GuidanceForm";
import { getSessionUser } from "@/lib/auth";
import { getTopics } from "@/lib/content";
import { aiConfig } from "@/lib/guidance/config";
import { topicText } from "@/content/topics";
import { getPrefs, getT } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Find Guidance", robots: { index: true } };

export default async function GuidancePage() {
  const [user, prefs, topics, { T, locale }] = await Promise.all([getSessionUser(), getPrefs(), getTopics(), getT()]);
  const cfg = aiConfig();
  const canUse = Boolean(user?.emailVerified);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{T("Find Guidance", "Trouver de l’aide", "اطلب إرشادًا")}</h1>
      <p className="mt-3 leading-relaxed text-muted">
        {T(
          "Describe what you’re struggling with, hoping for, or trying to grow in. We’ll suggest a few Bible passages and briefly explain why each may be relevant — with links to read the full chapter for context. This is a reading aid, not a pastor, counselor, or doctor.",
          "Décrivez ce qui vous pèse, ce que vous espérez, ou ce dans quoi vous voulez grandir. Nous proposerons quelques passages bibliques avec une brève explication — et des liens pour lire le chapitre entier. C’est une aide à la lecture, pas un pasteur, un conseiller ou un médecin.",
          "صِف ما تعانيه أو ترجوه أو تريد أن تنمو فيه. سنقترح بعض المقاطع من الكتاب المقدس مع شرح موجز لسبب ملاءمتها — وروابط لقراءة الأصحاح كاملًا. هذه أداة مساعدة على القراءة، لا راعٍ ولا مرشد ولا طبيب.",
        )}
      </p>
      <details className="mt-4 text-sm text-muted">
        <summary className="cursor-pointer">{T("How this works and what is shared", "Fonctionnement et données partagées", "كيف يعمل هذا وما الذي يُشارك")}</summary>
        <ul className="mt-2 list-disc space-y-1 ps-6">
          <li>{T("First we search our verified Bible text and curated topic lists for candidate passages.", "Nous cherchons d’abord des passages dans notre texte biblique vérifié et nos listes thématiques.", "نبحث أولًا عن مقاطع في نصّ الكتاب المقدس الموثّق وقوائمنا الموضوعية.")}</li>
          <li>{T("If AI is available, your words and those candidates are sent to our AI provider (Groq, free plan, US servers), which chooses among them and writes short explanations. It cannot add other references.", "Si l’IA est disponible, vos mots et ces passages sont envoyés à notre fournisseur d’IA (Groq, offre gratuite, serveurs aux États-Unis), qui choisit parmi eux et rédige de courtes explications. Il ne peut pas ajouter d’autres références.", "إن كان الذكاء الاصطناعي متاحًا، تُرسل كلماتك وهذه المقاطع إلى مزوّدنا (Groq، الخطة المجانية، خوادم في الولايات المتحدة) ليختار منها ويكتب شروحًا قصيرة. لا يمكنه إضافة مراجع أخرى.")}</li>
          <li>{T("Verse text is always shown from our verified edition, never from AI wording.", "Le texte des versets vient toujours de notre édition vérifiée, jamais de l’IA.", "يُعرض نص الآيات دائمًا من طبعتنا الموثّقة، لا من صياغة الذكاء الاصطناعي.")}</li>
          <li>{T("Your request is not stored unless you choose “Save”. It is never added to analytics or logs.", "Votre demande n’est pas conservée sauf si vous choisissez « Enregistrer ». Elle n’entre jamais dans des statistiques ou journaux.", "لا يُحفظ طلبك إلا إذا اخترت «حفظ»، ولا يُضاف أبدًا إلى الإحصاءات أو السجلات.")}</li>
          <li>{T("If AI is unavailable, you’ll see passages from curated topic lists instead, clearly labelled.", "Si l’IA n’est pas disponible, vous verrez des passages de nos listes thématiques, clairement indiqués.", "إن لم يتوفر الذكاء الاصطناعي، سترى مقاطع من قوائمنا الموضوعية مع توضيح ذلك.")}</li>
          <li>{T(`Limit: ${cfg.dailyLimit} AI requests per person per day.`, `Limite : ${cfg.dailyLimit} demandes d’IA par personne et par jour.`, `الحدّ: ${cfg.dailyLimit} طلبات يوميًا لكل شخص.`)}</li>
        </ul>
      </details>
      {!isSupabaseConfigured() ? (
        <p className="card mt-6 p-4 text-sm">
          {T("Personalized guidance needs accounts, which aren’t configured yet. Browse curated passages on ", "L’aide personnalisée nécessite un compte, pas encore configuré. Parcourez les passages sur ", "الإرشاد الشخصي يحتاج إلى حسابات غير مفعّلة بعد. تصفّح المقاطع في ")}
          <Link href="/discover" className="underline">{T("Discover", "Découvrir", "اكتشف")}</Link>.
        </p>
      ) : !canUse ? (
        <div className="card mt-6 p-4 text-sm">
          <p>
            <strong>{T("Personalized guidance requires signing in", "L’aide personnalisée nécessite une connexion", "الإرشاد الشخصي يتطلب تسجيل الدخول")}</strong>{" "}
            {T(
              "(with a verified email), so we can keep fair daily limits. You can type your request below first — it is kept privately in this browser tab while you sign in, and you choose when to send it.",
              "(avec un e-mail vérifié), pour garder des limites équitables. Vous pouvez écrire votre demande d’abord — elle reste en privé dans cet onglet pendant la connexion, et vous choisissez quand l’envoyer.",
              "(ببريد مؤكَّد) لنحافظ على حدود يومية عادلة. يمكنك كتابة طلبك أولًا — يبقى خاصًا في علامة التبويب هذه أثناء تسجيل الدخول، وأنت تختار متى ترسله.",
            )}
          </p>
          <p className="mt-3 text-muted">{T("Or open passages chosen by people, no account needed:", "Ou ouvrez des passages choisis par des personnes, sans compte :", "أو افتح مقاطع اختارها أشخاص، دون حساب:")}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {topics.map((tp) => (
              <li key={tp.slug}>
                <Link href={`/discover/${tp.slug}`} className="btn btn-sm">
                  {topicText(tp, locale).label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-6">
        <GuidanceForm edition={prefs.edition} maxChars={cfg.maxInputChars} canUse={canUse} userId={user?.id} signInHref="/auth/sign-in?next=/guidance" />
      </div>
      {canUse && (
        <p className="mt-8 text-sm">
          <Link href="/guidance/saved" className="underline">
            {T("Your saved guidance", "Vos aides enregistrées", "إرشاداتك المحفوظة")}
          </Link>
        </p>
      )}
    </div>
  );
}
