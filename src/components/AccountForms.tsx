"use client";

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
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="displayName" className="label">Display name (optional)</label>
        <input id="displayName" name="displayName" className="input" maxLength={80} defaultValue={defaults.displayName} />
      </div>
      <div>
        <label htmlFor="locale" className="label">Interface language</label>
        <select id="locale" name="locale" className="input" defaultValue={defaults.locale}>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </div>
      <div>
        <label htmlFor="edition" className="label">Default translation</label>
        <select id="edition" name="edition" className="input" defaultValue={defaults.edition}>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="theme" className="label">Reading theme</label>
        <select id="theme" name="theme" className="input" defaultValue={defaults.theme}>
          <option value="light">Light</option>
          <option value="sepia">Sepia</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div>
        <label htmlFor="fontSize" className="label">Text size (px)</label>
        <input id="fontSize" name="fontSize" type="number" min={14} max={30} className="input" defaultValue={defaults.fontSize} />
      </div>
      <div>
        <label htmlFor="timezone" className="label">Timezone</label>
        <select id="timezone" name="timezone" className="input" defaultValue={defaults.timezone}>
          {timezones.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="dailyTarget" className="label">Daily flashcard goal</label>
        <input id="dailyTarget" name="dailyTarget" type="number" min={1} max={200} className="input" defaultValue={defaults.dailyTarget} />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary" disabled={pending}>Save settings</button>
        <p role="status" className={state.error ? "text-danger" : "text-success"}>{state.error ?? state.message}</p>
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, {});
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm">
        This permanently deletes your account and all bookmarks, highlights, notes, flashcards, plan progress, journal entries,
        saved guidance, and watchlist items. It cannot be undone. Consider exporting your data first.
      </p>
      <div>
        <label htmlFor="del-pw" className="label">Current password</label>
        <input id="del-pw" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <div>
        <label htmlFor="del-confirm" className="label">Type DELETE to confirm</label>
        <input id="del-confirm" name="confirm" required className="input" autoComplete="off" />
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button className="btn btn-danger" disabled={pending}>Delete my account permanently</button>
    </form>
  );
}
