/**
 * Email authentication flows: registration + code verification, one-time-code
 * sign-in, magic-link button, password sign-in, password recovery by code,
 * attempt limits, cooldowns, expired links, and "never localhost" in emails.
 *
 * Local:  npx supabase start && npm run build && npm start &  then  npm run test:e2e:email
 * Env: BASE_URL, MAILPIT_URL, DB_URL (local only, to reset app rate limits).
 */
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const DB_URL = process.env.DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const OTP_LENGTH = Number(process.env.OTP_LENGTH ?? 8);
const run = Date.now().toString(36);
const U = { email: `otp-${run}@example.test`, password: "first-pass-123", newPassword: "second-pass-456" };

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
const seen = new Set();

/** Newest unseen email to `to` whose subject matches. Returns {subject, html, code, link}. */
async function nextEmail(to, subject) {
  for (let i = 0; i < 40; i++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)).json();
    for (const m of list.messages ?? []) {
      if (seen.has(m.ID) || !subject.test(m.Subject)) continue;
      seen.add(m.ID);
      const msg = await (await fetch(`${MAILPIT}/api/v1/message/${m.ID}`)).json();
      const html = msg.HTML ?? "";
      const code = new RegExp(`>\\s*(\\d{${OTP_LENGTH}})\\s*<`).exec(html)?.[1];
      const link = /href="([^"]*\/auth\/confirm\?[^"]+)"/.exec(html)?.[1]?.replace(/&amp;/g, "&");
      return { subject: m.Subject, html, code, link };
    }
    await sleep(500);
  }
  throw new Error(`no "${subject}" email for ${to}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const signedIn = () => page.getByRole("button", { name: "Sign out" }).first().isVisible();

await check("registration sends a branded verification email with code and button", async () => {
  await page.goto(`${BASE}/auth/sign-up`);
  await page.getByLabel("Email").fill(U.email);
  await page.getByLabel("Password", { exact: true }).fill(U.password);
  await page.getByLabel("Confirm password").fill(U.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/check-email/);
  const mail = await nextEmail(U.email, /Confirm your Abide account/);
  assert(mail.code, "no code in email");
  assert(mail.link?.startsWith(`${BASE}/auth/confirm?token_hash=`), `bad link ${mail.link}`);
  assert(/expire in 15 minutes/.test(mail.html) && /didn’t request this/.test(mail.html), "missing expiry/ignore text");
  U.verifyCode = mail.code;
});

await check("wrong verification code is rejected with recovery help", async () => {
  await page.getByLabel(/digit code/).fill("1".repeat(OTP_LENGTH));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText(/incorrect or has expired/).waitFor();
});

await check("verification by code signs the new account in", async () => {
  await page.getByLabel(/digit code/).fill(U.verifyCode);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "not signed in");
});

await check("session persists across reloads and new pages", async () => {
  await page.reload();
  await page.goto(`${BASE}/library`);
  assert(await page.getByRole("heading", { name: "My Library" }).isVisible(), "library not available");
});

await check("one-time code sign-in (existing account)", async () => {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/auth/sign-in`);
  assert(await page.getByRole("tab", { name: "Email me a code", selected: true }).isVisible(), "code is not the default method");
  await page.getByLabel("Email").fill(U.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByText(/code is on its way/).waitFor();
  assert(await page.getByRole("button", { name: /Send a new code in \d+s/ }).isVisible(), "no resend cooldown");
  const mail = await nextEmail(U.email, /Your Abide sign-in code/);
  const input = page.getByLabel(/digit code/);
  assert((await input.getAttribute("maxlength")) === String(OTP_LENGTH), "input length mismatch");
  await input.fill(mail.code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "not signed in");
  U.usedLink = mail.link;
});

await check("magic-link button is single-use (second use shows recovery page)", async () => {
  // The code above consumed this email's token, so its button must no longer work.
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(U.usedLink);
  await page.waitForURL(/\/auth\/error\?reason=expired/);
  assert(await page.getByRole("link", { name: "Get a new sign-in code" }).isVisible(), "no recovery action");
});

await check("magic-link button signs in from a fresh email", async () => {
  execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);
  await sleep(1100); // local auth email frequency is 1s
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByLabel("Email").fill(U.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByText(/code is on its way/).waitFor();
  const mail = await nextEmail(U.email, /Your Abide sign-in code/);
  await page.goto(mail.link);
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "button did not sign in");
});

await check("code attempts are limited", async () => {
  await page.getByRole("button", { name: "Sign out" }).first().click();
  execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);
  await sleep(1100);
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByLabel("Email").fill(U.email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByText(/code is on its way/).waitFor();
  await nextEmail(U.email, /Your Abide sign-in code/);
  for (let i = 0; i < 6; i++) {
    await page.getByLabel(/digit code/).fill(String(10 ** (OTP_LENGTH - 1) + i));
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("alert").first().waitFor();
    await sleep(300);
  }
  await page.getByText(/Too many attempts/).waitFor();
});

await check("unknown email gets a neutral message (no account disclosure)", async () => {
  execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByLabel("Email").fill(`nobody-${run}@example.test`);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await page.getByText(/If nobody-.* belongs to an Abide account/).waitFor();
});

await check("password sign-in still works", async () => {
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByRole("tab", { name: "Use password" }).click();
  await page.getByLabel("Email").fill(U.email);
  await page.getByLabel("Password", { exact: true }).fill(U.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "password sign-in failed");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(`${BASE}/`);
});

await check("verified account using sign-up gets a sign-in code (not silence)", async () => {
  execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);
  await sleep(1100);
  await page.goto(`${BASE}/auth/sign-up`);
  await page.getByLabel("Email").fill(U.email);
  await page.getByLabel("Password", { exact: true }).fill("another-pass-789");
  await page.getByLabel("Confirm password").fill("another-pass-789");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/check-email/);
  const mail = await nextEmail(U.email, /Your Abide sign-in code/);
  await page.getByLabel(/digit code/).fill(mail.code);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL(`${BASE}/`);
  assert(await signedIn(), "not signed in");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.waitForURL(`${BASE}/`);
});

await check("verified account pressing 'resend verification' gets a sign-in code", async () => {
  execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);
  await sleep(1100);
  await page.goto(`${BASE}/auth/check-email?email=${encodeURIComponent(U.email)}`);
  await page.getByRole("button", { name: /Resend verification email|Resend available/ }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => b.textContent === "Resend verification email"), null, { timeout: 70000 });
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await page.getByText(/a new email is on its way/).waitFor();
  const mail = await nextEmail(U.email, /Your Abide sign-in code/);
  assert(mail.code, "no code");
});

await check("password recovery by code, then sign in with the new password", async () => {
  execFileSync("psql", [DB_URL, "-qc", "delete from public.rate_limits"]);
  await sleep(1100);
  await page.goto(`${BASE}/auth/forgot`);
  await page.getByLabel("Email").fill(U.email);
  await page.getByRole("button", { name: "Send reset email" }).click();
  await page.getByText(/we sent a reset email/).waitFor();
  const mail = await nextEmail(U.email, /Reset your Abide password/);
  assert(mail.link?.includes("type=recovery"), "no recovery link");
  await page.getByLabel(/digit code/).fill(mail.code);
  await page.getByRole("button", { name: "Continue to new password" }).click();
  await page.waitForURL(/\/auth\/reset/);
  await page.getByLabel("New password", { exact: true }).fill(U.newPassword);
  await page.getByLabel("Confirm new password").fill(U.newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await page.waitForURL(/\/account/);
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await page.goto(`${BASE}/auth/sign-in`);
  await page.getByRole("tab", { name: "Use password" }).click();
  await page.getByLabel("Email").fill(U.email);
  await page.getByLabel("Password", { exact: true }).fill(U.newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${BASE}/`);
});

await check("no client-side errors", async () => assert(errors.length === 0, errors.slice(0, 3).join(" | ")));

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
