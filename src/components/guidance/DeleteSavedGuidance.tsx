"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteSavedGuidance } from "@/app/actions/guidance";
import { useT } from "../LocaleProvider";

export function DeleteSavedGuidance({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const T = useT();
  return (
    <button
      className="btn btn-sm btn-ghost btn-danger mt-3"
      disabled={pending} aria-busy={pending}
      onClick={() =>
        confirm(T("Delete this saved guidance?", "Supprimer cette aide enregistrée ?", "حذف هذا الإرشاد المحفوظ؟")) &&
        start(async () => {
          const r = await deleteSavedGuidance(id);
          if (r.ok) router.refresh();
        })
      }
    >
      {T("Delete", "Supprimer", "حذف")}
    </button>
  );
}
