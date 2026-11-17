import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/AuthForms";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { getT } from "@/lib/request";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignUpPage() {
  const { T } = await getT();
  return (
    <AuthShell
      title={T("Create your account", "Créer votre compte", "أنشئ حسابك")}
      intro={
        <>
          {T(
            "An account lets you save bookmarks, notes, flashcards, plan progress, and a private prayer journal. We only ask for an email and password. ",
            "Un compte permet d’enregistrer signets, notes, cartes, progression des plans et un journal de prière privé. Nous demandons seulement un e-mail et un mot de passe. ",
            "يتيح لك الحساب حفظ الإشارات والملاحظات والبطاقات وتقدّم الخطط ودفتر صلاة خاصًا. نطلب فقط بريدًا إلكترونيًا وكلمة مرور. ",
          )}
          <Link href="/privacy" className="underline">
            {T("What we store", "Ce que nous conservons", "ما الذي نحفظه")}
          </Link>
        </>
      }
    >
      <SignUpForm />
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted">
        {T("Already have an account?", "Vous avez déjà un compte ?", "لديك حساب؟")}{" "}
        <Link href="/auth/sign-in" className="underline">
          {T("Sign in", "Se connecter", "تسجيل الدخول")}
        </Link>
      </p>
    </AuthShell>
  );
}
