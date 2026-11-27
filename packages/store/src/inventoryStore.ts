// Inventory (F8) behind the store door: add, edit, move, archive, restore, delete for good.
// Every rule is checked here, against the actor as stored now, one change at a time (as Accounts, B27).
// Rights (F2.7): View looks only; Work and Manage change and archive stock; delete for good only Manage, a mistake, within 24 hours.
import { can, checkDelete, wholeNumber, itemNameProblem, matchingLine, expiryProblem, newRecordId, type StoredRecord } from "@md/core";
import { Door } from "./door";
import { Refused } from "./accounts";

export interface LineValues { qty: unknown; required: unknown; lot?: unknown; expiry?: unknown }

export class InventoryStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private door: Door) {}
  private one<T>(fn: () => Promise<T>): Promise<T> { const p = this.queue.then(fn, fn); this.queue = p.catch(() => undefined); return p; }
  private allowed(actor: StoredRecord, action: "changeStock" | "archiveStock"): StoredRecord {
    const p = this.door.get("person", actor.id);
    if (!p || p.state !== "Active" || !can(p.level, action)) throw new Refused("View level can look but not change anything.");
    return p;
  }
  private line(id: string): StoredRecord { const l = this.door.get("line", id); if (!l) throw new Refused("That line isn't there any more."); return l; }
  private item(id: string): StoredRecord { const i = this.door.get("item", id); if (!i) throw new Refused("That item isn't there any more."); return i; }
  private place(id: string): StoredRecord { const p = this.door.get("location", id); if (!p || p.state !== "Active") throw new Refused("Pick a place that is in use."); return p; }

  /** Checks the values of a line; returns them clean, or throws with the reason. */
  private values(v: LineValues) {
    const q = wholeNumber(v.qty, { min: 0, what: "amount on hand" }); if (!q.ok) throw new Refused(q.why);
    const rs = String(v.required ?? "").trim();
    const r = rs === "" ? null : wholeNumber(rs, { min: 0, what: "required amount" });
    if (r && !r.ok) throw new Refused(r.why);
    const expiry = String(v.expiry ?? "").trim();
    const ep = expiryProblem(expiry); if (ep) throw new Refused(ep);
    return { qty: q.n, required: r ? r.n : null, lot: String(v.lot ?? "").trim(), expiry: expiry || null };
  }

  /** F8.4: a new item with its first place. A duplicate name is refused. */
  addItem(actor: StoredRecord, p: { name: string; categoryId?: string; unit?: string; locationId: string; qty: unknown }) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const why = itemNameProblem(this.door.records("item"), p.name); if (why) throw new Refused(why);
      this.place(p.locationId);
      const q = wholeNumber(p.qty, { min: 0, what: "amount on hand" }); if (!q.ok) throw new Refused(q.why);
      const itemId = newRecordId();
      const cat = p.categoryId && this.door.get("category", p.categoryId)?.state === "Active" ? p.categoryId : null;
      await this.door.applyAll([
        { recordType: "item", recordId: itemId, op: "create", data: { name: p.name.trim().replace(/\s+/g, " "), categoryId: cat, unit: String(p.unit ?? "").trim(), controlled: false }, by: me.id },
        { recordType: "line", op: "create", data: { itemId, locationId: p.locationId, qty: q.n, required: null, lot: "", expiry: null }, by: me.id },
      ]);
      return itemId;
    });
  }

  /** F8.4: the item in one more place. */
  addLine(actor: StoredRecord, itemId: string, locationId: string, v: LineValues) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const it = this.item(itemId); if (it.state !== "Active") throw new Refused("Restore the item first.");
      this.place(locationId);
      const clean = this.values(v);
      return (await this.door.apply({ recordType: "line", op: "create", data: { itemId, locationId, ...clean }, by: me.id })).recordId;
    });
  }

  /** F8.3: edit a line. The place can't be changed here (use Move). Only what changed is saved, so the log shows old → new. */
  editLine(actor: StoredRecord, lineId: string, v: LineValues & { locationId?: unknown }) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const l = this.line(lineId);
      if (v.locationId !== undefined && v.locationId !== l.locationId) throw new Refused("The place can't be changed here. Use Move.");
      const clean = this.values(v);
      const changed = Object.fromEntries(Object.entries(clean).filter(([k, x]) => (l[k] ?? null) !== x));
      if (!Object.keys(changed).length) return false;
      await this.door.apply({ recordType: "line", recordId: lineId, op: "set", data: changed, by: me.id });
      return true;
    });
  }

  /** F8.2: move all or part of a line. It joins a matching line (same item, place, lot and expiry) or starts a new one without a required amount. */
  move(actor: StoredRecord, lineId: string, toLocationId: string, qty: unknown) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const l = this.line(lineId);
      if (l.state !== "Active") throw new Refused("Restore the line first.");
      if (toLocationId === l.locationId) throw new Refused("Pick a different place to move to.");
      this.place(toLocationId);
      const q = wholeNumber(qty, { min: 1, max: Number(l.qty) }); if (!q.ok) throw new Refused(q.why);
      const dest = matchingLine(this.door.records("line"), l, toLocationId);
      const destId = dest ? dest.id : newRecordId();
      const msgs = [{ recordType: "line", recordId: lineId, op: "delta" as const, data: { field: "qty", by: -q.n, moveTo: destId }, by: me.id }];
      if (!dest) msgs.push({ recordType: "line", recordId: destId, op: "create" as const, data: { itemId: l.itemId, locationId: toLocationId, qty: 0, required: null, lot: l.lot ?? "", expiry: l.expiry ?? null } as any, by: me.id });
      msgs.push({ recordType: "line", recordId: destId, op: "delta" as const, data: { field: "qty", by: q.n, moveFrom: lineId } as any, by: me.id });
      // Q24 = C: a line emptied by the move stays at 0 if it says what the place must carry (required amount / reorder level),
      // so the bag keeps showing it as missing; with no amount set it had no job, so it is archived — in the same save.
      const emptied = q.n === Number(l.qty);
      const archived = emptied && (l.required === null || l.required === undefined);
      if (archived) msgs.push({ recordType: "line", recordId: lineId, op: "archive" as const, data: {}, by: me.id });
      await this.door.applyAll(msgs);
      return { destId, joined: !!dest, archived };
    });
  }

  /** F8.4 archive / reactivate (Work and Manage, F2.7). An item can be archived once none of its lines are in use. */
  archive(actor: StoredRecord, type: "line" | "item", id: string) {
    return this.one(async () => {
      const me = this.allowed(actor, "archiveStock");
      const r = type === "line" ? this.line(id) : this.item(id);
      if (r.state !== "Active") return;
      if (type === "item") {
        const n = this.door.records("line").filter(l => l.itemId === id && l.state === "Active").length;
        if (n) throw new Refused(`${String(r.name)} still has ${n} ${n === 1 ? "line" : "lines"} in use. Archive or move them first.`);
      }
      await this.door.apply({ recordType: type, recordId: id, op: "archive", data: {}, by: me.id });
    });
  }
  restore(actor: StoredRecord, type: "line" | "item", id: string) {
    return this.one(async () => {
      const me = this.allowed(actor, "archiveStock");
      const r = type === "line" ? this.line(id) : this.item(id);
      if (r.state === "Active") return;
      if (type === "line" && this.door.get("item", String(r.itemId))?.state !== "Active") throw new Refused("Restore the item first.");
      await this.door.apply({ recordType: type, recordId: id, op: "restore", data: {}, by: me.id });
    });
  }

  /** Why this can't be deleted for good, or null if it can (F2.7: Manage, a mistake, within 24 hours; an item only without lines). */
  deleteProblem(actor: StoredRecord, type: "line" | "item", id: string): string | null {
    const p = this.door.get("person", actor.id);
    const r = this.door.get(type, id);
    if (!p || p.state !== "Active" || !r) return "Not found.";
    const ok = checkDelete(type, r, p as any, this.door.now()); if (!ok.ok) return ok.why;
    if (type === "item") {
      const n = this.door.records("line").filter(l => l.itemId === id).length;
      if (n) return `${String(r.name)} still has ${n} ${n === 1 ? "line" : "lines"} (archived ones count too). Delete or archive those instead.`;
    }
    return null;
  }
  deleteMistake(actor: StoredRecord, type: "line" | "item", id: string) {
    return this.one(async () => {
      const why = this.deleteProblem(actor, type, id); if (why) throw new Refused(why);
      await this.door.apply({ recordType: type, recordId: id, op: "delete", data: { reason: "mistake" }, by: actor.id });
    });
  }
}
