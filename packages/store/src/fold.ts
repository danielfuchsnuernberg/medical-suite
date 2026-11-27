// Work out the records from the change messages (event folding). Every computer folds the same messages in the
// same order, so every computer ends up with the same records. The activity log (F4) uses the same steps, so the
// log and the records can never disagree.
import { changeOrder, type Change, type StoredRecord } from "@md/core";

export interface CountFlag { recordType: string; recordId: string; counts: { messageId: string; qty: number; by: string; at: number }[]; used: number }
export interface Folded { records: Map<string, Map<string, StoredRecord>>; flags: CountFlag[] }
export type Tables = Map<string, Map<string, StoredRecord>>;
/** Records that can never change after they are made (F11.1). */
export const FROZEN = new Set(["stocktake"]);

/** Applies one message. Returns the record before and after (undefined = didn't exist / was removed). */
export function step(records: Tables, c: Change, country = "PG"): { before?: StoredRecord; after?: StoredRecord } {
  let t = records.get(c.recordType);
  if (!t) { t = new Map(); records.set(c.recordType, t); }
  const cur = t.get(c.recordId);
  // F11.1: a stock take is frozen when it is made. Nothing after its first message changes it — from this computer or any other.
  if (FROZEN.has(c.recordType) && c.op !== "create") return { before: cur, after: cur };
  const touch = (r: StoredRecord): StoredRecord => ({ ...r, changedAt: c.at, changedBy: c.by });
  let next: StoredRecord | undefined = cur;
  switch (c.op) {
    case "create":
      if (!cur) next = { ...(c.data as object), id: c.recordId, createdAt: c.at, createdBy: c.by, changedAt: c.at, changedBy: c.by, country: (c.data.country as string) || country, state: "Active" } as StoredRecord;
      break;
    case "set":
      if (cur) { const { id, createdAt, createdBy, ...rest } = c.data as any; next = touch({ ...cur, ...rest }); }
      break;
    case "delta":
      if (cur) { const f = String(c.data.field); const by = Number(c.data.by) || 0; next = touch({ ...cur, [f]: (Number(cur[f]) || 0) + by }); }
      break;
    case "count":
      if (cur) next = touch({ ...cur, qty: Number(c.data.qty), lastCountAt: c.at, lastCountBy: c.by });
      break;
    case "archive": if (cur) next = touch({ ...cur, state: "Archived" }); break;
    case "restore": if (cur) next = touch({ ...cur, state: "Active" }); break;
    case "delete": next = undefined; break;
  }
  if (next) t.set(c.recordId, next); else t.delete(c.recordId);
  return { before: cur, after: next };
}

export function fold(changes: Change[], country = "PG"): Folded {
  const sorted = [...changes].sort(changeOrder);
  const records: Tables = new Map();
  const countsByBase = new Map<string, Change[]>(); // key: type|id|basedOn
  for (const c of sorted) {
    const { before } = step(records, c, country);
    if (c.op === "count" && before) {
      const key = `${c.recordType}|${c.recordId}|${String(c.data.basedOn ?? "")}`;
      const list = countsByBase.get(key) || []; list.push(c); countsByBase.set(key, list);
    }
  }
  // Two counts made without seeing each other (same basedOn) that disagree are flagged; the later one is used (F3.5).
  const flags: CountFlag[] = [];
  for (const list of countsByBase.values()) {
    if (list.length < 2) continue;
    const qtys = new Set(list.map(c => Number(c.data.qty)));
    if (qtys.size < 2) continue;
    const last = list[list.length - 1];
    flags.push({ recordType: last.recordType, recordId: last.recordId, used: Number(last.data.qty), counts: list.map(c => ({ messageId: c.messageId, qty: Number(c.data.qty), by: c.by, at: c.at })) });
  }
  return { records, flags };
}
