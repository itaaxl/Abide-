"use client";

import { useMsg, useT } from "./LocaleProvider";
import { useActionState } from "react";
import { deleteAccountAction, saveSettingsAction } from "@/app/actions/account";

interface Props {
  defaults: {
    displayName: string;
    locale: string;
    edition: string;
    theme: string;
    fontSize: number;
    timezone: string;
    dailyTarget: number;
  };
  editions: { id: string; label: string }[];
  timezones: string[];
}

export function SettingsForm({ defaults, editions, timezones }: Props) {
  const [state, action, pending] = useActionState(saveSettingsAction, {});
  const T = useT();
  const msg = useMsg();
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="displayName" className="label">{T("Display name (optional)", "Nom affiché (facultatif)", "الاسم الظاهر (اختياري)")}</label>
        <input id="displayName" name="displayName" className="input" maxLength={80} defaultValue={defaults.displayName} />
      </div>
      <div>
        <label htmlFor="locale" className="label">{T("Interface language", "Langue de l’interface", "لغة الواجهة")}</label>
        <select id="locale" name="locale" className="input" defaultValue={defaults.locale}>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </div>
      <div>
        <label htmlFor="edition" className="label">{T("Default translation", "Traduction par défaut", "الترجمة الافتراضية")}</label>
        <select id="edition" name="edition" className="input" defaultValue={defaults.edition}>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="theme" className="label">{T("Reading theme", "Thème de lecture", "سمة القراءة")}</label>
        <select id="theme" name="theme" className="input" defaultValue={defaults.theme}>
          <option value="light">{T("Light", "Clair", "فاتح")}</option>
          <option value="sepia">{T("Sepia", "Sépia", "بني فاتح")}</option>
          <option value="dark">{T("Dark", "Sombre", "داكن")}</option>
        </select>
      </div>
      <div>
        <label htmlFor="fontSize" className="label">{T("Text size (px)", "Taille du texte (px)", "حجم النص (بكسل)")}</label>
        <input id="fontSize" name="fontSize" type="number" min={14} max={30} className="input" defaultValue={defaults.fontSize} />
      </div>
      <div>
        <label htmlFor="timezone" className="label">{T("Timezone", "Fuseau horaire", "المنطقة الزمنية")}</label>
        <select id="timezone" name="timezone" className="input" defaultValue={defaults.timezone}>
          {timezones.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dailyTarget" className="label">{T("Daily flashcard goal", "Objectif quotidien de cartes", "هدف البطاقات اليومي")}</label>
        <input id="dailyTarget" name="dailyTarget" type="number" min={1} max={200} className="input" defaultValue={defaults.dailyTarget} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending} aria-busy={pending}>{T("Save settings", "Enregistrer", "حفظ الإعدادات")}</button>
        <p role="status" className={state.error ? "text-danger" : "text-success"}>{msg(state.error ?? state.message)}</p>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, {});
  const T = useT();
  const msg = useMsg();
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm">
        {T(
          "This permanently deletes your account and all bookmarks, highlights, notes, flashcards, plan progress, journal entries, saved guidance, and watchlist items. It cannot be undone. Consider exporting your data first.",
          "Cela supprime définitivement votre compte et tous vos signets, surlignages, notes, cartes, progression, entrées de journal, aides enregistrées et liste à regarder. C’est irréversible. Pensez à exporter vos données d’abord.",
          "سيحذف هذا حسابك نهائيًا مع كل الإشارات والتظليلات والملاحظات والبطاقات وتقدّم الخطط ومدخلات الدفتر والإرشادات المحفوظة وقائمة المشاهدة. لا يمكن التراجع. فكّر في تصدير بياناتك أولًا.",
        )}
      </p>
      <div>
        <label htmlFor="del-pw" className="label">{T("Current password", "Mot de passe actuel", "كلمة المرور الحالية")}</label>
        <input id="del-pw" name="password" type="password" autoComplete="current-password" className="input" aria-describedby="del-pw-help" />
        <p id="del-pw-help" className="mt-1 text-xs text-muted">
          {T(
            "No password? If you signed in with an email code in the last 15 minutes, leave this empty.",
            "Pas de mot de passe ? Si vous vous êtes connecté avec un code dans les 15 dernières minutes, laissez vide.",
            "لا توجد كلمة مرور؟ إن سجّلت الدخول برمز البريد خلال آخر 15 دقيقة فاترك الحقل فارغًا.",
          )}
        </p>
      </div>
      <div>
        <label htmlFor="del-confirm" className="label">{T("Type DELETE to confirm", "Tapez DELETE pour confirmer", "اكتب DELETE للتأكيد")}</label>
        <input id="del-confirm" name="confirm" required className="input" autoComplete="off" />
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{msg(state.error)}</p>}
      <button className="btn btn-danger" disabled={pending} aria-busy={pending}>
        {T("Delete my account permanently", "Supprimer définitivement mon compte", "احذف حسابي نهائيًا")}
      </button>
    </form>
  );
}
