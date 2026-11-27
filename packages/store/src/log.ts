// The activity log (F4, REACH R9): who, which record, what changed (old → new), when, from which app.
// It is worked out from the change messages with the same steps as the records (fold.step), so it can't disagree
// with the data. Nothing here can change or remove a message: the log is read-only (F4.4).
import { changeOrder, APP_CODE, type Change, type StoredRecord } from "@md/core";
import { step, type Tables } from "./fold";

export type LogArea = "Inventory" | "People" | "Settings" | string;   // or another app's code, e.g. "EDP"
export interface FieldChange { field: string; from: unknown; to: unknown }
export interface LogEntry {
  messageId: string; at: number; by: string; app: string; area: LogArea; device?: string;
  recordType: string; recordId: string; op: Change["op"];
  changes: FieldChange[];                 // old → new, field by field
  was?: Record<string, unknown>;          // a delete for good: what was there (F4.3)
  data: Record<string, unknown>;          // the message's own data (e.g. an event's "what")
}

const AREA: Record<string, LogArea> = { item: "Inventory", line: "Inventory", location: "Inventory", stocktake: "Inventory", cdline: "Inventory", cddecision: "Inventory", person: "People", event: "People", settings: "Settings", department: "Settings", category: "Settings", course: "Settings" };
/** Stamps and bookkeeping, not "what changed". */
export const NOT_SHOWN = new Set(["id", "createdAt", "createdBy", "changedAt", "changedBy", "demo", "lastCountAt", "lastCountBy"]);
// The country stamp is set when a record is made; a later change to it (the base moving country, F5.1) is shown.
const NOT_SHOWN_ON_CREATE = new Set(["state", "country"]);

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const visible = (r?: StoredRecord) => { const o: Record<string, unknown> = {}; if (r) for (const [k, v] of Object.entries(r)) if (!NOT_SHOWN.has(k)) o[k] = v; return o; };

export function areaOf(c: Pick<Change, "app" | "recordType">): LogArea {
  if (c.app && c.app !== APP_CODE) return c.app;
  return AREA[c.recordType] ?? "Inventory";
}

/** Newest first. */
export function buildLog(changes: Change[], country = "PG"): LogEntry[] {
  const records: Tables = new Map();
  const out: LogEntry[] = [];
  for (const c of [...changes].sort(changeOrder)) {
    const { before, after } = step(records, c, country);
    const b = visible(before), a = visible(after);
    const changesOut: FieldChange[] = [];
    if (c.op !== "delete") for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) if (!same(b[k], a[k]) && !(c.op === "create" && NOT_SHOWN_ON_CREATE.has(k))) changesOut.push({ field: k, from: b[k] ?? null, to: a[k] ?? null });
    out.push({
      messageId: c.messageId, at: c.at, by: c.by, app: c.app, area: areaOf(c), device: c.device,
      recordType: c.recordType, recordId: c.recordId, op: c.op, changes: changesOut,
      was: c.op === "delete" && before && !after ? Object.fromEntries(Object.entries(b).filter(([k]) => k !== "country")) : undefined, data: c.data,
    });
  }
  return out.reverse();
}
