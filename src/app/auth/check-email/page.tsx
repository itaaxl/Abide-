import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { CodeForm, ResendForm } from "@/components/auth/AuthForms";
import { EMAIL_CODES, OTP_EXPIRY_MINUTES, OTP_LENGTH } from "@/lib/auth-config";
import { getT } from "@/lib/request";
import { emailSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default async function CheckEmailPage({ searchParams }: PageProps<"/auth/check-email">) {
  const sp = await searchParams;
  const { T } = await getT();
  const parsed = emailSchema.safeParse(sp.email);
  const email = parsed.success ? parsed.data : null;
  return (
    <AuthShell
      title={T("Check your email", "Vérifiez votre messagerie", "تحقّق من بريدك")}
      intro={
        <>
          {T("We sent an email", "Nous avons envoyé un e-mail", "أرسلنا رسالة")}
          {email ? (
            <>
              {T(" to ", " à ", " إلى ")}
              <strong className="text-ink">{email}</strong>
            </>
          ) : null}
          .{" "}
          {T(
            "If you’re new, it verifies your account. If this address already has an Abide account, it contains a sign-in code instead. ",
            "Si vous êtes nouveau, il vérifie votre compte. Si cette adresse a déjà un compte Abide, il contient plutôt un code de connexion. ",
            "إن كنت جديدًا فهي لتأكيد حسابك. وإن كان لهذا العنوان حساب في Abide، فهي تحتوي على رمز دخول. ",
          )}
          {EMAIL_CODES
            ? T(`Tap its button, or enter the ${OTP_LENGTH}-digit code below.`, `Touchez son bouton ou saisissez le code à ${OTP_LENGTH} chiffres ci-dessous.`, `اضغط زرّها أو أدخل الرمز المكوّن من ${OTP_LENGTH} أرقام أدناه.`)
            : T("Tap its button.", "Touchez son bouton.", "اضغط زرّها.")}
        </>
      }
    >
      <ul className="mb-6 list-disc space-y-1 ps-5 text-sm text-muted">
        <li>
          {T(
            `It works once and expires after ${OTP_EXPIRY_MINUTES} minutes. Only the newest email is valid.`,
            `Il ne sert qu’une fois et expire après ${OTP_EXPIRY_MINUTES} minutes. Seul le plus récent est valide.`,
            `يعمل مرة واحدة وتنتهي صلاحيته بعد ${OTP_EXPIRY_MINUTES} دقيقة. أحدث رسالة فقط صالحة.`,
          )}
        </li>
        <li>
          {T(
            "Check your spam or promotions folder if it hasn’t arrived in a few minutes.",
            "Vérifiez vos courriers indésirables s’il n’arrive pas d’ici quelques minutes.",
            "تحقّق من مجلد الرسائل غير المرغوبة إن لم تصل خلال دقائق.",
          )}
        </li>
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
