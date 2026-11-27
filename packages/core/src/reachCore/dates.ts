// Dates and times (REACH Core R6, June bug B13).
// A Moment (when something happened) is a number of milliseconds in UTC.
// A CalendarDate (an expiry, a course done) is a plain "YYYY-MM-DD" with no time at all, so it can never slip a day.

export type Moment = number;
export type CalendarDate = string;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's calendar date at the base, in its own time zone (from the country settings). */
export function todayIn(timeZone: string, now: Moment = Date.now()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(now));
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function isCalendarDate(s: unknown): s is CalendarDate {
  if (typeof s !== "string") return false;
  const m = ISO.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Whole days from a to b (b − a). Both are plain dates, so no time zone can move them. */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  if (!isCalendarDate(a) || !isCalendarDate(b)) throw new Error(`Not a calendar date: ${a} / ${b}`);
  const ms = (s: string) => { const m = ISO.exec(s)!; return Date.UTC(+m[1], +m[2] - 1, +m[3]); };
  return Math.round((ms(b) - ms(a)) / 86400000);
}

export type ExpiryKind = "none" | "expired" | "today" | "tomorrow" | "soon" | "ok";
export const SOON_DAYS = 60;

/** How an expiry date looks today: the same answer in PNG and in Peru (B13). */
export function expiryStatus(expiry: CalendarDate | null | undefined, today: CalendarDate): { kind: ExpiryKind; days: number | null } {
  if (!expiry) return { kind: "none", days: null };
  const days = daysBetween(today, expiry);
  if (days < 0) return { kind: "expired", days };
  if (days === 0) return { kind: "today", days };
  if (days === 1) return { kind: "tomorrow", days };
  if (days <= SOON_DAYS) return { kind: "soon", days };
  return { kind: "ok", days };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "27 Nov 2026" (long) or "27/11/2026" (short), from the country setting. */
export function formatCalendarDate(d: CalendarDate, style: "long" | "short" = "long"): string {
  const m = ISO.exec(d);
  if (!m) return d;
  return style === "short" ? `${m[3]}/${m[2]}/${m[1]}` : `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
}

/** "Friday 27 November 2026" for the Home screen. */
export function formatDayLong(d: CalendarDate): string {
  const m = ISO.exec(d);
  if (!m) return d;
  const wd = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
  return `${WEEKDAYS[wd]} ${+m[3]} ${MONTHS_LONG[+m[2] - 1]} ${m[1]}`;
}

/** A moment shown as the base's local time, 24-hour ("16:14"), whatever the computer's own clock is set to (R6). */
export function formatTimeIn(moment: Moment, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(moment));
}
