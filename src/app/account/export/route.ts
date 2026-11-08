import { NextResponse } from "next/server";
import { AuthError, requireVerifiedUser } from "@/lib/auth";

/**
 * Personal data export (JSON). Includes every user-owned record. Read with the
 * user's own session, so row-level security limits it to their data.
 */
const TABLES = [
  "profiles",
  "bookmarks",
  "highlights",
  "notes",
  "reading_positions",
  "reading_history",
  "decks",
  "cards",
  "reviews",
  "plan_enrollments",
  "plan_progress",
  "prayer_entries",
  "saved_guidance",
  "watchlist",
  "ai_usage",
] as const;

export async function GET() {
  try {
    const { supabase, user } = await requireVerifiedUser();
    const out: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      account: { id: user.id, email: user.email },
      note: "Scripture text is referenced by edition and passage; it is public-domain text available on the site.",
    };
    for (const t of TABLES) {
      const { data, error } = await supabase.from(t).select("*");
      out[t] = error ? { error: "unavailable" } : data;
    }
    return new NextResponse(JSON.stringify(out, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="abide-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (e) {
    const status = e instanceof AuthError && e.code !== "unconfigured" ? 401 : 503;
    return NextResponse.json({ error: "Sign in with a verified account to export your data." }, { status, headers: { "cache-control": "no-store" } });
  }
}
