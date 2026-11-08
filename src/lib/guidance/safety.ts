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

export const CRISIS_RESPONSE = {
  title: "You deserve support right now",
  body: [
    "Thank you for telling us. What you’re carrying sounds very heavy, and you don’t have to face it alone.",
    "If you might act on thoughts of harming yourself or someone else, or you are in danger, please contact your local emergency number now, or go to the nearest emergency department.",
    "If you can, reach out to someone you trust — a friend, family member, pastor, or doctor — and let them know how you’re feeling today.",
    "A crisis line can also help. You can find one for your country at findahelpline.com, an international directory of helplines.",
  ],
  link: { href: "https://findahelpline.com/", label: "Find a helpline (findahelpline.com)" },
};
