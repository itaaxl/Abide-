# Accessibility

## Measured contrast of design tokens (WCAG 2.1 ratio)

| Theme | Ink / paper | Muted / paper | Gold / paper | Focus ring / paper | Danger / surface | Success / surface | Ink on lowest-contrast highlight |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Light | 16.15 | 6.73 | 5.41 | 7.85 | 7.40 | 6.29 | 12.43 |
| Sepia | 11.62 | 6.54 | 5.87 | 6.78 | 7.46 | 6.45 | 8.83 |
| Dark | 14.81 | 7.99 | 9.37 | 9.03 | 8.09 | 9.15 | 6.76 |

All pairs meet WCAG AA for normal text (≥ 4.5:1). Computed from the hex values in `src/app/globals.css`; additionally checked with axe-core `color-contrast` on rendered pages in sepia and dark themes.

## What is implemented
- Skip link, landmark regions, one `h1` per page, labelled form controls, visible 3px focus rings, `aria-live` status messages for saves/copies.
- Reader: verse numbers are buttons (keyboard-selectable, `aria-pressed`), highlight colours have text labels, footnote markers are links, focus mode keeps an exit button focused.
- Flashcards: Space/Enter to flip, 1–4 to rate; flip animation disabled under `prefers-reduced-motion`.
- Touch targets ≥ 44px for primary buttons (36px for compact secondary buttons).
- Arabic: `dir="rtl"` on Arabic Scripture and on the whole document when the UI language is Arabic; Amiri font.
- Zoom: layout uses relative units and wraps; no horizontal overflow at phone, landscape, tablet and wide widths (checked).

## Automated checks (tests/e2e/smoke.mjs)
axe-core with WCAG 2.0/2.1 A and AA tags on 9 guest pages (home, reader, Arabic reader, search, daily, plans, watch, sign-up, guidance) and, in `tests/e2e/accounts.mjs`, 9 signed-in pages (library, notes, flashcards, flashcard review, journal, new entry, account, plan progress, guidance): no serious or critical violations. Colour contrast also checked in sepia and dark themes. See docs/TESTING.md.

## Not yet done
- Manual screen-reader testing (VoiceOver/NVDA/TalkBack) has not been performed.
- Admin pages were not axe-scanned.
