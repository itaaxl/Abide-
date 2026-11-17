import type { Metadata } from "next";
import Link from "next/link";
import { DeleteAccountForm, SettingsForm } from "@/components/AccountForms";
import { gate, PrivateBadge } from "@/components/Gate";
import { listEditions } from "@/lib/bible/provider";
import { getPrefs, getT } from "@/lib/request";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const g = await gate("/account", "Account settings");
  if (!g.user) return g.panel;
  const sp = await searchParams;
  const supabase = (await createClient())!;
  const [{ data: profile }, prefs, editions] = await Promise.all([
    supabase.from("profiles").select("display_name, timezone, daily_review_target").eq("id", g.user.id).maybeSingle(),
    getPrefs(),
    listEditions(),
  ]);
  const timezones = Intl.supportedValuesOf("timeZone");
  const { T } = await getT();
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{T("Account settings", "Paramètres du compte", "إعدادات الحساب")}</h1>
        <div className="flex items-center gap-2">
          <PrivateBadge />
          <form action={signOutAction}>
            <button className="btn btn-sm">{T("Sign out", "Se déconnecter", "تسجيل الخروج")}</button>
          </form>
        </div>
      </div>
      {sp.reset === "1" && <p role="status" className="card p-4 text-success">{T("Your password was updated.", "Votre mot de passe a été mis à jour.", "تم تحديث كلمة المرور.")}</p>}
      <section className="card p-6">
        <h2 className="mb-1 text-lg font-semibold tracking-tight">{T("Profile and reading", "Profil et lecture", "الملف والقراءة")}</h2>
        <p className="mb-4 text-sm text-muted">
          {T("Signed in as", "Connecté en tant que", "مسجّل باسم")} <span dir="ltr">{g.user.email}</span>.{" "}
          {T("These preferences sync to every device you sign in on.", "Ces préférences se synchronisent sur tous vos appareils.", "تُزامَن هذه التفضيلات على كل أجهزتك.")}
        </p>
        <SettingsForm
          defaults={{
            displayName: profile?.display_name ?? "",
            locale: prefs.locale,
            edition: prefs.edition,
            theme: prefs.theme,
            fontSize: prefs.fontSize,
            timezone: profile?.timezone ?? prefs.timezone,
            dailyTarget: profile?.daily_review_target ?? 20,
          }}
          editions={editions.map((e) => ({ id: e.id, label: `${e.languageName} — ${e.name}` }))}
          timezones={timezones}
        />
      </section>
      <section className="card p-6">
        <h2 className="text-lg font-semibold tracking-tight">{T("Your data", "Vos données", "بياناتك")}</h2>
        <p className="mt-2 text-sm text-muted">
          {T(
            "Download everything you have saved (bookmarks, highlights, notes, flashcards and reviews, plan progress, journal entries, saved guidance, watchlist) as a JSON file. ",
            "Téléchargez tout ce que vous avez enregistré (signets, surlignages, notes, cartes et révisions, progression, journal, aides, liste) dans un fichier JSON. ",
            "نزّل كل ما حفظته (الإشارات والتظليلات والملاحظات والبطاقات والمراجعات وتقدّم الخطط والدفتر والإرشادات وقائمة المشاهدة) كملف JSON. ",
          )}
          <Link href="/privacy" className="underline">
            {T("What we store", "Ce que nous conservons", "ما الذي نحفظه")}
          </Link>
        </p>
        <a href="/account/export" className="btn mt-4" download>
          {T("Export my data", "Exporter mes données", "تصدير بياناتي")}
        </a>
      </section>
      <section className="card border-danger/40 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-danger">{T("Delete account", "Supprimer le compte", "حذف الحساب")}</h2>
        <div className="mt-3">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}
