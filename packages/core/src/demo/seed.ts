// DEMO data (REACH Core R11): invented names and numbers, marked DEMO. Never real stock or staff.
// Used until the store door (F3) holds the program's own data; then it becomes the first-run demo only.

import type { CalendarDate } from "../reachCore/dates";

export const DEMO = true as const;

export interface DemoSettings { baseName: string; country: string; timeZone: string; dateStyle: "long" | "short"; dayShift: string; nightShift: string }
/** The base's settings (F5), stored as the record settings/base. */
export const demoSettings: DemoSettings = { baseName: "Port Moresby base", country: "PG", timeZone: "Pacific/Port_Moresby", dateStyle: "long", dayShift: "07:00–19:00", nightShift: "19:00–07:00" };

const stamp = { createdAt: 0, createdBy: "demo", changedAt: 0, changedBy: "demo", country: "PG", state: "Active" as const, demo: DEMO };

// Lists managed in Settings (F5.6), as in demo batch 4. "Training" is used only by an archived person and "icu"
// only by an archived item: the B21 cases. "icu" is lower case on purpose: the B24 rename case.
export const demoDepartments = [
  { id: "demo-d1", name: "Clinical" }, { id: "demo-d2", name: "Management" }, { id: "demo-d3", name: "Logistics" }, { id: "demo-d4", name: "Training" },
];
export const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Category IDs come from the name, so data saved before categories were records gets the same IDs (migration 2). */
export const categoryId = (name: string) => "cat-" + slug(name);
export const demoCategories = ["Dressings", "Fluids", "Medication", "Airway and IV", "Controlled drugs", "Trauma", "PPE", "icu"].map(name => ({ id: categoryId(name), name }));
export const demoCourses = [
  { id: "demo-k1", name: "BLS (basic life support)", validMonths: 12 }, { id: "demo-k2", name: "ACLS", validMonths: 24 },
  { id: "demo-k3", name: "Fire safety", validMonths: 12 }, { id: "demo-k4", name: "Controlled-drug handling", validMonths: 12 },
  { id: "demo-k5", name: "Oxygen refresher", validMonths: 1 },
];

export const demoPeople = [
  { id: "demo-p1", staffNo: "S-001", name: "Anna Example", job: "Nurse", level: "Work", departmentId: "demo-d1", ...stamp },
  { id: "demo-p2", staffNo: "S-002", name: "Dr Ben Sample", job: "Doctor", level: "Manage", departmentId: "demo-d1", ...stamp },
  { id: "demo-p3", staffNo: "S-003", name: "Cara Demo", job: "Base manager", level: "Manage", departmentId: "demo-d2", ...stamp },
  { id: "demo-p4", staffNo: "S-004", name: "Dina Test", job: "Nurse", level: "Work", departmentId: "demo-d1", ...stamp },
  { id: "demo-p5", staffNo: "S-005", name: "Finn Former", job: "Nurse", level: "Work", departmentId: "demo-d4", ...stamp, state: "Archived" as const },
];

export const demoLocations = [
  { id: "demo-l0", name: "Store (main)", kind: "store", ...stamp },
  { id: "demo-l1", name: "Bag 1 (adult)", kind: "bag", ...stamp },
  { id: "demo-l2", name: "Bag 2 (child)", kind: "bag", ...stamp },
  { id: "demo-l3", name: "Trauma kit", kind: "bag", ...stamp },
];

export const demoItems = [
  { id: "demo-i1", itemNo: "I-0001", name: "Gauze 10×10 cm", categoryId: categoryId("Dressings"), unit: "pack", controlled: false, ...stamp },
  { id: "demo-i2", itemNo: "I-0002", name: "Saline 0.9% 500 ml", categoryId: categoryId("Fluids"), unit: "bag", controlled: false, ...stamp },
  { id: "demo-i3", itemNo: "I-0003", name: "Glucose gel 15 g", categoryId: categoryId("Medication"), unit: "tube", controlled: false, ...stamp },
  { id: "demo-i4", itemNo: "I-0004", name: "IV cannula 18G", categoryId: categoryId("Airway and IV"), unit: "", controlled: false, ...stamp },
  { id: "demo-i5", itemNo: "I-0005", name: "Morphine 10 mg/ml (demo)", categoryId: categoryId("Controlled drugs"), unit: "amp", controlled: true, ...stamp },
  { id: "demo-i7", itemNo: "I-0007", name: "Bandage 8 cm", categoryId: categoryId("Dressings"), unit: "roll", controlled: false, ...stamp },
  { id: "demo-i8", itemNo: "I-0008", name: "Tourniquet", categoryId: categoryId("Trauma"), unit: "", controlled: false, ...stamp },
  { id: "demo-i9", itemNo: "I-0009", name: "Gloves, size M", categoryId: categoryId("PPE"), unit: "box", controlled: false, ...stamp },
  { id: "demo-i6", itemNo: "I-0006", name: "Old suction tubing (demo)", categoryId: categoryId("icu"), unit: "", controlled: false, ...stamp, state: "Archived" as const },
];

export const demoLines: { id: string; itemId: string; locationId: string; qty: number; required: number | null; lot: string; expiry: CalendarDate | null }[] = [
  { id: "demo-s1", itemId: "demo-i1", locationId: "demo-l1", qty: 12, required: 10, lot: "G-2201", expiry: "2027-12-01" },
  { id: "demo-s2", itemId: "demo-i2", locationId: "demo-l1", qty: 4, required: 4, lot: "S-118", expiry: "2027-06-15" },
  { id: "demo-s3", itemId: "demo-i3", locationId: "demo-l2", qty: 2, required: 2, lot: "GG-5", expiry: "2026-11-28" },
  { id: "demo-s4", itemId: "demo-i4", locationId: "demo-l2", qty: 0, required: 4, lot: "", expiry: "2028-03-01" },
  { id: "demo-s5", itemId: "demo-i2", locationId: "demo-l0", qty: 24, required: 12, lot: "S-099", expiry: "2026-11-20" },
  { id: "demo-s6", itemId: "demo-i1", locationId: "demo-l0", qty: 30, required: 20, lot: "G-2190", expiry: "2027-10-01" },
  { id: "demo-s7", itemId: "demo-i5", locationId: "demo-l0", qty: 5, required: 5, lot: "M-3", expiry: "2027-07-24" },
  // F6 cases: the Trauma kit has no required amounts yet (B25, "Not set up"); the Store is below a reorder level (B10).
  { id: "demo-s8", itemId: "demo-i8", locationId: "demo-l3", qty: 2, required: null, lot: "", expiry: null },
  { id: "demo-s9", itemId: "demo-i7", locationId: "demo-l3", qty: 4, required: null, lot: "", expiry: "2028-10-01" },
  { id: "demo-s10", itemId: "demo-i9", locationId: "demo-l0", qty: 6, required: 10, lot: "", expiry: null },
];

/** The search source (F1.4) built from the DEMO records, by ID (R5). */
export function demoSearchSource() {
  const item = (id: string) => demoItems.find(i => i.id === id)!;
  const loc = (id: string) => demoLocations.find(l => l.id === id)!;
  return {
    people: demoPeople.filter(p => p.state === "Active").map(p => ({ id: p.id, name: p.name, job: p.job })),
    stock: demoLines.map(l => ({ id: l.id, item: item(l.itemId).name, location: loc(l.locationId).name, qty: l.qty, unit: item(l.itemId).unit, expiry: l.expiry })),
  };
}

import { type Change, APP_CODE } from "../reachCore/change";

/** The DEMO data as messages, for an empty store's first start (only ever into an empty store, B3). */
export function demoSeedChanges(at = Date.UTC(2026, 10, 1)): Change[] {
  const out: Change[] = [];
  const add = (recordType: string, rec: { id: string } & Record<string, unknown>) => {
    const { id, createdAt, createdBy, changedAt, changedBy, state, ...data } = rec as any;
    out.push({ messageId: `seed-${id}`, at, by: "demo", app: APP_CODE, recordType, recordId: id, op: "create", data: { ...data, demo: true } });
  };
  add("settings", { id: "base", ...demoSettings });
  demoDepartments.forEach(r => add("department", r));
  demoCategories.forEach(r => add("category", r));
  demoCourses.forEach(r => add("course", r));
  demoLocations.forEach(r => add("location", r));
  demoItems.forEach(r => add("item", r));
  demoLines.forEach(r => add("line", { ...r, country: "PG" }));
  demoPeople.forEach(r => add("person", r));
  // Archived DEMO records: created, then archived (the archive is its own message, as in real use).
  for (const [type, list] of [["item", demoItems], ["person", demoPeople]] as const)
    for (const r of list as readonly { id: string; state: string }[]) if (r.state === "Archived")
      out.push({ messageId: `seed-archive-${r.id}`, at: at + 1, by: "demo", app: APP_CODE, recordType: type, recordId: r.id, op: "archive", data: {} });
  return out;
}
