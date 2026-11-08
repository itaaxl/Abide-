"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/annotations";
import { withUser } from "@/lib/actions-util";
import { getPlans } from "@/lib/content";
import { listEditionIds } from "@/lib/bible/provider";
import { addDays, localDate, safeTimezone } from "@/lib/time";

async function userToday(supabase: Parameters<Parameters<typeof withUser>[0]>[0]["supabase"], userId: string) {
  const { data } = await supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle();
  return localDate(new Date(), safeTimezone(data?.timezone));
}

export async function enrollPlan(slug: string, edition: string): Promise<ActionResult> {
  const plan = (await getPlans()).find((p) => p.slug === slug);
  if (!plan || !(await listEditionIds()).includes(edition)) return { ok: false, error: "Unknown plan or translation." };
  return withUser(async ({ supabase, user }) => {
    const { error } = await supabase
      .from("plan_enrollments")
      .insert({ user_id: user.id, plan_slug: slug, edition, start_date: await userToday(supabase, user.id) });
    if (error?.code === "23505") return { ok: false, error: "You are already following this plan." };
    if (error) return { ok: false, error: "Could not start the plan." };
    revalidatePath(`/plans/${slug}`);
    return { ok: true };
  });
}

export async function setPlanStatus(enrollmentId: string, status: "active" | "paused" | "left"): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(enrollmentId).success || !["active", "paused", "left"].includes(status)) return { ok: false, error: "Invalid request." };
  return withUser(async ({ supabase }) => {
    const { error } = await supabase.from("plan_enrollments").update({ status, updated_at: new Date().toISOString() }).eq("id", enrollmentId);
    if (error) return { ok: false, error: "Could not update the plan." };
    revalidatePath("/plans", "layout");
    return { ok: true };
  });
}

/** Mark a day complete or not. Explicit only — opening a reading never marks it. */
export async function markPlanDay(enrollmentId: string, day: number, complete: boolean): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(enrollmentId).success || !Number.isInteger(day) || day < 1 || day > 1000) return { ok: false, error: "Invalid day." };
  return withUser(async ({ supabase, user }) => {
    const { data: enr } = await supabase.from("plan_enrollments").select("plan_slug").eq("id", enrollmentId).maybeSingle();
    const plan = enr && (await getPlans()).find((p) => p.slug === enr.plan_slug);
    if (!plan || day > plan.days.length) return { ok: false, error: "Invalid day." };
    const { error } = complete
      ? await supabase.from("plan_progress").upsert({ enrollment_id: enrollmentId, user_id: user.id, day }, { onConflict: "enrollment_id,day", ignoreDuplicates: true })
      : await supabase.from("plan_progress").delete().eq("enrollment_id", enrollmentId).eq("day", day);
    if (error) return { ok: false, error: "Could not save progress." };
    const { count } = await supabase.from("plan_progress").select("day", { count: "exact", head: true }).eq("enrollment_id", enrollmentId);
    await supabase
      .from("plan_enrollments")
      .update({ status: count === plan.days.length ? "completed" : "active", updated_at: new Date().toISOString() })
      .eq("id", enrollmentId)
      .neq("status", "left");
    revalidatePath(`/plans/${plan.slug}`);
    return { ok: true };
  });
}

/** Catch up: move the schedule so the first unfinished day is today. Completed days are kept. */
export async function shiftPlanSchedule(enrollmentId: string): Promise<ActionResult> {
  if (!z.string().uuid().safeParse(enrollmentId).success) return { ok: false, error: "Invalid request." };
  return withUser(async ({ supabase, user }) => {
    const { data: done } = await supabase.from("plan_progress").select("day").eq("enrollment_id", enrollmentId);
    const completed = new Set((done ?? []).map((d) => d.day));
    let next = 1;
    while (completed.has(next)) next++;
    const today = await userToday(supabase, user.id);
    const { error } = await supabase
      .from("plan_enrollments")
      .update({ start_date: addDays(today, -(next - 1)), status: "active", updated_at: new Date().toISOString() })
      .eq("id", enrollmentId);
    if (error) return { ok: false, error: "Could not shift the schedule." };
    revalidatePath("/plans", "layout");
    return { ok: true };
  });
}
