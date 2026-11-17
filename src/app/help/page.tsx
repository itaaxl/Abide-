import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Help" };

export default async function HelpPage() {
  const { T } = await getT();
  const FAQ: [string, React.ReactNode][] = [
    [
      T("How do I look up a verse?", "Comment trouver un verset ?", "كيف أبحث عن آية؟"),
      T(
        "Type a reference such as John 3:16, Psalm 23, or 1 Cor 13:4-7 into the search bar. French and Arabic book names work too (Jean 3:16, يوحنا 3:16).",
        "Tapez une référence comme Jean 3:16, Psaumes 23 ou 1 Co 13:4-7 dans la recherche. Les noms anglais et arabes fonctionnent aussi (John 3:16, يوحنا 3:16).",
        "اكتب مرجعًا مثل يوحنا 3:16 أو المزامير 23 في شريط البحث. تعمل أسماء الأسفار بالإنجليزية والفرنسية أيضًا (John 3:16، Jean 3:16).",
      ),
    ],
    [
      T("How do I search for a word or phrase?", "Comment chercher un mot ou une expression ?", "كيف أبحث عن كلمة أو عبارة؟"),
      T(
        "Type words into the search bar. Use quotation marks for an exact phrase. Results come from the translation you’re reading.",
        "Tapez des mots dans la recherche. Mettez une expression exacte entre guillemets. Les résultats viennent de la traduction que vous lisez.",
        "اكتب الكلمات في شريط البحث. ضع العبارة الدقيقة بين علامتي تنصيص. النتائج من الترجمة التي تقرؤها.",
      ),
    ],
    [
      T("Why do verse numbers sometimes differ between translations?", "Pourquoi la numérotation diffère-t-elle parfois ?", "لماذا يختلف ترقيم الآيات أحيانًا بين الترجمات؟"),
      T(
        "Translations follow different numbering traditions. For example, the Louis Segond counts some longer Psalm titles as their own verse. When numbers might not line up, we show a warning instead of guessing.",
        "Les traductions suivent des traditions de numérotation différentes. Par exemple, la Louis Segond compte certains titres de psaumes comme un verset. Quand les numéros peuvent ne pas correspondre, nous l’indiquons au lieu de deviner.",
        "تتبع الترجمات تقاليد ترقيم مختلفة. مثلًا تعدّ ترجمة لويس سيغون بعض عناوين المزامير الطويلة آية مستقلة. عندما قد لا تتطابق الأرقام نعرض تنبيهًا بدل التخمين.",
      ),
    ],
    [
      T("How do I save a verse?", "Comment enregistrer un verset ?", "كيف أحفظ آية؟"),
      T(
        "Sign in, then tap a verse in the reader to bookmark, highlight, add a private note, or make a flashcard. On verse cards, tap Save.",
        "Connectez-vous, puis touchez un verset dans le lecteur pour l’ajouter aux signets, le surligner, l’annoter ou en faire une carte. Sur les cartes, touchez Enregistrer.",
        "سجّل الدخول ثم اضغط على آية في القارئ لحفظها أو تظليلها أو إضافة ملاحظة خاصة أو إنشاء بطاقة. وفي بطاقات الآيات اضغط «حفظ».",
      ),
    ],
    [
      T("How do flashcards work?", "Comment fonctionnent les cartes ?", "كيف تعمل البطاقات؟"),
      T(
        "Saved cards are scheduled with a simple spaced-repetition rule: rate how well you remembered, and the card returns sooner or later. You can always practise without changing the schedule.",
        "Les cartes enregistrées suivent une règle simple de répétition espacée : notez votre souvenir, et la carte revient plus ou moins tôt. Vous pouvez toujours vous entraîner sans changer le programme.",
        "تُجدول البطاقات المحفوظة بقاعدة تكرار متباعد بسيطة: قيّم مدى تذكّرك فتعود البطاقة أسرع أو أبطأ. ويمكنك دائمًا التمرّن دون تغيير الجدول.",
      ),
    ],
    [
      T("Can I listen to a chapter?", "Puis-je écouter un chapitre ?", "هل يمكنني الاستماع إلى أصحاح؟"),
      T(
        "Yes — press Listen in the reader. Your device’s own voice reads the text aloud; nothing is sent anywhere. Voices depend on your device.",
        "Oui — appuyez sur Écouter dans le lecteur. La voix de votre appareil lit le texte ; rien n’est envoyé. Les voix dépendent de l’appareil.",
        "نعم — اضغط «استمع» في القارئ. يقرأ صوت جهازك النص؛ ولا يُرسل شيء. تعتمد الأصوات على جهازك.",
      ),
    ],
    [
      T("Can I read offline?", "Puis-je lire hors ligne ?", "هل يمكنني القراءة دون اتصال؟"),
      T(
        "Yes — open a chapter and press “Download for offline”, or download a whole book. Manage downloads on the Offline page.",
        "Oui — ouvrez un chapitre et appuyez sur « Télécharger hors ligne », ou téléchargez un livre entier. Gérez-les sur la page Hors ligne.",
        "نعم — افتح أصحاحًا واضغط «نزّل للقراءة دون اتصال»، أو نزّل سفرًا كاملًا. أدِر التنزيلات من صفحة «دون اتصال».",
      ),
    ],
    [
      T("Is my journal private?", "Mon journal est-il privé ?", "هل دفتري خاص؟"),
      T(
        "Yes. Journal entries, notes, and saved guidance are visible only to your account, protected by database rules. Journal entries are never sent to AI.",
        "Oui. Le journal, les notes et les aides enregistrées ne sont visibles que par votre compte, protégés par des règles de base de données. Le journal n’est jamais envoyé à l’IA.",
        "نعم. المدخلات والملاحظات والإرشادات المحفوظة مرئية لحسابك فقط، ومحمية بقواعد قاعدة البيانات. ولا يُرسل الدفتر إلى الذكاء الاصطناعي أبدًا.",
      ),
    ],
    [
      T("How do I export or delete my data?", "Comment exporter ou supprimer mes données ?", "كيف أصدّر بياناتي أو أحذفها؟"),
      <>
        <Link href="/account">{T("Account settings", "Paramètres du compte", "إعدادات الحساب")}</Link>
        {T(": Export downloads a JSON file; deletion removes your account and everything you saved.", " : l’export télécharge un fichier JSON ; la suppression efface votre compte et tout ce que vous avez enregistré.", ": التصدير ينزّل ملف JSON؛ والحذف يزيل حسابك وكل ما حفظته.")}
      </>,
    ],
    [
      T("Reading settings", "Réglages de lecture", "إعدادات القراءة"),
      T(
        "Use the Aa button above any chapter to change theme, text size, line spacing, width, layout, and whether the deuterocanonical books are shown. Focus mode hides everything except the text.",
        "Le bouton Aa au-dessus de chaque chapitre change le thème, la taille, l’interligne, la largeur, la mise en page et l’affichage des livres deutérocanoniques. Le mode lecture masque tout sauf le texte.",
        "زر Aa فوق كل أصحاح يغيّر السمة وحجم النص وتباعد الأسطر والعرض والتخطيط وإظهار الأسفار القانونية الثانية. ووضع التركيز يُخفي كل شيء ما عدا النص.",
      ),
    ],
    [
      T("Keyboard shortcuts", "Raccourcis clavier", "اختصارات لوحة المفاتيح"),
      T(
        "In flashcards: Space shows the answer, 1–4 rate it. In focus mode: Escape exits. Everywhere: the first Tab offers “Skip to content”.",
        "Cartes : Espace affiche la réponse, 1–4 pour noter. Mode lecture : Échap pour sortir. Partout : la première tabulation propose « Aller au contenu ».",
        "في البطاقات: المسافة تُظهر الإجابة و1–4 للتقييم. في وضع التركيز: Escape للخروج. وفي كل مكان: أول Tab يقدّم «تخطَّ إلى المحتوى».",
      ),
    ],
  ];
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <h1>{T("Help", "Aide", "مساعدة")}</h1>
      {FAQ.map(([q, a]) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
    </article>
  );
}
