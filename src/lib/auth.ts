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
 * The current user, or null. Cached per request.
 *
 * Uses getClaims(): the access token's signature is verified locally against
 * the project's published signing key (ES256), so ordinary page loads need no
 * round trip to the auth server. The proxy refreshes expired tokens before
 * the page renders. Email confirmation is required on this project, so a
 * session only exists for confirmed accounts; the token's email_verified flag
 * is still checked, with a server lookup in the rare case it is absent.
 * Sensitive operations (admin, account deletion) use getVerifiedUser().
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const meta = (claims.user_metadata ?? {}) as { email_verified?: boolean };
  const [verified, { data: profile }] = await Promise.all([
    meta.email_verified === true ? Promise.resolve(true) : supabase.auth.getUser().then((r) => Boolean(r.data.user?.email_confirmed_at)),
    supabase.from("profiles").select("display_name, role").eq("id", claims.sub).maybeSingle(),
  ]);
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    emailVerified: verified,
    displayName: profile?.display_name ?? null,
    isAdmin: profile?.role === "admin",
  };
});

/** Like getSessionUser, but confirmed with the auth server (detects revoked sessions). */
export async function getVerifiedUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const base = await getSessionUser();
  if (!base || base.id !== data.user.id) return null;
  return { ...base, emailVerified: Boolean(data.user.email_confirmed_at) };
}

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
  const strict = await getVerifiedUser();
  if (!strict?.isAdmin) throw new AuthError("forbidden");
  return ctx;
}
