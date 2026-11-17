"use client";

import { useState } from "react";
import { site } from "@/config/site";
import { useT } from "./LocaleProvider";

/**
 * Optional gentle reminder. There is no push server and nothing is tracked:
 * this creates a repeating event in the person's own calendar app (.ics),
 * which they can change or delete there at any time.
 */
export function DailyReminder() {
  const T = useT();
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("08:00");
  const [what, setWhat] = useState<"read" | "cards">("read");
  const [days, setDays] = useState<"daily" | "weekdays">("daily");
  const [done, setDone] = useState(false);

  function download() {
    const [hh, mm] = time.split(":");
    const now = new Date();
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const origin = typeof location !== "undefined" ? location.origin : site.url;
    const path = what === "read" ? "/bible" : "/flashcards";
    const summary = what === "read" ? T("Time with Scripture", "Un moment avec l’Écriture", "وقت مع الكتاب المقدس") : T("Today’s verse", "Le verset du jour", "آية اليوم");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${site.name}//Reminder//EN`,
      "BEGIN:VEVENT",
      `UID:reminder-${what}-${date}-${hh}${mm}@${new URL(origin).hostname}`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART:${date}T${hh}${mm}00`,
      "DURATION:PT10M",
      days === "daily" ? "RRULE:FREQ=DAILY" : "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
      `SUMMARY:${site.name}: ${summary}`,
      `DESCRIPTION:${origin}${path}`,
      `URL:${origin}${path}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${summary}`,
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "abide-reminder.ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 30000);
    setDone(true);
  }

  if (!open)
    return (
      <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {T("Gentle reminder", "Rappel discret", "تذكير لطيف")}
      </button>
    );

  return (
    <section aria-labelledby="reminder-h" className="w-full rounded-2xl border border-rule bg-surface p-4">
      <h2 id="reminder-h" className="text-sm font-semibold">
        {T("A gentle reminder", "Un rappel discret", "تذكير لطيف")}
      </h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="r-what" className="label">
            {T("Remind me to", "Me rappeler de", "ذكّرني بـ")}
          </label>
          <select id="r-what" className="input w-auto" value={what} onChange={(e) => setWhat(e.target.value as "read" | "cards")}>
            <option value="read">{T("Read the Bible", "Lire la Bible", "قراءة الكتاب المقدس")}</option>
            <option value="cards">{T("See today’s verse", "Voir le verset du jour", "رؤية آية اليوم")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="r-days" className="label">
            {T("When", "Quand", "متى")}
          </label>
          <select id="r-days" className="input w-auto" value={days} onChange={(e) => setDays(e.target.value as "daily" | "weekdays")}>
            <option value="daily">{T("Every day", "Tous les jours", "كل يوم")}</option>
            <option value="weekdays">{T("Weekdays", "En semaine", "أيام الأسبوع")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="r-time" className="label">
            {T("Time", "Heure", "الوقت")}
          </label>
          <input id="r-time" type="time" className="input w-auto" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button type="button" className="btn btn-primary" onClick={download}>
          {T("Add to my calendar", "Ajouter à mon agenda", "أضف إلى تقويمي")}
        </button>
      </div>
      <p role="status" className="mt-2 text-xs text-muted">
        {done
          ? T(
              "Open the downloaded file to add it to your calendar. You can change or delete it there any time.",
              "Ouvrez le fichier téléchargé pour l’ajouter à votre agenda. Vous pourrez le modifier ou le supprimer à tout moment.",
              "افتح الملف المنزّل لإضافته إلى تقويمك. يمكنك تعديله أو حذفه في أي وقت.",
            )
          : T(
              "Your own calendar app reminds you — no notifications from us, no tracking, no streaks.",
              "C’est votre agenda qui vous le rappelle — pas de notifications de notre part, pas de suivi, pas de séries.",
              "تقويمك هو من يذكّرك — لا إشعارات منّا، ولا تتبّع، ولا ضغط للاستمرار.",
            )}
      </p>
    </section>
  );
}
