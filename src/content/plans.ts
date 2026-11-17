/**
 * Reading plans (seed content). Every day lists real passages in World
 * English Bible numbering; tests/content.test.ts validates each one against
 * the installed editions and reports books missing from an edition.
 */
export interface ReadingPlan {
  slug: string;
  title: string;
  summary: string;
  description: string;
  minutesPerDay: number;
  days: { refs: string[] }[];
  /** French and Arabic title/description (falls back to English). */
  i18n?: Partial<Record<"fr" | "ar", { title: string; description: string }>>;
}

export function planText(plan: ReadingPlan, locale: "en" | "fr" | "ar") {
  const t = locale === "en" ? undefined : plan.i18n?.[locale];
  return { title: t?.title ?? plan.title, description: t?.description ?? plan.description };
}

const chapters = (book: string, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ refs: [`${book}.${from + i}`] }));

export const PLANS: ReadingPlan[] = [
  {
    slug: "gospel-of-john",
    i18n: {
      fr: { title: "Rencontrer Jésus dans l’Évangile de Jean", description: "Jean a écrit son Évangile « afin que vous croyiez que Jésus est le Christ, le Fils de Dieu » (Jean 20:31). Lisez un chapitre par jour pour suivre les signes, les rencontres, la mort et la résurrection de Jésus. Un bon premier plan pour qui découvre la Bible." },
      ar: { title: "التعرّف على يسوع في إنجيل يوحنا", description: "كتب يوحنا إنجيله «لتؤمنوا أن يسوع هو المسيح ابن الله» (يوحنا 20:31). اقرأ أصحاحًا كل يوم لتتبّع آيات يسوع ولقاءاته وموته وقيامته. خطة أولى مناسبة لكل من يبدأ قراءة الكتاب المقدس." },
    },
    title: "Meet Jesus in the Gospel of John",
    summary: "21 days · one chapter a day",
    description:
      "John wrote his Gospel ‘that you may believe that Jesus is the Christ, the Son of God’ (John 20:31). Read one chapter a day to walk through Jesus’ signs, conversations, death, and resurrection. A good first plan for anyone new to the Bible.",
    minutesPerDay: 6,
    days: chapters("JHN", 1, 21),
  },
  {
    slug: "psalms-for-prayer",
    i18n: {
      fr: { title: "Les Psaumes pour prier", description: "Les Psaumes sont le livre de prière de la Bible : louange, lamentation, confiance et questions honnêtes. Lisez un psaume par jour et laissez ses mots ouvrir votre propre prière." },
      ar: { title: "المزامير للصلاة", description: "المزامير كتاب صلاة الكتاب المقدس: تسبيح ورثاء وثقة وأسئلة صادقة. اقرأ مزمورًا كل يوم ودع كلماته تكون بداية لصلاتك." },
    },
    title: "Psalms for Prayer",
    summary: "30 days · one psalm a day",
    description:
      "The Psalms are the prayer book of the Bible, full of praise, lament, trust, and honest questions. Read one psalm a day and use its words as a starting point for your own prayer.",
    minutesPerDay: 4,
    days: [1, 4, 8, 13, 16, 19, 23, 25, 27, 30, 32, 34, 40, 42, 46, 51, 62, 63, 84, 90, 91, 100, 103, 116, 121, 130, 139, 145, 146, 150].map(
      (n) => ({ refs: [`PSA.${n}`] }),
    ),
  },
  {
    slug: "new-testament-start",
    i18n: {
      fr: { title: "Commencer le Nouveau Testament", description: "Commencez par l’Évangile de Marc, vif et direct, voyez naître l’Église dans les Actes, puis lisez des chapitres clés des lettres sur la grâce, l’amour et l’espérance." },
      ar: { title: "البداية مع العهد الجديد", description: "ابدأ بإنجيل مرقس السريع، وشاهد بداية الكنيسة في سفر الأعمال، ثم اقرأ أصحاحات أساسية من الرسائل عن النعمة والمحبة والرجاء." },
    },
    title: "Starting the New Testament",
    summary: "30 days · about one chapter a day",
    description:
      "Begin with the fast-moving Gospel of Mark, see the early church begin in Acts, then read key chapters from the letters about grace, love, and hope.",
    minutesPerDay: 7,
    days: [
      ...chapters("MRK", 1, 16),
      { refs: ["ACT.1"] },
      { refs: ["ACT.2"] },
      { refs: ["ROM.5"] },
      { refs: ["ROM.8"] },
      { refs: ["ROM.12"] },
      { refs: ["1CO.13"] },
      { refs: ["1CO.15"] },
      { refs: ["GAL.5"] },
      { refs: ["EPH.2"] },
      { refs: ["PHP.2"] },
      { refs: ["PHP.4"] },
      { refs: ["JAS.1"] },
      { refs: ["1JN.4"] },
      { refs: ["REV.21"] },
    ],
  },
  {
    slug: "sermon-on-the-mount",
    i18n: {
      fr: { title: "Le Sermon sur la montagne", description: "Lisez lentement, sur une semaine, l’enseignement le plus connu de Jésus, quelques paragraphes à la fois." },
      ar: { title: "الموعظة على الجبل", description: "اقرأ أشهر تعاليم يسوع ببطء على مدى أسبوع، فقرات قليلة كل يوم." },
    },
    title: "The Sermon on the Mount",
    summary: "7 days · short daily readings",
    description: "Read Jesus’ best-known teaching slowly over one week, a few paragraphs at a time.",
    minutesPerDay: 4,
    days: [
      { refs: ["MAT.5.1-16"] },
      { refs: ["MAT.5.17-48"] },
      { refs: ["MAT.6.1-18"] },
      { refs: ["MAT.6.19-34"] },
      { refs: ["MAT.7.1-14"] },
      { refs: ["MAT.7.15-29"] },
      { refs: ["LUK.6.27-49"] },
    ],
  },
  {
    slug: "proverbs-in-a-month",
    title: "Proverbs in a Month",
    summary: "31 days · one chapter a day",
    description: "Proverbs has 31 chapters — one for each day of a month. Short, practical wisdom about words, work, friendship, money, and the fear of the Lord.",
    minutesPerDay: 5,
    days: chapters("PRO", 1, 31),
    i18n: {
      fr: { title: "Les Proverbes en un mois", description: "Les Proverbes comptent 31 chapitres — un par jour du mois. Une sagesse courte et pratique sur les paroles, le travail, l’amitié, l’argent et la crainte de l’Éternel." },
      ar: { title: "سفر الأمثال في شهر", description: "في سفر الأمثال 31 أصحاحًا — واحد لكل يوم من الشهر. حكمة قصيرة وعملية عن الكلام والعمل والصداقة والمال ومخافة الرب." },
    },
  },
  {
    slug: "romans",
    title: "Romans: The Gospel Explained",
    summary: "16 days · one chapter a day",
    description: "Paul’s letter to the Romans explains the good news step by step: sin and grace, faith and new life, hope in suffering, and love in community.",
    minutesPerDay: 8,
    days: chapters("ROM", 1, 16),
    i18n: {
      fr: { title: "Romains : l’Évangile expliqué", description: "La lettre de Paul aux Romains explique la bonne nouvelle pas à pas : péché et grâce, foi et vie nouvelle, espérance dans l’épreuve, amour en communauté." },
      ar: { title: "رومية: الإنجيل مشروحًا", description: "رسالة بولس إلى أهل رومية تشرح البشارة خطوة خطوة: الخطية والنعمة، الإيمان والحياة الجديدة، الرجاء في الضيق، والمحبة في الجماعة." },
    },
  },
  {
    slug: "new-to-faith",
    title: "New to Faith: 7 Days",
    summary: "7 days · one chapter a day",
    description: "Seven short chapters for anyone exploring Christianity: God’s love, the welcome of the Father, grace, prayer, the Good Shepherd, and new life.",
    minutesPerDay: 5,
    days: [{ refs: ["JHN.3"] }, { refs: ["LUK.15"] }, { refs: ["ROM.5"] }, { refs: ["EPH.2"] }, { refs: ["MAT.6"] }, { refs: ["PSA.23"] }, { refs: ["1JN.4"] }],
    i18n: {
      fr: { title: "Découvrir la foi : 7 jours", description: "Sept chapitres courts pour qui découvre le christianisme : l’amour de Dieu, l’accueil du Père, la grâce, la prière, le bon berger et la vie nouvelle." },
      ar: { title: "بداية الإيمان: 7 أيام", description: "سبعة أصحاحات قصيرة لكل من يستكشف المسيحية: محبة الله، استقبال الآب، النعمة، الصلاة، الراعي الصالح، والحياة الجديدة." },
    },
  },
  {
    slug: "advent",
    title: "Advent: Waiting for Christ",
    summary: "24 days · from promise to birth",
    description: "From the prophets’ promises to the birth in Bethlehem: a reading for each day of December before Christmas.",
    minutesPerDay: 5,
    days: ["ISA.40", "ISA.11", "ISA.35", "ISA.42", "ISA.52", "ISA.53", "ISA.55", "ISA.60", "ISA.61", "JER.23", "JER.31", "ZEP.3", "PSA.96", "PSA.98", "LUK.1.1-38", "LUK.1.39-80", "MAT.1", "LUK.2.1-20", "LUK.2.21-40", "MAT.2", "JHN.1.1-18", "GAL.4.1-7", "TIT.2.11-14", "1JN.1"].map((r) => ({ refs: [r] })),
    i18n: {
      fr: { title: "L’Avent : attendre le Christ", description: "Des promesses des prophètes à la naissance à Bethléhem : une lecture pour chaque jour de décembre avant Noël." },
      ar: { title: "زمن المجيء: انتظار المسيح", description: "من وعود الأنبياء إلى الميلاد في بيت لحم: قراءة لكل يوم من كانون الأول/ديسمبر قبل عيد الميلاد." },
    },
  },
  {
    slug: "holy-week",
    title: "Holy Week",
    summary: "8 days · Palm Sunday to Easter",
    description: "Walk with Jesus through his last week: the entry into Jerusalem, the Last Supper, the cross, and the empty tomb.",
    minutesPerDay: 6,
    days: ["MAT.21.1-17", "MRK.11.12-33", "MAT.26.1-16", "JHN.13", "JHN.17", "LUK.22.39-71", "JHN.19", "JHN.20"].map((r) => ({ refs: [r] })),
    i18n: {
      fr: { title: "La Semaine sainte", description: "Marchez avec Jésus pendant sa dernière semaine : l’entrée à Jérusalem, le dernier repas, la croix et le tombeau vide." },
      ar: { title: "أسبوع الآلام", description: "سِر مع يسوع في أسبوعه الأخير: الدخول إلى أورشليم، العشاء الأخير، الصليب، والقبر الفارغ." },
    },
  },
];
