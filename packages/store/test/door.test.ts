import { describe, it, expect } from "vitest";
import { Door, DoorError, MemoryBackend, FakeServer, SCHEMA_VERSION } from "../src";
import { demoSeedChanges, type Change } from "@md/core";

const qty = (d: Door, id = "demo-s1") => Number(d.get("line", id)?.qty);
let clock = Date.UTC(2026, 10, 27, 3, 0);
const now = () => (clock += 1000);

describe("store door: saving on this computer", () => {
  it("F3.1 data is still there when the program opens again", async () => {
    const b = new MemoryBackend();
    const d1 = await Door.open({ backend: b, seed: demoSeedChanges, now });
    await d1.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    const d2 = await Door.open({ backend: b, seed: demoSeedChanges, now });
    expect(qty(d2)).toBe(11);
    expect(d2.status().server).toBe("none"); // no server yet: this computer only
  });

  it("F3.6 a failed save changes nothing and says so", async () => {
    const b = new MemoryBackend();
    const d = await Door.open({ backend: b, seed: demoSeedChanges, now });
    b.failNext = 1;
    await expect(d.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" })).rejects.toBeInstanceOf(DoorError);
    expect(qty(d)).toBe(12);
    expect(d.status().error).toMatch(/Not saved/);
    expect(qty(await Door.open({ backend: b, now }))).toBe(12);
    await d.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    expect(d.status().error).toBeNull();
  });

  it("F3.7 a new version carries old data over and never replaces it with built-in data (B3)", async () => {
    const b = new MemoryBackend();
    // Data saved by an older version: no schemaVersion, messages without the app code.
    const old: Change[] = [{ messageId: "m1", at: 1, by: "p", app: "", recordType: "line", recordId: "L-old", op: "create", data: { qty: 4242 } }];
    await b.commit(old, { toOutbox: false });
    const d = await Door.open({ backend: b, seed: demoSeedChanges, now });
    expect(d.get("line", "L-old")?.qty).toBe(4242);
    expect(d.records("line").length).toBe(1);                // DEMO data was NOT added
    expect(d.messages()[0].app).toBe("MD");                   // migrated
    expect(b.meta.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("built-in DEMO data goes only into an empty store, once", async () => {
    const b = new MemoryBackend();
    await Door.open({ backend: b, seed: demoSeedChanges, now });
    const n = b.changes.size;
    await Door.open({ backend: b, seed: demoSeedChanges, now });
    expect(b.changes.size).toBe(n);
  });
});

describe("store door: offline and two computers (with a stand-in server)", () => {
  async function twoComputers() {
    const server = new FakeServer();
    const seed = demoSeedChanges();
    server.receive(seed);
    const ta = server.connect(), tb = server.connect();
    const a = await Door.open({ backend: new MemoryBackend(), transport: ta, device: "mac", now });
    const b = await Door.open({ backend: new MemoryBackend(), transport: tb, device: "pc", now });
    await a.sync(); await b.sync();
    return { server, a, b, ta, tb };
  }

  it("F3.2 changes made offline wait on the computer and are sent when the internet is back", async () => {
    const { server, a, ta } = await twoComputers();
    ta.setOnline(false);
    await a.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    await a.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    await a.sync();
    expect(a.status()).toMatchObject({ server: "offline", waiting: 2 });
    const before = server.log.length;
    ta.setOnline(true); await a.sync();
    expect(a.status()).toMatchObject({ server: "online", waiting: 0 });
    expect(server.log.length).toBe(before + 2);
  });

  it("F3.4 two computers change the same line offline: both movements count", async () => {
    const { a, b, ta, tb } = await twoComputers();
    ta.setOnline(false); tb.setOnline(false);
    await a.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    await b.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: 2 }, by: "demo-p2" });
    ta.setOnline(true); tb.setOnline(true);
    await a.sync(); await b.sync(); await a.sync();
    expect(qty(a)).toBe(13); expect(qty(b)).toBe(13); // 12 − 1 + 2
  });

  it("F3.5 two counts that disagree: the later is used, both kept, flagged; later movements still count", async () => {
    const { a, b, ta, tb } = await twoComputers();
    ta.setOnline(false); tb.setOnline(false);
    await a.apply({ recordType: "line", recordId: "demo-s1", op: "count", data: { qty: 11, basedOn: null }, by: "demo-p1" });
    await b.apply({ recordType: "line", recordId: "demo-s1", op: "count", data: { qty: 9, basedOn: null }, by: "demo-p2" });
    ta.setOnline(true); tb.setOnline(true);
    await a.sync(); await b.sync(); await a.sync();
    expect(qty(a)).toBe(9); expect(qty(b)).toBe(9);
    expect(a.flags()).toHaveLength(1);
    expect(a.flags()[0].counts.map(c => c.qty)).toEqual([11, 9]);
    await a.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    await b.sync();
    expect(qty(b)).toBe(8);
  });

  it("a message that arrives twice counts once (R8)", async () => {
    const { server, a, b } = await twoComputers();
    const c = await a.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
    server.receive([c]); server.receive([c]);
    await b.sync(); await b.sync();
    expect(qty(b)).toBe(11);
  });
});
