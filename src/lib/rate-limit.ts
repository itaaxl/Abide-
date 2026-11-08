import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "./supabase/server";

/**
 * Durable rate limiting backed by the `consume_rate_limit` database function
 * (service role only). If the service key is not configured, a per-instance
 * in-memory limiter is used and the limitation is documented in
 * docs/OPERATIONS.md — it is weaker on serverless platforms.
 */
const memory = new Map<string, { windowStart: number; count: number }>();

export async function consume(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const hashed = createHash("sha256").update(key).digest("hex").slice(0, 40); // no raw emails/IPs stored
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key: hashed,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (!error) return Boolean(data);
  }
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000));
  const cur = memory.get(hashed);
  if (!cur || cur.windowStart !== windowStart) {
    memory.set(hashed, { windowStart, count: 1 });
    return true;
  }
  cur.count += 1;
  return cur.count <= limit;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
