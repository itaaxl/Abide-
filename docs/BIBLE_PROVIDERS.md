# Bible data and providers

## Installed editions

| Id | Edition | Language | Books | Source | Rights |
| --- | --- | --- | --- | --- | --- |
| `eng-web` | World English Bible (Classic, ecumenical) | English | 81 (39 OT + 15 deuterocanon + 27 NT) | https://ebible.org/web/ | Public domain; “World English Bible” is a trademark of eBible.org, usable for unaltered text |
| `fra-lsg` | Louis Segond 1910 | French | 66 | https://ebible.org/fraLSG/ | Public domain |
| `arb-vd` | Smith & Van Dyck | Arabic | 66 | https://ebible.org/arb-vd/ | Public domain (eBible.org; contributor American Bible Society) |

Not installed: KJV (Crown letters patent restrict printing in the UK), Biblica’s Arabic NAV (CC BY-SA with trademark terms), and modern copyrighted translations.

Excluded from the imported files to avoid rights ambiguity: LSG’s 2011 editorial introductions, section headings and cross-references; Van Dyck section headings. WEB footnotes and cross-references are part of the public-domain WEB and are kept. Song of Songs speaker labels in WEB are kept as labelled, non-Scripture segments.

## Import and validation

`npm run bible:import` downloads the USFM and VPL archives (cached in `.cache/sources`), records their SHA-256, parses USFM into per-chapter JSON and compares **every verse** with the publisher’s VPL plain text. Reports: `data/bibles/<id>/validation.json` and [`docs/validation/`](validation). All three editions currently pass with 100% exact matches, no missing or duplicate verses, and no ordering problems. Edition-specific numbering is kept as published (e.g. LSG counts longer Psalm titles as their own verse, shifting numbering; WEB marks some Sirach verses as omitted with a note).

Text is never rewritten: only USFM markup and Strong’s tags are removed and footnotes are separated.

## Adding a licensed provider (e.g. API.Bible)

1. **Agreement first.** Read the provider’s licensing terms (API.Bible: https://care.api.bible/article/369-understanding-api-bible-licensing and the policies quick reference). Many translations restrict: number of verses displayed per page, offline caching duration, required copyright/attribution text and placement, usage reporting (e.g. FUMS tracking), commercial use, and **use with AI/LLMs**. Record these per edition.
2. Implement `BibleProvider` (`src/lib/bible/provider.ts`) — e.g. `ApiBibleProvider` with `getEdition()`, `getChapter()`, `getCorpus()`; `getCorpus()` may be unsupported if bulk search is not allowed, in which case search must call the provider’s search API instead.
3. Register it in `getProvider()` keyed by a stable edition id, with an `EditionMeta.license` that sets `aiProcessingAllowed` and `redistributionAllowed` truthfully. Guidance automatically falls back to curated passages when `aiProcessingAllowed` is false.
4. Respect caching rules: if the licence limits caching, do not store the text in `data/bibles` or the database; cache only as permitted.
5. Add the required attribution to `license.attribution` (shown on copy/share and below every chapter) and report usage as the licence requires.
6. Map its book ids to USFM codes and keep its own verse counts; do not assume WEB numbering.
