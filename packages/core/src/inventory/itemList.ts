// B74 (A5, Q41 = A) — the Item list: one row per item (the catalogue), with its stock added up over every place.
// Store and bags lists stock lines (one per item, place and lot); this answers "how much do we have in total, and where".

import type { CalendarDate } from "../reachCore/dates";
import { stockStatus, csvCell, type StockLine } from "./readiness";

export interface CatalogueItem { id: string; itemNo?: unknown; name?: unknown; categoryId?: unknown; unit?: unknown; controlled?: unknown; state?: unknown }
/** "below": the total is under zero (two computers offline); "out": nothing on hand anywhere; "low": some line is under its
 *  required amount or reorder level; "none": no line has an amount set; "ok": every line with an amount set has it. */
export type ItemStatus = "below" | "out" | "low" | "none" | "ok";
export interface ItemRow { id: string; itemNo: string; name: string; categoryId: string | null; unit: string; controlled: boolean; archived: boolean;
  total: number; places: number; nextExpiry: CalendarDate | null; status: ItemStatus }

/** `lines`: the active lines in active places. `isStore(locationId)` tells the Store (reorder level) from a bag (required amount). */
export function itemRows(items: CatalogueItem[], lines: StockLine[], isStore: (locationId: string) => boolean): ItemRow[] {
  const by = new Map<string, StockLine[]>();
  for (const l of lines) { const a = by.get(l.itemId); if (a) a.push(l); else by.set(l.itemId, [l]); }
  return items.map(it => {
    const ls = by.get(it.id) ?? [];
    const total = ls.reduce((s, l) => s + Number(l.qty), 0);
    const places = new Set(ls.filter(l => Number(l.qty) !== 0 || l.required !== null && l.required !== undefined).map(l => l.locationId)).size;
    const dated = ls.filter(l => Number(l.qty) > 0 && l.expiry).map(l => String(l.expiry)).sort();
    const st = ls.map(l => stockStatus(l, { store: isStore(l.locationId) }));
    const status: ItemStatus = total < 0 ? "below" : total === 0 ? "out" : st.some(s => s === "low" || s === "out") ? "low" : st.every(s => s === "none") ? "none" : "ok";
    return { id: it.id, itemNo: String(it.itemNo ?? ""), name: String(it.name ?? ""), categoryId: it.categoryId ? String(it.categoryId) : null, unit: String(it.unit ?? ""),
      controlled: it.controlled === true, archived: it.state !== undefined && it.state !== "Active", total, places, nextExpiry: (dated[0] as CalendarDate) ?? null, status };
  });
}

export interface ItemFilter { q?: string; categoryId?: string; archived?: boolean }
/** Search by name or item number; a category; archived items only when asked. Sorted by name. */
export function filterItems(rows: ItemRow[], f: ItemFilter): ItemRow[] {
  const q = (f.q ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return rows.filter(r => (f.archived || !r.archived) && (!f.categoryId || r.categoryId === f.categoryId)
    && (!q || r.name.toLowerCase().replace(/\s+/g, " ").includes(q) || r.itemNo.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name) || a.itemNo.localeCompare(b.itemNo));
}

export const ITEM_STATUS_WORD: Record<ItemStatus, string> = { below: "Below zero: count it", out: "Out of stock", low: "Short somewhere", none: "No amount set", ok: "In stock" };
export const ITEMS_CSV_HEADER = ["Item no.", "Item", "Category", "Unit", "Controlled drug", "Total on hand", "Places", "Next expiry", "Stock", "Archived"];

/** The CSV of exactly the rows shown, in that order (same guards as the lines CSV: formulas never run, Excel reads × and –). */
export function itemsCsv(rows: ItemRow[], category: (id: string) => string): string {
  const out = [ITEMS_CSV_HEADER.map(csvCell).join(",")];
  for (const r of rows) out.push([r.itemNo, r.name, r.categoryId ? category(r.categoryId) : "", r.unit, r.controlled ? "yes" : "", r.total, r.places, r.nextExpiry ?? "", ITEM_STATUS_WORD[r.status], r.archived ? "yes" : ""].map(csvCell).join(","));
  return "﻿" + out.join("\r\n") + "\r\n";
}
