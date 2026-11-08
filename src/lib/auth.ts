import "server-only";
import { cache } from "react";
import { createClient } from "./supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  isAdmin: boolean;
}

/**
 * The current user, verified with the auth server (getUser), or null.
 * Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const u = data.user;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", u.id)
    .maybeSingle();
  return {
    id: u.id,
    email: u.email ?? "",
    emailVerified: Boolean(u.email_confirmed_at),
    displayName: profile?.display_name ?? null,
    isAdmin: profile?.role === "admin",
  };
});

export class AuthError extends Error {
  constructor(public code: "unconfigured" | "signed-out" | "unverified" | "forbidden") {
    super(code);
  }
}

/** Server-side gate for private data and signed-in AI features. */
export async function requireVerifiedUser() {
  const supabase = await createClient();
  if (!supabase) throw new AuthError("unconfigured");
  const user = await getSessionUser();
  if (!user) throw new AuthError("signed-out");
  if (!user.emailVerified) throw new AuthError("unverified");
  return { user, supabase };
}

export async function requireAdmin() {
  const ctx = await requireVerifiedUser();
  if (!ctx.user.isAdmin) throw new AuthError("forbidden");
  return ctx;
}
