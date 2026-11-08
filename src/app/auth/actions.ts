"use server";

import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { clientIp, consume } from "@/lib/rate-limit";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { emailSchema, passwordSchema } from "@/lib/validation";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  email?: string;
}

const UNCONFIGURED: FormState = { error: "Accounts are not configured on this site yet. You can still read, search, and use the daily verse." };

function callbackUrl(next: string) {
  return `${site.url}/auth/confirm?next=${encodeURIComponent(next)}`;
}

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
    // Do not reveal whether an account exists beyond what the provider returns.
    if (/password/i.test(error.message)) return { fieldErrors: { password: error.message }, email: email.data };
    return { error: "We couldn’t create the account. Please check your details and try again." };
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
    return { error: "Please wait a minute before requesting another email.", email: email.data };
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data, options: { emailRedirectTo: callbackUrl("/") } });
  if (error?.status === 429) return { error: "Please wait a minute before requesting another email.", email: email.data };
  return { message: "If that address has an unverified account, we sent a new verification email. Use the newest link.", email: email.data };
}

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
    if (/not confirmed/i.test(error.message))
      return { error: "Please verify your email address first. We can send a new link.", email: email.data, fieldErrors: { unverified: "1" } };
    return { error: "Email or password is incorrect.", email: email.data };
  }
  // Apply saved account preferences to this device (account wins on sign-in).
  const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", data.user.id).maybeSingle();
  if (profile?.preferences && Object.keys(profile.preferences).length) {
    const { updatePrefs } = await import("@/app/actions/prefs");
    await updatePrefs(profile.preferences);
  }
  redirect(safeNext(String(formData.get("next") ?? "/")));
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const ok = (await consume(`forgot:${email.data}`, 1, 60)) && (await consume(`forgot-ip:${await clientIp()}`, 5, 3600));
  if (ok) await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: callbackUrl("/auth/reset") });
  // Same response either way: never reveal whether an account exists.
  return { message: "If an account exists for that address, a password reset link is on its way. The link can be used once." };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  if (!supabase) return UNCONFIGURED;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired or was already used. Please request a new one." };
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { fieldErrors: { password: password.error.issues[0].message } };
  if (password.data !== formData.get("confirm")) return { fieldErrors: { confirm: "Passwords do not match." } };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: "Could not update the password. Please request a new reset link." };
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
