"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollPlan, markPlanDay, setPlanStatus, shiftPlanSchedule } from "@/app/actions/plans";
import { useMsg, useT } from "./LocaleProvider";

function ErrorText({ error, inline = false }: { error: string | null; inline?: boolean }) {
  const msg = useMsg();
  if (!error) return null;
  return inline ? <span role="alert" className="text-sm text-danger">{msg(error)}</span> : <p role="alert" className="w-full text-sm text-danger">{msg(error)}</p>;
}

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Something went wrong. Please try again."));
      if (r.ok) router.refresh();
    });
  return { pending, run, error };
}

export function EnrollButton({ slug, edition, canEnroll }: { slug: string; edition: string; canEnroll: boolean }) {
  const { pending, run, error } = useRun();
  const T = useT();
  if (!canEnroll) return null;
  return (
    <>
      <button className="btn btn-primary" disabled={pending} aria-busy={pending} onClick={() => run(() => enrollPlan(slug, edition))}>
        {T("Start this plan", "Commencer ce plan", "ابدأ هذه الخطة")}
      </button>
      <ErrorText error={error} />
    </>
  );
}

export function EnrollmentControls({ id, status, behind }: { id: string; status: string; behind: boolean }) {
  const { pending, run, error } = useRun();
  const T = useT();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "paused" ? (
        <button className="btn btn-sm btn-primary" disabled={pending} aria-busy={pending} onClick={() => run(() => setPlanStatus(id, "active"))}>{T("Resume", "Reprendre", "استئناف")}</button>
      ) : status === "active" ? (
        <button className="btn btn-sm" disabled={pending} aria-busy={pending} onClick={() => run(() => setPlanStatus(id, "paused"))}>{T("Pause", "Pause", "إيقاف مؤقت")}</button>
      ) : null}
      {behind && (
        <button className="btn btn-sm" disabled={pending} aria-busy={pending} onClick={() => run(() => shiftPlanSchedule(id))}>
          {T("Shift schedule to start from today", "Recommencer le programme aujourd’hui", "أجّل الجدول ليبدأ اليوم")}
        </button>
      )}
      <button className="btn btn-sm btn-ghost btn-danger" disabled={pending} aria-busy={pending} onClick={() => confirm(T("Leave this plan? Your completed days will no longer be shown.", "Quitter ce plan ? Vos jours terminés ne seront plus affichés.", "مغادرة هذه الخطة؟ لن تُعرض الأيام التي أنجزتها.")) && run(() => setPlanStatus(id, "left"))}>
        {T("Leave plan", "Quitter le plan", "مغادرة الخطة")}
      </button>
      <ErrorText error={error} />
    </div>
  );
}

export function DayToggle({ enrollmentId, day, done }: { enrollmentId: string; day: number; done: boolean }) {
  const [checked, setChecked] = useState(done);
  const { pending, run, error } = useRun();
  const T = useT();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        className={`btn btn-sm ${checked ? "btn-primary" : ""}`}
        aria-pressed={checked}
        disabled={pending} aria-busy={pending}
        onClick={() => {
          const next = !checked;
          setChecked(next);
          run(async () => {
            const r = await markPlanDay(enrollmentId, day, next);
            if (!r.ok) setChecked(!next);
            return r;
          });
        }}
      >
        {checked ? T("✓ Completed", "✓ Lu", "✓ تمّت القراءة") : T("Mark as read", "Marquer comme lu", "علّم كمقروء")}
      </button>
      <ErrorText error={error} inline />
    </span>
  );
}
