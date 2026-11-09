/**
 * Signed-in end-to-end checks against a real (local or test) Supabase project
 * with Mailpit capturing auth emails. See docs/TESTING.md.
 *
 *   npx supabase start            # local stack incl. Mailpit
 *   npm run build && npm start &  # app configured via .env.local
 *   npm run test:e2e:accounts
 *
 * Env: BASE_URL (default http://localhost:3000), MAILPIT_URL (default http://127.0.0.1:54324),
 *      DB_URL for granting admin (default local supabase postgres).
 */
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const DB_URL = process.env.DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const run = Date.now().toString(36);
const A = { email: `a-${run}@example.test`, password: "first-pass-123", newPassword: "second-pass-456" };
const B = { email: `b-${run}@example.test`, password: "other-pass-789" };

// Our own sign-up/sign-in limits (e.g. 5 sign-ups per IP per hour) would block
// repeated local runs; reset them, but only against a local database.
if (/@(127\.0\.0\.1|localhost):/.test(DB_URL)) execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);

const results = [];
let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    results.push(`PASS ${name}`);
  } catch (e) {
    failed++;
    results.push(`FAIL ${name}: ${String(e.message).split("\n")[0]}`);
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function latestLink(to, kind) {
  for (let i = 0; i < 30; i++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
    for (const m of list.messages ?? []) {
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
      const body = `${msg.HTML ?? ""} ${msg.Text ?? ""}`;
      const links = [...body.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((x) => x[0].replace(/&amp;/g, "&"));
      const link = links.find((l) => (kind === "recovery" ? /type=recovery|recovery/.test(l) : /verify|confirm/.test(l)));
      if (link && !seen.has(m.ID)) {
        seen.add(m.ID);
        return link;
      }
    }
    await sleep(500);
  }
  throw new Error(`no ${kind} email for ${to}`);
}
const seen = new Set();

const accountLink = (p) => p.getByRole("link", { name: /^Account \(/ });
/** Sign-out lives on the account page (the header only shows an account link). */
async function signOut(p) {
  await p.goto(new URL("/account", p.url()).href, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Sign out" }).click();
  await p.waitForURL((u) => new URL(u).pathname === "/");
}
const browser = await chromium.launch();
const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctxA.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

async function signUp(p, u) {
  await p.goto(`${BASE}/auth/sign-up`);
  await p.getByLabel("Email").fill(u.email);
  await p.getByLabel("Password", { exact: true }).fill(u.password);
  await p.getByLabel("Confirm password").fill(u.password);
  await p.getByRole("checkbox").check();
  await p.getByRole("button", { name: "Create account" }).click();
  await p.waitForURL(/check-email/);
}
async function signIn(p, u, password = u.password) {
  await p.goto(`${BASE}/auth/sign-in`);
  const tab = p.getByRole("tab", { name: "Use password" });
  if (await tab.count()) await tab.click(); // tabs only exist when email codes are enabled
  await p.getByLabel("Email").fill(u.email);
  await p.getByLabel("Password", { exact: true }).fill(password);
  await p.getByRole("button", { name: "Sign in" }).click();
}

await check("sign-up validates fields and shows password requirements", async () => {
  await page.goto(`${BASE}/auth/sign-up`);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  assert(await page.getByText("At least 10 characters").isVisible(), "rules not shown");
  await page.getByRole("button", { name: "Show password" }).first().click();
  assert((await page.getByLabel("Password", { exact: true }).getAttribute("type")) === "text", "show password failed");
  await page.getByLabel("Confirm password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText(/valid email/).waitFor();
});

await check("sign-up shows check-your-email state (not signed in)", async () => {
  await signUp(page, A);
  assert(await page.getByText(A.email).isVisible(), "email not shown");
  await page.goto(`${BASE}/library`);
  assert(await page.getByRole("link", { name: "Sign in" }).first().isVisible(), "unverified user reached library");
});

await check("unverified sign-in is refused with a resend option", async () => {
  await signIn(page, A);
  await page.getByText(/hasn’t been verified yet/i).first().waitFor();
  assert(await page.getByRole("button", { name: /Resend verification/ }).isVisible(), "no resend");
});

await check("resend verification has a cooldown", async () => {
  await page.getByRole("button", { name: /Resend verification/ }).click();
  await page.getByText(/Resend available in/).waitFor();
});

await check("email verification link signs the user in", async () => {
  const link = await latestLink(A.email, "signup");
  await page.goto(link);
  await page.waitForLoadState("networkidle");
  assert(await accountLink(page).isVisible(), `not signed in at ${page.url()}`);
});

await check("expired or invalid verification links are handled", async () => {
  await page.goto(`${BASE}/auth/confirm?token_hash=bogus&type=email`);
  await page.getByText(/expired or has already been used|isn’t valid/).waitFor();
});

await check("bookmark, highlight and note persist after reload", async () => {
  await page.goto(`${BASE}/bible/eng-web/JHN/3`, { waitUntil: "networkidle" });
  await page.locator('[data-verse="16"]').first().click();
  await page.getByRole("button", { name: /Bookmark/ }).click();
  await page.getByRole("button", { name: /Bookmarked/ }).waitFor();
  await page.getByRole("button", { name: "Highlight: Green" }).click();
  await page.getByRole("button", { name: /Note/ }).click();
  await page.locator("#note").fill("God’s love is for the whole world.");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("✓").waitFor();
  await sleep(500);
  await page.reload({ waitUntil: "networkidle" });
  assert(await page.locator('.verse.hl-green[data-verse="16"]').count(), "highlight lost");
  await page.locator('[data-verse="16"]').first().click();
  assert(await page.getByRole("button", { name: /Bookmarked/ }).isVisible(), "bookmark lost");
  await page.goto(`${BASE}/library?tab=notes`, { waitUntil: "networkidle" });
  assert(await page.getByText("God’s love is for the whole world.").isVisible(), "note missing in library");
  await page.goto(`${BASE}/library?tab=notes&q=whole+world`, { waitUntil: "networkidle" });
  assert(await page.getByText("John 3:16").first().isVisible(), "library search failed");
});

await check("flashcard: create, due today, review once, idempotent", async () => {
  await page.goto(`${BASE}/bible/eng-web/PSA/23`, { waitUntil: "networkidle" });
  await page.locator('[data-verse="1"]').first().click();
  await page.getByRole("button", { name: "Make flashcard" }).click();
  await page.getByText(/Flashcard added/).waitFor();
  await page.locator('[data-verse="1"]').first().click(); // deselect
  await page.locator('[data-verse="1"]').first().click();
  await page.getByRole("button", { name: "Make flashcard" }).click();
  await page.getByText(/already in that deck/).waitFor();
  await page.goto(`${BASE}/flashcards?tab=saved`, { waitUntil: "networkidle" });
  assert(await page.getByText("Psalms 23:1").first().isVisible(), "saved card missing from Saved tab");
  await page.goto(`${BASE}/flashcards/review`, { waitUntil: "networkidle" });
  await page.keyboard.press("Space");
  await page.getByRole("group", { name: /How well/ }).waitFor();
  await page.keyboard.press("3");
  await page.keyboard.press("3"); // rapid double press
  await page.getByText(/all caught up/).waitFor();
  const n = execFileSync("psql", [DB_URL, "-tAc", `select count(*) from reviews r join auth.users u on u.id=r.user_id where u.email='${A.email}'`]).toString().trim();
  assert(n === "1", `expected 1 review row, got ${n}`);
});

await check("verse card Save adds today's verse to Saved (and repeats are harmless)", async () => {
  await page.goto(`${BASE}/flashcards`, { waitUntil: "networkidle" });
  const card = page.locator('[aria-roledescription="slide"]:not([aria-hidden="true"])').first();
  const ref = (await card.getAttribute("aria-label")).split(": ").slice(1).join(": ");
  await card.getByRole("button", { name: "Save" }).click();
  await card.getByRole("button", { name: "Saved" }).waitFor();
  await page.goto(`${BASE}/flashcards?tab=saved`, { waitUntil: "networkidle" });
  assert(await page.getByText(ref).first().isVisible(), `${ref} not in Saved`);
});

await check("reading plan: start, mark day complete, persists", async () => {
  await page.goto(`${BASE}/plans/gospel-of-john`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start this plan" }).click();
  await page.getByRole("button", { name: "Mark as read" }).first().waitFor();
  await page.getByRole("button", { name: "Mark as read" }).first().click();
  await page.getByText("1 of 21 readings completed").waitFor({ timeout: 10000 }).catch(async () => {
    await page.reload({ waitUntil: "networkidle" });
  });
  await page.reload({ waitUntil: "networkidle" });
  assert(await page.getByText("1 of 21 readings completed").isVisible(), "progress lost");
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Resume" }).waitFor();
});

let entryUrl = "";
await check("journal: create, search, private", async () => {
  await page.goto(`${BASE}/journal/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("Thankful today");
  await page.getByLabel("Your words").fill("Grateful for my family and for quiet mornings.");
  await page.getByRole("button", { name: "Save privately" }).click();
  await page.waitForURL(/\/journal\/[0-9a-f-]{36}/);
  entryUrl = page.url();
  await page.goto(`${BASE}/journal?q=quiet`, { waitUntil: "networkidle" });
  assert(await page.getByText("Thankful today").isVisible(), "search failed");
});

await check("guidance without an AI key shows an honest curated fallback", async () => {
  await page.goto(`${BASE}/guidance`, { waitUntil: "networkidle" });
  await page.getByLabel(/What are you facing/).fill("I feel anxious about tomorrow");
  await page.getByRole("button", { name: "Find passages" }).click();
  await page.getByText(/aren’t available on this site right now/).waitFor();
  assert(await page.getByText(/selected from our curated topic list/).isVisible(), "fallback label missing");
  assert((await page.locator("article blockquote").count()) > 0, "no passages");
});

await check("data export contains the user’s records", async () => {
  const res = await page.request.get(`${BASE}/account/export`);
  const data = await res.json();
  assert(data.prayer_entries?.length === 1 && data.notes?.length === 1 && data.bookmarks?.length === 1, "export incomplete");
  assert(res.headers()["cache-control"]?.includes("no-store"), "export cacheable");
});

for (const path of ["/library", "/library?tab=notes", "/flashcards", "/flashcards/review?mode=practice", "/journal", "/journal/new", "/account", "/plans/gospel-of-john", "/guidance"]) {
  await check(`axe WCAG A/AA (signed in): ${path}`, async () => {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    assert(bad.length === 0, bad.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`).join("; "));
  });
}

await check("sign out ends the session", async () => {
  await signOut(page);
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/journal`);
  assert(await page.getByRole("link", { name: "Sign in" }).first().isVisible(), "still signed in");
});

// Second user
const ctxB = await browser.newContext();
const pb = await ctxB.newPage();
await check("user B cannot see user A’s data (guessed ids, direct requests)", async () => {
  await signUp(pb, B);
  await pb.goto(await latestLink(B.email, "signup"));
  await pb.waitForLoadState("networkidle");
  const r = await pb.goto(entryUrl);
  assert(r.status() === 404, `A's journal entry returned ${r.status()} to B`);
  await pb.goto(`${BASE}/library?tab=notes`, { waitUntil: "networkidle" });
  assert(!(await pb.getByText("God’s love is for the whole world.").count()), "B sees A note");
  const exp = await (await pb.request.get(`${BASE}/account/export`)).json();
  assert(exp.prayer_entries.length === 0 && exp.notes.length === 0, "B export includes A data");
});

await check("non-admin cannot use admin area; admin role only via SQL", async () => {
  await pb.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  assert(await pb.getByText(/doesn’t have administrator access/).isVisible(), "admin gate");
  execFileSync("psql", [DB_URL, "-qc", `update profiles set role='admin' where id=(select id from auth.users where email='${B.email}')`]);
  await pb.reload({ waitUntil: "networkidle" });
  assert(await pb.getByRole("link", { name: "AI usage" }).isVisible(), "admin page not shown to admin");
});

await check("password reset via one-time link, then sign in with new password", async () => {
  const pr = await ctxA.newPage();
  await pr.goto(`${BASE}/auth/forgot`);
  await pr.getByLabel("Email").fill(A.email);
  await pr.getByRole("button", { name: "Send reset email" }).click();
  await pr.getByText(/we sent a reset email/).waitFor();
  await pr.goto(await latestLink(A.email, "recovery"));
  await pr.waitForURL(/\/auth\/reset/);
  await pr.getByLabel("New password", { exact: true }).fill(A.newPassword);
  await pr.getByLabel("Confirm new password").fill(A.newPassword);
  await pr.getByRole("button", { name: "Update password" }).click();
  await pr.waitForURL(/\/account/);
  await signOut(pr);
  await signIn(pr, A, A.password);
  await pr.getByText("Email or password is incorrect.").waitFor();
  await signIn(pr, A, A.newPassword);
  await pr.waitForURL(`${BASE}/`);
});

await check("session expiry: cleared cookies return to signed-out state", async () => {
  await ctxA.clearCookies();
  const p = await ctxA.newPage();
  await p.goto(`${BASE}/flashcards`);
  assert(await p.getByRole("link", { name: "Sign in" }).first().isVisible(), "still signed in");
});

await check("account deletion requires password and removes all records", async () => {
  await pb.goto(`${BASE}/account`, { waitUntil: "networkidle" });
  await pb.getByLabel("Current password").fill("wrong-password-1");
  await pb.getByLabel("Type DELETE to confirm").fill("DELETE");
  await pb.getByRole("button", { name: /Delete my account/ }).click();
  await pb.getByText("Password is incorrect.").waitFor();
  // React resets uncontrolled form fields after an action: re-enter both.
  await pb.getByLabel("Current password").fill(B.password);
  await pb.getByLabel("Type DELETE to confirm").fill("DELETE");
  await pb.getByRole("button", { name: /Delete my account/ }).click();
  await pb.waitForURL(/\?deleted=1/);
  const n = execFileSync("psql", [DB_URL, "-tAc", `select count(*) from auth.users where email='${B.email}'`]).toString().trim();
  assert(n === "0", "auth user still exists");
});

await check("no client-side errors", async () => {
  assert(errors.length === 0, errors.slice(0, 3).join(" | "));
});

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
