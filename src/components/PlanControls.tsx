"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { enrollPlan, markPlanDay, setPlanStatus, shiftPlanSchedule } from "@/app/actions/plans";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      setError(r.ok ? null : (r.error ?? "Failed"));
      if (r.ok) router.refresh();
    });
  return { pending, run, error };
}

export function EnrollButton({ slug, edition, canEnroll }: { slug: string; edition: string; canEnroll: boolean }) {
  const { pending, run, error } = useRun();
  if (!canEnroll) return null;
  return (
    <>
      <button className="btn btn-primary" disabled={pending} onClick={() => run(() => enrollPlan(slug, edition))}>
        Start this plan
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </>
  );
}

export function EnrollmentControls({ id, status, behind }: { id: string; status: string; behind: boolean }) {
  const { pending, run, error } = useRun();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "paused" ? (
        <button className="btn btn-sm btn-primary" disabled={pending} onClick={() => run(() => setPlanStatus(id, "active"))}>Resume</button>
      ) : status === "active" ? (
        <button className="btn btn-sm" disabled={pending} onClick={() => run(() => setPlanStatus(id, "paused"))}>Pause</button>
      ) : null}
      {behind && (
        <button className="btn btn-sm" disabled={pending} onClick={() => run(() => shiftPlanSchedule(id))}>
          Shift schedule to start from today
        </button>
      )}
      <button className="btn btn-sm btn-ghost btn-danger" disabled={pending} onClick={() => confirm("Leave this plan? Your completed days will no longer be shown.") && run(() => setPlanStatus(id, "left"))}>
        Leave plan
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}

export function DayToggle({ enrollmentId, day, done }: { enrollmentId: string; day: number; done: boolean }) {
  const [checked, setChecked] = useState(done);
  const { pending, run, error } = useRun();
  return (
    <span className="inline-flex items-center gap-2">
      <button
        className={`btn btn-sm ${checked ? "btn-primary" : ""}`}
        aria-pressed={checked}
        disabled={pending}
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
        {checked ? "✓ Completed" : "Mark as read"}
      </button>
      {error && <span role="alert" className="text-sm text-danger">{error}</span>}
    </span>
  );
}
