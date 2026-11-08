import "server-only";
import { AuthError, requireVerifiedUser } from "./auth";
import type { ActionResult } from "./annotations";
import { getEdition } from "./bible/provider";

export function authErrorMessage(e: unknown): string {
  if (e instanceof AuthError) {
    switch (e.code) {
      case "unconfigured":
        return "Accounts are not configured on this site yet.";
      case "signed-out":
        return "Please sign in to save.";
      case "unverified":
        return "Please verify your email address first.";
      case "forbidden":
        return "You do not have permission to do that.";
    }
  }
  return "Could not save. Please try again.";
}

/** Run an authenticated, verified-user action and map failures to safe messages. */
export async function withUser<T>(
  fn: (ctx: Awaited<ReturnType<typeof requireVerifiedUser>>) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await fn(await requireVerifiedUser());
  } catch (e) {
    if (!(e instanceof AuthError)) console.error("action failed", (e as Error)?.message);
    return { ok: false, error: authErrorMessage(e) };
  }
}

/** Validate that a passage exists in the edition's real data. */
export async function validPassage(edition: string, book: string, chapter: number, from: number, to: number) {
  const e = await getEdition(edition);
  const b = e?.books.find((x) => x.id === book);
  if (!e || !b) return false;
  const max = b.chapters[chapter - 1];
  return Boolean(max) && from >= 1 && to >= from && to <= max;
}
