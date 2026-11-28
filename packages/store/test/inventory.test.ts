import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, InventoryStore } from "../src";
import { demoSeedChanges, wholeNumber, itemNameProblem, DAY_MS } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);
const open = async (b = new MemoryBackend()) => { const door = await Door.open({ backend: b, seed: demoSeedChanges, now }); return { b, door, inv: new InventoryStore(door) }; };
const cara = (d: Door) => d.get("person", "demo-p3")!;          // Manage
const anna = (d: Door) => d.get("person", "demo-p1")!;          // Work
const line = (d: Door, id: string) => d.get("line", id)!;

describe("whole numbers and item names (F8.3, F8.4)", () => {
  it("amounts are whole numbers", () => {
    expect(wholeNumber("3")).toEqual({ ok: true, n: 3 });
    expect(wholeNumber("0", { min: 0 })).toEqual({ ok: true, n: 0 });
    for (const bad of ["", "2.7", "2,5", "−5", "-5", "0", "abc", "1e3"]) expect(wholeNumber(bad).ok).toBe(false);
    expect(wholeNumber("9", { max: 4 })).toMatchObject({ ok: false, tooMany: true });
  });
  it("a duplicate item name is refused, any capitals and spaces, archived too", () => {
    const items = [{ id: "a", name: "Gauze  10×10 cm", state: "Active" }, { id: "b", name: "Old tube", state: "Archived" }];
    expect(itemNameProblem(items, "gauze 10×10 CM")).toBe("“Gauze  10×10 cm” is already there. Open it and add a place instead.");
    expect(itemNameProblem(items, "old TUBE")).toBe("“Old tube” is already there (archived). Restore it instead.");
    expect(itemNameProblem(items, "  ")).toBe("Give the item a name.");
    expect(itemNameProblem(items, "Gauze 10×10 cm", "a")).toBeNull();
  });
});

describe("inventory store (F8)", () => {
  it("F8.2 move part to a place with no matching line: a new line starts without a required amount; saved together", async () => {
    const { door, inv, b } = await open();
    const before = (await b.load()).changes.length;
    const r = await inv.move(anna(door), "demo-s1", "demo-l2", 5);                // Gauze, Bag 1 → Bag 2
    expect(r.joined).toBe(false);
    expect(line(door, "demo-s1").qty).toBe(7);
    expect(line(door, r.destId)).toMatchObject({ itemId: "demo-i1", locationId: "demo-l2", qty: 5, required: null, lot: "G-2201", expiry: "2027-12-01" });
    expect((await b.load()).changes.length).toBe(before + 3);                     // take, new line, add
  });
  it("F8.2 move to a place with the same lot and expiry joins that line", async () => {
    const { door, inv } = await open();
    const first = await inv.move(anna(door), "demo-s1", "demo-l0", 2);             // a new Store line, lot G-2201
    const again = await inv.move(anna(door), "demo-s1", "demo-l0", 3);
    expect(again).toEqual({ destId: first.destId, joined: true, archived: false });
    expect(line(door, first.destId).qty).toBe(5);
    expect(line(door, "demo-s6").qty).toBe(30);                                    // the other Store Gauze (lot G-2190) untouched
  });
  it("F8.2 same lot but another expiry, or same expiry but another lot, is not a match", async () => {
    const { door, inv } = await open();
    await door.apply({ recordType: "line", recordId: "demo-s6", op: "set", data: { expiry: "2027-12-01" }, by: "demo-p3" });   // same expiry, lot G-2190
    expect((await inv.move(anna(door), "demo-s1", "demo-l0", 1)).joined).toBe(false);
    await door.apply({ recordType: "line", recordId: "demo-s6", op: "set", data: { expiry: "2027-10-01", lot: "g-2201 " }, by: "demo-p3" });   // same lot (any capitals), other expiry
    const r = await inv.move(anna(door), "demo-s1", "demo-l0", 1);
    expect(r.joined).toBe(true);                                                    // joins the line made by the first move, not demo-s6
    expect(r.destId).not.toBe("demo-s6");
  });
  it("F8.2 move all or part, never more; never to the same place; the log says from where to where", async () => {
    const { door, inv } = await open();
    await expect(inv.move(anna(door), "demo-s1", "demo-l2", 13)).rejects.toThrow("Only 12 on hand, so 13 can't be taken.");
    await expect(inv.move(anna(door), "demo-s1", "demo-l1", 1)).rejects.toThrow("Pick a different place to move to.");
    await expect(inv.move(anna(door), "demo-s1", "demo-l2", "2.5")).rejects.toThrow("Whole numbers only.");
    const r = await inv.move(anna(door), "demo-s1", "demo-l2", 12);
    expect(line(door, "demo-s1")).toMatchObject({ qty: 0, state: "Active" });      // Q24 = C: it has a required amount, so it stays, at 0
    const log = door.log();
    expect(log.find(e => e.recordId === "demo-s1" && e.op === "delta")!.data).toMatchObject({ by: -12, moveTo: r.destId });
    expect(log.find(e => e.recordId === r.destId && e.op === "delta")!.data).toMatchObject({ by: 12, moveFrom: "demo-s1" });
  });
  it("F8.2 Q24 = C: an emptied line with no required amount is archived in the same save; part of it, or with an amount, stays", async () => {
    const { door, inv, b } = await open();
    expect((await inv.move(anna(door), "demo-s9", "demo-l0", 3)).archived).toBe(false);   // Bandage, Trauma kit, no amount: part only
    expect(line(door, "demo-s9")).toMatchObject({ qty: 1, state: "Active" });
    const before = (await b.load()).changes.length;
    const r = await inv.move(anna(door), "demo-s9", "demo-l0", 1);                          // the rest
    expect(r.archived).toBe(true);
    expect(line(door, "demo-s9")).toMatchObject({ qty: 0, state: "Archived" });
    expect((await b.load()).changes.length).toBe(before + 3);                               // take, add (joins), archive: one save
    expect(door.log()[0]).toMatchObject({ op: "archive", recordId: "demo-s9" });
    expect((await inv.move(anna(door), "demo-s10", "demo-l1", 6)).archived).toBe(false);   // Gloves, Store, reorder at 10: stays at 0
    expect(line(door, "demo-s10")).toMatchObject({ qty: 0, state: "Active" });
  });
  it("F8.2 a move that can't be saved changes nothing (all or none)", async () => {
    const { door, inv, b } = await open();
    // the disk refuses any save that holds the new line: if the take were saved on its own first, stock would vanish
    const commit = b.commit.bind(b);
    b.commit = async (cs, o) => { if (cs.some(c => c.op === "create" && c.recordType === "line")) throw new Error("disk full"); return commit(cs, o); };
    await expect(inv.move(anna(door), "demo-s1", "demo-l2", 5)).rejects.toThrow("Not saved.");
    expect((await b.load()).changes.filter(c => c.recordId === "demo-s1").length).toBe(1);   // only its DEMO create
    expect(line(door, "demo-s1").qty).toBe(12);
    expect(door.records("line").filter(l => l.itemId === "demo-i1").length).toBe(2);
  });
  it("F8.3 edit: the place can't change here; only what changed is saved, old → new; whole numbers", async () => {
    const { door, inv } = await open();
    await expect(inv.editLine(anna(door), "demo-s1", { qty: 12, required: 10, locationId: "demo-l2" })).rejects.toThrow("Use Move.");
    await expect(inv.editLine(anna(door), "demo-s1", { qty: "1.5", required: 10 })).rejects.toThrow("Whole numbers only.");
    await expect(inv.editLine(anna(door), "demo-s1", { qty: 12, required: "-1" })).rejects.toThrow("It can't be below 0.");
    await expect(inv.editLine(anna(door), "demo-s1", { qty: 12, required: 10, lot: "G-2201", expiry: "2027-02-30" })).rejects.toThrow("isn't a date");
    expect(await inv.editLine(anna(door), "demo-s1", { qty: 12, required: 10, lot: "G-2201", expiry: "2027-12-01" })).toBe(false);
    expect(await inv.editLine(anna(door), "demo-s1", { qty: 11, required: "", lot: "G-2201", expiry: "2027-12-01" })).toBe(true);
    expect(door.log()[0].changes).toEqual([{ field: "qty", from: 12, to: 11 }, { field: "required", from: 10, to: null }]);
  });
  it("F8.4 add an item (duplicate refused), add a place; View level refused", async () => {
    const { door, inv } = await open();
    await expect(inv.addItem(anna(door), { name: "saline 0.9% 500 ML", locationId: "demo-l0", qty: 1 })).rejects.toThrow("already there");
    const id = await inv.addItem(anna(door), { name: "Burn dressing 10×10 cm", categoryId: "cat-dressings", unit: "pack", locationId: "demo-l0", qty: 6 });
    expect(door.get("item", id)).toMatchObject({ name: "Burn dressing 10×10 cm", categoryId: "cat-dressings", unit: "pack", state: "Active" });
    expect(door.records("line").find(l => l.itemId === id)).toMatchObject({ locationId: "demo-l0", qty: 6, required: null });
    await inv.addLine(anna(door), id, "demo-l1", { qty: 2, required: 2, lot: "", expiry: "2028-01-31" });
    expect(door.records("line").filter(l => l.itemId === id).length).toBe(2);
    const dina = door.get("person", "demo-p4")!;
    await door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" }, by: "demo-p3" });
    await expect(inv.addItem(dina, { name: "X", locationId: "demo-l0", qty: 1 })).rejects.toThrow("View level can look but not change anything.");
  });
  it("F8.4 archive and reactivate; an item in use can't be archived", async () => {
    const { door, inv } = await open();
    await expect(inv.archive(anna(door), "item", "demo-i4")).rejects.toThrow("IV cannula 18G still has 1 line in use.");
    await inv.archive(anna(door), "line", "demo-s4");
    await inv.archive(anna(door), "item", "demo-i4");
    await expect(inv.restore(anna(door), "line", "demo-s4")).rejects.toThrow("Restore the item first.");
    await inv.restore(anna(door), "item", "demo-i4");
    await inv.restore(anna(door), "line", "demo-s4");
    expect(line(door, "demo-s4").state).toBe("Active");
  });
  it("F8.4 delete for good: only Manage, only a mistake within 24 hours, an item only without lines; logged", async () => {
    const { door, inv } = await open();
    const id = await inv.addItem(cara(door), { name: "Typo itme", locationId: "demo-l0", qty: 0 });
    const lid = door.records("line").find(l => l.itemId === id)!.id;
    expect(inv.deleteProblem(anna(door), "line", lid)).toBe("Only Manage level can delete a mistake.");
    await expect(inv.deleteMistake(anna(door), "line", lid)).rejects.toThrow("Only Manage level");
    expect(inv.deleteProblem(cara(door), "item", id)).toMatch(/still has 1 line/);
    expect(inv.deleteProblem(cara(door), "line", "demo-s1")).toMatch(/within 24 hours/);           // DEMO lines are older
    await inv.deleteMistake(cara(door), "line", lid);
    await inv.deleteMistake(cara(door), "item", id);
    expect(door.get("item", id)).toBeUndefined();
    expect(door.log()[0]).toMatchObject({ op: "delete", recordType: "item", by: "demo-p3", was: { name: "Typo itme" } });
    clock += DAY_MS;
    const late = await inv.addItem(cara(door), { name: "Late typo", locationId: "demo-l0", qty: 0 });
    clock += DAY_MS + 1;
    expect(inv.deleteProblem(cara(door), "line", door.records("line").find(l => l.itemId === late)!.id)).toMatch(/within 24 hours/);
  });
});

describe("restock and dispense (F9)", () => {
  it("F9.1 a whole number, 1 or more; 0, negatives, decimals and an empty box are refused and nothing changes (B17)", async () => {
    const { door, inv, b } = await open();
    const before = (await b.load()).changes.length;
    for (const [bad, why] of [["0", "It has to be at least 1. 0 isn't allowed."], ["-5", "It has to be at least 1."], ["2.7", "Whole numbers only. 2.7 isn't allowed"], ["", "Type the amount."], ["  ", "Type the amount."], ["3 boxes", "isn't a number"]] as const) {
      await expect(inv.adjust(anna(door), "demo-s1", "restock", bad)).rejects.toThrow(why);
      await expect(inv.adjust(anna(door), "demo-s1", "dispense", bad)).rejects.toThrow(why);
    }
    expect(line(door, "demo-s1").qty).toBe(12);
    expect((await b.load()).changes.length).toBe(before);
    expect(await inv.adjust(anna(door), "demo-s1", "restock", "3")).toBe(15);
    expect(await inv.adjust(anna(door), "demo-s1", "dispense", " 5 ")).toBe(10);
  });
  it("F9.2 taking out more than is there is refused; all of it is allowed", async () => {
    const { door, inv } = await open();
    await expect(inv.adjust(anna(door), "demo-s2", "dispense", 5)).rejects.toThrow("Only 4 on hand, so 5 can't be taken.");
    expect(await inv.adjust(anna(door), "demo-s2", "dispense", 4)).toBe(0);
    await expect(inv.adjust(anna(door), "demo-s4", "dispense", 1)).rejects.toThrow("Only 0 on hand, so 1 can't be taken.");
  });
  it("F9.3 every booked movement is logged old → new, as restock or dispense", async () => {
    const { door, inv } = await open();
    await inv.adjust(anna(door), "demo-s1", "dispense", 2);
    expect(door.log()[0]).toMatchObject({ by: "demo-p1", recordId: "demo-s1", data: { kind: "dispense", by: -2 }, changes: [{ field: "qty", from: 12, to: 10 }] });
    await inv.adjust(anna(door), "demo-s1", "restock", 7);
    expect(door.log()[0].changes).toEqual([{ field: "qty", from: 10, to: 17 }]);
  });
  it("F9.4 a controlled drug has no plain restock or dispense; its amount can't be edited or moved outside the register (Q8)", async () => {
    const { door, inv } = await open();
    for (const f of [() => inv.adjust(anna(door), "demo-s7", "dispense", 1), () => inv.adjust(cara(door), "demo-s7", "restock", 1),
      () => inv.editLine(cara(door), "demo-s7", { qty: 4, required: 5, lot: "M-3", expiry: "2027-07-24" }), () => inv.move(cara(door), "demo-s7", "demo-l1", 1)])
      await expect(f()).rejects.toThrow("controlled-drug register");
    expect(line(door, "demo-s7").qty).toBe(5);
    expect(await inv.editLine(cara(door), "demo-s7", { qty: 5, required: 6, lot: "M-3", expiry: "2027-07-24" })).toBe(true);   // the reorder level may change
  });
  it("View level and archived lines can't be restocked or dispensed", async () => {
    const { door, inv } = await open();
    await door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" }, by: "demo-p3" });
    await expect(inv.adjust(door.get("person", "demo-p4")!, "demo-s1", "restock", 1)).rejects.toThrow("View level");
    await inv.archive(anna(door), "line", "demo-s1");
    await expect(inv.adjust(anna(door), "demo-s1", "restock", 1)).rejects.toThrow("Reactivate the line first.");
  });
});

describe("count stock (F10)", () => {
  it("F10.1 an empty box is 'not counted' and changes nothing (B16); typed counts are saved together", async () => {
    const { door, inv, b } = await open();
    const before = (await b.load()).changes.length;
    const r = await inv.saveCounts(anna(door), { "demo-s1": "11", "demo-s2": "", "demo-s3": "  ", "demo-s4": "0" });
    expect(r).toEqual({ changed: 1, same: 1 });                                      // Gauze 12 → 11; IV cannula 0 = 0
    expect(line(door, "demo-s1").qty).toBe(11);
    expect(line(door, "demo-s2").qty).toBe(4);                                     // empty: not set to 0
    expect(line(door, "demo-s3").qty).toBe(2);
    expect((await b.load()).changes.length).toBe(before + 2);
    expect(await inv.saveCounts(anna(door), { "demo-s1": "" })).toEqual({ changed: 0, same: 0 });
  });
  it("F10.3 a count that isn't a whole number of 0 or more blocks the whole save", async () => {
    const { door, inv, b } = await open();
    const before = (await b.load()).changes.length;
    for (const bad of ["-1", "2.5", "ten", "1,5"]) {
      await expect(inv.saveCounts(anna(door), { "demo-s1": "11", "demo-s2": bad })).rejects.toThrow("1 count isn't a whole number of 0 or more. Fix the red box first. Nothing was saved.");
    }
    expect(line(door, "demo-s1").qty).toBe(12);
    expect((await b.load()).changes.length).toBe(before);
    expect(InventoryStore.countProblem("0")).toBeNull();
    expect(InventoryStore.countProblem("")).toBeNull();
    expect(InventoryStore.countProblem("-3")).toBe("It can't be below 0.");
  });
  it("F10.4 each change logged old → new; a count that matches is logged as the same", async () => {
    const { door, inv } = await open();
    await inv.saveCounts(anna(door), { "demo-s1": "9", "demo-s2": "4" });
    const counts = door.log().filter(e => e.op === "count");
    expect(counts.find(e => e.recordId === "demo-s1")!.changes).toEqual([{ field: "qty", from: 12, to: 9 }]);
    expect(counts.find(e => e.recordId === "demo-s2")!.changes).toEqual([]);
    expect(counts[0].by).toBe("demo-p1");
  });
  it("controlled drugs are counted in the register, not here; View level can't count", async () => {
    const { door, inv } = await open();
    await expect(inv.saveCounts(cara(door), { "demo-s7": "4" })).rejects.toThrow("controlled-drug register");
    expect(line(door, "demo-s7").qty).toBe(5);
    await door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" }, by: "demo-p3" });
    await expect(inv.saveCounts(door.get("person", "demo-p4")!, { "demo-s1": "3" })).rejects.toThrow("View level");
  });
  it("two counts from the same starting point that disagree are flagged; a count made after seeing the other isn't (F3.5)", async () => {
    const { door, inv } = await open();
    const ben = door.get("person", "demo-p2")!;
    await inv.saveCounts(anna(door), { "demo-s1": "11" });                            // Anna: based on no earlier count
    // Dina counted on another computer at the same time, without seeing Anna's count: also based on no earlier count
    await door.apply({ recordType: "line", recordId: "demo-s1", op: "count", data: { qty: 9, basedOn: null }, by: "demo-p4" });
    expect(door.flags()).toHaveLength(1);
    expect(door.flags()[0].counts.map(c => c.qty)).toEqual([11, 9]);
    await inv.saveCounts(ben, { "demo-s2": "4" });                                  // another line: no flag
    expect(door.flags()).toHaveLength(1);
    await inv.saveCounts(ben, { "demo-s1": "10" });                                 // Ben counts after seeing them: his count is based on Dina's, not flagged again
    expect(door.flags()).toHaveLength(1);
    expect(line(door, "demo-s1").qty).toBe(10);
  });
});

import { thenVsNow, stockTakeCsv, stockTakeFileName, checkDelete } from "@md/core";

describe("stock takes (F11)", () => {
  it("F11.1 freeze: every line in use, date, who, label; names copied as they were", async () => {
    const { door, inv } = await open();
    await expect(inv.freezeStockTake(anna(door), "  ")).rejects.toThrow("Give the stock take a label");
    await inv.archive(anna(door), "line", "demo-s9");                                     // archived lines are not in it
    const id = await inv.freezeStockTake(anna(door), "Stock take, November 2026");
    const t = door.get("stocktake", id)!;
    expect(t).toMatchObject({ name: "Stock take, November 2026", createdBy: "demo-p1" });
    expect(typeof t.createdAt).toBe("number");
    const lines = t.lines as any[];
    expect(lines.length).toBe(9);
    expect(lines.find(l => l.lineId === "demo-s1")).toMatchObject({ item: "Gauze 10×10 cm", place: "Bag 1 (adult)", lot: "G-2201", expiry: "2027-12-01", qty: 12, required: 10 });
    expect(lines.some(l => l.lineId === "demo-s9")).toBe(false);
  });
  it("F11.1 it can't be changed or deleted afterwards — not by this computer, not by a message from another one", async () => {
    const { door, inv } = await open();
    const id = await inv.freezeStockTake(anna(door), "November");
    const before = JSON.stringify(door.get("stocktake", id));
    for (const op of ["set", "delta", "count", "archive", "delete"] as const)
      await door.apply({ recordType: "stocktake", recordId: id, op, data: { name: "changed", field: "x", by: 1, qty: 1, lines: [] }, by: "demo-p3" });
    expect(JSON.stringify(door.get("stocktake", id))).toBe(before);
    expect(checkDelete("stocktake", door.get("stocktake", id)!, cara(door) as any, Date.now()).ok).toBe(false);
  });
  it("F11.2 then vs now for every line; lines removed since are shown as removed (archived or deleted)", async () => {
    const { door, inv } = await open();
    const lid = await inv.addLine(cara(door), "demo-i4", "demo-l0", { qty: 3, required: "", lot: "", expiry: "" });
    const id = await inv.freezeStockTake(anna(door), "November");
    await inv.adjust(anna(door), "demo-s1", "dispense", 2);
    await inv.archive(anna(door), "line", "demo-s9");
    await inv.deleteMistake(cara(door), "line", lid);
    const rows = thenVsNow(door.get("stocktake", id) as any, (x) => door.get("line", x));
    const by = (x: string) => rows.find(r => r.line.lineId === x)!;
    expect(by("demo-s1")).toMatchObject({ now: 10, change: -2, state: "changed" });
    expect(by("demo-s2")).toMatchObject({ now: 4, change: 0, state: "same" });
    expect(by("demo-s9")).toMatchObject({ now: null, state: "archived" });
    expect(by(lid)).toMatchObject({ now: null, state: "deleted", line: { item: "IV cannula 18G", place: "Store (main)" } });
  });
  it("F11.3 the file: local dates, then and now, removed lines named", () => {
    const take = { name: "Stock take, November 2026", lines: [{ lineId: "a", itemId: "i", item: "Gauze, sterile", place: "Bag 1 (adult)", lot: "G-1", expiry: "2027-12-01", qty: 12, required: 10 }, { lineId: "b", itemId: "j", item: "Saline", place: "Store (main)", lot: "", expiry: null, qty: 4, required: null }] };
    const rows = thenVsNow(take, (id) => id === "a" ? { qty: 10, state: "Active" } : undefined);
    const text = stockTakeCsv(take, rows, "2026-11-28", "10:00", "Anna Example");
    expect(text.slice(1).trimEnd().split("\r\n")).toEqual([
      "Stock take,Frozen on,Frozen at,By,Item,Place,Lot,Expiry,Counted then,Now,Change",
      "\"Stock take, November 2026\",2026-11-28,10:00,Anna Example,\"Gauze, sterile\",Bag 1 (adult),G-1,2027-12-01,12,10,-2",
      "\"Stock take, November 2026\",2026-11-28,10:00,Anna Example,Saline,Store (main),,,4,deleted since,",
    ]);
    expect(stockTakeFileName("Stock take, November 2026", "2026-11-28")).toBe("stock-take-november-2026-2026-11-28.csv");
    expect(stockTakeFileName("Monthly", "2026-11-28")).toBe("stock-take-monthly-2026-11-28.csv");
  });
  it("F11.4 stock takes are change messages: they survive a new version and reach the server", async () => {
    const b = new MemoryBackend();
    const first = await open(b);
    const id = await first.inv.freezeStockTake(anna(first.door), "November");
    const again = await Door.open({ backend: b, seed: demoSeedChanges, now });          // the next version opens the same data
    expect(again.get("stocktake", id)).toMatchObject({ name: "November" });
    expect((await b.load()).outbox).toContain(again.messages().find(m => m.recordId === id)!.messageId);   // waiting to go to the server
  });
});
