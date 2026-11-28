import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, Accounts, InventoryStore, RegisterStore, SettingsStore, TrainingStore, BackupStore, MemoryFiles } from "../src";
import { demoSeedChanges } from "@md/core";

// Stage 8 (28 Nov 2026): one test per gap B58–B69, each failing before its fix (Danny's GO, Q31 = A, Q32 = B).
let clock = Date.UTC(2026, 10, 27, 23, 0);
const now = () => (clock += 1000);
const open = async () => {
  const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
  return { door, acc: new Accounts(door), inv: new InventoryStore(door), reg: new RegisterStore(door), st: new SettingsStore(door), tr: new TrainingStore(door) };
};
const P = (d: Door, id: string) => d.get("person", id)!;

describe("B63 (Q31 = A): only doctors change the doctors' list", () => {
  it("Management can't change a listed doctor's profession; the list can't be emptied that way", async () => {
    const { door, acc, reg } = await open();
    const cara = P(door, "demo-p3");
    await expect(acc.setProfession(cara, "demo-p2", "Nurse")).rejects.toThrow("Dr Ben Sample is on the doctors' list. A doctor removes them first (✕); then the profession can change.");
    expect(reg.doctors().map(p => p.id)).toEqual(["demo-p2"]);
    await expect(reg.grant(cara, "demo-p1")).rejects.toThrow();       // the list isn't empty: Management names nobody
  });
  it("someone off the list doesn't come back on it by being set to Doctor again (an old stored right is cleared)", async () => {
    const { door, acc, reg } = await open();
    await door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { profession: "Nurse", cdRight: true }, by: "demo-p3" });   // old data
    await acc.setProfession(P(door, "demo-p3"), "demo-p4", "Doctor");
    await acc.setMedicalCode(P(door, "demo-p4"), "MD-D4");
    expect(reg.isDoctor("demo-p4")).toBe(false);
  });
  it("after the last doctor is archived (still allowed), Management names the next one, as before", async () => {
    const { door, acc, reg } = await open();
    const cara = P(door, "demo-p3");
    await door.apply({ recordType: "person", recordId: "demo-p1", op: "set", data: { profession: "Doctor", medicalCode: "MD-A1" }, by: "demo-p3" });
    await acc.archive(cara, "demo-p2");
    expect(reg.doctors().length).toBe(0);
    await reg.grant(cara, "demo-p1");
    expect(reg.doctors().map(p => p.id)).toEqual(["demo-p1"]);
  });
});

describe("group 2: country, numbers, name, office", () => {
  it("B59 new records carry the base's country; Management adds a country in Settings", async () => {
    const { door, st, inv } = await open();
    const cara = P(door, "demo-p3");
    await st.saveBase(cara, { ...st.base(), country: "PE", timeZone: "America/Lima", baseName: "Lima base" } as any);
    await inv.addItem(cara, { name: "Peru gauze", locationId: "demo-l0", qty: 1 });
    expect(door.records("item").find(i => i.name === "Peru gauze")!.country).toBe("PE");
    await expect(st.addCountry(P(door, "demo-p1"), { code: "CL", name: "Chile", timeZone: "America/Santiago" })).rejects.toThrow("Only Manage level");
    await expect(st.addCountry(cara, { code: "C", name: "Chile", timeZone: "America/Santiago" })).rejects.toThrow("two letters");
    await expect(st.addCountry(cara, { code: "PE", name: "Peru again", timeZone: "America/Lima" })).rejects.toThrow("already in the list");
    await st.addCountry(cara, { code: "cl", name: "Chile", timeZone: "America/Santiago" });
    expect(st.countries().map(c => c.code)).toContain("CL");
    await st.saveBase(cara, { ...st.base(), country: "CL", timeZone: "America/Santiago" } as any);
    await inv.addItem(cara, { name: "Chile gauze", locationId: "demo-l0", qty: 1 });
    expect(door.records("item").find(i => i.name === "Chile gauze")!.country).toBe("CL");
    expect(door.records("item").find(i => i.name === "Peru gauze")!.country).toBe("PE");     // stamped once, never moves
  });
  it("B62 new people and items get the next readable number; a clash from two computers reads -2", async () => {
    const { door, acc, inv } = await open();
    const cara = P(door, "demo-p3");
    const eva = await acc.addPerson(cara, { name: "Eva Trial", job: "", level: "Work" });
    expect(eva.staffNo).toBe("S-006");
    await inv.addItem(cara, { name: "New thing", locationId: "demo-l0", qty: 1 });
    const it = door.records("item").find(i => i.name === "New thing")!;
    expect(it.itemNo).toMatch(/^I-\d{4}$/);
    const { shownNumbers } = await import("@md/core");
    const shown = shownNumbers([{ id: "a", staffNo: "S-007", createdAt: 1 }, { id: "b", staffNo: "S-007", createdAt: 2 }], "staffNo");
    expect([shown.get("a"), shown.get("b")]).toEqual(["S-007", "S-007-2"]);
  });
  it("B61 the program's name is a setting, REACH Medical Suite until changed", async () => {
    const { door, st } = await open();
    const { programName } = await import("@md/core");
    expect(programName(st.base())).toBe("REACH Medical Suite");
    await st.saveBase(P(door, "demo-p3"), { ...st.base(), programName: "REACH Medical" } as any);
    expect(programName(st.base())).toBe("REACH Medical");
  });
  it("B65 the person who sets up a computer has a REACH office", async () => {
    const door = await Door.open({ backend: new MemoryBackend(), seed: null, now });
    const acc = new Accounts(door);
    const p = await acc.setUp({ name: "Cara Real", job: "Base manager", office: "Management" }, "cara-secret-1", "cara-secret-1");
    expect(p).toMatchObject({ office: "Management", staffNo: "S-001" });
    const q = await acc.addPerson(p, { name: "No Office Given", job: "", level: "Work" });
    expect(q.office).toBe("Medics");
  });
});

describe("group 3: restore keeps the log (Q32 = B), loading checks itself", () => {
  it("B66 a restore sets records back with new changes: every log entry stays, the restore is one entry; register lines and stock takes stay", async () => {
    const { door, inv, reg } = await open();
    const bs = new BackupStore(door, new MemoryFiles());
    const cara = P(door, "demo-p3"), anna = P(door, "demo-p1");
    const text = bs.exportFile(cara).text;
    const logBefore = door.log().length;
    await inv.adjust(anna, "demo-s1", "dispense", 5);                                    // after the backup
    await inv.addItem(cara, { name: "Made after", locationId: "demo-l0", qty: 2 });
    await inv.freezeStockTake(anna, "After the backup");
    await reg.receive(anna, { itemId: "demo-i5", locationId: "demo-l0", qty: 1, witness: "demo-p4", reason: "delivery" });
    const entriesBeforeRestore = door.log().length;
    const r = await bs.restore(cara, text, true);
    expect(door.get("line", "demo-s1")!.qty).toBe(12);                                    // set back
    expect(door.records("item").find(i => i.name === "Made after")!.state).toBe("Archived");   // archived, not deleted
    expect(door.records("stocktake").length).toBe(1);                                     // stock takes stay
    expect(door.records("cdline").some(l => l.kind === "in")).toBe(true);                // register lines stay
    expect(door.messages().filter(m => ["stocktake", "cdline", "cddecision", "event"].includes(m.recordType) && m.op !== "create").length).toBe(0);   // not even tried
    expect(door.log().length).toBeGreaterThan(entriesBeforeRestore);                      // nothing cut
    expect(door.log().length).toBeGreaterThan(logBefore);
    expect(door.log().some(e => e.recordId === "demo-s1" && e.op === "delta")).toBe(true);
    const ev = door.records("event").find(e => e.what === "restored a backup")!;
    expect(ev).toMatchObject({ records: r.records, safety: r.safety });
    expect(r.records).toBeGreaterThan(0);
  });
  it("B64 the store refuses a plan with must-fix rows even when told there are none", async () => {
    const { door, inv } = await open();
    const plan = { sheets: [{ name: "Store (DEMO)", target: { kind: "place", id: "demo-l0" }, rows: [{ key: "x#2", sheet: "Store (DEMO)", row: 2, item: "Gauze", itemId: null, unit: "", qty: 1, month: null, lot: "", expiry: null, required: null, waits: null, blocking: true }] }], load: 1, waiting: 0, newItems: 1, newBags: [], skipped: 0 } as any;
    await expect(inv.loadImport(P(door, "demo-p3"), plan, "x.xlsx", 0)).rejects.toThrow("1 row has to be fixed");
  });
});
