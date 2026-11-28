import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, Accounts, InventoryStore, RegisterStore, SettingsStore, TrainingStore } from "../src";
import { demoSeedChanges, planImport, type Checked } from "@md/core";

// Stage 7 (28 Nov 2026): one test per bug B29–B57, each failing before its fix (Danny's GO, Q27–Q29 = A).
let clock = Date.UTC(2026, 10, 27, 23, 0);
const now = () => (clock += 1000);
const open = async () => {
  const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
  return { door, acc: new Accounts(door), inv: new InventoryStore(door), reg: new RegisterStore(door), st: new SettingsStore(door), tr: new TrainingStore(door) };
};
const P = (d: Door, id: string) => d.get("person", id)!;
const M = "demo-i5", STORE = "demo-s7";   // Morphine in the Store: 5
const asDoctor = (d: Door, id: string) => d.apply({ recordType: "person", recordId: id, op: "set", data: { profession: "Doctor", medicalCode: "DEMO-MD-" + id }, by: "demo-p3" });
const base = { itemId: M, lineId: STORE, witness: "demo-p4", reason: "case 1" } as any;

describe("group 1: controlled drugs only through the register", () => {
  it("B35 archive, restore, add a place and delete-a-mistake are refused for a controlled drug's stock", async () => {
    const { door, inv, reg } = await open();
    const anna = P(door, "demo-p1"), ben = P(door, "demo-p2");
    await expect(inv.archive(anna, "line", STORE)).rejects.toThrow(/controlled drug/);
    expect(door.get("line", STORE)!.state).toBe("Active");
    await expect(inv.addLine(anna, M, "demo-l1", { qty: 50, required: "" } as any)).rejects.toThrow(/controlled drug/);
    expect(reg.onShelves(M)).toBe(reg.balance(M));
    // a line received through the register, then "deleted as a mistake"
    await reg.receive(anna, { itemId: M, locationId: "demo-l2", qty: 3, witness: "demo-p4", reason: "delivery" });
    const bag2 = door.records("line").find(l => l.itemId === M && l.locationId === "demo-l2")!;
    expect(inv.deleteProblem(ben, "line", bag2.id)).toMatch(/controlled drug/);
    await expect(inv.deleteMistake(ben, "line", bag2.id)).rejects.toThrow(/controlled drug/);
    expect(reg.onShelves(M)).toBe(8);
    expect(reg.balance(M)).toBe(8);
  });

  it("B35 an archived controlled drug in an import waits for the Head Doctor; loading it as ordinary is refused", async () => {
    const { door, inv } = await open();
    await door.apply({ recordType: "item", recordId: M, op: "archive", by: "demo-p3" });
    const name = String(door.get("item", M)!.name);
    const checked: Checked = { sheets: [{ name: "Bag 1 (adult)", columns: { counts: [{ label: "SOH FEB" }] } as any, rows: [{ row: 2, tidied: name, unit: "amp", lot: "", expiry: "", counts: [7], required: null } as any], notes: [] } as any] } as any;
    const plan = planImport(checked, "x.xlsx", door.records("location") as any, door.records("item") as any);
    expect(plan.sheets[0]!.rows[0]!.waits).toBe("controlled");
    plan.sheets[0]!.rows[0]!.waits = null;   // forced past the screen
    await expect(inv.loadImport(P(door, "demo-p3"), plan, "x.xlsx", 0)).rejects.toThrow(/controlled drug/);
    expect(door.records("item").filter(i => i.name === name).length).toBe(1);
  });

  it("B36 unticking is refused while a take-out waits; a drug no longer controlled can't be approved or corrected", async () => {
    const { door, reg, inv } = await open();
    const anna = P(door, "demo-p1"), ben = P(door, "demo-p2");
    await reg.takeOut(anna, { ...base, qty: 2, how: "request", doctor: "demo-p2" });
    await reg.takeOut(anna, { ...base, qty: 1, how: "emergency" });
    await expect(reg.setControlled(ben, M, false, { reason: "test" })).rejects.toThrow("2 take-outs of Morphine 10 mg/ml (demo) still wait for a doctor. Decide them first.");
    expect(reg.waitingAll().length).toBe(2);
    // decide both, then untick: the register is read-only
    const [req, em] = door.records("cdline").filter(l => l.how === "request" || l.how === "emergency");
    await reg.decide(ben, (req!.how === "request" ? req : em)!.id, "refuse");
    await reg.decide(ben, (req!.how === "emergency" ? req : em)!.id, "approve");
    await reg.setControlled(ben, M, false, { reason: "test" });
    await expect(reg.correct(ben, { refId: "demo-cd1", change: "+3", witness: "demo-p4", reason: "x" })).rejects.toThrow(/no longer a controlled drug/);
    expect(door.get("line", STORE)!.qty).toBe(4);
    void inv;
  });

  it("B45 a doctor whose profession changed to Nurse can't put anyone on the doctors' list", async () => {
    const { door, reg, acc } = await open();
    await asDoctor(door, "demo-p1"); await asDoctor(door, "demo-p4");
    await reg.grant(P(door, "demo-p2"), "demo-p4");                     // Dina on the list too, so the list isn't empty
    await acc.setProfession(P(door, "demo-p3"), "demo-p2", "Nurse");
    await expect(reg.grant(P(door, "demo-p2"), "demo-p1")).rejects.toThrow(/Only a doctor can give this right/);
    expect(P(door, "demo-p1").cdRight).not.toBe(true);
  });

  it("B46 after 5 wrong PINs, PIN approval for that doctor pauses for 15 minutes and the doctor is told", async () => {
    const { door, reg } = await open();
    const anna = P(door, "demo-p1");
    const pin = (p: string) => reg.takeOut(anna, { ...base, qty: 1, how: "pin", doctor: "demo-p2", pin: p });
    for (let i = 1; i <= 4; i++) await expect(pin("000" + i)).rejects.toThrow(`${5 - i} ${5 - i === 1 ? "try" : "tries"} left`);
    await expect(pin("0005")).rejects.toThrow(/paused for 15 minutes/);
    await expect(pin("1234")).rejects.toThrow(/paused for 15 more minutes/);   // even the right PIN, while paused
    expect(reg.pinAlerts("demo-p2").length).toBe(1);
    expect(door.get("line", STORE)!.qty).toBe(5);
    clock += 16 * 60 * 1000;
    await pin("1234");                                                          // after the pause, the right PIN works
    expect(door.get("line", STORE)!.qty).toBe(4);
  });
});

describe("group 2: amounts", () => {
  it("B32 a count is saved exactly as checked: “12,0”, “1,000” and “−0” never save “not a number”", async () => {
    const { door, inv } = await open();
    const anna = P(door, "demo-p1");
    for (const v of ["12,0", "1,000", "1 000"]) await expect(inv.saveCounts(anna, { "demo-s1": v })).rejects.toThrow(/whole number/);
    expect(door.get("line", "demo-s1")!.qty).toBe(12);
    await inv.saveCounts(anna, { "demo-s2": "−0" });
    expect(Object.is(door.get("line", "demo-s2")!.qty, 0)).toBe(true);
  });
  it("B33 (Q28 = A) a comma or a point in an amount is refused with the example 1000", async () => {
    const { door, inv } = await open();
    await expect(inv.adjust(P(door, "demo-p1"), "demo-s1", "restock", "1,000")).rejects.toThrow("Whole numbers only. 1,000 isn't allowed: type it without commas or points, for example 1000.");
    expect(door.get("line", "demo-s1")!.qty).toBe(12);
    expect(await inv.adjust(P(door, "demo-p1"), "demo-s1", "restock", "1000")).toBe(1012);
  });
  it("B34 an amount above 1,000,000 is refused", async () => {
    const { door, inv } = await open();
    await expect(inv.adjust(P(door, "demo-p1"), "demo-s1", "restock", "99999999999999999999")).rejects.toThrow("That's more than one line can hold (1,000,000). Check the number.");
    expect(door.get("line", "demo-s1")!.qty).toBe(12);
  });
});

describe("group 3: sign-in and people", () => {
  it("B43 a password changes only with the current (or one-time) password; archived and unknown people refused; logged", async () => {
    const { door, acc } = await open();
    await expect(acc.setOwnPassword("demo-p3", "", "taken-over-1", "taken-over-1")).rejects.toThrow("Your current password is not right.");
    await expect(acc.setOwnPassword("demo-p3", "wrong", "taken-over-1", "taken-over-1")).rejects.toThrow("Your current password is not right.");
    expect((await acc.signIn("demo-p3", "taken-over-1")).ok).toBe(false);
    await expect(acc.setOwnPassword("demo-p5", "demo", "finn-pass-1", "finn-pass-1")).rejects.toThrow("Pick your name");
    await expect(acc.setOwnPassword("ghost", "demo", "ghost-pass-1", "ghost-pass-1")).rejects.toThrow("Pick your name");
    // a one-time password can't be skipped
    const code = await acc.giveOneTime(P(door, "demo-p3"), "demo-p1");
    await expect(acc.setOwnPassword("demo-p1", "demo", "never-knew-1", "never-knew-1")).rejects.toThrow("That one-time password is not right.");
    await acc.setOwnPassword("demo-p1", code, "anna-own-pass", "anna-own-pass");
    expect((await acc.signIn("demo-p1", "anna-own-pass")).ok).toBe(true);
    expect(door.records("event").filter(e => e.what === "own password chosen" && e.personId === "demo-p1").length).toBe(1);
  });
  it("B44 a password of spaces is refused", async () => {
    const { acc } = await open();
    await expect(acc.setOwnPassword("demo-p1", "demo", "        ", "        ")).rejects.toThrow("At least 8 characters that aren't spaces.");
  });
  it("B47 set-up refuses an archived Manage person", async () => {
    const door = await Door.open({ backend: new MemoryBackend(), seed: null, now });
    for (const [id, state] of [["m1", "Archived"], ["m2", "Active"]] as const) await door.apply({ recordType: "person", recordId: id, op: "create", data: { name: id, level: "Manage" }, by: "setup" });
    await door.apply({ recordType: "person", recordId: "m1", op: "archive", by: "setup" });
    const acc = new Accounts(door);
    await expect(acc.setUp({ personId: "m1" }, "set-up-pass-1", "set-up-pass-1")).rejects.toThrow("Only an active Manage-level person");
    await acc.setUp({ personId: "m2" }, "set-up-pass-1", "set-up-pass-1");
    await expect(acc.setUp({ personId: "m2" }, "again-pass-1", "again-pass-1")).rejects.toThrow("already set up");
  });
  it("B48 two computers offline leave nobody at Manage level: the later change is undone and logged", async () => {
    const { FakeServer } = await import("../src");
    const server = new FakeServer(); server.receive(demoSeedChanges());
    const a = await Door.open({ backend: new MemoryBackend(), transport: server.connect(), seed: demoSeedChanges, now });
    const b = await Door.open({ backend: new MemoryBackend(), transport: server.connect(), seed: demoSeedChanges, now });
    await a.sync(); await b.sync();
    const A = new Accounts(a), B = new Accounts(b);
    await A.archive(a.get("person", "demo-p3")!, "demo-p2");                 // Cara archives Ben on A
    await B.setLevel(b.get("person", "demo-p2")!, "demo-p3", "Work");          // Ben lowers Cara on B (later)
    await a.sync(); await b.sync(); await a.sync();
    expect(a.records("person").filter(p => p.state === "Active" && p.level === "Manage").length).toBe(0);
    expect(await A.repairLockout()).toBe("demo-p3");                          // Cara's lowering came last: undone
    await a.sync(); await b.sync();
    for (const d of [a, b]) expect(d.records("person").filter(p => p.state === "Active" && p.level === "Manage").map(p => p.id)).toEqual(["demo-p3"]);
    expect(a.records("event").some(e => e.what === "nobody was left at Manage level")).toBe(true);
    expect(await B.repairLockout()).toBe(null);                               // nothing more to do
  });
  it("B50 an archived department doesn't block changing a person's other details", async () => {
    const { door, acc, st } = await open();
    const cara = P(door, "demo-p3");
    await st.archive(cara, "department", "demo-d1");
    await acc.setDetails(cara, "demo-p1", { job: "Nurse", email: "anna2@example.org", office: "Medics", departmentId: "demo-d1" });
    expect(P(door, "demo-p1")).toMatchObject({ email: "anna2@example.org", departmentId: "demo-d1" });
    await expect(acc.setDetails(cara, "demo-p4", { departmentId: "demo-d1" })).resolves.toBeUndefined();   // already hers
    await expect(acc.addPerson(cara, { name: "New One", job: "", level: "Work", departmentId: "demo-d1" })).rejects.toThrow("Pick a department");
  });
  it("B52 deleting a person added by mistake removes their training too", async () => {
    const { door, acc, tr } = await open();
    const cara = P(door, "demo-p3");
    const eva = await acc.addPerson(cara, { name: "Eva T", job: "", level: "Work" });
    const t = await tr.assign(cara, eva.id, "demo-k1");
    await acc.deleteMistake(cara, eva.id);
    expect(door.get("training", t)).toBeUndefined();
    expect(door.get("person", eva.id)).toBeUndefined();
  });
  it("B53 + B54 settings: extra fields can't replace the name; wrong kinds and made-up ids are refused", async () => {
    const { door, st, acc } = await open();
    const cara = P(door, "demo-p3");
    const id = await st.add(cara, "department", "Totally Unique", { name: "Clinical" });
    expect(door.get("department", id)!.name).toBe("Totally Unique");
    const store = door.records("location").find(l => l.kind === "store")!;
    await expect(st.rename(cara, "bag", store.id, "Renamed Store")).rejects.toThrow("Not found.");
    await expect(st.setCourseMonths(cara, "ghost", 6)).rejects.toThrow("Not found.");
    await expect(acc.restore(cara, "ghost")).rejects.toThrow("Not found.");
  });
  it("B55 lowering an archived Manage person is allowed (it locks nobody out)", async () => {
    const { door, acc } = await open();
    const cara = P(door, "demo-p3");
    await acc.archive(cara, "demo-p2");
    await acc.setLevel(cara, "demo-p2", "Work");
    expect(P(door, "demo-p2").level).toBe("Work");
  });
  it("B56 names are tidied before comparing; at most 80 letters", async () => {
    const { door, acc } = await open();
    const cara = P(door, "demo-p3");
    for (const n of ["Anna  Example", "Anna Example", " anna example "]) await expect(acc.addPerson(cara, { name: n, job: "", level: "Work" })).rejects.toThrow("already in the list");
    await acc.addPerson(cara, { name: "Zoé A", job: "", level: "Work" });
    await expect(acc.addPerson(cara, { name: "Zoé A", job: "", level: "Work" })).rejects.toThrow("already in the list");
    await expect(acc.addPerson(cara, { name: "x".repeat(81), job: "", level: "Work" })).rejects.toThrow("at most 80");
  });
});

describe("group 4: backup, restore and two computers", () => {
  const two = async () => {
    const { FakeServer } = await import("../src");
    const server = new FakeServer(); server.receive(demoSeedChanges());
    const a = await Door.open({ backend: new MemoryBackend(), transport: server.connect(), seed: demoSeedChanges, now });
    const b = await Door.open({ backend: new MemoryBackend(), transport: server.connect(), seed: demoSeedChanges, now });
    await a.sync(); await b.sync();
    return { a, b, server };
  };
  it("B29 after a restore every computer agrees, and what was only in the backup reaches the others", async () => {
    const { BackupStore, MemoryFiles } = await import("../src");
    const { a, b } = await two();
    const bs = new BackupStore(a, new MemoryFiles());
    const cara = a.get("person", "demo-p3")!;
    const text = bs.exportFile(cara).text;
    const extra = JSON.parse(text); extra.data.messages.push({ messageId: "only-in-backup", at: now(), by: "demo-p3", app: "MD", recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: 5 } });
    await new InventoryStore(b).adjust(b.get("person", "demo-p1")!, "demo-s1", "dispense", 3); await b.sync();
    await bs.restore(cara, JSON.stringify(extra), true);
    await a.sync(); await b.sync(); await a.sync();
    expect(a.get("line", "demo-s1")!.qty).toBe(b.get("line", "demo-s1")!.qty);
    expect(b.get("line", "demo-s1")!.qty).toBe(12 - 3 + 5);
  });
  it("B30 two restores in the same second keep both safety copies", async () => {
    const { BackupStore, MemoryFiles } = await import("../src");
    const fixed = Date.UTC(2026, 10, 28, 1, 0);
    const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now: () => fixed });
    const files = new MemoryFiles(); const bs = new BackupStore(door, files);
    const cara = door.get("person", "demo-p3")!;
    const text = bs.exportFile(cara).text;
    const r1 = await bs.restore(cara, text, true); const r2 = await bs.restore(cara, text, true);
    expect(r1.safety).not.toBe(r2.safety);
    expect((await files.list()).length).toBe(2);
  });
  it("B31 (Q27 = A) stock below zero after two offline dispenses is kept (nothing lost) and counted for the warning", async () => {
    const { overview } = await import("@md/core");
    const { a, b } = await two();
    const anna = (d: Door) => d.get("person", "demo-p1")!;
    await new InventoryStore(a).adjust(anna(a), "demo-s1", "dispense", 12);
    await new InventoryStore(b).adjust(anna(b), "demo-s1", "dispense", 12);
    await a.sync(); await b.sync(); await a.sync();
    expect(a.get("line", "demo-s1")!.qty).toBe(-12);
    expect(overview(a.records("line").filter(l => l.state === "Active") as any, "2026-11-28").below).toBe(1);
    await new InventoryStore(a).saveCounts(anna(a), { "demo-s1": "0" });
    expect(overview(a.records("line").filter(l => l.state === "Active") as any, "2026-11-28").below).toBe(0);
  });
  it("B49 a backup with a damaged version number is refused before anything happens", async () => {
    const { BackupStore, MemoryFiles, checkBackup } = await import("../src");
    const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
    const files = new MemoryFiles(); const bs = new BackupStore(door, files); const cara = door.get("person", "demo-p3")!;
    for (const v of [1.5, -1, "2"]) {
      const o = JSON.parse(bs.exportFile(cara).text); o.dataVersion = v;
      expect(checkBackup(JSON.stringify(o))).toMatchObject({ ok: false, why: "This backup is damaged. Refused: nothing was changed." });
      await expect(bs.restore(cara, JSON.stringify(o), true)).rejects.toThrow("damaged");
    }
    expect((await files.list()).length).toBe(0);
  });
});

describe("group 6: required 0", () => {
  it("B57 (Q29 = A) a bag line with required 0 and nothing on hand is OK; a Store line with 0 is still out", async () => {
    const { stockStatus } = await import("@md/core");
    expect(stockStatus({ qty: 0, required: 0 })).toBe("ok");
    expect(stockStatus({ qty: 0, required: 0 }, { store: true })).toBe("out");
    expect(stockStatus({ qty: 0, required: null })).toBe("out");
    expect(stockStatus({ qty: 0, required: 2 })).toBe("out");
  });
});
