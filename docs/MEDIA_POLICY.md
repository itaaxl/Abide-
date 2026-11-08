# Media policy (Watch page)

- Copyrighted films and episodes are **linked** to their official viewing destination. Nothing is hosted, downloaded, scraped, proxied or re-streamed, and no paywall or DRM is bypassed. Free viewing does not imply permission to redistribute.
- An in-site player is used only when the publisher explicitly authorizes embedding for this use and it is recorded with `access: "authorized-embed"` and an `embedUrl` on an allow-listed domain (the CSP allows only `youtube-nocookie.com` frames). No entry uses an embed at launch.
- Each entry records: title, type, original description, official provider, access type, dramatization flag, and the date the link was last checked.
- No third-party artwork is used; cards are text-only.
- Age guidance is shown only with a cited, trustworthy rating source; none is shown at launch.
- Inclusion does not imply affiliation with or endorsement by producers. Dramatizations are labelled as going beyond the biblical text.

## Verified links (2026-11-08)
| Title | URL | Result |
| --- | --- | --- |
| The Chosen | https://watch.thechosen.tv/ | HTTP 200 |
| BibleProject | https://bibleproject.com/ | HTTP 202 (site reachable; responds to automated checks with 202) |

The Chosen’s distribution and resource permissions (https://www.comeandseefoundation.org/resources, HTTP 200) were not used to embed or host any content; we only link to the official site. Re-check links before launch and periodically (update `lastChecked` in `src/content/media.ts` or via `/admin`).
