import { googleSignInAction } from "@/app/auth/actions";

/** Rendered only when Google sign-in is configured in Supabase and enabled by env. */
export function GoogleButton() {
  if (process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED !== "true") return null;
  return (
    <form action={googleSignInAction} className="mt-4">
      <div className="rule-ornament my-4 text-xs text-muted">or</div>
      <button className="btn w-full">Continue with Google</button>
    </form>
  );
}
