import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default async function ForgotPage() {
  const { T } = await getT();
  return (
    <AuthShell
      title={T("Reset your password", "Réinitialiser le mot de passe", "إعادة تعيين كلمة المرور")}
      intro={T(
        "Enter your email and we’ll send a one-time link to choose a new password.",
        "Saisissez votre e-mail : nous enverrons un lien à usage unique pour choisir un nouveau mot de passe.",
        "أدخل بريدك الإلكتروني وسنرسل رابطًا لمرة واحدة لاختيار كلمة مرور جديدة.",
      )}
    >
      <ForgotForm />
    </AuthShell>
  );
}
