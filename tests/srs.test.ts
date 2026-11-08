import { describe, expect, it } from "vitest";
import { NEW_CARD, schedule, MAX_INTERVAL } from "@/lib/srs";
import { addDays, endOfLocalDay, localDate, startOfLocalDay, daysBetween } from "@/lib/time";

const NOW = new Date("2026-03-10T15:00:00Z");

describe("scheduler", () => {
  it("schedules a new card on first success", () => {
    const g = schedule(NEW_CARD, "good", NOW, "UTC");
    expect(g).toMatchObject({ intervalDays: 1, reps: 1, ease: 2.5 });
    expect(g.dueAt.toISOString()).toBe("2026-03-11T00:00:00.000Z");
    expect(schedule(NEW_CARD, "easy", NOW, "UTC").intervalDays).toBe(4);
    expect(schedule(NEW_CARD, "hard", NOW, "UTC").intervalDays).toBe(1);
  });

  it("grows intervals on repeated success and never shrinks Good", () => {
    let s = { ...NEW_CARD };
    const intervals: number[] = [];
    for (let i = 0; i < 8; i++) {
      s = schedule(s, "good", NOW, "UTC");
      intervals.push(s.intervalDays);
    }
    expect(intervals.slice(0, 3)).toEqual([1, 3, 8]);
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    expect(Math.max(...intervals)).toBeLessThanOrEqual(MAX_INTERVAL);
  });

  it("handles repeated failures with bounded ease and a short relearn step", () => {
    let s = schedule(schedule(NEW_CARD, "good", NOW, "UTC"), "good", NOW, "UTC");
    for (let i = 0; i < 10; i++) s = schedule(s, "again", NOW, "UTC");
    expect(s).toMatchObject({ intervalDays: 0, reps: 0, lapses: 10, ease: 1.3 });
    expect(s.dueAt.getTime() - NOW.getTime()).toBe(10 * 60000);
    // Recovery restarts the ladder.
    expect(schedule(s, "good", NOW, "UTC").intervalDays).toBe(1);
  });

  it("caps long intervals", () => {
    const s = schedule({ intervalDays: 300, ease: 3, reps: 10, lapses: 0 }, "easy", NOW, "UTC");
    expect(s.intervalDays).toBe(MAX_INTERVAL);
  });

  it("is deterministic", () => {
    expect(schedule(NEW_CARD, "good", NOW, "Europe/Paris")).toEqual(schedule(NEW_CARD, "good", NOW, "Europe/Paris"));
  });

  it("uses the user's local day boundary", () => {
    // 15:00 UTC on Mar 10 is already Mar 11 in Tokyo (UTC+9 -> 00:00).
    const tokyo = schedule(NEW_CARD, "good", NOW, "Asia/Tokyo");
    expect(localDate(NOW, "Asia/Tokyo")).toBe("2026-03-11");
    expect(tokyo.dueAt.toISOString()).toBe("2026-03-11T15:00:00.000Z"); // Mar 12 00:00 JST
    const la = schedule(NEW_CARD, "good", NOW, "America/Los_Angeles");
    expect(la.dueAt.toISOString()).toBe("2026-03-11T07:00:00.000Z"); // Mar 11 00:00 PDT
  });
});

describe("timezone helpers", () => {
  it("handles DST transitions", () => {
    // US DST starts 2026-03-08; midnight is still standard time (UTC-8).
    expect(startOfLocalDay("2026-03-08", "America/Los_Angeles").toISOString()).toBe("2026-03-08T08:00:00.000Z");
    expect(startOfLocalDay("2026-03-09", "America/Los_Angeles").toISOString()).toBe("2026-03-09T07:00:00.000Z");
  });

  it("computes end of local day and date arithmetic", () => {
    expect(endOfLocalDay(NOW, "UTC").toISOString()).toBe("2026-03-11T00:00:00.000Z");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(daysBetween("2026-01-01", "2026-03-01")).toBe(59);
  });

  it("falls back to UTC for invalid timezones", () => {
    expect(localDate(NOW, "Not/AZone")).toBe("2026-03-10");
  });

  it("keeps a due card due after a timezone change (absolute instants)", () => {
    const s = schedule(NEW_CARD, "good", NOW, "UTC"); // due 2026-03-11T00:00Z
    const later = new Date("2026-03-11T02:00:00Z");
    // Moving to Los Angeles: end of their local day (Mar 10 PDT) is 07:00Z Mar 11, so the card is due.
    expect(s.dueAt <= endOfLocalDay(later, "America/Los_Angeles")).toBe(true);
  });
});
