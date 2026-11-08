"use client";

import { useEffect } from "react";
import { updatePrefs } from "@/app/actions/prefs";

/**
 * Records the browser's timezone in the preferences cookie once, so the
 * daily verse and study-day boundaries follow the visitor's local day.
 */
export function TimezoneSync({ current }: { current: string }) {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== current && sessionStorage.getItem("abide:tz") !== tz) {
        sessionStorage.setItem("abide:tz", tz);
        void updatePrefs({ timezone: tz });
      }
    } catch {
      /* ignore */
    }
  }, [current]);
  return null;
}
