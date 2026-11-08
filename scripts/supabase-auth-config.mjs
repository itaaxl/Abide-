/**
 * Applies Abide's Auth settings and branded email templates to a hosted
 * Supabase project through the Management API, so production never depends
 * on hand-edited dashboard fields.
 *
 *   SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... SITE_URL=https://your-site npm run supabase:auth-config
 *
 * The token is a Supabase personal access token (Account → Access Tokens).
 * Never commit it. SMTP (Resend) is configured separately; see docs/EMAIL.md.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ref = process.env.SUPABASE_PROJECT_REF;
const site = (process.env.SITE_URL ?? "").replace(/\/$/, "");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !site.startsWith("https://") || !token) {
  console.error("Set SUPABASE_PROJECT_REF, SITE_URL (https://...) and SUPABASE_ACCESS_TOKEN.");
  process.exit(1);
}
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase", "templates");
const t = (f) => readFileSync(path.join(dir, f), "utf8");

const body = {
  site_url: site,
  // Only this site may receive auth redirects. Never localhost in production.
  uri_allow_list: [`${site}/auth/confirm`, `${site}/auth/confirm?**`, `${site}/**`].join(","),
  password_min_length: 10,
  mailer_otp_length: 8,
  mailer_otp_exp: 900,
  mailer_subjects_confirmation: "Confirm your Abide account",
  mailer_subjects_magic_link: "Your Abide sign-in code",
  mailer_subjects_recovery: "Reset your Abide password",
  mailer_subjects_email_change: "Confirm your new email for Abide",
  mailer_templates_confirmation_content: t("confirmation.html"),
  mailer_templates_magic_link_content: t("magic_link.html"),
  mailer_templates_recovery_content: t("recovery.html"),
  mailer_templates_email_change_content: t("email_change.html"),
};

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const out = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Failed (${res.status}): ${out.message ?? "unknown error"}`);
  process.exit(1);
}
console.log(`Updated: site_url=${out.site_url} allow_list=${out.uri_allow_list} otp_length=${out.mailer_otp_length} otp_exp=${out.mailer_otp_exp}s`);
