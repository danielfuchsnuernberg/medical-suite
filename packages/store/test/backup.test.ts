import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, BackupStore, MemoryFiles, InventoryStore, checkBackup, makeBackup, SCHEMA_VERSION, KEEP } from "../src";
import { demoSeedChanges, type Change } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);
const open = async (b = new MemoryBackend(), files = new MemoryFiles()) => { const door = await Door.open({ backend: b, seed: demoSeedChanges, now }); return { b, door, files, bk: new BackupStore(door, files), inv: new InventoryStore(door) }; };
const cara = (d: Door) => d.get("person", "demo-p3")!;
const anna = (d: Door) => d.get("person", "demo-p1")!;

describe("backup and restore (F13)", () => {
  it("F13.2 a backup file in the REACH shape: app code, data version, when exported, the data", async () => {
    const { door, bk } = await open();
    const f = bk.exportFile(cara(door));
    expect(f.name).toBe("medical-suite-backup-2026-11-28.json");                       // the base's date
    const o = JSON.parse(f.text);
    expect(o).toMatchObject({ app: "MD", kind: "backup", dataVersion: SCHEMA_VERSION, exportedBy: "demo-p3" });
    expect(o.exportedAt).toMatch(/^2026-11-28T/);
    expect(o.data.messages.length).toBe(door.messages().length);
    expect(f.text).not.toContain("salt");                                               // no password check values
    expect(() => bk.exportFile(anna(door))).toThrow("Only Manage level");
  });
  it("F13.1 one backup a day on this computer, the last 30 kept", async () => {
    const { bk, files } = await open();
    expect(await bk.nightly()).toBe("medical-suite-backup-2026-11-28.json");
    expect(await bk.nightly()).toBeNull();                                               // once a day
    for (let d = 1; d <= 40; d++) await files.save(`medical-suite-backup-2026-${String(Math.ceil(d / 28) + 9).padStart(2, "0")}-${String(((d - 1) % 28) + 1).padStart(2, "0")}.json`, "{}");
    await files.save("medical-suite-backup-2026-11-28-before-restore-101500.json", "{}");
    const names = (await files.list()).map(f => f.name);
    expect(names.filter(n => !n.includes("before")).length).toBe(KEEP);
    expect(names).toContain("medical-suite-backup-2026-11-28.json");                     // the newest stay
    expect(names).toContain("medical-suite-backup-2026-11-28-before-restore-101500.json");
  });
  it("F13.3 a backup with no stock, or with no people, is refused with the reason; nothing changes", async () => {
    const { door, bk } = await open();
    const all = door.messages();
    const noStock = JSON.stringify(makeBackup(all.filter(m => m.recordType !== "line"), "x", Date.now()));
    const noPeople = JSON.stringify(makeBackup(all.filter(m => m.recordType !== "person"), "x", Date.now()));
    expect(bk.check(cara(door), noStock)).toEqual({ ok: false, why: "This backup has no stock in it. Restoring it would delete all 10 stock lines, the stock takes and the register. Refused: nothing was changed." });
    expect(bk.check(cara(door), noPeople)).toEqual({ ok: false, why: "This backup has no people in it. Nobody could sign in afterwards. Refused: nothing was changed." });
    expect(checkBackup('{"people":[],"courses":[]}')).toMatchObject({ ok: false, why: expect.stringContaining("isn't a REACH Medical Suite backup") });
    expect(checkBackup("not json")).toMatchObject({ ok: false, why: expect.stringContaining("can't be read") });
    expect(checkBackup({ ...makeBackup(all, "x", 0), dataVersion: SCHEMA_VERSION + 1 })).toMatchObject({ ok: false, why: expect.stringContaining("newer version") });
    await expect(bk.restore(cara(door), noStock, true)).rejects.toThrow("no stock");
    expect(door.messages().length).toBe(all.length);
  });
  it("F13.4 a restore needs the tick, saves a backup of today first, and sets everything back (Q32 = B)", async () => {
    const { door, bk, files, inv } = await open();
    const before = bk.exportFile(cara(door)).text;                                        // the state to go back to
    await inv.adjust(anna(door), "demo-s1", "dispense", 5);
    expect(door.get("line", "demo-s1")!.qty).toBe(7);
    await expect(bk.restore(cara(door), before, false)).rejects.toThrow("Tick the box to confirm. Nothing was changed.");
    await expect(bk.restore(anna(door), before, true)).rejects.toThrow("Only Manage level");
    const r = await bk.restore(cara(door), before, true);
    expect(r.safety).toMatch(/^medical-suite-backup-2026-11-28-before-restore-\d{6}\.json$/);
    expect(JSON.parse(await files.read(r.safety)).data.messages.some((m: Change) => m.recordId === "demo-s1" && m.op === "delta")).toBe(true);   // today's state was kept
    expect(door.get("line", "demo-s1")!.qty).toBe(12);
    // Q32 = B (B66): the restore is new changes; the dispense stays in the log, and the restore is one entry
    expect(door.log().some(e => e.recordId === "demo-s1" && e.op === "delta")).toBe(true);
    expect(door.records("event").some(e => e.what === "restored a backup")).toBe(true);
  });
  it("F13.5 after a restore the data is there at once, for everyone listening; a failed restore changes nothing", async () => {
    const { door, bk, b } = await open();
    const text = bk.exportFile(cara(door)).text;
    let told = 0; door.subscribe(() => told++);
    await door.apply({ recordType: "line", recordId: "demo-s2", op: "delta", data: { field: "qty", by: -4 }, by: "demo-p1" });
    told = 0;
    await bk.restore(cara(door), text, true);
    expect(told).toBeGreaterThan(0);
    expect(door.get("line", "demo-s2")!.qty).toBe(4);
    b.failNext = 1;
    await door.apply({ recordType: "line", recordId: "demo-s2", op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" }).catch(() => {});
    const m = door.messages().length;
    b.failNext = 1;
    await expect(bk.restore(cara(door), text, true)).rejects.toThrow("Not saved.");   // even its own log entry isn't saved: nothing changes
    expect(door.messages().length).toBe(m);
    // and on disk too: the next start sees the restored data
    const again = await Door.open({ backend: b, seed: demoSeedChanges, now });
    expect(again.get("line", "demo-s2")!.qty).toBe(4);
  });
  it("an older backup is carried forward to this version on restore (B3)", async () => {
    const { door, bk } = await open();
    const old = makeBackup(door.messages().filter(m => m.recordType !== "category").map(m => m.recordType === "item" ? { ...m, data: { ...m.data, categoryId: undefined, category: "Fluids" } } : m), "x", 0);
    const text = JSON.stringify({ ...old, dataVersion: 1 });
    await bk.restore(cara(door), text, true);
    expect(door.get("category", "cat-fluids")).toMatchObject({ name: "Fluids" });         // version 2 made category records
  });
});
