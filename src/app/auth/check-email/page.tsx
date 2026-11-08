import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResendForm } from "@/components/auth/AuthForms";
import { emailSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: PageProps<"/auth/check-email">) {
  const sp = await searchParams;
  const parsed = emailSchema.safeParse(sp.email);
  const email = parsed.success ? parsed.data : null;
  return (
    <AuthShell
      title="Check your email"
      intro={
        <>
          We sent a verification link{email ? <> to <strong className="text-ink">{email}</strong></> : null}. Open it on this device to
          finish creating your account. Saving notes, flashcards, and journal entries unlocks after verification.
        </>
      }
    >
      <ul className="mb-6 list-disc space-y-1 ps-5 text-sm text-muted">
        <li>The link can be used once and expires after a limited time.</li>
        <li>Check your spam or promotions folder if it hasn’t arrived in a few minutes.</li>
      </ul>
      {email && <ResendForm email={email} initialCooldown={60} />}
    </AuthShell>
  );
}
