import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/AuthForms";
import { getSessionUser } from "@/lib/auth";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPage() {
  const [user, { T }] = await Promise.all([getSessionUser(), getT()]);
  return (
    <AuthShell title={T("Choose a new password", "Choisir un nouveau mot de passe", "اختر كلمة مرور جديدة")}>
      {user ? (
        <ResetForm />
      ) : (
        <p role="alert" className="text-sm">
          {T(
            "This page opens from the link in a password reset email. That link may have expired or already been used. ",
            "Cette page s’ouvre depuis le lien d’un e-mail de réinitialisation. Ce lien a peut-être expiré ou déjà servi. ",
            "تُفتح هذه الصفحة من رابط رسالة إعادة التعيين. ربما انتهت صلاحية الرابط أو استُخدم مسبقًا. ",
          )}
          <Link href="/auth/forgot" className="underline">
            {T("Request a new link", "Demander un nouveau lien", "اطلب رابطًا جديدًا")}
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
