import { NextResponse } from "next/server";
import { getChapter, listEditionIds } from "@/lib/bible/provider";
import { aiConfig } from "@/lib/guidance/config";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/**
 * Operational health check. Reports availability only — no secrets, no
 * personal data, no configuration values.
 */
export async function GET() {
  const checks: Record<string, "ok" | "unconfigured" | "error"> = {};
  try {
    const ids = await listEditionIds();
    const ch = ids.length ? await getChapter(ids[0], "JHN", 1) : null;
    checks.bible = ch?.verses.length ? "ok" : "error";
  } catch {
    checks.bible = "error";
  }
  checks.auth = isSupabaseConfigured() ? "ok" : "unconfigured";
  const admin = createAdminClient();
  if (!admin) checks.database = isSupabaseConfigured() ? "unconfigured" : "unconfigured";
  else {
    const { error } = await admin.from("content_plans").select("slug", { head: true, count: "exact" });
    checks.database = error ? "error" : "ok";
  }
  checks.ai = aiConfig().enabled ? "ok" : "unconfigured";
  const healthy = checks.bible === "ok" && checks.database !== "error";
  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks, time: new Date().toISOString() }, { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } });
}
