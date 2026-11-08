"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { EMAIL_CODES, OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/auth-config";
import { clientIp, consume } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, passwordSchema } from "@/lib/validation";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  email?: string;
  /** Code-entry step for one-time-code flows. */
  step?: "code";
  /** Seconds until another email may be requested. */
  cooldown?: number;
}

const UNCONFIGURED: FormState = { error: "Accounts are not configured on this site yet. You can still read, search, and use the daily verse." };
const WAIT = "Please wait a minute before requesting another email.";

function callbackUrl(next: string) {
  return `${site.url}/auth/confirm?next=${encodeURIComponent(next)}`;
}

/** Map an email-sending failure to an honest message. Never report success after a provider error. */
function sendError(error: AuthError): string {
  if (error.status === 429 || /rate limit|security purposes/i.test(error.message)) return "Too many emails were requested. Please wait a few minutes and try again.";
  return "We couldn’t send the email right now. Please try again in a few minutes.";
}

async function applyAccountPrefs(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
  if (profile?.preferences && Object.keys(profile.preferences).length) {
    const { updatePrefs } = await import("@/app/actions/prefs");
    await updatePrefs(profile.preferences);
  }
}

// ---------------------------------------------------------------------------
// Registration and account verification
// ---------------------------------------------------------------------------

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirm = String(formData.get("confirm") ?? "");
  const fieldErrors: Record<string, string> = {};
  if (!email.success) fieldErrors.email = email.error.issues[0].message;
  if (!password.success) fieldErrors.password = password.error.issues[0].message;
  else if (password.data !== confirm) fieldErrors.confirm = "Passwords do not match.";
  if (formData.get("terms") !== "on") fieldErrors.terms = "Please accept the terms and privacy policy.";
  if (Object.keys(fieldErrors).length) return { fieldErrors, email: String(formData.get("email") ?? "") };

  if (!(await consume(`signup:${await clientIp()}`, 5, 3600)))
    return { error: "Too many sign-up attempts from this network. Please try again later." };

  const { error } = await supabase.auth.signUp({
    email: email.data!,
    password: password.data!,
    options: { emailRedirectTo: callbackUrl("/") },
  });
  if (error) {
    if (error.code === "weak_password" || /password/i.test(error.message)) return { fieldErrors: { password: error.message }, email: email.data };
    if (/email/i.test(error.message) && /send/i.test(error.message)) return { error: sendError(error), email: email.data };
    if (error.status === 429) return { error: sendError(error), email: email.data };
    return { error: "We couldn’t create the account. Please check your details and try again.", email: email.data };
  }
  // The auth server allows one email per address per minute; occupy the resend
  // window so an early "resend" can't rotate the token without sending a new email.
  await consume(`resend:${email.data}`, 1, 60);
  redirect(`/auth/check-email?email=${encodeURIComponent(email.data!)}`);
}

export async function resendVerificationAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const ip = await clientIp();
  // Server-side cooldown: 1 per 60s per address, 5 per hour per network.
  if (!(await consume(`resend:${email.data}`, 1, 60)) || !(await consume(`resend-ip:${ip}`, 5, 3600)))
    return { error: WAIT, email: email.data, cooldown: 60 };
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data, options: { emailRedirectTo: callbackUrl("/") } });
  if (error) return { error: sendError(error), email: email.data, cooldown: 60 };
  return {
    message: `If that address has an account waiting for verification, a new email is on its way. Use the newest ${EMAIL_CODES ? "code or link" : "link"}; it expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    email: email.data,
    cooldown: 60,
  };
}

// ---------------------------------------------------------------------------
// One-time code: sign in (preferred), verify a new account, password recovery
// ---------------------------------------------------------------------------

/** Email a Supabase-generated one-time sign-in code to an existing account. */
export async function sendLoginCodeAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  if (!EMAIL_CODES) return { error: "Email codes aren’t available yet. Please sign in with your password." };
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address.", email: String(formData.get("email") ?? "") };
  if (!(await consume(`otp-send:${email.data}`, 1, 60)) || !(await consume(`otp-send-ip:${await clientIp()}`, 10, 3600)))
    return { error: WAIT, email: email.data, step: "code", cooldown: 60 };
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: callbackUrl(safeNext(String(formData.get("next") ?? "/"))) },
  });
  // "No such user" is answered like success (without claiming an email was sent)
  // so the form can't be used to discover who has an account.
  const unknownUser = error && (error.code === "otp_disabled" || /signups not allowed/i.test(error.message));
  if (error && !unknownUser) return { error: sendError(error), email: email.data };
  return {
    step: "code",
    email: email.data,
    cooldown: 60,
    message: `If ${email.data} belongs to an Abide account, a ${OTP_LENGTH}-digit code is on its way. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  };
}

const CODE_PURPOSES = { login: "email", signup: "email", recovery: "recovery" } as const;

/** Verify a code with Supabase. Limited to 5 attempts per address per 15 minutes. */
export async function verifyCodeAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  if (!EMAIL_CODES) return { error: "Email codes aren’t available yet. Use the button in the email." };
  const purpose = String(formData.get("purpose")) as keyof typeof CODE_PURPOSES;
  if (!(purpose in CODE_PURPOSES)) return { error: "Invalid request." };
  const email = emailSchema.safeParse(formData.get("email"));
  const token = String(formData.get("code") ?? "").replace(/\s+/g, "");
  if (!email.success) return { error: "Enter a valid email address.", step: "code" };
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(token))
    return { error: `Enter the ${OTP_LENGTH}-digit code from the email.`, email: email.data, step: "code" };
  if (!(await consume(`otp-verify:${email.data}`, 5, 900)) || !(await consume(`otp-verify-ip:${await clientIp()}`, 30, 900)))
    return { error: "Too many attempts. Request a new code and try again in 15 minutes.", email: email.data, step: "code" };

  const { data, error } = await supabase.auth.verifyOtp({ email: email.data, token, type: CODE_PURPOSES[purpose] });
  if (error || !data.user) {
    return {
      error: "That code is incorrect or has expired. Make sure you’re using the newest email, or request a new code.",
      email: email.data,
      step: "code",
    };
  }
  if (purpose === "recovery") redirect("/auth/reset");
  await applyAccountPrefs(supabase, data.user.id);
  redirect(safeNext(String(formData.get("next") ?? "/")));
}

// ---------------------------------------------------------------------------
// Password sign-in and recovery
// ---------------------------------------------------------------------------

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success || !password) return { error: "Enter your email and password.", email: String(formData.get("email") ?? "") };
  if (!(await consume(`signin:${await clientIp()}`, 20, 900)) || !(await consume(`signin:${email.data}`, 10, 900)))
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again.", email: email.data };
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  if (error) {
    if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message))
      return {
        error: `This account hasn’t been verified yet. ${EMAIL_CODES ? "Enter the code from your verification email" : "Tap the button in your verification email"}, or send a new one.`,
        email: email.data,
        fieldErrors: { unverified: "1" },
      };
    return { error: "Email or password is incorrect.", email: email.data };
  }
  await applyAccountPrefs(supabase, data.user.id);
  redirect(safeNext(String(formData.get("next") ?? "/")));
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  if (!(await consume(`forgot:${email.data}`, 1, 60)) || !(await consume(`forgot-ip:${await clientIp()}`, 5, 3600)))
    return { error: WAIT, email: email.data, step: "code", cooldown: 60 };
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: callbackUrl("/auth/reset") });
  if (error) return { error: sendError(error), email: email.data };
  // Supabase answers the same for unknown addresses, so this never reveals whether an account exists.
  return {
    step: "code",
    email: email.data,
    cooldown: 60,
    message: EMAIL_CODES
      ? `If an account exists for ${email.data}, we sent a reset email with a button and a ${OTP_LENGTH}-digit code. Both work once and expire in ${OTP_EXPIRY_MINUTES} minutes.`
      : `If an account exists for ${email.data}, we sent a reset email. Its button works once and expires in ${OTP_EXPIRY_MINUTES} minutes.`,
  };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link or code has expired or was already used. Please request a new one." };
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { fieldErrors: { password: password.error.issues[0].message } };
  if (password.data !== formData.get("confirm")) return { fieldErrors: { confirm: "Passwords do not match." } };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    if (error.code === "same_password") return { fieldErrors: { password: "Choose a password different from your current one." } };
    return { error: "Could not update the password. Please request a new reset email." };
  }
  redirect("/account?reset=1");
}

export async function googleSignInAction() {
  const supabase = await createClient();
  if (!supabase || process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED !== "true") redirect("/auth/sign-in");
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl("/") } });
  if (error || !data.url) redirect("/auth/error?reason=oauth");
  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}
