import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/AuthForms";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/auth/sign-in">) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : "/");
  const expired = sp.expired === "1";
  return (
    <AuthShell title="Welcome back" intro={expired ? "Your session ended. Please sign in again." : undefined}>
      <SignInForm next={next} />
      <GoogleButton />
      <div className="mt-6 flex justify-between text-sm text-muted">
        <Link href="/auth/forgot" className="underline">
          Forgot password?
        </Link>
        <Link href="/auth/sign-up" className="underline">
          Create an account
        </Link>
      </div>
    </AuthShell>
  );
}
