import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Link problem", robots: { index: false } };

const MESSAGES: Record<string, string> = {
  expired: "This link has expired or has already been used. Links from our emails work once and only for a limited time.",
  invalid: "This link isn’t valid. It may have been copied incompletely.",
  oauth: "We couldn’t complete sign-in with that provider.",
};

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const sp = await searchParams;
  const reason = typeof sp.reason === "string" && sp.reason in MESSAGES ? sp.reason : "invalid";
  return (
    <AuthShell title="That link didn’t work">
      <p role="alert">{MESSAGES[reason]}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/auth/sign-in" className="btn btn-primary">
          Sign in (and resend verification)
        </Link>
        <Link href="/auth/forgot" className="btn">
          Request a password reset
        </Link>
      </div>
    </AuthShell>
  );
}
