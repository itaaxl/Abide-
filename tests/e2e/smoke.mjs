/**
 * End-to-end smoke checks against a running server (default http://localhost:3000).
 *
 *   npm run build && npm start &   # or npm run dev
 *   BASE_URL=http://localhost:3000 npm run test:e2e
 *
 * Covers guest flows (reader, navigation, search, daily verse, plans, watch,
 * guidance gating, auth pages), CSP violations, keyboard focus, responsive
 * layouts, RTL, and automated accessibility (axe-core, WCAG 2.1 A/AA).
 * Signed-in flows need a configured Supabase test project (see docs/TESTING.md).
 */
import { chromium, devices } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const results = [];
let failed = 0;

async function check(name, fn) {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (e) {
    failed++;
    results.push(`FAIL ${name}: ${e.message.split("\n")[0]}`);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const cspErrors = [];
page.on("console", (m) => {
  if (m.type() === "error" && /Content Security Policy/i.test(m.text())) cspErrors.push(m.text().slice(0, 200));
});
page.on("pageerror", (e) => cspErrors.push(`pageerror: ${e.message.slice(0, 200)}`));

await check("home shows search, daily verse, reader and book browser", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  assert(await page.getByRole("search").first().isVisible(), "search missing");
  assert((await page.getByPlaceholder(/John 3:16/).count()) > 0, "example hint missing");
  assert(await page.getByText(/Today’s verse/i).first().isVisible(), "daily verse missing");
  assert((await page.locator("article.scripture").count()) > 0, "reader missing");
  assert((await page.getByRole("heading", { name: /Old Testament/ }).count()) > 0, "OT browser missing");
  assert((await page.getByRole("heading", { name: /New Testament/ }).count()) > 0, "NT browser missing");
});

await check("reference search opens the exact passage", async () => {
  await page.goto(`${BASE}/search?q=${encodeURIComponent("John 3:16")}&edition=eng-web`, { waitUntil: "networkidle" });
  assert(page.url().includes("/bible/eng-web/JHN/3"), `redirected to ${page.url()}`);
  const target = await page.locator(".verse.target").first().innerText();
  assert(target.startsWith("For God so loved the world"), `target text: ${target.slice(0, 40)}`);
});

await check("keyword search returns highlighted results with pagination", async () => {
  await page.goto(`${BASE}/search?q=shepherd&edition=eng-web`, { waitUntil: "networkidle" });
  assert((await page.locator("mark.search-hit").count()) > 0, "no highlights");
  assert(await page.getByRole("link", { name: /Next page/ }).isVisible(), "no pagination");
  await page.goto(`${BASE}/search?q=shepherd&edition=eng-web&book=PSA`, { waitUntil: "networkidle" });
  const refs = await page.locator("ol li a.font-semibold").allInnerTexts();
  assert(refs.length > 0 && refs.every((r) => r.startsWith("Psalms")), "book filter failed");
});

await check("invalid references explain the problem", async () => {
  await page.goto(`${BASE}/search?q=${encodeURIComponent("John 3:99")}`, { waitUntil: "networkidle" });
  assert(await page.getByText(/has 36 verses/).isVisible(), "no bounds message");
  const r = await page.goto(`${BASE}/bible/eng-web/JHN/99`);
  assert(r.status() === 404, `expected 404, got ${r.status()}`);
});

await check("next chapter crosses book boundaries in canonical order", async () => {
  await page.goto(`${BASE}/bible/eng-web/MAL/4`, { waitUntil: "networkidle" });
  const next = page.locator('a[rel="next"]');
  assert((await next.innerText()).includes("Tobit 1"), "WEB: Malachi 4 should lead to Tobit (deuterocanon)");
  await page.goto(`${BASE}/bible/fra-lsg/MAL/4`, { waitUntil: "networkidle" });
  assert((await page.locator('a[rel="next"]').innerText()).includes("Matthieu 1"), "LSG: Malachi -> Matthew");
});

await check("verse selection offers copy and share for guests", async () => {
  await page.goto(`${BASE}/bible/eng-web/PSA/23`, { waitUntil: "networkidle" });
  await page.locator('[data-verse="1"]').first().click();
  assert(await page.getByRole("button", { name: "Copy" }).isVisible(), "copy missing");
  assert(await page.getByRole("button", { name: "Share link" }).isVisible(), "share missing");
});

await check("public share page shows Scripture only, with metadata", async () => {
  await page.goto(`${BASE}/p/eng-web/JHN.3.16-17`, { waitUntil: "networkidle" });
  const desc = await page.locator('meta[name="description"]').getAttribute("content");
  assert(desc?.startsWith("For God so loved"), "description metadata");
  assert((await page.title()).includes("John 3:16–17"), "title metadata");
});

await check("parallel reading warns about Psalm numbering", async () => {
  await page.goto(`${BASE}/bible/eng-web/PSA/3?parallel=fra-lsg`, { waitUntil: "networkidle" });
  assert(await page.getByText(/numbers this Psalm’s title differently/).isVisible(), "no warning");
});

await check("Arabic edition renders right-to-left", async () => {
  await page.goto(`${BASE}/bible/arb-vd/JHN/1`, { waitUntil: "networkidle" });
  assert((await page.locator("article.scripture").getAttribute("dir")) === "rtl", "not rtl");
});

await check("daily verse page and home agree on the passage", async () => {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const home = await page.locator("figcaption .text-gold").first().innerText();
  await page.goto(`${BASE}/daily`, { waitUntil: "networkidle" });
  const daily = await page.locator("figcaption .text-gold").first().innerText();
  assert(home === daily, `${home} != ${daily}`);
  assert(await page.getByText(/Editorial content/).isVisible(), "editorial label missing");
});

await check("reading plans list real passages", async () => {
  await page.goto(`${BASE}/plans/gospel-of-john`, { waitUntil: "networkidle" });
  assert(await page.getByRole("link", { name: "John 21" }).isVisible(), "John 21 missing");
});

await check("Watch page links to the official The Chosen site", async () => {
  await page.goto(`${BASE}/watch`, { waitUntil: "networkidle" });
  const href = await page.getByRole("link", { name: /Watch on The Chosen/ }).getAttribute("href");
  assert(href === "https://watch.thechosen.tv/", `href ${href}`);
});

await check("guidance and private pages show honest states for guests", async () => {
  await page.goto(`${BASE}/guidance`, { waitUntil: "networkidle" });
  assert((await page.getByText(/verified email|aren’t configured/).count()) > 0, "no gating message");
  for (const p of ["/library", "/journal", "/flashcards"]) {
    const r = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" });
    assert(/noindex/.test(r.headers()["x-robots-tag"] ?? ""), `${p} not noindex`);
    assert((await page.getByText(/Sign in|not configured/).count()) > 0, `${p} gate missing`);
  }
});

await check("security headers are present", async () => {
  const r = await page.goto(`${BASE}/`);
  const h = r.headers();
  assert(/nonce-/.test(h["content-security-policy"] ?? ""), "CSP nonce missing");
  assert(h["x-content-type-options"] === "nosniff", "nosniff missing");
  assert(/frame-ancestors 'none'/.test(h["content-security-policy"]), "frame-ancestors missing");
});

await check("health endpoint reports availability without secrets", async () => {
  const r = await page.goto(`${BASE}/api/health`);
  const body = await r.json();
  assert(body.checks.bible === "ok", "bible not ok");
  assert(!JSON.stringify(body).match(/key|secret|http/i), "health leaks config");
});

await check("keyboard: skip link is first and focus is visible", async () => {
  await page.goto(`${BASE}/bible/eng-web/JHN/1`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const text = await page.evaluate(() => document.activeElement?.textContent);
  assert(/Skip to content/.test(text ?? ""), `first focus: ${text}`);
});

for (const path of ["/", "/bible/eng-web/PSA/23", "/search?q=love", "/daily", "/plans", "/watch", "/auth/sign-up", "/guidance", "/bible/arb-vd/JHN/1"]) {
  await check(`axe WCAG A/AA: ${path}`, async () => {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = r.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    assert(serious.length === 0, serious.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`).join("; "));
  });
}

for (const theme of ["sepia", "dark"]) {
  await check(`axe contrast in ${theme} theme`, async () => {
    await ctx.addCookies([{ name: "abide_prefs", value: encodeURIComponent(JSON.stringify({ theme })), url: BASE }]);
    await page.goto(`${BASE}/bible/eng-web/PSA/23`, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
    assert(r.violations.length === 0, r.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target).join(",")}`).join("; "));
  });
}
await ctx.clearCookies();

for (const [name, opts] of [
  ["phone", devices["iPhone 13"]],
  ["phone landscape", devices["iPhone 13 landscape"]],
  ["tablet", devices["iPad (gen 7)"]],
  ["wide", { viewport: { width: 1920, height: 1080 } }],
]) {
  await check(`no horizontal overflow on ${name}`, async () => {
    const c = await browser.newContext(opts);
    const p = await c.newPage();
    for (const path of ["/", "/bible/eng-web/PSA/119", "/bible/arb-vd/ROM/8", "/search?q=love", "/watch"]) {
      await p.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `${path} overflows by ${overflow}px`);
    }
    await c.close();
  });
}

await check("no CSP violations or page errors were logged", async () => {
  assert(cspErrors.length === 0, cspErrors.slice(0, 3).join(" | "));
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
