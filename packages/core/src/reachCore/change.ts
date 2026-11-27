// The change message (REACH Core R8, R9): every change, from any computer, is one of these.
// A message that arrives twice is applied once (by messageId). Records are worked out from the messages.

import type { Moment } from "./dates";
import { newRecordId } from "./ids";

export const APP_CODE = "MD"; // REACH D4: Medical Suite

export type ChangeOp =
  | "create"   // data: the new record's fields
  | "set"      // data: fields that change (later message wins)
  | "delta"    // data: { field, by } — added up, so two computers' movements both count (F3.4)
  | "count"    // data: { qty, basedOn } — a count; the later one is used, both kept, flagged if they disagree (F3.5)
  | "archive"  // data: {}
  | "restore"; // data: {}

export interface Change {
  messageId: string;
  at: Moment;            // UTC milliseconds (R6)
  by: string;            // person id, or "demo" / "system"
  app: string;           // "MD"
  recordType: string;    // "item", "location", "line", "person" …
  recordId: string;
  op: ChangeOp;
  data: Record<string, unknown>;
  device?: string;       // which computer made it
}

export function makeChange(p: { recordType: string; recordId?: string; op: ChangeOp; data?: Record<string, unknown>; by: string; at?: Moment; device?: string }): Change {
  return {
    messageId: newRecordId(),
    at: p.at ?? Date.now(),
    by: p.by,
    app: APP_CODE,
    recordType: p.recordType,
    recordId: p.recordId ?? newRecordId(),
    op: p.op,
    data: p.data ?? {},
    device: p.device,
  };
}

/** One fixed order on every computer: by time, then by message id. */
export function changeOrder(a: Change, b: Change): number {
  return a.at - b.at || (a.messageId < b.messageId ? -1 : a.messageId > b.messageId ? 1 : 0);
}
