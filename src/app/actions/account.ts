"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/app/auth/actions";
import { AuthError, requireVerifiedUser } from "@/lib/auth";
import { authErrorMessage } from "@/lib/actions-util";
import { LOCALES, THEMES } from "@/lib/prefs";
import { clientIp, consume } from "@/lib/rate-limit";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/prefs";
import { updatePrefs } from "./prefs";
import { listEditionIds } from "@/lib/bible/provider";

const settingsSchema = z.object({
  displayName: z.string().trim().max(80),
  locale: z.enum(LOCALES),
  edition: z.string(),
  theme: z.enum(THEMES),
  fontSize: z.coerce.number().int().min(14).max(30),
  timezone: z.string().max(64).refine(isValidTimezone, "Unknown timezone."),
  dailyTarget: z.coerce.number().int().min(1).max(200),
});

export async function saveSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (!(await listEditionIds()).includes(v.edition)) return { error: "Unknown translation." };
  try {
    const { supabase, user } = await requireVerifiedUser();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: v.displayName || null, timezone: v.timezone, daily_review_target: v.dailyTarget, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) return { error: "Could not save settings." };
    await updatePrefs({ locale: v.locale, edition: v.edition, theme: v.theme, fontSize: v.fontSize, timezone: v.timezone });
    return { message: "Settings saved." };
  } catch (e) {
    return { error: authErrorMessage(e) };
  }
}

/**
 * Permanently delete the account. Requires re-entering the password
 * (reauthentication) and typing DELETE. Deleting the auth user cascades to
 * every application table (foreign keys use ON DELETE CASCADE).
 */
export async function deleteAccountAction(_: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE to confirm." };
  try {
    const { user } = await requireVerifiedUser();
    if (!(await consume(`delete:${await clientIp()}`, 5, 3600))) return { error: "Too many attempts. Try again later." };
    const supabase = (await createClient())!;
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user.email, password: String(formData.get("password") ?? "") });
    if (authErr) return { error: "Password is incorrect." };
    const admin = createAdminClient();
    if (!admin)
      return {
        error:
          "Self-service deletion is not available because the server key is not configured. Please contact the site operator; see the privacy policy for the manual process.",
      };
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return { error: "Deletion failed. Nothing was removed; please try again or contact the operator." };
    await supabase.auth.signOut();
  } catch (e) {
    if (e instanceof AuthError) return { error: authErrorMessage(e) };
    return { error: "Deletion failed." };
  }
  redirect("/?deleted=1");
}
