import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClientRaw } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

/**
 * Per-request Supabase client acting as the signed-in user. Row-level
 * security applies to every query made with it.
 */
export async function createClient() {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const cookieStore = await cookies();
  return createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes sessions instead.
        }
      },
    },
  });
}

/**
 * Privileged client using the service-role key. Server-only; used for
 * account deletion, quota counters, and admin aggregates. Never import from
 * client components.
 */
export function createAdminClient() {
  const cfg = supabaseConfig();
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cfg || !serviceKey) return null;
  return createAdminClientRaw(cfg.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
