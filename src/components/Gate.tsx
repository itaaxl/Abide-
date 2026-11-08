import Link from "next/link";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Server-side gate for private pages. Returns the verified user, or a panel
 * explaining exactly what is needed. Data access is separately enforced by
 * server actions and row-level security.
 */
export async function gate(next: string, feature: string): Promise<{ user: SessionUser; panel: null } | { user: null; panel: React.ReactElement }> {
  if (!isSupabaseConfigured())
    return {
      user: null,
      panel: (
        <Panel title={feature}>
          Personal features need accounts, which are not configured on this deployment yet. Reading, search, and the daily verse work
          without an account.
        </Panel>
      ),
    };
  const user = await getSessionUser();
  if (!user)
    return {
      user: null,
      panel: (
        <Panel title={feature}>
          <p>Sign in to use {feature.toLowerCase()}. Your data is private to your account.</p>
          <div className="mt-4 flex gap-2">
            <Link className="btn btn-primary" href={`/auth/sign-in?next=${encodeURIComponent(next)}`}>
              Sign in
            </Link>
            <Link className="btn" href="/auth/sign-up">
              Create account
            </Link>
          </div>
        </Panel>
      ),
    };
  if (!user.emailVerified)
    return {
      user: null,
      panel: (
        <Panel title={feature}>
          Please verify your email address to use personal features. Check your inbox for the link, or{" "}
          <Link className="underline" href={`/auth/check-email?email=${encodeURIComponent(user.email)}`}>
            resend it
          </Link>
          .
        </Panel>
      ),
    };
  return { user, panel: null };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <div className="card p-8">
        <h1 className="font-serif text-3xl">{title}</h1>
        <div className="mt-3 text-muted">{children}</div>
      </div>
    </div>
  );
}

export function PrivateBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rule px-2 py-0.5 text-xs text-muted">
      <span aria-hidden="true">🔒</span> Private — only you can see this
    </span>
  );
}
