/**
 * Canon metadata keyed by standard USFM/Paratext book codes.
 *
 * Book identity is edition-independent (JHN is always John), but whether a
 * book exists, where it sits, and how it is numbered is edition-specific and
 * comes from each edition's imported `edition.json`. Nothing here assumes
 * that every edition has the same books, chapters, or verse numbering.
 */

export type Collection = "ot" | "deuterocanon" | "nt";

export const COLLECTION_LABELS: Record<Collection, { en: string; fr: string; ar: string }> = {
  ot: { en: "Old Testament", fr: "Ancien Testament", ar: "العهد القديم" },
  deuterocanon: {
    en: "Deuterocanonical books / Apocrypha",
    fr: "Livres deutérocanoniques / Apocryphes",
    ar: "الأسفار القانونية الثانية",
  },
  nt: { en: "New Testament", fr: "Nouveau Testament", ar: "العهد الجديد" },
};

export const OT_CODES = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI",
  "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER",
  "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP",
  "HAG", "ZEC", "MAL",
] as const;

export const NT_CODES = [
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL",
  "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN",
  "3JN", "JUD", "REV",
] as const;

export function collectionFor(code: string): Collection {
  if ((OT_CODES as readonly string[]).includes(code)) return "ot";
  if ((NT_CODES as readonly string[]).includes(code)) return "nt";
  return "deuterocanon";
}

/** English names and common abbreviations. The first entry is the display name. */
export const ENGLISH_BOOKS: Record<string, string[]> = {
  GEN: ["Genesis", "gen", "ge", "gn"],
  EXO: ["Exodus", "exod", "exo", "ex"],
  LEV: ["Leviticus", "lev", "le", "lv"],
  NUM: ["Numbers", "num", "nu", "nm", "nb"],
  DEU: ["Deuteronomy", "deut", "deu", "dt"],
  JOS: ["Joshua", "josh", "jos", "jsh"],
  JDG: ["Judges", "judg", "jdg", "jg", "jdgs"],
  RUT: ["Ruth", "rth", "ru"],
  "1SA": ["1 Samuel", "1 sam", "1 sa", "1sm", "i samuel", "first samuel"],
  "2SA": ["2 Samuel", "2 sam", "2 sa", "2sm", "ii samuel", "second samuel"],
  "1KI": ["1 Kings", "1 kgs", "1 ki", "1kg", "i kings", "first kings"],
  "2KI": ["2 Kings", "2 kgs", "2 ki", "2kg", "ii kings", "second kings"],
  "1CH": ["1 Chronicles", "1 chron", "1 chr", "1 ch", "i chronicles", "first chronicles"],
  "2CH": ["2 Chronicles", "2 chron", "2 chr", "2 ch", "ii chronicles", "second chronicles"],
  EZR: ["Ezra", "ezr"],
  NEH: ["Nehemiah", "neh", "ne"],
  EST: ["Esther", "esth", "est", "es"],
  JOB: ["Job", "jb"],
  PSA: ["Psalms", "psalm", "ps", "psa", "pss", "psalter"],
  PRO: ["Proverbs", "prov", "pro", "prv", "pr"],
  ECC: ["Ecclesiastes", "eccles", "eccl", "ecc", "ec", "qoheleth"],
  SNG: ["Song of Solomon", "song of songs", "song", "songs", "sos", "canticles", "sg"],
  ISA: ["Isaiah", "isa", "is"],
  JER: ["Jeremiah", "jer", "je", "jr"],
  LAM: ["Lamentations", "lam", "la"],
  EZK: ["Ezekiel", "ezek", "eze", "ezk"],
  DAN: ["Daniel", "dan", "da", "dn"],
  HOS: ["Hosea", "hos", "ho"],
  JOL: ["Joel", "jl"],
  AMO: ["Amos", "am"],
  OBA: ["Obadiah", "obad", "ob"],
  JON: ["Jonah", "jnh", "jon"],
  MIC: ["Micah", "mic", "mc"],
  NAM: ["Nahum", "nah", "na"],
  HAB: ["Habakkuk", "hab", "hb"],
  ZEP: ["Zephaniah", "zeph", "zep", "zp"],
  HAG: ["Haggai", "hag", "hg"],
  ZEC: ["Zechariah", "zech", "zec", "zc"],
  MAL: ["Malachi", "mal", "ml"],
  TOB: ["Tobit", "tob", "tb"],
  JDT: ["Judith", "jdt", "jdth"],
  ESG: ["Esther (Greek)", "greek esther", "esther greek", "esg", "add esth"],
  WIS: ["Wisdom of Solomon", "wisdom", "wis", "ws"],
  SIR: ["Sirach", "ecclesiasticus", "sir", "ben sira"],
  BAR: ["Baruch", "bar"],
  "1MA": ["1 Maccabees", "1 macc", "1 mac", "1 ma", "i maccabees", "first maccabees"],
  "2MA": ["2 Maccabees", "2 macc", "2 mac", "2 ma", "ii maccabees", "second maccabees"],
  "3MA": ["3 Maccabees", "3 macc", "3 mac", "3 ma", "iii maccabees", "third maccabees"],
  "4MA": ["4 Maccabees", "4 macc", "4 mac", "4 ma", "iv maccabees", "fourth maccabees"],
  "1ES": ["1 Esdras", "1 esd", "1 es", "i esdras", "first esdras"],
  "2ES": ["2 Esdras", "2 esd", "2 es", "ii esdras", "second esdras"],
  MAN: ["Prayer of Manasseh", "prayer of manasses", "pr man", "man"],
  PS2: ["Psalm 151", "ps 151", "psalm151", "ps151"],
  DAG: ["Daniel (Greek)", "greek daniel", "daniel greek", "dag"],
  MAT: ["Matthew", "matt", "mat", "mt"],
  MRK: ["Mark", "mrk", "mar", "mk", "mr"],
  LUK: ["Luke", "luk", "lk", "lu"],
  JHN: ["John", "jhn", "joh", "jn"],
  ACT: ["Acts", "act", "ac", "acts of the apostles"],
  ROM: ["Romans", "rom", "ro", "rm"],
  "1CO": ["1 Corinthians", "1 cor", "1 co", "i corinthians", "first corinthians"],
  "2CO": ["2 Corinthians", "2 cor", "2 co", "ii corinthians", "second corinthians"],
  GAL: ["Galatians", "gal", "ga"],
  EPH: ["Ephesians", "eph", "ephes"],
  PHP: ["Philippians", "phil", "php", "pp"],
  COL: ["Colossians", "col", "co"],
  "1TH": ["1 Thessalonians", "1 thess", "1 thes", "1 th", "i thessalonians", "first thessalonians"],
  "2TH": ["2 Thessalonians", "2 thess", "2 thes", "2 th", "ii thessalonians", "second thessalonians"],
  "1TI": ["1 Timothy", "1 tim", "1 ti", "i timothy", "first timothy"],
  "2TI": ["2 Timothy", "2 tim", "2 ti", "ii timothy", "second timothy"],
  TIT: ["Titus", "tit", "ti"],
  PHM: ["Philemon", "philem", "phm", "pm"],
  HEB: ["Hebrews", "heb"],
  JAS: ["James", "jas", "jm"],
  "1PE": ["1 Peter", "1 pet", "1 pe", "1 pt", "i peter", "first peter"],
  "2PE": ["2 Peter", "2 pet", "2 pe", "2 pt", "ii peter", "second peter"],
  "1JN": ["1 John", "1 jn", "1 jhn", "1 joh", "i john", "first john"],
  "2JN": ["2 John", "2 jn", "2 jhn", "2 joh", "ii john", "second john"],
  "3JN": ["3 John", "3 jn", "3 jhn", "3 joh", "iii john", "third john"],
  JUD: ["Jude", "jud", "jd"],
  REV: ["Revelation", "rev", "re", "revelations", "apocalypse", "rv"],
};

/** Additional French aliases (accent-insensitive after normalization). */
export const FRENCH_ALIASES: Record<string, string[]> = {
  GEN: ["genese", "gn"], EXO: ["exode", "ex"], LEV: ["levitique", "lv"], NUM: ["nombres", "nb"],
  DEU: ["deuteronome", "dt"], JOS: ["josue"], JDG: ["juges", "jg"], RUT: ["ruth", "rt"],
  "1SA": ["1 samuel", "1 s"], "2SA": ["2 samuel", "2 s"], "1KI": ["1 rois", "1 r"], "2KI": ["2 rois", "2 r"],
  "1CH": ["1 chroniques"], "2CH": ["2 chroniques"], EZR: ["esdras", "esd"], NEH: ["nehemie", "ne"],
  EST: ["esther"], JOB: ["job"], PSA: ["psaumes", "psaume", "ps"], PRO: ["proverbes", "pr"],
  ECC: ["ecclesiaste", "qohelet", "ec"], SNG: ["cantique des cantiques", "cantique", "ct"],
  ISA: ["esaie", "isaie", "es"], JER: ["jeremie", "jr"], LAM: ["lamentations", "lm"],
  EZK: ["ezechiel", "ez"], DAN: ["daniel", "dn"], HOS: ["osee", "os"], JOL: ["joel", "jl"],
  AMO: ["amos", "am"], OBA: ["abdias", "ab"], JON: ["jonas", "jon"], MIC: ["michee", "mi"],
  NAM: ["nahum", "na"], HAB: ["habacuc", "ha"], ZEP: ["sophonie", "so"], HAG: ["aggee", "ag"],
  ZEC: ["zacharie", "za"], MAL: ["malachie", "ml"], MAT: ["matthieu", "mt"], MRK: ["marc", "mc"],
  LUK: ["luc", "lc"], JHN: ["jean", "jn"], ACT: ["actes", "ac"], ROM: ["romains", "rm"],
  "1CO": ["1 corinthiens"], "2CO": ["2 corinthiens"], GAL: ["galates", "ga"], EPH: ["ephesiens", "ep"],
  PHP: ["philippiens", "ph"], COL: ["colossiens", "col"], "1TH": ["1 thessaloniciens"],
  "2TH": ["2 thessaloniciens"], "1TI": ["1 timothee"], "2TI": ["2 timothee"], TIT: ["tite", "tt"],
  PHM: ["philemon", "phm"], HEB: ["hebreux", "he"], JAS: ["jacques", "jc"], "1PE": ["1 pierre"],
  "2PE": ["2 pierre"], "1JN": ["1 jean"], "2JN": ["2 jean"], "3JN": ["3 jean"], JUD: ["jude"],
  REV: ["apocalypse", "ap"],
};

/** Conventional short Arabic book names (navigation labels and aliases). */
export const ARABIC_BOOKS: Record<string, string[]> = {
  GEN: ["التكوين", "تك"], EXO: ["الخروج", "خر"], LEV: ["اللاويين", "لا"], NUM: ["العدد", "عد"],
  DEU: ["التثنية", "تث"], JOS: ["يشوع", "يش"], JDG: ["القضاة", "قض"], RUT: ["راعوث", "را"],
  "1SA": ["صموئيل الأول", "1 صموئيل", "1صم"], "2SA": ["صموئيل الثاني", "2 صموئيل", "2صم"],
  "1KI": ["الملوك الأول", "1 ملوك", "1مل"], "2KI": ["الملوك الثاني", "2 ملوك", "2مل"],
  "1CH": ["أخبار الأيام الأول", "1 أخبار", "1أخ"], "2CH": ["أخبار الأيام الثاني", "2 أخبار", "2أخ"],
  EZR: ["عزرا", "عز"], NEH: ["نحميا", "نح"], EST: ["أستير", "اس"], JOB: ["أيوب", "اي"],
  PSA: ["المزامير", "مزمور", "مز"], PRO: ["الأمثال", "أمثال", "ام"], ECC: ["الجامعة", "جا"],
  SNG: ["نشيد الأنشاد", "نش"], ISA: ["إشعياء", "اش"], JER: ["إرميا", "ار"], LAM: ["مراثي إرميا", "مراثي", "مرا"],
  EZK: ["حزقيال", "حز"], DAN: ["دانيال", "دا"], HOS: ["هوشع", "هو"], JOL: ["يوئيل", "يؤ"],
  AMO: ["عاموس", "عا"], OBA: ["عوبديا", "عو"], JON: ["يونان", "يون"], MIC: ["ميخا", "مي"],
  NAM: ["ناحوم", "نا"], HAB: ["حبقوق", "حب"], ZEP: ["صفنيا", "صف"], HAG: ["حجي", "حج"],
  ZEC: ["زكريا", "زك"], MAL: ["ملاخي", "ملا"], MAT: ["متى", "مت"], MRK: ["مرقس", "مر"],
  LUK: ["لوقا", "لو"], JHN: ["يوحنا", "يو"], ACT: ["أعمال الرسل", "أعمال", "اع"], ROM: ["رومية", "رو"],
  "1CO": ["1 كورنثوس", "كورنثوس الأولى", "1كو"], "2CO": ["2 كورنثوس", "كورنثوس الثانية", "2كو"],
  GAL: ["غلاطية", "غل"], EPH: ["أفسس", "اف"], PHP: ["فيلبي", "في"], COL: ["كولوسي", "كو"],
  "1TH": ["1 تسالونيكي", "1تس"], "2TH": ["2 تسالونيكي", "2تس"], "1TI": ["1 تيموثاوس", "1تي"],
  "2TI": ["2 تيموثاوس", "2تي"], TIT: ["تيطس", "تي"], PHM: ["فليمون", "فل"], HEB: ["العبرانيين", "عب"],
  JAS: ["يعقوب", "يع"], "1PE": ["1 بطرس", "1بط"], "2PE": ["2 بطرس", "2بط"], "1JN": ["1 يوحنا", "1يو"],
  "2JN": ["2 يوحنا", "2يو"], "3JN": ["3 يوحنا", "3يو"], JUD: ["يهوذا", "يه"], REV: ["رؤيا يوحنا", "رؤيا", "رؤ"],
};
