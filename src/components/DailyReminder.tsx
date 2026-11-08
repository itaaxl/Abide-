"use client";

import { useState } from "react";
import { site } from "@/config/site";

/**
 * Optional daily reminder. This site has no push server, so instead of
 * asking for notification permission we offer a calendar reminder file that
 * works in any calendar app. Nothing is requested until the user opts in.
 */
export function DailyReminder() {
  const [time, setTime] = useState("08:00");
  const [open, setOpen] = useState(false);

  function download() {
    const [hh, mm] = time.split(":");
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${site.name}//Daily Verse//EN`,
      "BEGIN:VEVENT",
      `UID:daily-verse-${date}@${new URL(site.url).hostname}`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART:${date}T${hh}${mm}00`,
      "DURATION:PT5M",
      "RRULE:FREQ=DAILY",
      `SUMMARY:${site.name}: daily verse`,
      `DESCRIPTION:Read today's verse: ${site.url}/daily`,
      `URL:${site.url}/daily`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "daily-verse-reminder.ics";
    a.click();
  }

  return (
    <section className="card p-5" aria-labelledby="reminder">
      <h2 id="reminder" className="font-serif text-xl">
        Daily reminder (optional)
      </h2>
      {!open ? (
        <button className="btn btn-sm mt-3" onClick={() => setOpen(true)}>
          Set up a gentle reminder
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="rtime" className="label">
              Time
            </label>
            <input id="rtime" type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={download}>
            Add to my calendar (.ics)
          </button>
          <p className="w-full text-sm text-muted">
            Your calendar app will remind you each day. You can remove the event at any time. We don’t send push notifications.
          </p>
        </div>
      )}
    </section>
  );
}
