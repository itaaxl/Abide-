/**
 * Live-deployment auth checks without reading a mailbox: uses the Supabase
 * admin API to generate the same tokens Supabase puts in emails, then uses
 * them on the deployed site. Test users are deleted afterwards.
 *
 *   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SECRET_KEY=... BASE_URL=https://your-site node tests/e2e/live-auth.mjs
 *
 * Never commit or print the key.
 */
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "https://abide-omega.vercel.app";
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const created = [];
const results = [];
let failed = 0;
const visited = [];

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
async function link(type, email, extra = {}) {
  const { data, error } = await admin.auth.admin.generateLink({ type, email, ...extra, options: { redirectTo: `${BASE}/auth/confirm?next=/` } });
  if (error) throw new Error(`${type}: ${error.message}`);
  if (data.user && !created.includes(data.user.id)) created.push(data.user.id);
  return data;
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("framenavigated", (f) => f === page.mainFrame() && visited.push(f.url()));
const accountLink = (p) => p.getByRole("link", { name: /^Account \(/ });
/** Sign-out lives on the account page (the header only shows an account link). */
async function signOut(p) {
  await p.goto(new URL("/account", p.url()).href, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Sign out" }).click();
  await p.waitForURL((u) => new URL(u).pathname === "/");
}
const signedIn = () => accountLink(page).isVisible();
const U = { email: `abide-live-${run}@example.com`, password: "Live-test-pass-1", newPassword: "Live-test-pass-2" };

await check("Supabase verify links redirect to the live site, never localhost", async () => {
  const d = await link("signup", `redirect-${run}@example.com`, { password: "Check-pass-12345" });
  const r = await fetch(d.properties.action_link, { redirect: "manual" });
  const loc = r.headers.get("location") ?? "";
  assert(r.status >= 300 && r.status < 400, `status ${r.status}`);
  assert(new URL(loc).origin === BASE, `redirects to ${new URL(loc).origin}`);
});

await check("registration verification link signs the new account in", async () => {
  const d = await link("signup", U.email, { password: U.password });
  await page.goto(`${BASE}/auth/confirm?token_hash=${d.properties.hashed_token}&type=email&next=/`);
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "not signed in after verification");
});

await check("session persists across reloads and pages", async () => {
  await page.reload();
  await page.goto(`${BASE}/library`);
  assert(await page.getByRole("heading", { name: "My Library" }).isVisible(), "library not available");
});

await check("private saved data persists (bookmark + note)", async () => {
  await page.goto(`${BASE}/bible/eng-web/PSA/23`, { waitUntil: "networkidle" });
  await page.locator('[data-verse="1"]').first().click();
  await page.getByRole("button", { name: /Bookmark/ }).click();
  await page.getByRole("button", { name: /Bookmarked/ }).waitFor();
  await page.getByRole("button", { name: /Note/ }).click();
  await page.locator("#note").fill("Live test note");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("✓").waitFor();
  await page.goto(`${BASE}/library?tab=notes`, { waitUntil: "networkidle" });
  assert(await page.getByText("Live test note").isVisible(), "note not saved");
});

await check("used verification link cannot be reused", async () => {
  await signOut(page);
  await page.waitForURL(`${BASE}/`);
  const d = await link("magiclink", U.email);
  const url = `${BASE}/auth/confirm?token_hash=${d.properties.hashed_token}&type=email&next=/`;
  await page.goto(url);
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "magic link did not sign in");
  await signOut(page);
  await page.waitForURL(`${BASE}/`);
  await page.goto(url);
  await page.waitForURL(/\/auth\/error\?reason=expired/);
});

await check("password recovery link → new password → password sign-in", async () => {
  const d = await link("recovery", U.email);
  await page.goto(`${BASE}/auth/confirm?token_hash=${d.properties.hashed_token}&type=recovery&next=/auth/reset`);
  await page.waitForURL(/\/auth\/reset/);
  await page.getByLabel("New password", { exact: true }).fill(U.newPassword);
  await page.getByLabel("Confirm new password").fill(U.newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await page.waitForURL(/\/account/);
  await signOut(page);
  await page.goto(`${BASE}/auth/sign-in`);
  const tab = page.getByRole("tab", { name: "Use password" });
  if (await tab.count()) await tab.click();
  await page.getByLabel("Email").fill(U.email);
  await page.getByLabel("Password", { exact: true }).fill(U.newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "password sign-in failed");
  await page.goto(`${BASE}/library?tab=notes`, { waitUntil: "networkidle" });
  assert(await page.getByText("Live test note").isVisible(), "saved note missing after re-sign-in");
});

await check("sign-up email failure is reported honestly (no false success)", async () => {
  const p2 = await (await browser.newContext()).newPage();
  const email = `abide-send-${run}@example.com`;
  await p2.goto(`${BASE}/auth/sign-up`);
  await p2.getByLabel("Email").fill(email);
  await p2.getByLabel("Password", { exact: true }).fill(U.password);
  await p2.getByLabel("Confirm password").fill(U.password);
  await p2.getByRole("checkbox").check();
  await p2.getByRole("button", { name: "Create account" }).click();
  const alert = p2.locator("form p[role=alert]");
  await Promise.race([p2.waitForURL(/check-email/, { timeout: 20000 }), alert.first().waitFor({ timeout: 20000 })]);
  const url = p2.url();
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  const u = data.users.find((x) => x.email === email);
  if (u) created.push(u.id);
  // With Supabase's built-in sender, mail to non-team addresses is refused; the app must say so.
  results.push(`INFO sign-up result for a non-team address: ${/check-email/.test(url) ? "check-email page" : await alert.first().innerText()}`);
});

await check("no page ever opened localhost", async () => assert(!visited.some((u) => /localhost|127\.0\.0\.1/.test(u)), visited.find((u) => /localhost/.test(u)) ?? ""));

for (const id of created) await admin.auth.admin.deleteUser(id);
results.push(`INFO removed ${created.length} test user(s)`);
await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.filter((r) => /^(PASS|FAIL)/.test(r)).length} checks passed`);
process.exit(failed ? 1 : 0);
