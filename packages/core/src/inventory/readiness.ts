// F6 — stock levels and bag readiness (June J4; bugs B1, B10, B25).
// One place works these out; the Overview, the lists and later the item page all ask here.

import { expiryStatus, type CalendarDate } from "../reachCore/dates";

export interface StockLine { id: string; itemId: string; locationId: string; qty: number; required: number | null | undefined; expiry: CalendarDate | null | undefined }

/** "out": none left · "low": below its required amount (bag) or reorder level (Store) · "none": no amount set · "ok": at or above it. */
export type StockStatus = "out" | "low" | "none" | "ok";

/** B1: holding exactly the required amount is OK, not low. B25: no required amount is "none", never OK. B10: the Store uses the same rule with its reorder level. */
export function stockStatus(line: Pick<StockLine, "qty" | "required">): StockStatus {
  const qty = Number(line.qty);
  if (!(qty > 0)) return "out";
  const req = line.required;
  if (req === null || req === undefined || Number.isNaN(Number(req))) return "none";
  return qty < Number(req) ? "low" : "ok";
}

export const isExpired = (line: Pick<StockLine, "expiry">, today: CalendarDate) => expiryStatus(line.expiry ?? null, today).kind === "expired";
/** Expires today, tomorrow or within the "soon" window (60 days); not yet expired. */
export const isExpiringSoon = (line: Pick<StockLine, "expiry">, today: CalendarDate) => ["today", "tomorrow", "soon"].includes(expiryStatus(line.expiry ?? null, today).kind);

export type Verdict = "empty" | "notReady" | "short" | "notSetUp" | "ready";
export interface Readiness { total: number; ok: number; short: number; out: number; expired: number; none: number; verdict: Verdict }

/**
 * A bag is Ready only when every line is at or above its required amount and in date (B1).
 * One line with no required amount makes it "Not set up", never Ready (B25).
 * Out of stock or expired → Not ready; below required → Short.
 */
export function readiness(lines: StockLine[], today: CalendarDate): Readiness {
  const r = { total: lines.length, ok: 0, short: 0, out: 0, expired: 0, none: 0 };
  for (const l of lines) {
    if (isExpired(l, today)) r.expired++;
    const s = stockStatus(l);
    if (s === "out") r.out++; else if (s === "low") r.short++; else if (s === "none") r.none++; else r.ok++;
  }
  const verdict: Verdict = r.total === 0 ? "empty" : (r.out || r.expired) ? "notReady" : r.short ? "short" : r.none ? "notSetUp" : "ready";
  return { ...r, verdict };
}

/** The words on a readiness card. The Store says "Reorder" and "Stocked" where a bag says "Short" and "Ready" (B10). */
export function verdictWord(v: Verdict, store: boolean): string {
  return { empty: "Empty", notReady: "Not ready", short: store ? "Reorder" : "Short", notSetUp: "Not set up", ready: store ? "Stocked" : "Ready" }[v];
}

/** "2 of 3 at or above required · 1 short · …" */
export function readinessLine(r: Readiness, store: boolean): string {
  if (r.total === 0) return "no lines";
  const bits = [`${r.ok} of ${r.total} ${store ? "at or above reorder level" : "at or above required"}`];
  if (r.short) bits.push(`${r.short} ${store ? "below reorder level" : "short"}`);
  if (r.out) bits.push(`${r.out} out`);
  if (r.expired) bits.push(`${r.expired} expired`);
  if (r.none) bits.push(`${r.none} with no ${store ? "reorder level" : "required amount"}`);
  return bits.join(" · ");
}

/** What a card or warning on the Overview opens: the lines it means (F6.1). */
export interface LineFilter { locationId?: string; stock?: StockStatus; expiry?: "expired" | "expiredOrSoon" }
export function matches(line: StockLine, f: LineFilter, today: CalendarDate): boolean {
  if (f.locationId && line.locationId !== f.locationId) return false;
  if (f.stock && stockStatus(line) !== f.stock) return false;
  if (f.expiry === "expired" && !isExpired(line, today)) return false;
  if (f.expiry === "expiredOrSoon" && !(isExpired(line, today) || isExpiringSoon(line, today))) return false;
  return true;
}

/** The Overview's numbers, from the active lines. */
export function overview(lines: StockLine[], today: CalendarDate) {
  const count = (f: LineFilter) => lines.filter(l => matches(l, f, today)).length;
  const expired = count({ expiry: "expired" });
  return {
    itemTypes: new Set(lines.map(l => l.itemId)).size,
    units: lines.reduce((s, l) => s + (Number(l.qty) > 0 ? Number(l.qty) : 0), 0),
    out: count({ stock: "out" }),
    low: count({ stock: "low" }),
    none: count({ stock: "none" }),
    expired,
    soon: count({ expiry: "expiredOrSoon" }) - expired,
    soonest: lines.filter(l => l.expiry && (isExpired(l, today) || isExpiringSoon(l, today))).sort((a, b) => String(a.expiry).localeCompare(String(b.expiry))).slice(0, 6),
  };
}
