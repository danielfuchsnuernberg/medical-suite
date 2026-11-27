import { describe, it, expect } from "vitest";
import { todayIn, daysBetween, expiryStatus, formatCalendarDate, formatDayLong, isCalendarDate } from "../src/reachCore/dates";

describe("todayIn: today follows the base's time zone (F1.5, B13, R6)", () => {
  // 27 Nov 2026, 13:30 UTC = 23:30 in Port Moresby (UTC+10) = 08:30 in Lima (UTC−5)
  const t = Date.UTC(2026, 10, 27, 13, 30);
  it("PNG is still 27 Nov at 23:30", () => expect(todayIn("Pacific/Port_Moresby", t)).toBe("2026-11-27"));
  it("PNG becomes 28 Nov one hour later", () => expect(todayIn("Pacific/Port_Moresby", t + 3600000)).toBe("2026-11-28"));
  it("Lima is 27 Nov the same moment", () => expect(todayIn("America/Lima", t)).toBe("2026-11-27"));
  it("Lima at 21:00 local (02:00 UTC next day) is still 27 Nov", () => expect(todayIn("America/Lima", Date.UTC(2026, 10, 28, 2, 0))).toBe("2026-11-27"));
});

describe("expiryStatus: the June B13 cases", () => {
  it("PNG at 11:00 on the expiry day: expires today, not expired", () => {
    const today = todayIn("Pacific/Port_Moresby", Date.UTC(2026, 10, 27, 1, 0)); // 11:00 PGT
    expect(expiryStatus("2026-11-27", today).kind).toBe("today");
  });
  it("Peru at 21:00 the evening before: expires tomorrow, not expired", () => {
    const today = todayIn("America/Lima", Date.UTC(2026, 10, 26, 2, 0)); // 25 Nov 21:00 Lima
    expect(expiryStatus("2026-11-26", today).kind).toBe("tomorrow");
  });
  it("kinds", () => {
    expect(expiryStatus(null, "2026-11-27").kind).toBe("none");
    expect(expiryStatus("2026-11-20", "2026-11-27")).toEqual({ kind: "expired", days: -7 });
    expect(expiryStatus("2027-01-26", "2026-11-27")).toEqual({ kind: "soon", days: 60 });
    expect(expiryStatus("2027-01-27", "2026-11-27")).toEqual({ kind: "ok", days: 61 });
  });
});

describe("plain calendar dates", () => {
  it("daysBetween across a month end and a leap day", () => {
    expect(daysBetween("2027-01-31", "2027-02-28")).toBe(28);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });
  it("refuses impossible dates", () => {
    expect(isCalendarDate("2027-02-30")).toBe(false);
    expect(isCalendarDate("1900-01-05")).toBe(true);
    expect(() => daysBetween("31/01/2027", "2027-02-01")).toThrow();
  });
  it("formats", () => {
    expect(formatCalendarDate("2026-11-27")).toBe("27 Nov 2026");
    expect(formatCalendarDate("2026-11-27", "short")).toBe("27/11/2026");
    expect(formatDayLong("2026-11-27")).toBe("Friday 27 November 2026");
  });
});
