// Inventory (F8) behind the store door: add, edit, move, archive, restore, delete for good.
// Every rule is checked here, against the actor as stored now, one change at a time (as Accounts, B27).
// Rights (F2.7): View looks only; Work and Manage change and archive stock; delete for good only Manage, a mistake, within 24 hours.
import { can, checkDelete, nextNumber, wholeNumber, itemNameProblem, matchingLine, expiryProblem, newRecordId, type StoredRecord, type Plan } from "@md/core";
import { Door } from "./door";
import { Refused } from "./accounts";

export interface LineValues { qty: unknown; required: unknown; lot?: unknown; expiry?: unknown }

export class InventoryStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private door: Door) {}
  private one<T>(fn: () => Promise<T>): Promise<T> { const done = this.door.hold(); const p = this.queue.then(fn, fn).finally(done); this.queue = p.catch(() => undefined); return p; }   // B37: counted from the click
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
        { recordType: "item", recordId: itemId, op: "create", data: { itemNo: nextNumber("I", this.door.records("item"), "itemNo", 4), name: p.name.trim().replace(/\s+/g, " "), categoryId: cat, unit: String(p.unit ?? "").trim(), controlled: false }, by: me.id },
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
      if (it.controlled === true) throw new Refused(InventoryStore.CD_REGISTER);   // B35: a new place for a controlled drug is a Receive in the register
      this.place(locationId);
      const clean = this.values(v);
      return (await this.door.apply({ recordType: "line", op: "create", data: { itemId, locationId, ...clean }, by: me.id })).recordId;
    });
  }

  /** A controlled drug moves only through the register (Q8: every movement; F12.8, F12.9). */
  private controlled(l: StoredRecord): boolean { return this.door.get("item", String(l.itemId))?.controlled === true; }
  static CD_REGISTER = "This is a controlled drug. Its stock changes only through the controlled-drug register (Controlled drugs in the menu), with a witness and the running balance.";

  /** F9: restock (+) or dispense (−). A whole number, 1 or more; never more out than is there; logged old → new. */
  adjust(actor: StoredRecord, lineId: string, kind: "restock" | "dispense", amount: unknown) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const l = this.line(lineId);
      if (l.state !== "Active") throw new Refused("Reactivate the line first.");
      if (this.controlled(l)) throw new Refused(InventoryStore.CD_REGISTER);
      const out = kind === "dispense";
      const q = wholeNumber(amount, out ? { min: 1, max: Number(l.qty) } : { min: 1 }); if (!q.ok) throw new Refused(q.why);
      await this.door.apply({ recordType: "line", recordId: lineId, op: "delta", data: { field: "qty", by: out ? -q.n : q.n, kind }, by: me.id });
      return Number(l.qty) + (out ? -q.n : q.n);
    });
  }

  /** F10: one count box. Empty = not counted (B16); otherwise a whole number, 0 or more. */
  static countProblem(raw: unknown): string | null {
    const s = String(raw ?? "").trim();
    if (s === "") return null;
    const q = wholeNumber(s, { min: 0, what: "count" });
    return q.ok ? null : q.why;
  }

  /**
   * F10: save typed counts. Empty boxes are "not counted" and change nothing (B16). Any box that isn't a whole number of 0 or more
   * blocks the whole save (F10.3). Saved together; each count is logged old → new; a count based on the same earlier count as
   * another computer's, that disagrees, is flagged (F3.5). Controlled drugs are counted in the register (Q8, F12.8), not here.
   */
  saveCounts(actor: StoredRecord, counts: Record<string, unknown>) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const typed = Object.entries(counts).filter(([, v]) => String(v ?? "").trim() !== "");
      const bad = typed.filter(([, v]) => InventoryStore.countProblem(v));
      if (bad.length) throw new Refused(`${bad.length} ${bad.length === 1 ? "count isn't" : "counts aren't"} a whole number of 0 or more. Fix the red ${bad.length === 1 ? "box" : "boxes"} first. Nothing was saved.`);
      let changed = 0, same = 0;
      const msgs: { recordType: string; recordId: string; op: "count"; data: Record<string, unknown>; by: string }[] = [];
      for (const [id, v] of typed) {
        const l = this.line(id);
        if (l.state !== "Active") throw new Refused("A line you counted was archived meanwhile. Nothing was saved.");
        if (this.controlled(l)) throw new Refused(InventoryStore.CD_REGISTER);
        const n = (wholeNumber(v, { min: 0, what: "count" }) as { n: number }).n;   // B32: the number exactly as checked
        if (n === Number(l.qty)) same++; else changed++;
        msgs.push({ recordType: "line", recordId: id, op: "count", data: { qty: n, basedOn: l.lastCountAt ?? null }, by: me.id });
      }
      if (msgs.length) await this.door.applyAll(msgs);
      return { changed, same };
    });
  }

  /**
   * F11.1: freeze a stock take: every line in use (Store and bags), with the date, who and a label. Names are copied as they are now,
   * so the stock take still reads properly after renames and removals. It can never be changed or deleted afterwards (fold FROZEN, F2.7).
   */
  freezeStockTake(actor: StoredRecord, label: string) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const name = String(label ?? "").trim().replace(/\s+/g, " ");
      if (!name) throw new Refused("Give the stock take a label, e.g. “Stock take, November 2026”.");
      const places = new Map(this.door.records("location").filter(p => p.state === "Active").map(p => [p.id, p]));
      const lines = this.door.records("line").filter(l => l.state === "Active" && places.has(String(l.locationId)))
        .map(l => ({ lineId: l.id, itemId: String(l.itemId), item: String(this.door.get("item", String(l.itemId))?.name ?? "?"), place: String(places.get(String(l.locationId))!.name),
          lot: String(l.lot ?? ""), expiry: (l.expiry as string) ?? null, qty: Number(l.qty), required: l.required === null || l.required === undefined ? null : Number(l.required) }))
        .sort((a, b) => a.place.localeCompare(b.place) || a.item.localeCompare(b.item));
      if (!lines.length) throw new Refused("There are no stock lines to freeze yet.");
      return (await this.door.apply({ recordType: "stocktake", op: "create", data: { name, lines }, by: me.id })).recordId;
    });
  }

  /**
   * F13.6: load a checked, planned stock list in one save (all or nothing). Manage level only (F13.8). Refused while any row
   * must be fixed in the spreadsheet. New bags and items are made; a line already there (same item, place, lot and expiry)
   * gets the imported amount as a count, otherwise a new line starts. Rows that wait (a controlled drug, or suggested as one)
   * become waiting records for the Head Doctor; they never come in as ordinary stock.
   */
  loadImport(actor: StoredRecord, plan: Plan, fileName: string, blocking: number) {
    return this.one(async () => {
      const p = this.door.get("person", actor.id);
      if (!p || p.state !== "Active" || !can(p.level, "changeSettings")) throw new Refused("Only Manage level imports stock lists.");
      blocking = Math.max(blocking, plan.sheets.flatMap(sh => sh.rows).filter(r => r.blocking).length);   // B64: counted here, not taken from the screen
      if (blocking > 0) throw new Refused(`${blocking} ${blocking === 1 ? "row has" : "rows have"} to be fixed in the spreadsheet first. Nothing was loaded.`);
      const msgs: any[] = [];
      const by = p.id;
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
      const bagIds = new Map<string, string>();
      const itemIds = new Map(this.door.records("item").filter(i => i.state === "Active").map(i => [norm(String(i.name)), i.id] as const));
      const controlledNames = new Set(this.door.records("item").filter(i => i.controlled === true).map(i => norm(String(i.name))));   // B35: archived ones too
      const lines = this.door.records("line").filter(l => l.state === "Active");
      let loaded = 0, waiting = 0;
      for (const s of plan.sheets) {
        if (s.target.kind === "skip") continue;
        let placeId: string;
        if (s.target.kind === "place") { const pl = this.door.get("location", s.target.id); if (!pl || pl.state !== "Active") throw new Refused(`The place for “${s.name}” isn't in use any more. Nothing was loaded.`); placeId = pl.id; }
        else {
          const k = norm(s.target.name);
          placeId = bagIds.get(k) ?? "";
          if (!placeId) { placeId = newRecordId(); bagIds.set(k, placeId); msgs.push({ recordType: "location", recordId: placeId, op: "create", data: { name: s.target.name, kind: "bag" }, by }); }
        }
        for (const r of s.rows) {
          if (r.waits) {
            waiting++;
            msgs.push({ recordType: "importwait", op: "create", data: { item: r.item, itemId: r.itemId, unit: r.unit, locationId: placeId, qty: r.qty, lot: r.lot, expiry: r.expiry, required: r.required, month: r.month, file: fileName, sheet: r.sheet, row: r.row, why: r.waits }, by });
            continue;
          }
          if (controlledNames.has(norm(r.item))) throw new Refused(`${r.item} is a controlled drug: it can only wait for the Head Doctor. Nothing was loaded.`);
          let itemId = r.itemId ?? itemIds.get(norm(r.item)) ?? null;
          if (!itemId) { itemId = newRecordId(); itemIds.set(norm(r.item), itemId); const itemNo = nextNumber("I", [...this.door.records("item"), ...msgs.filter(m => m.recordType === "item").map(m => ({ id: m.recordId, ...m.data }))], "itemNo", 4); msgs.push({ recordType: "item", recordId: itemId, op: "create", data: { itemNo, name: r.item, categoryId: null, unit: r.unit, controlled: false }, by }); }
          else if (this.door.get("item", itemId)?.controlled === true) throw new Refused(`${r.item} is a controlled drug: it can only wait for the Head Doctor. Nothing was loaded.`);
          const same = lines.find(l => l.itemId === itemId && l.locationId === placeId && String(l.lot ?? "").trim().toLowerCase() === r.lot.trim().toLowerCase() && String(l.expiry ?? "") === String(r.expiry ?? ""));
          if (same) msgs.push({ recordType: "line", recordId: same.id, op: "count", data: { qty: r.qty, basedOn: same.lastCountAt ?? null, from: fileName }, by });
          else msgs.push({ recordType: "line", op: "create", data: { itemId, locationId: placeId, qty: r.qty, required: r.required, lot: r.lot, expiry: r.expiry }, by });
          loaded++;
        }
      }
      if (!loaded && !waiting) throw new Refused("There is nothing to load (every sheet is skipped). Nothing was loaded.");
      msgs.push({ recordType: "event", op: "create", data: { what: "imported a stock list", file: fileName, lines: loaded, waiting }, by });
      await this.door.applyAll(msgs);
      return { loaded, waiting, newBags: bagIds.size };
    });
  }

  /** F8.3: edit a line. The place can't be changed here (use Move). Only what changed is saved, so the log shows old → new. */
  editLine(actor: StoredRecord, lineId: string, v: LineValues & { locationId?: unknown }) {
    return this.one(async () => {
      const me = this.allowed(actor, "changeStock");
      const l = this.line(lineId);
      if (v.locationId !== undefined && v.locationId !== l.locationId) throw new Refused("The place can't be changed here. Use Move.");
      const clean = this.values(v);
      if (this.controlled(l) && clean.qty !== Number(l.qty)) throw new Refused(InventoryStore.CD_REGISTER);
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
      if (this.controlled(l)) throw new Refused(InventoryStore.CD_REGISTER);
      if (toLocationId === l.locationId) throw new Refused("Pick a different place to move to.");
      this.place(toLocationId);
      const q = wholeNumber(qty, { min: 1, max: Number(l.qty) }); if (!q.ok) throw new Refused(q.why);
      const dest = matchingLine(this.door.records("line"), l, toLocationId);
      const destId = dest ? dest.id : newRecordId();
      const msgs: any[] = [{ recordType: "line", recordId: lineId, op: "delta" as const, data: { field: "qty", by: -q.n, moveTo: destId }, by: me.id }];
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
      if (type === "line" && this.controlled(r) && Number(r.qty) !== 0) throw new Refused(InventoryStore.CD_REGISTER);   // B35: archiving would take it off the shelves
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
      if (type === "line" && this.controlled(r) && Number(r.qty) !== 0) throw new Refused(InventoryStore.CD_REGISTER);   // B35: restoring would put it back on the shelves
      await this.door.apply({ recordType: type, recordId: id, op: "restore", data: {}, by: me.id });
    });
  }

  /** Why this can't be deleted for good, or null if it can (F2.7: Manage, a mistake, within 24 hours; an item only without lines). */
  deleteProblem(actor: StoredRecord, type: "line" | "item", id: string): string | null {
    const p = this.door.get("person", actor.id);
    const r = this.door.get(type, id);
    if (!p || p.state !== "Active" || !r) return "Not found.";
    const ok = checkDelete(type, r, p as any, this.door.now()); if (!ok.ok) return ok.why;
    if (type === "line" && this.controlled(r) && Number(r.qty) !== 0) return InventoryStore.CD_REGISTER;   // B35
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
