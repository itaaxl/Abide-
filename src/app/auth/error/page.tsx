import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { EMAIL_CODES } from "@/lib/auth-config";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Link problem", robots: { index: false } };

export default async function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  const sp = await searchParams;
  const { T } = await getT();
  const MESSAGES: Record<string, string> = {
    expired: T(
      "This link has expired or has already been used. Links and codes from our emails work once and expire after 15 minutes, and only the newest email is valid.",
      "Ce lien a expiré ou a déjà servi. Les liens et codes de nos e-mails ne servent qu’une fois, expirent après 15 minutes, et seul le plus récent est valide.",
      "انتهت صلاحية هذا الرابط أو استُخدم مسبقًا. تعمل الروابط والرموز مرة واحدة وتنتهي بعد 15 دقيقة، وأحدث رسالة فقط صالحة.",
    ),
    invalid: T("This link isn’t valid. It may have been copied incompletely.", "Ce lien n’est pas valide. Il a peut-être été copié incomplètement.", "هذا الرابط غير صالح. ربما نُسخ بشكل ناقص."),
    oauth: T("We couldn’t complete sign-in with that provider.", "Impossible de terminer la connexion avec ce fournisseur.", "تعذّر إكمال تسجيل الدخول عبر هذا المزوّد."),
  };
  const reason = typeof sp.reason === "string" && sp.reason in MESSAGES ? sp.reason : "invalid";
  return (
    <AuthShell title={T("That link didn’t work", "Ce lien n’a pas fonctionné", "لم يعمل هذا الرابط")}>
      <p role="alert">{MESSAGES[reason]}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/auth/sign-in" className="btn btn-primary">
          {EMAIL_CODES ? T("Get a new sign-in code", "Obtenir un nouveau code", "احصل على رمز دخول جديد") : T("Sign in again", "Se reconnecter", "سجّل الدخول مجددًا")}
        </Link>
        <Link href="/auth/forgot" className="btn">
          {T("Request a password reset", "Réinitialiser le mot de passe", "طلب إعادة تعيين كلمة المرور")}
        </Link>
      </div>
    </AuthShell>
  );
}
