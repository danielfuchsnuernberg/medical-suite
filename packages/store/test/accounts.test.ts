import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, Accounts, FakeServer } from "../src";
import { demoSeedChanges } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);
const open = async (b = new MemoryBackend(), seed: any = demoSeedChanges) => { const door = await Door.open({ backend: b, seed, now }); return { b, door, acc: new Accounts(door) }; };

describe("accounts until the server (Q22 = A)", () => {
  it("DEMO people sign in with demo; wrong passwords are refused; there is no 'acting as'", async () => {
    const { acc } = await open();
    expect(acc.needsSetUp()).toBe(false);
    expect(await acc.signIn("demo-p1", "demo")).toEqual({ ok: true, mustChange: false });
    expect((await acc.signIn("demo-p1", "Demo")).ok).toBe(false);
    expect((await acc.signIn("nobody", "demo")).ok).toBe(false);
  });

  it("first start on an empty computer: the first Management person sets it up", async () => {
    const { acc, door } = await open(new MemoryBackend(), null);
    expect(acc.needsSetUp()).toBe(true);
    await expect(acc.setUp({ name: "Cara Real" }, "short")).rejects.toThrow("At least 8 characters.");
    const cara = await acc.setUp({ name: "Cara Real", job: "Base manager" }, "cara-secret-1", "cara-secret-1");
    expect(cara.level).toBe("Manage");
    expect(acc.needsSetUp()).toBe(false);
    await expect(acc.setUp({ name: "Someone" }, "another-pass")).rejects.toThrow(/already set up/);
    expect((await acc.signIn(cara.id, "cara-secret-1")).ok).toBe(true);
    expect(door.records("event").map(e => e.what)).toContain("this computer set up");
  });

  it("a Manage-level person gives a one-time password; it must be changed at first sign-in; it's never synced", async () => {
    const server = new FakeServer(); server.receive(demoSeedChanges());
    const b = new MemoryBackend();
    const door = await Door.open({ backend: b, transport: server.connect(), seed: demoSeedChanges, now });
    const acc = new Accounts(door);
    const cara = acc.person("demo-p3")!, anna = acc.person("demo-p1")!;
    await expect(acc.giveOneTime(anna, "demo-p4")).rejects.toThrow("Only Manage level can give passwords.");
    const code = await acc.giveOneTime(cara, "demo-p4");
    expect((await acc.signIn("demo-p4", "demo")).ok).toBe(false);                 // demo no longer works for her here
    expect(await acc.signIn("demo-p4", code.toLowerCase().replace("-", " "))).toEqual({ ok: true, mustChange: true });
    await acc.setOwnPassword("demo-p4", "dina-own-pass", "dina-own-pass");
    expect(await acc.signIn("demo-p4", "dina-own-pass")).toEqual({ ok: true, mustChange: false });
    expect((await acc.signIn("demo-p4", code)).ok).toBe(false);
    await door.sync();
    const sent = JSON.stringify(server.log);
    expect(sent).not.toContain("dina-own-pass");
    expect(sent).not.toContain(code);
    expect(sent).not.toMatch(/"hash"|"salt"/);
    expect(sent).toContain("one-time password given");                            // logged: who and when, not what
  });

  it("levels, last Manage person, archiving oneself (F2.2, F2.4, F2.5)", async () => {
    const { acc } = await open();
    const cara = () => acc.person("demo-p3")!;
    await acc.setLevel(cara(), "demo-p2", "Work");                                   // Ben → Work
    await expect(acc.setLevel(cara(), "demo-p3", "Work")).rejects.toThrow(/Cara Demo is the last Manage-level person/);
    await expect(acc.archive(cara(), "demo-p3")).rejects.toThrow(/Nobody can archive themselves/);
    await expect(acc.setLevel(acc.person("demo-p1")!, "demo-p1", "Manage")).rejects.toThrow("Only Manage level can change levels.");
    await acc.archive(cara(), "demo-p4");
    expect(acc.people().map(p => p.id)).not.toContain("demo-p4");
    expect((await acc.signIn("demo-p4", "demo")).ok).toBe(false);                 // archived people can't sign in
    await acc.restore(cara(), "demo-p4");
    expect((await acc.signIn("demo-p4", "demo")).ok).toBe(true);
  });

  it("delete for good: a person added by mistake, within 24 hours; the message stays (F2.7)", async () => {
    const { acc, door } = await open();
    const cara = acc.person("demo-p3")!;
    const oops = await acc.addPerson(cara, { name: "Typo Persn", job: "Nurse", level: "Work" });
    await expect(acc.addPerson(cara, { name: "typo persn", job: "", level: "Work" })).rejects.toThrow(/already in the list/);
    expect(acc.canDelete(cara, "demo-p1")).toBe(false);                            // DEMO people were made weeks ago
    expect(acc.canDelete(cara, oops.id)).toBe(true);
    await acc.deleteMistake(cara, oops.id);
    expect(acc.person(oops.id)).toBeUndefined();
    expect(door.messages().filter(m => m.recordId === oops.id).map(m => m.op)).toEqual(["create", "delete"]);
    clock += 25 * 3600 * 1000;
    const late = await acc.addPerson(cara, { name: "Late One", job: "", level: "Work" });
    clock += 25 * 3600 * 1000;
    await expect(acc.deleteMistake(cara, late.id)).rejects.toThrow(/archive it instead/);
  });

  it("stay signed in survives reopening; passwords stay on this computer (F2.6)", async () => {
    const b = new MemoryBackend();
    const a1 = (await open(b)).acc;
    await a1.setOwnPassword("demo-p1", "anna-own-pass");
    await a1.stay("demo-p1");
    const a2 = (await open(b)).acc;
    expect(a2.stayed()).toBe("demo-p1");
    expect((await a2.signIn("demo-p1", "anna-own-pass")).ok).toBe(true);
    await a2.stay(null);
    expect((await open(b)).acc.stayed()).toBeNull();
  });
});

describe("two changes at once (found 28 Nov while looking at the program)", () => {
  it("lowering the last two managers at the same moment leaves one at Manage level (F2.4)", async () => {
    const { acc } = await open();
    const cara = acc.person("demo-p3")!;
    const r = await Promise.allSettled([acc.setLevel(cara, "demo-p2", "Work"), acc.setLevel(cara, "demo-p3", "Work")]);
    expect(r.map(x => x.status)).toEqual(["fulfilled", "rejected"]);
    expect(acc.people().filter(p => p.level === "Manage").length).toBe(1);
  });
  it("a level lowered a moment ago counts at once, even if the screen still holds the old copy", async () => {
    const { acc } = await open();
    const caraBefore = acc.person("demo-p3")!;                                    // Manage
    await acc.setLevel(caraBefore, "demo-p3", "Work");                             // Cara lowers herself (Ben still manages)
    await expect(acc.setLevel(caraBefore, "demo-p1", "Manage")).rejects.toThrow("Only Manage level can change levels.");
    expect(acc.person("demo-p1")!.level).toBe("Work");
  });
});
