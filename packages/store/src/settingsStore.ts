// Settings (F5) behind the store door. Everyone may look; only Manage level changes (F5.7, Q23 = C).
// Every rule is checked here, against the actor as stored now, one change at a time (as Accounts, B27).
import { can, checkBaseSettings, checkListName, checkListDelete, checkBagArchive, usesOf, LIST_STORE, LIST_WORD,
  type ListKind, type BaseSettings, type StoredRecord } from "@md/core";
import { Door } from "./door";
import { Refused } from "./accounts";

export class SettingsStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private door: Door) {}
  private one<T>(fn: () => Promise<T>): Promise<T> { const p = this.queue.then(fn, fn); this.queue = p.catch(() => undefined); return p; }
  private manager(actor: StoredRecord): StoredRecord {
    const p = this.door.get("person", actor.id);
    if (!p || p.state !== "Active" || !can(p.level, "changeSettings")) throw new Refused("Only Manage level changes settings.");
    return p;
  }

  base(): StoredRecord | undefined { return this.door.get("settings", "base"); }

  entries(kind: ListKind, withArchived = true): StoredRecord[] {
    const all = this.door.records(LIST_STORE[kind].recordType).filter(r => kind !== "bag" || r.kind === "bag");
    return all.filter(r => withArchived || r.state === "Active").sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  nameOf = (r: StoredRecord, type: string): string => {
    if (type === "line") return `${this.door.get("item", String(r.itemId))?.name ?? "?"} in ${this.door.get("location", String(r.locationId))?.name ?? "?"}`;
    return String(r.name ?? r.id);
  };
  uses(kind: ListKind, id: string) { return usesOf(kind, id, t => this.door.records(t), this.nameOf); }
  canDelete(actor: StoredRecord, kind: ListKind, id: string): boolean {
    const e = this.door.get(LIST_STORE[kind].recordType, id);
    return !!e && checkListDelete(kind, e, this.uses(kind, id), actor, this.door.now()).ok;
  }

  saveBase(actor: StoredRecord, values: Partial<BaseSettings>) {
    return this.one(async () => {
      const me = this.manager(actor);
      const v = { ...values, baseName: String(values.baseName ?? "").trim(), dayShift: String(values.dayShift ?? "").replace(/\s/g, "").replace("-", "–"), nightShift: String(values.nightShift ?? "").replace(/\s/g, "").replace("-", "–") };
      const ok = checkBaseSettings(v); if (!ok.ok) throw new Refused(ok.why);
      const cur = this.base();
      const data = { baseName: v.baseName, country: v.country, timeZone: v.timeZone, dateStyle: v.dateStyle, dayShift: v.dayShift, nightShift: v.nightShift };
      if (!cur) { await this.door.apply({ recordType: "settings", recordId: "base", op: "create", data, by: me.id }); return; }
      const changed = Object.fromEntries(Object.entries(data).filter(([k, x]) => cur[k] !== x));
      if (Object.keys(changed).length) await this.door.apply({ recordType: "settings", recordId: "base", op: "set", data: changed, by: me.id });
    });
  }

  add(actor: StoredRecord, kind: ListKind, name: string, extra: Record<string, unknown> = {}) {
    return this.one(async () => {
      const me = this.manager(actor);
      const ok = checkListName(kind, this.entries(kind), name); if (!ok.ok) throw new Refused(ok.why);
      const data: Record<string, unknown> = { name: name.trim().replace(/\s+/g, " "), ...extra };
      if (kind === "bag") data.kind = "bag";
      if (kind === "course") { const m = Number(extra.validMonths); if (!Number.isInteger(m) || m < 1 || m > 120) throw new Refused("Valid for: a whole number of months, 1 to 120."); data.validMonths = m; }
      return (await this.door.apply({ recordType: LIST_STORE[kind].recordType, op: "create", data, by: me.id })).recordId;
    });
  }

  rename(actor: StoredRecord, kind: ListKind, id: string, name: string) {
    return this.one(async () => {
      const me = this.manager(actor);
      const ok = checkListName(kind, this.entries(kind), name, id); if (!ok.ok) throw new Refused(ok.why);
      const n = name.trim().replace(/\s+/g, " ");
      if (this.door.get(LIST_STORE[kind].recordType, id)?.name === n) return;
      await this.door.apply({ recordType: LIST_STORE[kind].recordType, recordId: id, op: "set", data: { name: n }, by: me.id });
    });
  }

  setCourseMonths(actor: StoredRecord, id: string, months: number) {
    return this.one(async () => {
      const me = this.manager(actor);
      if (!Number.isInteger(months) || months < 1 || months > 120) throw new Refused("Valid for: a whole number of months, 1 to 120.");
      await this.door.apply({ recordType: "course", recordId: id, op: "set", data: { validMonths: months }, by: me.id });
    });
  }

  archive(actor: StoredRecord, kind: ListKind, id: string) {
    return this.one(async () => {
      const me = this.manager(actor);
      const e = this.door.get(LIST_STORE[kind].recordType, id); if (!e) throw new Refused("Not found.");
      if (kind === "bag") { const ok = checkBagArchive(e, this.uses(kind, id)); if (!ok.ok) throw new Refused(ok.why); }
      await this.door.apply({ recordType: LIST_STORE[kind].recordType, recordId: id, op: "archive", by: me.id });
    });
  }
  restore(actor: StoredRecord, kind: ListKind, id: string) {
    return this.one(async () => {
      const me = this.manager(actor);
      await this.door.apply({ recordType: LIST_STORE[kind].recordType, recordId: id, op: "restore", by: me.id });
    });
  }
  delete(actor: StoredRecord, kind: ListKind, id: string) {
    return this.one(async () => {
      const me = this.manager(actor);
      const e = this.door.get(LIST_STORE[kind].recordType, id); if (!e) throw new Refused("Not found.");
      const ok = checkListDelete(kind, e, this.uses(kind, id), me, this.door.now()); if (!ok.ok) throw new Refused(ok.why);
      await this.door.apply({ recordType: LIST_STORE[kind].recordType, recordId: id, op: "delete", data: { reason: "mistake", name: e.name }, by: me.id });
    });
  }
  word(kind: ListKind) { return LIST_WORD[kind]; }
}
