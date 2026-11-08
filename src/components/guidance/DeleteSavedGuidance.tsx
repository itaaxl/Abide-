"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteSavedGuidance } from "@/app/actions/guidance";

export function DeleteSavedGuidance({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      className="btn btn-sm btn-ghost btn-danger mt-3"
      disabled={pending}
      onClick={() =>
        confirm("Delete this saved guidance?") &&
        start(async () => {
          const r = await deleteSavedGuidance(id);
          if (r.ok) router.refresh();
        })
      }
    >
      Delete
    </button>
  );
}
