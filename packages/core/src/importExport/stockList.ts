// F13.6 — the medics' Excel stock lists, checked before anything is loaded (B6).
// Each sheet is one place (the Store sheet, or a bag). Columns are found by their header, whatever each sheet calls them.
// Problems are listed per row; a blocking one has to be fixed in the spreadsheet itself, so the medics' file stays the truth.

import type { Sheet } from "./xlsx";
import { excelDate } from "./xlsx";
import { isCalendarDate } from "../reachCore/dates";

export type Col = "item" | "unit" | "lot" | "expiry" | "required" | "section";
export interface Columns { item: number; unit?: number; lot?: number; expiry?: number; required?: number; section?: number; counts: { index: number; label: string }[] }
export interface Flag { text: string; blocking: boolean }
export interface CheckedRow { sheet: string; row: number; item: string; tidied: string; unit: string; lot: string; expiry: string; required: number | null; counts: (number | null)[]; flags: Flag[] }
export interface CheckedSheet { name: string; header: number; columns: Columns | null; rows: CheckedRow[]; note?: string }
export interface Checked { sheets: CheckedSheet[]; rows: number; blocking: number; notes: number }

const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim().toLowerCase();
const HEAD: Record<Col, RegExp> = {
  item: /^(medication.*consumables|.*consu?ables?.*|list items|items?( list)?|item list|list|consuable & medication list|list of consuables)$/,
  unit: /^unit(e)?s?$/,
  lot: /^(batch( number)?|lot( number)?)$/,
  expiry: /^(exp(iry)?( date)?)$/,
  required: /^(required( qty| quantity)?|sta[nr]dard( quantity)?|par)$/,
  section: /^(sections?|bag compartment)$/,
};
const MONTH = /^(soh\b.*|order .*|jan|feb|mar|apr|apri|april|may|jun|june|jul|july|aug|sep|sept|oct|nov|dec)(\s*soh)?(\s*\d{2,4})?$/;

/** Finds the header row (the first with an item column) and what each column holds. Counts are the SOH / month columns, left to right. */
export function findColumns(rows: Sheet["rows"]): { header: number; columns: Columns } | null {
  for (let h = 0; h < Math.min(rows.length, 10); h++) {
    const r = rows[h] ?? [];
    const cols: Partial<Columns> & { counts: Columns["counts"] } = { counts: [] };
    r.forEach((v, i) => {
      const c = clean(v);
      if (typeof v === "number" && v > 40000 && v < 60000) { cols.counts.push({ index: i, label: excelDate(v).slice(0, 7) }); return; }   // a month written as a date
      if (!c) return;
      for (const k of ["unit", "lot", "expiry", "required", "section"] as Col[]) if (HEAD[k].test(c) && (cols as any)[k] === undefined) { (cols as any)[k] = i; return; }
      if (MONTH.test(c)) { cols.counts.push({ index: i, label: String(v).replace(/\s+/g, " ").trim() }); return; }
      if (cols.item === undefined && HEAD.item.test(c)) cols.item = i;
    });
    if (cols.item !== undefined) return { header: h, columns: cols as Columns };
  }
  return null;
}

/** An expiry cell as a calendar date, or the reason it isn't one. */
export function readExpiry(v: unknown): { date: string } | { bad: string } | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  if (typeof v === "string" && /^(n\/?a|nil|none|no expiry|-+|–)$/i.test(v.trim())) return null;   // “NA”: no expiry, not a problem
  if (typeof v === "string" && (v.match(/\d{1,2}[./-]\d{2,4}/g) ?? []).length >= 2)
    return { bad: `two expiry dates in one cell (“${v.trim()}”): split it into two rows, one per lot` };
  let d: string | null = null;
  if (typeof v === "number") d = excelDate(v);
  else {
    const s = String(v).trim();
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
    if (m) d = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    else if ((m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.exec(s))) d = `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;   // day first (PNG, Peru)
    else if ((m = /^(\d{1,2})[./-](\d{4})$/.exec(s))) d = `${m[2]}-${m[1].padStart(2, "0")}-01`;   // month/year on the box
    else return { bad: `“${s}” isn't a date` };
  }
  if (!isCalendarDate(d)) return { bad: `“${String(v).trim()}” isn't a date` };   // e.g. month 13 or 31 June
  const y = Number(d.slice(0, 4));
  if (y < 2000 || y > 2100) return { bad: `the date looks wrong (${y})` };
  return { date: d };
}
const looksLikeDate = (v: unknown) => typeof v === "number" ? v > 36500 && v < 73000 : /^(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[./]\d{1,2}[./]\d{2,4})$/.test(String(v ?? "").trim());

/** Checks every sheet. Nothing is loaded; the result lists what is wrong where. */
export function checkStockList(sheets: Sheet[]): Checked {
  const out: CheckedSheet[] = [];
  for (const s of sheets) {
    const found = findColumns(s.rows);
    if (!found) { out.push({ name: s.name.trim(), header: -1, columns: null, rows: [], note: s.rows.some(r => r.some(x => x !== null && x !== "")) ? "No item column found: this sheet is skipped." : "Empty sheet." }); continue; }
    const { header, columns: c } = found;
    const rows: CheckedRow[] = [];
    const seen = new Map<string, number>();
    for (let i = header + 1; i < s.rows.length; i++) {
      const r = s.rows[i] ?? [];
      const raw = String(r[c.item] ?? "");
      const tidied = raw.replace(/\s+/g, " ").trim();
      if (!tidied) continue;
      const flags: Flag[] = [];
      if (/\s{2,}/.test(raw.trim())) flags.push({ text: `double spaces in the name, tidied to “${tidied}”`, blocking: false });
      const unit = c.unit !== undefined ? String(r[c.unit] ?? "").trim() : "";
      if (c.unit !== undefined && !unit) flags.push({ text: "no unit", blocking: false });
      const lotRaw = c.lot !== undefined ? r[c.lot] : null;
      const exp = c.expiry !== undefined ? readExpiry(r[c.expiry]) : null;
      if (exp && "bad" in exp) flags.push({ text: exp.bad, blocking: true });
      if (lotRaw !== null && lotRaw !== undefined && looksLikeDate(lotRaw)) flags.push({ text: "the lot number looks like a date: is it the expiry?", blocking: true });
      const key = tidied.toLowerCase();
      if (seen.has(key)) flags.push({ text: `the same item twice in this place (also row ${seen.get(key)})`, blocking: true });
      else seen.set(key, i + 1);
      const lot = lotRaw === null || lotRaw === undefined ? "" : typeof lotRaw === "number" && looksLikeDate(lotRaw) ? excelDate(lotRaw) : String(lotRaw).trim();
      const req = c.required !== undefined && typeof r[c.required] === "number" ? Math.max(0, Math.round(r[c.required] as number)) : null;
      rows.push({ sheet: s.name.trim(), row: i + 1, item: raw, tidied, unit, lot, expiry: exp && "date" in exp ? exp.date : "", required: req, counts: c.counts.map(k => typeof r[k.index] === "number" ? (r[k.index] as number) : null), flags });
    }
    out.push({ name: s.name.trim(), header, columns: c, rows });
  }
  const all = out.flatMap(s => s.rows);
  return { sheets: out, rows: all.length, blocking: all.filter(r => r.flags.some(f => f.blocking)).length, notes: all.filter(r => r.flags.length && !r.flags.some(f => f.blocking)).length };
}

/** The problem list as plain text, to copy for the medics. */
export function problemsText(c: Checked, file: string): string {
  const lines = [`Problems found in ${file}`, ""];
  for (const s of c.sheets) {
    const bad = s.rows.filter(r => r.flags.length);
    if (s.note) lines.push(`${s.name}: ${s.note}`);
    if (!bad.length) continue;
    lines.push(`${s.name}:`);
    for (const r of bad) lines.push(`  row ${r.row}, ${r.tidied}: ${r.flags.map(f => (f.blocking ? "MUST FIX: " : "") + f.text).join("; ")}`);
  }
  if (lines.length === 2) lines.push("No problems found.");
  return lines.join("\n");
}
