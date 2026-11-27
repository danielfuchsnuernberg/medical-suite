import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, RegisterStore, InventoryStore, DEMO_PIN } from "../src";
import { demoSeedChanges, pinProblem } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);
const open = async (b = new MemoryBackend()) => { const door = await Door.open({ backend: b, seed: demoSeedChanges, now }); return { b, door, reg: new RegisterStore(door), inv: new InventoryStore(door) }; };
const P = (d: Door, id: string) => d.get("person", id)!;
const anna = (d: Door) => P(d, "demo-p1");      // nurse, Work
const ben = (d: Door) => P(d, "demo-p2");       // doctor, Manage
const cara = (d: Door) => P(d, "demo-p3");      // Manage, not a doctor
const dina = (d: Door) => P(d, "demo-p4");      // nurse, Work
const M = "demo-i5", STORE = "demo-s7";          // Morphine in the Store: 5
const qty = (d: Door, id: string) => d.get("line", id)!.qty;
const out = (o: Record<string, unknown> = {}) => ({ itemId: M, lineId: STORE, qty: 1, witness: "demo-p4", reason: "Pain relief · case 117", how: "self", ...o }) as any;

describe("register (F12)", () => {
  it("F12.1 running balance; every line has when, kind, amount, balance, who, doctor and how, witness, reason", async () => {
    const { door, reg } = await open();
    expect(reg.balance(M)).toBe(5);
    expect(reg.onShelves(M)).toBe(5);                                                      // register and Store and bags agree
    await reg.takeOut(ben(door), out({ qty: 2 }) );
    const rows = reg.ledger(M);
    expect(rows.map(r => [r.line.kind, r.delta, r.balance])).toEqual([["opening", 5, 5], ["out", -2, 3]]);
    expect(rows[1]).toMatchObject({ status: "booked", doctor: "demo-p2", how: "self", line: { createdBy: "demo-p2", witness: "demo-p4", reason: "Pain relief · case 117", qty: 2 } });
    expect(typeof rows[1].at).toBe("number");
    expect(qty(door, STORE)).toBe(3);                                                      // the stock line moved with it
  });
  it("F12.2 only a doctor takes out or approves; Manage level gives no right", async () => {
    const { door, reg } = await open();
    await expect(reg.takeOut(cara(door), out({ how: "self" }))).rejects.toThrow("Only a doctor can do this. Manage level gives no right here.");
    await expect(reg.takeOut(anna(door), out({ how: "self" }))).rejects.toThrow("Only a doctor");
    const id = await reg.takeOut(anna(door), out({ how: "request", doctor: "demo-p2" }));
    await expect(reg.decide(cara(door), id, "approve")).rejects.toThrow("Only a doctor");
    expect(reg.balance(M)).toBe(5);
  });
  it("F12.3 a nurse takes out with a doctor's PIN in the room, or by request: nothing comes off until approved; a refusal stays visible", async () => {
    const { door, reg } = await open();
    await expect(reg.takeOut(anna(door), out({ how: "pin", doctor: "demo-p2", pin: "0000" }))).rejects.toThrow("That isn't Dr Ben Sample's PIN.");
    await reg.takeOut(anna(door), out({ how: "pin", doctor: "demo-p2", pin: DEMO_PIN }));
    expect(reg.balance(M)).toBe(4);
    expect(reg.ledger(M).at(-1)).toMatchObject({ status: "booked", doctor: "demo-p2", how: "pin" });
    // by request
    const r1 = await reg.takeOut(anna(door), out({ how: "request", doctor: "demo-p2", qty: 2 }));
    expect(reg.balance(M)).toBe(4);                                                         // nothing off yet
    expect(qty(door, STORE)).toBe(4);
    expect(reg.waitingAll().map(r => r.line.id)).toEqual([r1]);
    await reg.decide(ben(door), r1, "query", "Please call me");
    expect(reg.ledger(M).find(r => r.line.id === r1)).toMatchObject({ status: "pending", queries: [{ note: "Please call me" }] });   // asking keeps it waiting
    await reg.decide(ben(door), r1, "approve");
    expect(reg.balance(M)).toBe(2);
    expect(qty(door, STORE)).toBe(2);
    expect(reg.ledger(M).find(r => r.line.id === r1)).toMatchObject({ status: "booked", how: "remote", doctor: "demo-p2" });
    await expect(reg.decide(ben(door), r1, "approve")).rejects.toThrow("already been answered");
    // refused: stays, never counts
    const r2 = await reg.takeOut(anna(door), out({ how: "request", doctor: "demo-p2" }));
    await reg.decide(ben(door), r2, "refuse");
    expect(reg.ledger(M).find(r => r.line.id === r2)).toMatchObject({ status: "refused", counts: false, balance: null });
    expect(reg.balance(M)).toBe(2);
    // approved later but there's not enough any more
    const r3 = await reg.takeOut(anna(door), out({ how: "request", doctor: "demo-p2", qty: 2 }));
    await reg.takeOut(ben(door), out({ qty: 1 }));
    await expect(reg.decide(ben(door), r3, "approve")).rejects.toThrow("Not enough on the balance any more.");
  });
  it("F12.4 emergency: reason and witness required; booked at once; waiting for a doctor until approved or queried", async () => {
    const { door, reg } = await open();
    await expect(reg.takeOut(anna(door), out({ how: "emergency", reason: " " }))).rejects.toThrow("Give a reason or case.");
    await expect(reg.takeOut(anna(door), out({ how: "emergency", witness: "" }))).rejects.toThrow("A witness has to sign");
    const e1 = await reg.takeOut(anna(door), out({ how: "emergency" }));
    expect(reg.balance(M)).toBe(4);
    expect(reg.waitingAll().map(r => [r.line.id, r.status])).toEqual([[e1, "emergency"]]);
    await expect(reg.decide(ben(door), e1, "refuse")).rejects.toThrow("approve it or ask about it");
    await reg.decide(ben(door), e1, "approve");
    expect(reg.waitingAll()).toEqual([]);
    expect(reg.ledger(M).find(r => r.line.id === e1)).toMatchObject({ status: "approvedAfter", how: "after", doctor: "demo-p2" });
    const e2 = await reg.takeOut(anna(door), out({ how: "emergency" }));
    await reg.decide(ben(door), e2, "query", "Which patient?");
    expect(reg.waitingAll()).toEqual([]);
    expect(reg.ledger(M).find(r => r.line.id === e2)!.status).toBe("queried");
  });
  it("F12.5 every line has a witness: never yourself, never the approving doctor", async () => {
    const { door, reg } = await open();
    await expect(reg.takeOut(ben(door), out({ how: "self", witness: "demo-p2" }))).rejects.toThrow("You can't be your own witness.");
    await expect(reg.takeOut(anna(door), out({ how: "pin", doctor: "demo-p2", pin: DEMO_PIN, witness: "demo-p2" }))).rejects.toThrow("The approving doctor can't also be the witness.");
    await expect(reg.takeOut(anna(door), out({ how: "request", doctor: "demo-p2", witness: "demo-p2" }))).rejects.toThrow("The approving doctor can't also be the witness.");
    await expect(reg.receive(anna(door), { itemId: M, locationId: "demo-l0", qty: 1, witness: "demo-p1", reason: "Delivery" })).rejects.toThrow("own witness");
    // a doctor who witnessed a request can't approve it
    await door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { cdRight: true }, by: "demo-p2" });
    const r = await reg.takeOut(anna(door), out({ how: "request", doctor: "demo-p4", witness: "demo-p2" }));
    await expect(reg.decide(ben(door), r, "approve")).rejects.toThrow("You were the witness");
    await reg.decide(dina(door), r, "approve");
    expect(reg.balance(M)).toBe(4);
  });
  it("F12.6 only a doctor gives the right, never to themselves; the first doctor is set once by Management; Manage can't change the list", async () => {
    const { door, reg } = await open();
    await expect(reg.grant(cara(door), "demo-p1")).rejects.toThrow("Only a doctor can give this right. Manage level can't change the list.");
    await expect(reg.grant(ben(door), "demo-p2")).rejects.toThrow("already has the right");
    await reg.grant(ben(door), "demo-p4");
    expect(reg.doctors().map(p => p.id).sort()).toEqual(["demo-p2", "demo-p4"]);
    await expect(reg.grant(dina(door), "demo-p4")).rejects.toThrow("already has the right");
    await door.apply({ recordType: "person", recordId: "demo-p1", op: "set", data: { cdRight: false }, by: "demo-p2" });
    // a program with no doctor at all: Management sets the first one, once
    const fresh = await open();
    await fresh.door.apply({ recordType: "person", recordId: "demo-p2", op: "set", data: { cdRight: false }, by: "demo-p3" });
    expect(fresh.reg.doctors()).toEqual([]);
    await expect(fresh.reg.grant(anna(fresh.door), "demo-p1")).rejects.toThrow("The first doctor is set by Management, once.");
    await fresh.reg.grant(cara(fresh.door), "demo-p2");
    await expect(fresh.reg.grant(cara(fresh.door), "demo-p1")).rejects.toThrow("Only a doctor can give this right.");
  });
  it("F12.7 a doctor removes a right; logged; the last doctor can't be removed", async () => {
    const { door, reg } = await open();
    await expect(reg.revoke(ben(door), "demo-p2")).rejects.toThrow("is the only person who can approve controlled drugs.");
    await reg.grant(ben(door), "demo-p4");
    await expect(reg.revoke(cara(door), "demo-p4")).rejects.toThrow("Only a doctor");
    await reg.revoke(ben(door), "demo-p4");
    expect(reg.doctors().map(p => p.id)).toEqual(["demo-p2"]);
    expect(reg.rightsLog()[0]).toMatchObject({ by: "demo-p2", recordId: "demo-p4", changes: [{ field: "cdRight", from: true, to: false }] });
  });
  it("F12.8 lines are never edited or deleted; a doctor adds a correction naming the original; the balance can't go below 0", async () => {
    const { door, reg } = await open();
    const o = await reg.takeOut(ben(door), out({ qty: 2 }));
    const before = JSON.stringify(door.get("cdline", o));
    for (const op of ["set", "delta", "archive", "delete"] as const) await door.apply({ recordType: "cdline", recordId: o, op, data: { qty: 99, field: "qty", by: 5 }, by: "demo-p2" });
    expect(JSON.stringify(door.get("cdline", o))).toBe(before);
    await expect(reg.correct(anna(door), { refId: o, change: 1, witness: "demo-p4", reason: "1 broken" })).rejects.toThrow("Only a doctor");
    for (const [bad, why] of [["0", "other than 0"], ["1.5", "other than 0"], ["-4", "below 0"]] as const)
      await expect(reg.correct(ben(door), { refId: o, change: bad, witness: "demo-p4", reason: "x" })).rejects.toThrow(why);
    await expect(reg.correct(ben(door), { refId: o, change: 1, witness: "demo-p4", reason: "" })).rejects.toThrow("Say what was wrong.");
    const c = await reg.correct(ben(door), { refId: o, change: "+1", witness: "demo-p4", reason: "1 ampoule not given, put back" });
    expect(reg.ledger(M).at(-1)).toMatchObject({ line: { id: c, kind: "correction", ref: o, qty: 1 }, balance: 4 });
    expect(qty(door, STORE)).toBe(4);
    expect(reg.ledger(M).find(r => r.line.id === o)!.line.qty).toBe(2);                    // the original is untouched
  });
  it("F12.9 receiving needs a witness, no doctor; it joins the matching line or starts a new one", async () => {
    const { door, reg } = await open();
    await reg.receive(anna(door), { itemId: M, locationId: "demo-l0", qty: 3, witness: "demo-p4", reason: "Delivery, invoice 4471", lot: "M-3", expiry: "2027-07-24" });
    expect(qty(door, STORE)).toBe(8);
    await reg.receive(anna(door), { itemId: M, locationId: "demo-l0", qty: 2, witness: "demo-p4", reason: "Delivery", lot: "M-9", expiry: "2028-01-31" });
    expect(reg.placesOf(M).length).toBe(2);
    expect(reg.balance(M)).toBe(10);
    expect(reg.onShelves(M)).toBe(10);
    await expect(reg.receive(anna(door), { itemId: M, locationId: "demo-l0", qty: 1, witness: "demo-p4", reason: " " })).rejects.toThrow("Say where it came from.");
  });
  it("F12.10 taking out more than the balance is refused", async () => {
    const { door, reg } = await open();
    await expect(reg.takeOut(ben(door), out({ qty: 6 }))).rejects.toThrow("Only 5 on hand, so 6 can't be taken.");
    await expect(reg.takeOut(anna(door), out({ how: "emergency", qty: 6 }))).rejects.toThrow("Only 5 on hand");
    expect(reg.balance(M)).toBe(5);
    await expect(reg.takeOut(ben(door), out({ how: undefined }))).rejects.toThrow("Say how it is approved");   // never guessed as an emergency
    expect(reg.waitingAll()).toEqual([]);
  });
  it("F12.11 moving between the Store and a bag: a Moved line with a witness, no doctor; the balance doesn't change (Q25 = A)", async () => {
    const { door, reg } = await open();
    await expect(reg.move(anna(door), { itemId: M, lineId: STORE, toLocationId: "demo-l1", qty: 2, witness: "demo-p1" })).rejects.toThrow("own witness");
    const m = await reg.move(anna(door), { itemId: M, lineId: STORE, toLocationId: "demo-l1", qty: 2, witness: "demo-p4" });
    expect(reg.balance(M)).toBe(5);
    expect(qty(door, STORE)).toBe(3);
    const bag = reg.placesOf(M).find(l => l.locationId === "demo-l1")!;
    expect(bag).toMatchObject({ qty: 2, lot: "M-3", expiry: "2027-07-24" });
    expect(reg.ledger(M).at(-1)).toMatchObject({ line: { id: m, kind: "moved", qty: 2, witness: "demo-p4", reason: "Store (main) → Bag 1 (adult)" }, delta: 0, balance: 5, doctor: null });
    await expect(reg.move(anna(door), { itemId: M, lineId: STORE, toLocationId: "demo-l1", qty: 4, witness: "demo-p4" })).rejects.toThrow("Only 3 on hand");
  });
  it("View level can look but not book; a PIN is 4–8 digits and stays on this computer", async () => {
    const { door, reg } = await open();
    await door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" }, by: "demo-p3" });
    await expect(reg.receive(dina(door), { itemId: M, locationId: "demo-l0", qty: 1, witness: "demo-p1", reason: "x" })).rejects.toThrow("View level");
    expect(pinProblem("12")).toBe("A PIN is 4 to 8 digits.");
    expect(pinProblem("1111")).toMatch("isn't a row");
    expect(pinProblem("1234")).toMatch("isn't a row");
    expect(pinProblem("4826", "4827")).toBe("The two PINs don't match.");
    await expect(reg.setPin(anna(door), "4826", "4826")).rejects.toThrow("Only a doctor");
    await reg.setPin(ben(door), "4826", "4826");
    expect(reg.hasPin("demo-p2")).toBe("own");
    expect(JSON.stringify(door.messages())).not.toContain("4826");
    await expect(reg.takeOut(anna(door), out({ how: "pin", doctor: "demo-p2", pin: DEMO_PIN }))).rejects.toThrow("PIN");   // the DEMO PIN stops once he set his own
    await reg.takeOut(anna(door), out({ how: "pin", doctor: "demo-p2", pin: "4826" }));
    expect(reg.balance(M)).toBe(4);
  });
});

describe("register for data from before F12", () => {
  it("a drug with stock but no register lines: a doctor opens it at what is on the shelves, with a witness, once", async () => {
    const { door, reg } = await open();
    // an older program: a controlled drug on the shelf, no register lines
    await door.apply({ recordType: "item", recordId: "old-cd", op: "create", data: { name: "Ketamine (old)", controlled: true, unit: "vial" }, by: "demo-p3" });
    await door.apply({ recordType: "line", recordId: "old-line", op: "create", data: { itemId: "old-cd", locationId: "demo-l0", qty: 3, required: null, lot: "", expiry: null }, by: "demo-p3" });
    expect(reg.ledger("old-cd")).toEqual([]);
    await expect(reg.openRegister(anna(door), "old-cd", "demo-p4")).rejects.toThrow("Only a doctor");
    await expect(reg.openRegister(ben(door), "old-cd", "demo-p2")).rejects.toThrow("own witness");
    await reg.openRegister(ben(door), "old-cd", "demo-p4");
    expect(reg.balance("old-cd")).toBe(3);
    expect(reg.onShelves("old-cd")).toBe(3);
    expect(qty(door, "old-line")).toBe(3);                                                   // the shelves don't change
    await expect(reg.openRegister(ben(door), "old-cd", "demo-p4")).rejects.toThrow("already open");
  });
});
