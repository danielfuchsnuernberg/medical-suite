// F11 — Stock takes (June J9): a frozen, dated copy of every count, like the monthly columns in the old spreadsheets.
// The copy keeps names as they were, so a line removed since still reads properly.

import { csvCell } from "./readiness";
import type { CalendarDate } from "../reachCore/dates";

export interface TakeLine { lineId: string; itemId: string; item: string; place: string; lot: string; expiry: CalendarDate | null; qty: number; required: number | null }
export interface StockTake { id: string; name: string; at: number; createdBy: string; lines: TakeLine[] }

export type NowState = "same" | "changed" | "archived" | "deleted";
export interface ThenNow { line: TakeLine; now: number | null; change: number | null; state: NowState }

/** Then vs now for every frozen line (F11.2). A line archived or deleted since shows as removed, with which. */
export function thenVsNow(take: Pick<StockTake, "lines">, current: (lineId: string) => { qty: unknown; state?: unknown } | undefined): ThenNow[] {
  return take.lines.map(line => {
    const c = current(line.lineId);
    if (!c) return { line, now: null, change: null, state: "deleted" as const };
    if (c.state !== "Active") return { line, now: null, change: null, state: "archived" as const };
    const now = Number(c.qty);
    return { line, now, change: now - line.qty, state: now === line.qty ? "same" as const : "changed" as const };
  });
}

/** The stock take as a spreadsheet file (F11.3). Dates are the base's own (frozen on, expiry as stored), never the computer's. */
export function stockTakeCsv(take: Pick<StockTake, "name" | "lines">, rows: ThenNow[], frozenOn: CalendarDate, frozenAt: string, by: string): string {
  const head = ["Stock take", "Frozen on", "Frozen at", "By", "Item", "Place", "Lot", "Expiry", "Counted then", "Now", "Change"];
  const out = [head.map(csvCell).join(",")];
  for (const r of rows) {
    const now = r.state === "deleted" ? "deleted since" : r.state === "archived" ? "archived since" : r.now;
    out.push([take.name, frozenOn, frozenAt, by, r.line.item, r.line.place, r.line.lot, r.line.expiry ?? "", r.line.qty, now, r.change ?? ""].map(csvCell).join(","));
  }
  return "﻿" + out.join("\r\n") + "\r\n";
}

/** "stock-take-november-2026-2026-11-28.csv" */
export function stockTakeFileName(name: string, frozenOn: CalendarDate): string {
  const s = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stock-take";
  return `${s.startsWith("stock-take") ? s : "stock-take-" + s}-${frozenOn}.csv`;
}
