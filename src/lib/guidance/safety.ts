/**
 * Detects explicit statements of immediate danger or intent to self-harm.
 * When matched, the guidance flow does NOT call the AI model and does not
 * return verses; it shows a short, compassionate message encouraging
 * immediate human help. Deliberately conservative (explicit phrases only);
 * it is a safety net, not a diagnosis.
 */
const PATTERNS: RegExp[] = [
  /\b(kill|hurt|harm|cut)\s+my\s*self\b/i,
  /\bkill\s+myself\b/i,
  /\b(end|take)\s+my\s+(own\s+)?life\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want|going|plan(ning)?)\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive)\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\boverdose\b/i,
  /\bkill\s+(him|her|them|someone|somebody|my\s+(husband|wife|child|son|daughter|mother|father|parents|family|boss))\b/i,
  /\b(want|going|plan(ning)?)\s+to\s+hurt\s+(him|her|them|someone|somebody|people)\b/i,
  /\b(in\s+danger|not\s+safe)\s+(right\s+)?now\b/i,
  /\bme\s+(suicider|tuer)\b/i,
  /\ben\s+finir\s+avec\s+la\s+vie\b/i,
  /\bmettre\s+fin\s+à\s+(mes\s+jours|ma\s+vie)\b/i,
  /انتحار|أنتحر|اقتل\s*نفسي|أقتل\s*نفسي|أنهي\s*حياتي|انهي\s*حياتي/,
];

export function detectCrisis(text: string): boolean {
  return PATTERNS.some((p) => p.test(text));
}

const CRISIS = {
  en: [
    "You deserve support right now",
    "Thank you for telling us. What you’re carrying sounds very heavy, and you don’t have to face it alone.",
    "If you might act on thoughts of harming yourself or someone else, or you are in danger, please contact your local emergency number now, or go to the nearest emergency department.",
    "If you can, reach out to someone you trust — a friend, family member, pastor, or doctor — and let them know how you’re feeling today.",
    "A crisis line can also help. You can find one for your country at findahelpline.com, an international directory of helplines.",
  ],
  fr: [
    "Vous méritez du soutien dès maintenant",
    "Merci de nous l’avoir dit. Ce que vous portez semble très lourd, et vous n’avez pas à l’affronter seul.",
    "Si vous risquez de passer à l’acte contre vous-même ou quelqu’un d’autre, ou si vous êtes en danger, appelez dès maintenant le numéro d’urgence local ou rendez-vous aux urgences les plus proches.",
    "Si vous le pouvez, contactez une personne de confiance — un ami, un proche, un pasteur ou un médecin — et dites-lui comment vous vous sentez aujourd’hui.",
    "Une ligne d’écoute peut aussi aider. Vous en trouverez une pour votre pays sur findahelpline.com, un annuaire international.",
  ],
  ar: [
    "أنت تستحق الدعم الآن",
    "شكرًا لأنك أخبرتنا. ما تحمله يبدو ثقيلًا جدًا، ولست مضطرًا لمواجهته وحدك.",
    "إن كنت قد تؤذي نفسك أو غيرك، أو كنت في خطر، فاتصل الآن برقم الطوارئ المحلي أو توجّه إلى أقرب قسم طوارئ.",
    "إن استطعت، تواصل مع شخص تثق به — صديق أو أحد أفراد العائلة أو راعٍ أو طبيب — وأخبره بما تشعر به اليوم.",
    "يمكن لخط المساعدة أن يساعد أيضًا. تجد خطًا لبلدك على findahelpline.com، وهو دليل دولي لخطوط المساعدة.",
  ],
} as const;

/** Crisis response in the interface language (title first, then paragraphs). */
export function crisisResponse(locale: "en" | "fr" | "ar" = "en"): string {
  return CRISIS[locale].join("\n\n");
}

export const CRISIS_RESPONSE = { title: CRISIS.en[0], body: CRISIS.en.slice(1) };
