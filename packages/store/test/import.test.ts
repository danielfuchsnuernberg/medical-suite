import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, InventoryStore, RegisterStore } from "../src";
import { demoSeedChanges, planImport, defaultTarget, newestCount, rowKey, type Checked } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);
const open = async () => { const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now }); return { door, inv: new InventoryStore(door), reg: new RegisterStore(door) }; };
const P = (d: Door, id: string) => d.get("person", id)!;
const ben = (d: Door) => P(d, "demo-p2"), cara = (d: Door) => P(d, "demo-p3"), anna = (d: Door) => P(d, "demo-p1");
const places = (d: Door) => d.records("location").map(l => ({ id: l.id, name: String(l.name), kind: l.kind, state: l.state }));
const items = (d: Door) => d.records("item").map(i => ({ id: i.id, name: String(i.name), unit: i.unit, controlled: i.controlled, state: i.state }));
const row = (sheet: string, n: number, item: string, counts: (number | null)[], o: Partial<{ unit: string; lot: string; expiry: string; required: number | null }> = {}) =>
  ({ sheet, row: n, item, tidied: item, unit: o.unit ?? "pack", lot: o.lot ?? "", expiry: o.expiry ?? "", required: o.required ?? null, counts, flags: [] });
// Made-up, already-checked lists (DEMO): the Store sheet of the stock take, and a bag sheet
const checked = (): Checked => ({ rows: 5, blocking: 0, notes: 0, sheets: [
  { name: "Sheet1", header: 0, columns: { item: 1, counts: [{ index: 5, label: "SOH Jan" }, { index: 6, label: "SOH FEB" }, { index: 7, label: "SOH MAR" }] }, rows: [
    row("Sheet1", 2, "Gauze 10×10 cm", [30, 28, null], { lot: "G-2190", expiry: "2027-10-01" }),   // the DEMO Store line: becomes a count
    row("Sheet1", 3, "Burn dressing 10×10 cm", [6, null, 5]),
    row("Sheet1", 4, "Morphine 10 mg/ml (demo)", [5, 5, 5], { unit: "amp", lot: "M-3", expiry: "2027-07-24" }),   // already controlled: waits
    row("Sheet1", 5, "Ketamine 200 mg", [null, null, null], { unit: "vial" }) ] },
  { name: "Snake Bite Kit", header: 0, columns: { item: 0, required: 1, counts: [{ index: 3, label: "SOH Mar" }, { index: 4, label: "2026-04" }] }, rows: [
    row("Snake Bite Kit", 2, "Crepe bandage", [6, 4], { required: 6, unit: "roll" }) ] },
] });

describe("planning and loading an Excel list (F13.6, Q26 = A, A, A)", () => {
  it("each sheet goes to the place with its name, the Store for the stock take, or a new bag", async () => {
    const { door } = await open();
    expect(defaultTarget("Sheet1", "Stock Take 2026.xlsx", places(door))).toEqual({ kind: "place", id: "demo-l0" });
    expect(defaultTarget("  trauma   KIT ", "x.xlsx", places(door))).toEqual({ kind: "place", id: "demo-l3" });
    expect(defaultTarget("Snake Bite Kit ", "Medevac Bag Check List.xlsx", places(door))).toEqual({ kind: "new", name: "Snake Bite Kit" });
  });
  it("the newest month with a number is the amount; the preview says which month", () => {
    expect(newestCount(row("s", 1, "x", [3, 7, null]), ["Jan", "Feb", "Mar"])).toEqual({ qty: 7, month: "Feb" });
    expect(newestCount(row("s", 1, "x", [null, null]), ["Jan", "Feb"])).toEqual({ qty: 0, month: null });
  });
  it("controlled drugs wait for the Head Doctor; suggested ones too; required amounts only in bags", async () => {
    const { door } = await open();
    const plan = planImport(checked(), "Stock Take 2026.xlsx", places(door), items(door), { suggested: new Set([rowKey({ sheet: "Sheet1", row: 5 })]) });
    const r = (n: number) => plan.sheets[0].rows.find(x => x.row === n)!;
    expect([r(2).qty, r(2).month, r(2).itemId]).toEqual([28, "SOH FEB", "demo-i1"]);
    expect(r(4).waits).toBe("controlled");
    expect(r(5).waits).toBe("suggested");
    expect(plan.sheets[1].rows[0]).toMatchObject({ qty: 4, month: "2026-04", required: 6 });
    expect([plan.load, plan.waiting, plan.newItems, plan.newBags]).toEqual([3, 2, 3, ["Snake Bite Kit"]]);
  });
  it("loading: Manage only, refused while rows must be fixed, one save; counts lines that exist, makes the rest; waiting rows don't load", async () => {
    const { door, inv, reg } = await open();
    const plan = planImport(checked(), "Stock Take 2026.xlsx", places(door), items(door), { suggested: new Set(["Sheet1#5"]) });
    await expect(inv.loadImport(anna(door), plan, "Stock Take 2026.xlsx", 0)).rejects.toThrow("Only Manage level imports stock lists.");
    await expect(inv.loadImport(cara(door), plan, "Stock Take 2026.xlsx", 2)).rejects.toThrow("2 rows have to be fixed in the spreadsheet first. Nothing was loaded.");
    const n = door.messages().length;
    const r = await inv.loadImport(cara(door), plan, "Stock Take 2026.xlsx", 0);
    expect(r).toEqual({ loaded: 3, waiting: 2, newBags: 1 });
    expect(door.get("line", "demo-s6")!.qty).toBe(28);                                       // counted, not doubled
    const burn = door.records("item").find(i => i.name === "Burn dressing 10×10 cm")!;
    expect(door.records("line").find(l => l.itemId === burn.id)).toMatchObject({ locationId: "demo-l0", qty: 5, required: null });
    const kit = door.records("location").find(l => l.name === "Snake Bite Kit")!;
    expect(kit.kind).toBe("bag");
    expect(door.records("line").find(l => l.locationId === kit.id)).toMatchObject({ qty: 4, required: 6 });
    expect(door.records("item").some(i => i.name === "Ketamine 200 mg")).toBe(false);          // waits, not loaded
    expect(door.get("line", "demo-s7")!.qty).toBe(5);                                       // Morphine untouched
    expect(reg.waitingImports().map(w => [w.item, w.why])).toEqual([["Morphine 10 mg/ml (demo)", "controlled"], ["Ketamine 200 mg", "suggested"]]);
    expect(door.messages().length - n).toBe(9);                                             // 1 bag, 2 items, 1 count, 2 lines, 2 waits, 1 event: one save
  });
  it("the Head Doctor decides each waiting row: controlled through the register with a witness, or ordinary", async () => {
    const { door, inv, reg } = await open();
    await inv.loadImport(cara(door), planImport(checked(), "Stock Take 2026.xlsx", places(door), items(door), { suggested: new Set(["Sheet1#5"]) }), "Stock Take 2026.xlsx", 0);
    const [morph, ket] = reg.waitingImports();
    await expect(reg.confirmImport(cara(door), ket.id, true, "demo-p4")).rejects.toThrow("Only a Head Doctor");
    await expect(reg.confirmImport(ben(door), ket.id, true, "")).rejects.toThrow("A witness has to sign");
    await expect(reg.confirmImport(ben(door), morph.id, false)).rejects.toThrow("is a controlled drug: its stock comes in through the register.");
    await reg.confirmImport(ben(door), morph.id, true, "demo-p4");                           // in: same lot joins, register 5 + 5
    expect(reg.balance("demo-i5")).toBe(10);
    expect(reg.onShelves("demo-i5")).toBe(10);
    expect(reg.ledger("demo-i5").at(-1)!.line).toMatchObject({ kind: "in", qty: 5, witness: "demo-p4" });
    await reg.confirmImport(ben(door), ket.id, true, "demo-p4");                             // a new controlled drug: opening line
    const k = door.records("item").find(i => i.name === "Ketamine 200 mg")!;
    expect(k.controlled).toBe(true);
    expect(reg.ledger(k.id).map(r => [r.line.kind, r.line.qty])).toEqual([["opening", 0]]);
    expect(reg.waitingImports()).toEqual([]);
    await expect(reg.confirmImport(ben(door), ket.id, true, "demo-p4")).rejects.toThrow("already been decided");
  });
  it("not a controlled drug: it loads as ordinary stock", async () => {
    const { door, inv, reg } = await open();
    await inv.loadImport(cara(door), planImport(checked(), "Stock Take 2026.xlsx", places(door), items(door), { suggested: new Set(["Sheet1#3"]) }), "Stock Take 2026.xlsx", 0);
    const w = reg.waitingImports().find(x => x.item === "Burn dressing 10×10 cm")!;
    await reg.confirmImport(ben(door), w.id, false);
    const burn = door.records("item").find(i => i.name === "Burn dressing 10×10 cm")!;
    expect(burn.controlled).toBe(false);
    expect(door.records("line").find(l => l.itemId === burn.id)!.qty).toBe(5);
  });
});
