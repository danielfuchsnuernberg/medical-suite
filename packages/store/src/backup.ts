// F13 — backup files in the REACH shape (R10), and the rules for restoring one (B15).
// A backup holds every change message of this program: the records, the register, stock takes and the activity log follow from them.
// What belongs to this computer only (password and PIN check values, "stay signed in") is never in a backup.
import { APP_CODE, type Change } from "@md/core";
import { fold } from "./fold";
import { SCHEMA_VERSION } from "./door";

export interface BackupFile { app: string; kind: "backup"; dataVersion: number; exportedAt: string; exportedBy: string; data: { messages: Change[] } }
export interface Summary { people: number; items: number; lines: number; register: number; stockTakes: number; messages: number; baseName: string | null }

export function makeBackup(messages: Change[], exportedBy: string, at: number): BackupFile {
  return { app: APP_CODE, kind: "backup", dataVersion: SCHEMA_VERSION, exportedAt: new Date(at).toISOString(), exportedBy, data: { messages: [...messages].sort((a, b) => a.at - b.at) } };
}

export function summaryOf(messages: Change[]): Summary {
  const r = fold(messages).records;
  const active = (t: string) => [...(r.get(t)?.values() ?? [])].filter(x => x.state === "Active").length;
  return {
    people: active("person"), items: active("item"), lines: active("line"), register: r.get("cdline")?.size ?? 0, stockTakes: r.get("stocktake")?.size ?? 0,
    messages: messages.length, baseName: (r.get("settings")?.get("base")?.baseName as string) ?? null,
  };
}

export type BackupCheck = { ok: true; messages: Change[]; dataVersion: number; summary: Summary; exportedAt: string } | { ok: false; why: string };
const isChange = (c: any) => c && typeof c.messageId === "string" && typeof c.recordType === "string" && typeof c.recordId === "string" && typeof c.op === "string" && typeof c.at === "number" && typeof c.by === "string" && c.data && typeof c.data === "object";

/** Reads a backup file and checks it before anything changes (B15). */
export function checkBackup(textOrObject: string | unknown, current?: Summary): BackupCheck {
  let o: any;
  try { o = typeof textOrObject === "string" ? JSON.parse(textOrObject) : textOrObject; }
  catch { return { ok: false, why: "This file can't be read as a backup. Refused: nothing was changed." }; }
  if (!o || o.app !== APP_CODE || o.kind !== "backup" || !o.data || !Array.isArray(o.data.messages))
    return { ok: false, why: "This isn't a REACH Medical Suite backup (for example a backup of the June app). Refused: nothing was changed." };
  if (typeof o.dataVersion !== "number" || o.dataVersion > SCHEMA_VERSION)
    return { ok: false, why: "This backup comes from a newer version of the program. Update this computer first. Refused: nothing was changed." };
  if (!o.data.messages.every(isChange)) return { ok: false, why: "This backup is damaged. Refused: nothing was changed." };
  const s = summaryOf(o.data.messages);
  if (s.lines === 0)
    return { ok: false, why: `This backup has no stock in it. Restoring it would delete all${current ? ` ${current.lines}` : ""} stock lines, the stock takes and the register. Refused: nothing was changed.` };
  if (s.people === 0)
    return { ok: false, why: "This backup has no people in it. Nobody could sign in afterwards. Refused: nothing was changed." };
  return { ok: true, messages: o.data.messages, dataVersion: o.dataVersion, summary: s, exportedAt: String(o.exportedAt ?? "") };
}
