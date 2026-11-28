// F13.6 — loading the medics' Excel lists, after the check (Q26 = A, A, A; Head Doctor rule, 28 Nov).
// 1. For each row, the newest month that has a number is the amount on hand; the preview shows which month.
// 2. Each sheet is a place: the bag with the same name, the Store for the stock-take sheet, or else a new bag named after
//    the sheet. The person importing can change it in the preview, or skip a sheet.
// 3. Controlled drugs never come in as ordinary stock: rows of an item that is already a controlled drug, and rows the
//    importer marks as a suspected one, wait for the Head Doctor; everything else loads at once.

import type { Checked, CheckedRow } from "./stockList";

export interface PlacePick { kind: "place"; id: string }
export type Target = PlacePick | { kind: "new"; name: string } | { kind: "skip" };
export interface KnownPlace { id: string; name: string; kind?: unknown; state?: unknown }
export interface KnownItem { id: string; name: string; unit?: unknown; controlled?: unknown; state?: unknown }
export interface PlanRow { key: string; sheet: string; row: number; item: string; itemId: string | null; unit: string; qty: number; month: string | null; lot: string; expiry: string | null; required: number | null; waits: "controlled" | "suggested" | null }
export interface PlanSheet { name: string; target: Target; rows: PlanRow[] }
export interface Plan { sheets: PlanSheet[]; load: number; waiting: number; newItems: number; newBags: string[]; skipped: number }

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
export const rowKey = (r: { sheet: string; row: number }) => `${r.sheet}#${r.row}`;

/** Where a sheet goes unless the importer changes it (Q26 part 2 = A). */
export function defaultTarget(sheet: string, fileName: string, places: KnownPlace[]): Target {
  const active = places.filter(p => p.state === undefined || p.state === "Active");
  const same = active.find(p => norm(p.name) === norm(sheet));
  if (same) return { kind: "place", id: same.id };
  const store = active.find(p => p.kind === "store");
  if (store && (/store|stock ?take/i.test(sheet) || (/^sheet ?\d*$/i.test(sheet.trim()) && /store|stock ?take/i.test(fileName)))) return { kind: "place", id: store.id };
  return { kind: "new", name: sheet.trim().replace(/\s+/g, " ") };
}

/** The newest month with a number (Q26 part 1 = A); a row with no number anywhere comes in at 0. */
export function newestCount(r: CheckedRow, labels: string[]): { qty: number; month: string | null } {
  for (let i = r.counts.length - 1; i >= 0; i--) { const v = r.counts[i]; if (typeof v === "number" && Number.isFinite(v)) return { qty: Math.max(0, Math.round(v)), month: labels[i] ?? null }; }
  return { qty: 0, month: null };
}

export function planImport(c: Checked, fileName: string, places: KnownPlace[], items: KnownItem[], choices: { targets?: Record<string, Target>; suggested?: Set<string> } = {}): Plan {
  const byName = new Map(items.filter(i => i.state === undefined || i.state === "Active").map(i => [norm(i.name), i]));
  // B35: an archived controlled drug is still a controlled drug; it never comes back in as ordinary stock
  const controlledNames = new Set(items.filter(i => i.controlled === true).map(i => norm(i.name)));
  const placeKind = (t: Target) => t.kind === "new" ? "bag" : t.kind === "place" ? places.find(p => p.id === t.id)?.kind : null;
  const sheets: PlanSheet[] = [];
  const newItems = new Set<string>(), newBags = new Set<string>();
  let load = 0, waiting = 0, skipped = 0;
  for (const s of c.sheets) {
    if (!s.columns || !s.rows.length) continue;
    const target = choices.targets?.[s.name] ?? defaultTarget(s.name, fileName, places);
    const labels = s.columns.counts.map(k => k.label);
    const bag = placeKind(target) !== "store";
    const rows: PlanRow[] = s.rows.map(r => {
      const it = byName.get(norm(r.tidied));
      const { qty, month } = newestCount(r, labels);
      const key = rowKey(r);
      const waits = it?.controlled === true || controlledNames.has(norm(r.tidied)) ? "controlled" as const : choices.suggested?.has(key) ? "suggested" as const : null;
      return { key, sheet: s.name, row: r.row, item: r.tidied, itemId: it?.id ?? null, unit: r.unit, qty, month, lot: r.lot, expiry: r.expiry || null, required: bag ? r.required ?? null : null, waits };
    });
    if (target.kind === "skip") { skipped += rows.length; }
    else {
      if (target.kind === "new") newBags.add(target.name);
      for (const r of rows) { if (r.waits) waiting++; else load++; if (!r.itemId) newItems.add(norm(r.item)); }
    }
    sheets.push({ name: s.name, target, rows });
  }
  return { sheets, load, waiting, newItems: newItems.size, newBags: [...newBags], skipped };
}
