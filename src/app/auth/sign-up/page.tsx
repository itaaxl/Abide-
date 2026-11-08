import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/AuthForms";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      intro={
        <>
          An account lets you save bookmarks, notes, flashcards, plan progress, and a private prayer journal. We only ask for an
          email and password. <Link href="/privacy" className="underline">What we store</Link>
        </>
      }
    >
      <SignUpForm />
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
