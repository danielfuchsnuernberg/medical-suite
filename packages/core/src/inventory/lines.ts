// F8 — item page rules: amounts, item names, moving stock (June J6; bugs B24, and the June demo 2 checks).

import { isCalendarDate } from "../reachCore/dates";

export type WholeNumber = { ok: true; n: number } | { ok: false; why: string; tooMany?: boolean };

/** B34: no single line holds more than this; a bigger number is a typing mistake. */
export const AMOUNT_LIMIT = 1_000_000;

/**
 * Amounts are whole numbers (demo 2: try 0, −5, 2.7 or an empty box). Q28 = A (B33): a comma or a point is refused, never
 * guessed (“1,000” could be a thousand or one). Every save uses the number this returns, never its own reading (B32).
 */
export function wholeNumber(raw: unknown, o: { min?: number; max?: number; what?: string } = {}): WholeNumber {
  const min = o.min ?? 1, max = o.max ?? Infinity, what = o.what ?? "amount";
  const s = String(raw ?? "").trim();
  if (s === "") return { ok: false, why: `Type the ${what}.` };
  if (/^[-−]?[\d.,\s]*\d[\d.,\s]*$/.test(s) && /[.,\s]/.test(s)) return { ok: false, why: `Whole numbers only. ${s} isn't allowed: type it without commas or points, for example 1000.` };
  if (!/^[-−]?\d+$/.test(s)) return { ok: false, why: `“${s}” isn't a number.` };
  const n = Number(s.replace("−", "-")) || 0;   // “−0” is 0
  if (Math.abs(n) > AMOUNT_LIMIT) return { ok: false, why: `That's more than one line can hold (${AMOUNT_LIMIT.toLocaleString("en")}). Check the number.` };
  if (n < min) return { ok: false, why: min === 1 ? `It has to be at least 1. ${n} isn't allowed.` : `It can't be below ${min}.` };
  if (n > max) return { ok: false, why: `Only ${max} on hand, so ${n} can't be taken.`, tooMany: true };
  return { ok: true, n };
}

/** An item's name: needed, and not already there (any capitals, archived items included). */
export function itemNameProblem(items: { id: string; name?: unknown; state?: unknown }[], name: string, selfId?: string): string | null {
  const n = name.trim().replace(/\s+/g, " ");
  if (!n) return "Give the item a name.";
  const same = items.find(i => i.id !== selfId && String(i.name ?? "").trim().replace(/\s+/g, " ").toLowerCase() === n.toLowerCase());
  if (!same) return null;
  return same.state === "Archived"
    ? `“${String(same.name)}” is already there (archived). Restore it instead.`
    : `“${String(same.name)}” is already there. Open it and add a place instead.`;
}

export interface LineLike { id: string; itemId?: unknown; locationId?: unknown; lot?: unknown; expiry?: unknown; state?: unknown }
const lotOf = (l: LineLike) => String(l.lot ?? "").trim().toLowerCase();
const expOf = (l: LineLike) => (l.expiry ? String(l.expiry) : "");

/** F8.2: where moved stock goes — an active line of the same item in that place with the same lot and expiry, or none (then a new line starts). */
export function matchingLine<T extends LineLike>(lines: T[], from: LineLike, toLocationId: string): T | undefined {
  return lines.find(l => l.id !== from.id && l.state === "Active" && l.itemId === from.itemId && l.locationId === toLocationId && lotOf(l) === lotOf(from) && expOf(l) === expOf(from));
}

/** An expiry from a date box: "" (none) or a real calendar date. Never through the computer's clock (B13). */
export function expiryProblem(v: string): string | null {
  if (v === "") return null;
  return isCalendarDate(v) ? null : `“${v}” isn't a date. Pick it from the calendar.`;
}
