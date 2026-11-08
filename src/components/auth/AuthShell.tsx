import { isSupabaseConfigured } from "@/lib/supabase/config";

export function AuthShell({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card p-6 sm:p-8">
        <h1 className="font-serif text-3xl">{title}</h1>
        {intro && <div className="mt-2 text-muted">{intro}</div>}
        <div className="mt-6">
          {isSupabaseConfigured() ? (
            children
          ) : (
            <p role="status" className="rounded-lg border border-rule bg-gold-soft/30 p-4 text-sm">
              Accounts are not configured on this deployment yet (Supabase environment variables are missing). Reading, search,
              the daily verse, reading plan previews, and the Watch page all work without an account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
