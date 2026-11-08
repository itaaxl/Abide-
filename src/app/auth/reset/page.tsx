import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/AuthForms";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage() {
  const user = await getSessionUser();
  return (
    <AuthShell title="Choose a new password">
      {user ? (
        <ResetForm />
      ) : (
        <p role="alert" className="text-sm">
          This page opens from the link in a password reset email. That link may have expired or already been used.{" "}
          <Link href="/auth/forgot" className="underline">
            Request a new link
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
