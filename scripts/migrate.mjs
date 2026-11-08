/**
 * Applies supabase/migrations/*.sql in order, once each, recording them in
 * abide_meta.migrations (a schema not exposed through the Supabase API).
 *
 * Runs automatically before `next build` on Vercel (see "vercel-build" in
 * package.json) when the Supabase integration provides a direct database URL.
 * Without a database URL it does nothing, so local builds and guest-only
 * deployments still work. A failing migration fails the build, so broken
 * code is never deployed against an old schema.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL;
if (!url) {
  console.log("migrate: no POSTGRES_URL_NON_POOLING/DATABASE_URL set — skipping database migrations.");
  process.exit(0);
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const sql = postgres(url, { max: 1, ssl: /localhost|127\.0\.0\.1|\/var\/|host=\//.test(url) ? false : "require", onnotice: () => {} });

try {
  await sql`create schema if not exists abide_meta`;
  await sql`revoke all on schema abide_meta from public`;
  await sql`create table if not exists abide_meta.migrations (name text primary key, applied_at timestamptz not null default now())`;
  const done = new Set((await sql`select name from abide_meta.migrations`).map((r) => r.name));
  for (const f of files) {
    if (done.has(f)) continue;
    const body = readFileSync(path.join(dir, f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into abide_meta.migrations (name) values (${f})`;
    });
    console.log(`migrate: applied ${f}`);
  }
  console.log(`migrate: database is up to date (${files.length} migration file(s)).`);
} catch (e) {
  // Never print the connection string.
  console.error(`migrate: FAILED — ${e.message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
