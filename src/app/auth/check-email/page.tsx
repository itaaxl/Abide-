import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { CodeForm, ResendForm } from "@/components/auth/AuthForms";
import { EMAIL_CODES, OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/auth-config";
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
          We sent an email{email ? <> to <strong className="text-ink">{email}</strong></> : null}. If you’re new, it verifies your account. If this
          address already has an Abide account, it contains a sign-in code instead. {EMAIL_CODES ? `Tap its button, or enter the ${OTP_LENGTH}-digit code below.` : "Tap its button."}
        </>
      }
    >
      <ul className="mb-6 list-disc space-y-1 ps-5 text-sm text-muted">
        <li>{EMAIL_CODES ? "The code and button work" : "The button works"} once and expire after {OTP_EXPIRY_MINUTES} minutes. Only the newest email is valid.</li>
        <li>Check your spam or promotions folder if it hasn’t arrived in a few minutes.</li>
      </ul>
      {email && (
        <div className="space-y-4">
          {EMAIL_CODES && <CodeForm email={email} purpose="signup" />}
          <ResendForm email={email} initialCooldown={60} />
        </div>
      )}
    </AuthShell>
  );
}
