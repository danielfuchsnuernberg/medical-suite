import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, SettingsStore, SCHEMA_VERSION } from "../src";
import { demoSeedChanges, checkBaseSettings, type Change } from "@md/core";

let clock = Date.UTC(2026, 10, 28, 1, 0);
const now = () => (clock += 1000);
const open = async (b = new MemoryBackend()) => { const door = await Door.open({ backend: b, seed: demoSeedChanges, now }); return { b, door, s: new SettingsStore(door) }; };
const cara = (d: Door) => d.get("person", "demo-p3")!;
const anna = (d: Door) => d.get("person", "demo-p1")!;

describe("settings (F5)", () => {
  it("F5.1 base settings are a record: base name, country, time zone, date style, shift times; old → new in the log", async () => {
    const { door, s } = await open();
    expect(s.base()).toMatchObject({ baseName: "Port Moresby base", country: "PG", timeZone: "Pacific/Port_Moresby", dateStyle: "long", dayShift: "07:00–19:00" });
    await s.saveBase(cara(door), { ...s.base(), country: "PE", timeZone: "America/Lima", baseName: "Lima base" } as any);
    expect(s.base()).toMatchObject({ country: "PE", timeZone: "America/Lima", baseName: "Lima base" });
    expect(door.log()[0].changes.map(c => c.field).sort()).toEqual(["baseName", "country", "timeZone"]);
    await expect(s.saveBase(cara(door), { ...s.base(), timeZone: "Mars/Olympus" } as any)).rejects.toThrow("Pick the base's time zone.");
    await expect(s.saveBase(cara(door), { ...s.base(), dayShift: "7 till 7" } as any)).rejects.toThrow(/Day shift: write it as 07:00–19:00/);
    expect(checkBaseSettings({ baseName: "x", country: "PG", timeZone: "Pacific/Port_Moresby", dateStyle: "long", dayShift: "07:00-19:00", nightShift: "19:00–07:00" }).ok).toBe(true);
  });

  it("F5.7 only Manage level changes settings, checked where it's saved", async () => {
    const { door, s } = await open();
    await expect(s.saveBase(anna(door), { ...s.base(), baseName: "Anna's base" } as any)).rejects.toThrow("Only Manage level changes settings.");
    await expect(s.add(anna(door), "department", "Pharmacy")).rejects.toThrow("Only Manage level changes settings.");
    expect(s.base()!.baseName).toBe("Port Moresby base");
  });

  it("F5.4 an entry in use, even only by archived records, can't be deleted; the message says who uses it (B21)", async () => {
    const { door, s } = await open();
    await expect(s.delete(cara(door), "department", "demo-d4")).rejects.toThrow("“Training” is still used by Finn Former (archived), so it can't be deleted. Archive it instead: it disappears from the lists, and those records keep it.");
    await expect(s.delete(cara(door), "category", "cat-icu")).rejects.toThrow(/“icu” is still used by Old suction tubing \(demo\) \(archived\)/);
    expect(door.get("department", "demo-d4")).toBeTruthy();
    expect(door.get("person", "demo-p5")!.departmentId).toBe("demo-d4");      // not re-filed (the June bug)
    await s.archive(cara(door), "department", "demo-d4");                       // archive is the way
    expect(s.entries("department", false).map(e => e.name)).not.toContain("Training");
    expect(door.get("person", "demo-p5")!.departmentId).toBe("demo-d4");
  });

  it("F5.4 a new unused entry added by mistake can be deleted within 24 hours; an old unused one only archived", async () => {
    const { door, s } = await open();
    const id = await s.add(cara(door), "category", "Oxgen");
    await s.delete(cara(door), "category", id);
    expect(door.get("category", id)).toBeUndefined();
    await expect(s.delete(cara(door), "department", "demo-d3")).rejects.toThrow(/within 24 hours/);  // Logistics: unused, but weeks old
  });

  it("F5.5 renaming only the capitals is allowed (icu → ICU); a real duplicate is refused (B24)", async () => {
    const { door, s } = await open();
    await s.rename(cara(door), "category", "cat-icu", "ICU");
    expect(door.get("category", "cat-icu")!.name).toBe("ICU");
    await expect(s.rename(cara(door), "category", "cat-icu", "fluids")).rejects.toThrow("“Fluids” is already there.");
    await expect(s.add(cara(door), "department", " clinical ")).rejects.toThrow("“Clinical” is already there.");
    await s.archive(cara(door), "department", "demo-d3");
    await expect(s.add(cara(door), "department", "LOGISTICS")).rejects.toThrow("“Logistics” is already there (archived).");
  });

  it("F5.6 departments, categories, courses and bags are managed here", async () => {
    const { door, s } = await open();
    expect(s.entries("department").map(e => e.name)).toEqual(["Clinical", "Logistics", "Management", "Training"]);
    expect(s.entries("bag").map(e => e.name)).toEqual(["Bag 1 (adult)", "Bag 2 (child)", "Trauma kit"]);       // the Store is not a bag
    const k = await s.add(cara(door), "course", "Neonatal resuscitation", { validMonths: 24 });
    expect(door.get("course", k)).toMatchObject({ name: "Neonatal resuscitation", validMonths: 24 });
    await expect(s.add(cara(door), "course", "Bad", { validMonths: 0 })).rejects.toThrow(/1 to 120/);
    await s.setCourseMonths(cara(door), "demo-k5", 3);
    expect(door.get("course", "demo-k5")!.validMonths).toBe(3);
    const bag = await s.add(cara(door), "bag", "Bag 3 (obstetric)");
    expect(door.get("location", bag)).toMatchObject({ kind: "bag", name: "Bag 3 (obstetric)" });
    await expect(s.archive(cara(door), "bag", "demo-l1")).rejects.toThrow("Bag 1 (adult) still has 2 stock lines. Move or archive them first.");
    await s.archive(cara(door), "bag", bag);
    expect(s.entries("bag", false).map(e => e.name)).not.toContain("Bag 3 (obstetric)");
  });

  it("migration 2: older data with categories as text gets category records by ID; nothing is lost, every computer makes the same messages", async () => {
    const old: Change[] = [
      { messageId: "o1", at: 5, by: "p", app: "MD", recordType: "item", recordId: "i1", op: "create", data: { name: "Gauze", category: "Dressings" } },
      { messageId: "o2", at: 6, by: "p", app: "MD", recordType: "item", recordId: "i2", op: "create", data: { name: "Tape", category: "Dressings" } },
      { messageId: "o3", at: 7, by: "p", app: "MD", recordType: "item", recordId: "i3", op: "create", data: { name: "Saline", category: "Fluids" } },
    ];
    const mk = async () => { const b = new MemoryBackend(); await b.commit(old, { toOutbox: false }); await b.setMeta({ schemaVersion: 1 }); return Door.open({ backend: b, now }); };
    const a = await mk(), b = await mk();
    expect(a.get("item", "i1")).toMatchObject({ category: "Dressings", categoryId: "cat-dressings" });
    expect(a.records("category").map(c => c.name).sort()).toEqual(["Dressings", "Fluids"]);
    expect(a.messages().map(m => m.messageId).sort()).toEqual(b.messages().map(m => m.messageId).sort());
    expect(a.status().version).toBe(SCHEMA_VERSION);
  });
});
