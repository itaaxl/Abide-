import Link from "next/link";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { getT } from "@/lib/request";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const FEATURES: Record<string, [string, string, string]> = {
  "Account settings": ["Account settings", "Paramètres du compte", "إعدادات الحساب"],
  Admin: ["Admin", "Administration", "الإدارة"],
  Decks: ["Decks", "Paquets", "المجموعات"],
  Flashcards: ["Flashcards", "Cartes", "البطاقات"],
  "Saved guidance": ["Saved guidance", "Aides enregistrées", "الإرشادات المحفوظة"],
  "Prayer Journal": ["Prayer Journal", "Journal de prière", "دفتر الصلاة"],
  "My Library": ["My Library", "Ma bibliothèque", "مكتبتي"],
};

/**
 * Server-side gate for private pages. Returns the verified user, or a panel
 * explaining exactly what is needed. Data access is separately enforced by
 * server actions and row-level security.
 */
export async function gate(next: string, featureKey: string): Promise<{ user: SessionUser; panel: null } | { user: null; panel: React.ReactElement }> {
  const { T } = await getT();
  const feature = FEATURES[featureKey] ? T(...FEATURES[featureKey]) : featureKey;
  if (!isSupabaseConfigured())
    return {
      user: null,
      panel: (
        <Panel title={feature}>
          {T(
            "Personal features need accounts, which are not configured on this site yet. Reading, search, and verse cards work without an account.",
            "Les fonctions personnelles nécessitent un compte, pas encore configuré sur ce site. La lecture, la recherche et les cartes fonctionnent sans compte.",
            "الميزات الشخصية تحتاج إلى حسابات غير مفعّلة بعد. القراءة والبحث والبطاقات تعمل دون حساب.",
          )}
        </Panel>
      ),
    };
  const user = await getSessionUser();
  if (!user)
    return {
      user: null,
      panel: (
        <Panel title={feature}>
          <p>
            {T("Sign in to continue. Your data is private to your account.", "Connectez-vous pour continuer. Vos données restent privées.", "سجّل الدخول للمتابعة. بياناتك خاصة بحسابك.")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 [&>a]:whitespace-nowrap">
            <Link className="btn btn-primary" href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>
              {T("Sign in", "Se connecter", "تسجيل الدخول")}
            </Link>
            <Link className="btn" href="/auth/sign-up">
              {T("Create account", "Créer un compte", "إنشاء حساب")}
            </Link>
          </div>
        </Panel>
      ),
    };
  if (!user.emailVerified)
    return {
      user: null,
      panel: (
        <Panel title={feature}>
          {T("Please verify your email address to use personal features. Check your inbox, or ", "Veuillez vérifier votre adresse e-mail pour utiliser les fonctions personnelles. Consultez votre messagerie, ou ", "يرجى تأكيد بريدك الإلكتروني لاستخدام الميزات الشخصية. تحقّق من بريدك، أو ")}
          <Link className="underline" href={`/auth/check-email?email=${encodeURIComponent(user.email)}`}>
            {T("resend it", "renvoyez-le", "أعد الإرسال")}
          </Link>
          .
        </Panel>
      ),
    };
  return { user, panel: null };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-14">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="mt-3 text-muted">{children}</div>
      </div>
    </div>
  );
}

export async function PrivateBadge() {
  const { T } = await getT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rule px-2 py-0.5 text-xs text-muted">
      <span aria-hidden="true">🔒</span> {T("Private — only you can see this", "Privé — visible par vous seul", "خاص — لا يراه غيرك")}
    </span>
  );
}
