import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, FakeServer, buildLog } from "../src";
import { demoSeedChanges, makeChange } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);

describe("activity log (F4)", () => {
  it("F4.1 every entry: who, which record, what changed, when, from which app; newest first; by area", async () => {
    const d = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
    await d.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    await d.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" }, by: "demo-p3" });
    const [last, first] = d.log();
    expect(last).toMatchObject({ by: "demo-p3", app: "MD", area: "People", recordType: "person", recordId: "demo-p4", changes: [{ field: "level", from: "Work", to: "View" }] });
    expect(first).toMatchObject({ by: "demo-p1", area: "Inventory", recordId: "demo-s1", changes: [{ field: "qty", from: 12, to: 11 }] });
    expect(typeof last.at).toBe("number");
    const ats = d.log().map(e => e.at); expect(ats).toEqual([...ats].sort((a, b) => b - a));
  });

  it("F4.1 another app's changes (EDP) arrive through the server and are logged under that app", async () => {
    const server = new FakeServer(); server.receive(demoSeedChanges());
    const d = await Door.open({ backend: new MemoryBackend(), transport: server.connect(), seed: demoSeedChanges, now });
    server.receive([{ ...makeChange({ recordType: "case", recordId: "case-1", op: "create", data: { caseNo: "C-0042" }, by: "edp-user", at: now() }), app: "EDP" }]);
    await d.sync();
    expect(d.log()[0]).toMatchObject({ app: "EDP", area: "EDP", recordType: "case", changes: [{ field: "caseNo", from: null, to: "C-0042" }] });
  });

  it("F4.2 a rename shows old → new, and the history follows the ID, not the name (B19)", async () => {
    const d = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
    await d.apply({ recordType: "item", recordId: "demo-i1", op: "set", data: { name: "Gauze pad 10×10 cm" }, by: "demo-p3" });
    await d.apply({ recordType: "item", recordId: "demo-i1", op: "set", data: { unit: "box" }, by: "demo-p3" });
    const hist = d.log().filter(e => e.recordId === "demo-i1");
    expect(hist.map(e => e.op)).toEqual(["set", "set", "create"]);          // the DEMO creation is still in its history
    expect(hist[1].changes).toEqual([{ field: "name", from: "Gauze 10×10 cm", to: "Gauze pad 10×10 cm" }]);
    expect(hist[0].changes).toEqual([{ field: "unit", from: "pack", to: "box" }]);
  });

  it("F4.3 a delete for good is logged with who, when and what was there (B18)", async () => {
    const d = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
    const c = await d.apply({ recordType: "person", op: "create", data: { name: "Typo Persn", job: "Nurse", level: "Work" }, by: "demo-p3" });
    await d.apply({ recordType: "person", recordId: c.recordId, op: "delete", data: { reason: "mistake" }, by: "demo-p3" });
    expect(d.get("person", c.recordId)).toBeUndefined();
    expect(d.log()[0]).toMatchObject({ op: "delete", by: "demo-p3", was: { name: "Typo Persn", job: "Nurse", level: "Work", state: "Active" } });
  });

  it("F4.4 nobody can change or remove a log entry: stored messages can't be altered, a changed copy from outside is ignored", async () => {
    const server = new FakeServer(); server.receive(demoSeedChanges());
    const d = await Door.open({ backend: new MemoryBackend(), transport: server.connect(), seed: demoSeedChanges, now });
    const c = await d.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    const stored = d.messages().find(m => m.messageId === c.messageId)!;
    expect(() => { (stored as any).by = "someone-else"; }).toThrow();
    expect(() => { (stored.data as any).by = -100; }).toThrow();
    expect(() => { (d.log()[0] as any).by = "x"; }).toThrow();                      // log entries are locked too
    expect(() => { (d.log() as any).length = 0; }).toThrow();
    expect(d.log()[0].by).toBe("demo-p1");
    server.receive([{ ...c, by: "someone-else", data: { field: "qty", by: -100 } }]);  // same message ID, altered
    await d.sync();
    expect(d.get("line", "demo-s1")!.qty).toBe(11);
    expect(d.log().filter(e => e.messageId === c.messageId)).toHaveLength(1);
    expect("deleteMessage" in d || "editMessage" in d || "removeLog" in d).toBe(false);
  });

  it("the log and the records always agree (same steps)", async () => {
    const d = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now });
    for (let i = 0; i < 5; i++) await d.apply({ recordType: "line", recordId: "demo-s2", op: "delta", data: { field: "qty", by: i % 2 ? 2 : -1 }, by: "demo-p1" });
    const lastQty = d.log().find(e => e.recordId === "demo-s2")!.changes.find(x => x.field === "qty")!.to;
    expect(lastQty).toBe(d.get("line", "demo-s2")!.qty);
    expect(buildLog([]).length).toBe(0);
  });
});
