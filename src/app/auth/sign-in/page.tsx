import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/AuthForms";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { getT } from "@/lib/request";
import { safeNext } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function SignInPage({ searchParams }: PageProps<"/auth/sign-in">) {
  const sp = await searchParams;
  const { T } = await getT();
  const next = safeNext(typeof sp.next === "string" ? sp.next : "/");
  const expired = sp.expired === "1";
  return (
    <AuthShell
      title={T("Welcome back", "Bon retour", "مرحبًا بعودتك")}
      intro={expired ? T("Your session ended. Please sign in again.", "Votre session a pris fin. Reconnectez-vous.", "انتهت جلستك. يرجى تسجيل الدخول مجددًا.") : undefined}
    >
      <SignInForm next={next} />
      <GoogleButton />
      <div className="mt-6 flex justify-between text-sm text-muted">
        <Link href="/auth/forgot" className="underline">
          {T("Forgot password?", "Mot de passe oublié ?", "نسيت كلمة المرور؟")}
        </Link>
        <Link href="/auth/sign-up" className="underline">
          {T("Create an account", "Créer un compte", "إنشاء حساب")}
        </Link>
      </div>
    </AuthShell>
  );
}
