// F15 — Training and certificates (June J3, demo batch 4). Rules only.
// A training record links a person to a course: Required → (In progress) → Done on a date, with an expiry worked out
// from the course's "valid for (months)". Dates are plain calendar dates (B13), so no time zone can move them.
// - F15.1 status: Valid, Expires in N days (30 or fewer), Expired, Required, In progress (Done when a course never expires).
// - F15.2 an expired certificate can be renewed, a valid one renewed early (the June B20: it never could).
// - F15.3 expiry is month-safe: 31 Jan + 1 month = 28/29 Feb, never 3 March (the June B26).
// - F15.4 archived people are offered no courses.
// - F15.5 a completion date can't be in the future.

import { daysBetween, isCalendarDate, type CalendarDate } from "../reachCore/dates";

export const DUE_DAYS = 30;
export type TrainingKind = "required" | "inprogress" | "done" | "valid" | "soon" | "expired";
export interface TrainingStatus { kind: TrainingKind; label: string; days: number | null }
type Rec = { id?: string; personId?: unknown; courseId?: unknown; status?: unknown; completedOn?: unknown; expires?: unknown; state?: unknown };
type Course = { id: string; name?: unknown; validMonths?: unknown; state?: unknown };
type Person = { id: string; state?: unknown };

/** F15.3: add whole months to a calendar date; a day the new month doesn't have becomes its last day. */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  if (!isCalendarDate(date)) throw new Error(`Not a calendar date: ${date}`);
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const idx = y * 12 + (m - 1) + Math.trunc(months);
  const ny = Math.floor(idx / 12), nm = idx % 12;
  const last = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${String(ny).padStart(4, "0")}-${String(nm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export const validMonthsOf = (c: Course | undefined): number | null => {
  const n = Number(c?.validMonths);
  return c && c.validMonths !== null && c.validMonths !== undefined && c.validMonths !== "" && Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/** The expiry for a course done on `completedOn`, or null when the course never expires. */
export function expiryFor(completedOn: CalendarDate, course: Course | undefined): CalendarDate | null {
  const m = validMonthsOf(course);
  return m === null ? null : addMonths(completedOn, m);
}

/** F15.1 */
export function trainingStatus(r: Rec, today: CalendarDate): TrainingStatus {
  if (r.status === "required") return { kind: "required", label: "Required", days: null };
  if (r.status === "in progress") return { kind: "inprogress", label: "In progress", days: null };
  if (!isCalendarDate(r.expires)) return { kind: "done", label: "Done", days: null };
  const d = daysBetween(today, r.expires);
  if (d < 0) return { kind: "expired", label: "Expired", days: d };
  if (d <= DUE_DAYS) return { kind: "soon", label: d === 0 ? "Expires today" : d === 1 ? "Expires tomorrow" : `Expires in ${d} days`, days: d };
  return { kind: "valid", label: "Valid", days: d };
}

/** One line for the staff list: the worst of a person's courses. */
export function personTrainingSummary(recs: Rec[], today: CalendarDate): { kind: "expired" | "due" | "ok" | "none"; label: string } {
  const s = recs.filter(r => r.state === undefined || r.state === "Active").map(r => trainingStatus(r, today).kind);
  if (!s.length) return { kind: "none", label: "No courses" };
  if (s.includes("expired")) return { kind: "expired", label: "Expired certificate" };
  if (s.includes("soon") || s.includes("required")) return { kind: "due", label: "Due soon / required" };
  return { kind: "ok", label: "All valid" };
}

/** F15.5: why this completion date can't be saved, or null. */
export function completionProblem(date: unknown, today: CalendarDate): string | null {
  if (!isCalendarDate(date)) return "Pick the date it was done.";
  if (daysBetween(today, date) > 0) return "A completion date can't be in the future.";
  if (daysBetween(date, today) > 366 * 50) return "That date is too long ago.";
  return null;
}

/** F15.4: the courses that can still be assigned to this person (none for archived people). */
export function coursesOffered(person: Person, courses: Course[], recs: Rec[]): Course[] {
  if (person.state !== "Active") return [];
  const have = new Set(recs.filter(r => r.personId === person.id && (r.state === undefined || r.state === "Active")).map(r => r.courseId));
  return courses.filter(c => (c.state === undefined || c.state === "Active") && !have.has(c.id));
}

/** Staff screen stats: certificates expired and due within 30 days, for active people only (B26). */
export function trainingCounts(people: Person[], recs: Rec[], today: CalendarDate): { expired: number; due: number } {
  const active = new Set(people.filter(p => p.state === "Active").map(p => p.id));
  let expired = 0, due = 0;
  for (const r of recs) {
    if (!active.has(String(r.personId)) || (r.state !== undefined && r.state !== "Active")) continue;
    const k = trainingStatus(r, today).kind;
    if (k === "expired") expired++; else if (k === "soon") due++;
  }
  return { expired, due };
}
