// Settings lists (F5.4–F5.6): departments, inventory categories, courses, bags. Rules only; no screens, no storage.
import type { StoredRecord } from "../reachCore/stamps";
import { checkDelete, can, type Check } from "../access/levels";

export type ListKind = "department" | "category" | "course" | "bag";
export const LIST_WORD: Record<ListKind, string> = { department: "department", category: "category", course: "course", bag: "bag" };
/** Where each list's entries are stored and who points to them (R5: by ID). */
export const LIST_STORE: Record<ListKind, { recordType: string; usedBy: { recordType: string; field: string; word: string }[] }> = {
  department: { recordType: "department", usedBy: [{ recordType: "person", field: "departmentId", word: "person" }] },
  category: { recordType: "category", usedBy: [{ recordType: "item", field: "categoryId", word: "item" }] },
  course: { recordType: "course", usedBy: [{ recordType: "training", field: "courseId", word: "training record" }] },
  bag: { recordType: "location", usedBy: [{ recordType: "line", field: "locationId", word: "stock line" }] },
};

const norm = (s: unknown) => String(s ?? "").trim().replace(/\s+/g, " ");

/** F5.5 / B24: a real duplicate (any capitals) is refused; changing only the capitals of the same entry is fine. */
export function checkListName(kind: ListKind, entries: StoredRecord[], name: string, selfId?: string): Check {
  const n = norm(name);
  if (!n) return { ok: false, why: `Type a name for the ${LIST_WORD[kind]}.` };
  const clash = entries.find(e => e.id !== selfId && norm(e.name).toLowerCase() === n.toLowerCase());
  if (clash) return { ok: false, why: `“${clash.name}” is already there${clash.state === "Archived" ? " (archived)" : ""}.` };
  return { ok: true };
}

export interface Use { recordType: string; id: string; name: string; archived: boolean; word: string }
/** Who points to this entry, archived records included (F5.4 / B21). */
export function usesOf(kind: ListKind, entryId: string, records: (type: string) => StoredRecord[], nameOf: (r: StoredRecord, type: string) => string): Use[] {
  const out: Use[] = [];
  for (const u of LIST_STORE[kind].usedBy)
    for (const r of records(u.recordType)) if (r[u.field] === entryId) out.push({ recordType: u.recordType, id: r.id, name: nameOf(r, u.recordType), archived: r.state !== "Active", word: u.word });
  return out;
}

export function describeUses(uses: Use[]): string {
  const shown = uses.slice(0, 3).map(u => `${u.name}${u.archived ? " (archived)" : ""}`);
  const more = uses.length > 3 ? ` and ${uses.length - 3} more` : "";
  return shown.join(", ") + more;
}

/** F5.4: in use (archived records count too) → can't be deleted; otherwise the delete-for-good rule (F2.7). */
export function checkListDelete(kind: ListKind, entry: StoredRecord, uses: Use[], actor: StoredRecord, now: number): Check {
  if (!can(actor.level, "changeSettings")) return { ok: false, why: "Only Manage level changes settings." };
  if (uses.length) return { ok: false, why: `“${entry.name}” is still used by ${describeUses(uses)}, so it can't be deleted. Archive it instead: it disappears from the lists, and those records keep it.` };
  return checkDelete(LIST_STORE[kind].recordType, entry, actor, now);
}

/** A bag with stock in it can't be archived: its lines would have nowhere to be shown. Moving lines comes with F7 (B24). */
export function checkBagArchive(entry: StoredRecord, uses: Use[]): Check {
  const active = uses.filter(u => !u.archived);
  if (active.length) return { ok: false, why: `${entry.name} still has ${active.length} stock line${active.length === 1 ? "" : "s"}. Move or archive them first.` };
  return { ok: true };
}

// Base settings (F5.1). Countries are a list of options, never rules in the code (R12).
export const COUNTRIES: { code: string; name: string; timeZone: string }[] = [
  { code: "PG", name: "Papua New Guinea", timeZone: "Pacific/Port_Moresby" },
  { code: "PE", name: "Peru", timeZone: "America/Lima" },
];
export const SHIFT = /^([01]\d|2[0-3]):[0-5]\d[–-]([01]\d|2[0-3]):[0-5]\d$/;
export function isTimeZone(tz: unknown): boolean {
  if (typeof tz !== "string" || !tz) return false;
  try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return true; } catch { return false; }
}
export interface BaseSettings { baseName: string; country: string; timeZone: string; dateStyle: "long" | "short"; dayShift: string; nightShift: string }
export function checkBaseSettings(s: Partial<BaseSettings>): Check {
  if (!norm(s.baseName)) return { ok: false, why: "Type the base's name." };
  if (!COUNTRIES.some(c => c.code === s.country)) return { ok: false, why: "Pick a country." };
  if (!isTimeZone(s.timeZone)) return { ok: false, why: "Pick the base's time zone." };
  if (s.dateStyle !== "long" && s.dateStyle !== "short") return { ok: false, why: "Pick a date style." };
  for (const [k, w] of [["dayShift", "Day shift"], ["nightShift", "Night shift"]] as const)
    if (!SHIFT.test(String(s[k] ?? "").replace(/\s/g, ""))) return { ok: false, why: `${w}: write it as 07:00–19:00 (24-hour).` };
  return { ok: true };
}
