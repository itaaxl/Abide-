import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Email verification / password recovery / OAuth callback.
 * Supports both the token_hash flow (recommended email templates) and the
 * PKCE `code` flow. Only allowlisted relative destinations are honoured.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  let next = safeNext(url.searchParams.get("next"));
  const fail = (reason: string) => NextResponse.redirect(new URL(`/auth/error?reason=${reason}`, url.origin));

  if (url.searchParams.get("error")) return fail(/expired/i.test(url.searchParams.get("error_description") ?? "") ? "expired" : "invalid");

  const supabase = await createClient();
  if (!supabase) return fail("invalid");

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return fail(/expired|invalid/i.test(error.message) ? "expired" : "invalid");
    if (type === "recovery") next = "/auth/reset";
    return NextResponse.redirect(new URL(next, url.origin));
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("expired");
    return NextResponse.redirect(new URL(next, url.origin));
  }
  return fail("invalid");
}
