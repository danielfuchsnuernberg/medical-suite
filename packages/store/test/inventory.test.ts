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
