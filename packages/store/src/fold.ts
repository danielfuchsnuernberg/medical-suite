// Work out the records from the change messages (event folding). Every computer folds the same messages in the
// same order, so every computer ends up with the same records.
import { changeOrder, type Change, type StoredRecord } from "@md/core";

export interface CountFlag { recordType: string; recordId: string; counts: { messageId: string; qty: number; by: string; at: number }[]; used: number }
export interface Folded { records: Map<string, Map<string, StoredRecord>>; flags: CountFlag[] }

export function fold(changes: Change[], country = "PG"): Folded {
  const sorted = [...changes].sort(changeOrder);
  const records = new Map<string, Map<string, StoredRecord>>();
  const countsByBase = new Map<string, Change[]>(); // key: type|id|basedOn
  const table = (t: string) => { let m = records.get(t); if (!m) { m = new Map(); records.set(t, m); } return m; };
  for (const c of sorted) {
    const t = table(c.recordType);
    const cur = t.get(c.recordId);
    const touch = (r: StoredRecord): StoredRecord => ({ ...r, changedAt: c.at, changedBy: c.by });
    switch (c.op) {
      case "create":
        if (!cur) t.set(c.recordId, { ...(c.data as object), id: c.recordId, createdAt: c.at, createdBy: c.by, changedAt: c.at, changedBy: c.by, country: (c.data.country as string) || country, state: "Active" } as StoredRecord);
        break;
      case "set":
        if (cur) { const { id, createdAt, createdBy, ...rest } = c.data as any; t.set(c.recordId, touch({ ...cur, ...rest })); }
        break;
      case "delta":
        if (cur) { const f = String(c.data.field); const by = Number(c.data.by) || 0; t.set(c.recordId, touch({ ...cur, [f]: (Number(cur[f]) || 0) + by })); }
        break;
      case "count":
        if (cur) {
          t.set(c.recordId, touch({ ...cur, qty: Number(c.data.qty), lastCountAt: c.at, lastCountBy: c.by }));
          const key = `${c.recordType}|${c.recordId}|${String(c.data.basedOn ?? "")}`;
          const list = countsByBase.get(key) || []; list.push(c); countsByBase.set(key, list);
        }
        break;
      case "archive": if (cur) t.set(c.recordId, touch({ ...cur, state: "Archived" })); break;
      case "restore": if (cur) t.set(c.recordId, touch({ ...cur, state: "Active" })); break;
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
