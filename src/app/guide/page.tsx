import type { Metadata } from "next";
import Link from "next/link";
import { getPrefs, getT } from "@/lib/request";

export const metadata: Metadata = { title: "Beginner’s guide to the Bible" };

export default async function GuidePage() {
  const [{ T }, prefs] = await Promise.all([getT(), getPrefs()]);
  const ed = prefs.edition;
  return (
    <article className="prose-page mx-auto max-w-2xl px-4 py-12">
      <p className="eyebrow">{T("Editorial guide — not Scripture", "Guide éditorial — pas l’Écriture", "دليل تحريري — ليس من الكتاب المقدس")}</p>
      <h1>{T("A beginner’s guide to reading the Bible", "Guide pour commencer à lire la Bible", "دليل المبتدئين لقراءة الكتاب المقدس")}</h1>
      <h2>{T("A library, not a single book", "Une bibliothèque, pas un seul livre", "مكتبة لا كتاب واحد")}</h2>
      <p>
        {T(
          "The Bible is a collection of writings composed over many centuries. Protestant Bibles contain 66 books: 39 in the Old Testament and 27 in the New Testament. Catholic and Orthodox Bibles also include additional books, often called deuterocanonical books or the Apocrypha. The World English Bible on this site includes those additional books in a separate, clearly labelled section, which you can hide in the reader settings.",
          "La Bible est un ensemble d’écrits composés sur de nombreux siècles. Les Bibles protestantes contiennent 66 livres : 39 dans l’Ancien Testament et 27 dans le Nouveau. Les Bibles catholiques et orthodoxes comprennent aussi d’autres livres, dits deutérocanoniques (ou apocryphes). La World English Bible de ce site les place dans une section séparée et clairement indiquée, que vous pouvez masquer dans les réglages de lecture.",
          "الكتاب المقدس مجموعة كتابات دُوّنت عبر قرون كثيرة. تضم الأناجيل البروتستانتية 66 سفرًا: 39 في العهد القديم و27 في العهد الجديد. وتضم الكتب الكاثوليكية والأرثوذكسية أسفارًا إضافية تُسمّى القانونية الثانية (أو الأبوكريفا). تضع الترجمة الإنجليزية العالمية في هذا الموقع هذه الأسفار في قسم منفصل وواضح، ويمكنك إخفاؤه من إعدادات القراءة.",
        )}
      </p>
      <h2>{T("Books, chapters, and verses", "Livres, chapitres et versets", "الأسفار والأصحاحات والآيات")}</h2>
      <p>
        {T(
          "Each book is divided into chapters, and each chapter into numbered verses. A reference like John 3:16 means the book of John, chapter 3, verse 16. A range like John 3:16–18 means verses 16 through 18. Chapter and verse numbers were added long after the books were written, to help readers find their place.",
          "Chaque livre est divisé en chapitres, et chaque chapitre en versets numérotés. Une référence comme Jean 3:16 signifie le livre de Jean, chapitre 3, verset 16. Jean 3:16-18 signifie les versets 16 à 18. Ces numéros ont été ajoutés bien après la rédaction, pour aider à se repérer.",
          "كل سفر مقسّم إلى أصحاحات، وكل أصحاح إلى آيات مرقّمة. المرجع يوحنا 3:16 يعني سفر يوحنا، الأصحاح 3، الآية 16. ويوحنا 3:16-18 يعني الآيات من 16 إلى 18. أُضيفت هذه الأرقام بعد كتابة الأسفار بزمن طويل لتسهيل العثور على المواضع.",
        )}
      </p>
      <h2>{T("Translations", "Traductions", "الترجمات")}</h2>
      <p>
        {T(
          "The Bible was written mainly in Hebrew, Aramaic, and Greek. A translation renders it into another language. Translations differ in wording and sometimes in numbering, so it helps to know which one you are reading. For example, the World English Bible writes God’s name as “Yahweh” where many English Bibles write “the LORD”. See ",
          "La Bible a été écrite surtout en hébreu, en araméen et en grec. Une traduction la rend dans une autre langue. Les traductions diffèrent par leurs mots et parfois leur numérotation ; il est utile de savoir laquelle on lit. Voir ",
          "كُتب الكتاب المقدس أساسًا بالعبرية والآرامية واليونانية. والترجمة تنقله إلى لغة أخرى. تختلف الترجمات في الألفاظ وأحيانًا في الترقيم، فمن المفيد معرفة الترجمة التي تقرؤها. انظر ",
        )}
        <Link href="/editions">{T("Bible editions", "Éditions de la Bible", "طبعات الكتاب المقدس")}</Link>.
      </p>
      <h2>{T("Where to start", "Par où commencer", "من أين تبدأ")}</h2>
      <ul>
        <li>
          <Link href={`/bible/${ed}/JHN/1`}>{T("The Gospel of John", "L’Évangile de Jean", "إنجيل يوحنا")}</Link> —{" "}
          {T("the life, teaching, death, and resurrection of Jesus.", "la vie, l’enseignement, la mort et la résurrection de Jésus.", "حياة يسوع وتعليمه وموته وقيامته.")}
        </li>
        <li>
          <Link href={`/bible/${ed}/MRK/1`}>{T("The Gospel of Mark", "L’Évangile de Marc", "إنجيل مرقس")}</Link> —{" "}
          {T("the shortest Gospel, fast-moving and direct.", "le plus court des Évangiles, vif et direct.", "أقصر الأناجيل، سريع ومباشر.")}
        </li>
        <li>
          <Link href={`/bible/${ed}/PSA/23`}>{T("Psalms", "Les Psaumes", "المزامير")}</Link> —{" "}
          {T("prayers and songs for every season of life.", "prières et chants pour chaque saison de la vie.", "صلوات وتسابيح لكل مواسم الحياة.")}
        </li>
        <li>
          <Link href={`/bible/${ed}/GEN/1`}>{T("Genesis", "La Genèse", "سفر التكوين")}</Link> —{" "}
          {T("beginnings: creation, Abraham, and his family.", "les commencements : la création, Abraham et sa famille.", "البدايات: الخلق وإبراهيم وعائلته.")}
        </li>
      </ul>
      <h2>{T("How to read", "Comment lire", "كيف تقرأ")}</h2>
      <p>
        {T(
          "Read a little at a time. Read whole chapters rather than single verses, so you see the context. Notice who is speaking and to whom. Ask questions; many Christians read alongside a church community, and traditions sometimes understand passages differently. A ",
          "Lisez un peu à la fois. Lisez des chapitres entiers plutôt que des versets isolés, pour voir le contexte. Remarquez qui parle et à qui. Posez des questions ; beaucoup de chrétiens lisent avec une communauté d’Église, et les traditions comprennent parfois les passages différemment. Un ",
          "اقرأ قليلًا في كل مرة. اقرأ أصحاحات كاملة لا آيات منفردة، لترى السياق. لاحظ من يتكلم وإلى من. اطرح الأسئلة؛ كثير من المسيحيين يقرؤون مع جماعة كنسية، وقد تفهم التقاليد المختلفة بعض المقاطع بطرق مختلفة. ",
        )}
        <Link href="/plans">{T("reading plan", "plan de lecture", "خطة القراءة")}</Link>
        {T(" can help you keep going.", " peut vous aider à persévérer.", " تساعدك على المواظبة.")}
      </p>
    </article>
  );
}
