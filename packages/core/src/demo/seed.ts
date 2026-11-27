// DEMO data (REACH Core R11): invented names and numbers, marked DEMO. Never real stock or staff.
// Used until the store door (F3) holds the program's own data; then it becomes the first-run demo only.

import type { CalendarDate } from "../reachCore/dates";

export const DEMO = true as const;

export interface DemoSettings { baseName: string; country: string; timeZone: string; dateStyle: "long" | "short" }
export const demoSettings: DemoSettings = { baseName: "Port Moresby base", country: "PG", timeZone: "Pacific/Port_Moresby", dateStyle: "long" };

const stamp = { createdAt: 0, createdBy: "demo", changedAt: 0, changedBy: "demo", country: "PG", state: "Active" as const, demo: DEMO };

export const demoPeople = [
  { id: "demo-p1", staffNo: "S-001", name: "Anna Example", job: "Nurse", level: "Work", ...stamp },
  { id: "demo-p2", staffNo: "S-002", name: "Dr Ben Sample", job: "Doctor", level: "Manage", ...stamp },
  { id: "demo-p3", staffNo: "S-003", name: "Cara Demo", job: "Base manager", level: "Manage", ...stamp },
  { id: "demo-p4", staffNo: "S-004", name: "Dina Test", job: "Nurse", level: "Work", ...stamp },
];

export const demoLocations = [
  { id: "demo-l0", name: "Store (main)", kind: "store", ...stamp },
  { id: "demo-l1", name: "Bag 1 (adult)", kind: "bag", ...stamp },
  { id: "demo-l2", name: "Bag 2 (child)", kind: "bag", ...stamp },
];

export const demoItems = [
  { id: "demo-i1", itemNo: "I-0001", name: "Gauze 10×10 cm", category: "Dressings", unit: "pack", controlled: false, ...stamp },
  { id: "demo-i2", itemNo: "I-0002", name: "Saline 0.9% 500 ml", category: "Fluids", unit: "bag", controlled: false, ...stamp },
  { id: "demo-i3", itemNo: "I-0003", name: "Glucose gel 15 g", category: "Medication", unit: "tube", controlled: false, ...stamp },
  { id: "demo-i4", itemNo: "I-0004", name: "IV cannula 18G", category: "Airway and IV", unit: "", controlled: false, ...stamp },
  { id: "demo-i5", itemNo: "I-0005", name: "Morphine 10 mg/ml (demo)", category: "Controlled drugs", unit: "amp", controlled: true, ...stamp },
];

export const demoLines: { id: string; itemId: string; locationId: string; qty: number; required: number | null; lot: string; expiry: CalendarDate | null }[] = [
  { id: "demo-s1", itemId: "demo-i1", locationId: "demo-l1", qty: 12, required: 10, lot: "G-2201", expiry: "2027-12-01" },
  { id: "demo-s2", itemId: "demo-i2", locationId: "demo-l1", qty: 4, required: 4, lot: "S-118", expiry: "2027-06-15" },
  { id: "demo-s3", itemId: "demo-i3", locationId: "demo-l2", qty: 2, required: 2, lot: "GG-5", expiry: "2026-11-28" },
  { id: "demo-s4", itemId: "demo-i4", locationId: "demo-l2", qty: 0, required: 4, lot: "", expiry: "2028-03-01" },
  { id: "demo-s5", itemId: "demo-i2", locationId: "demo-l0", qty: 24, required: 12, lot: "S-099", expiry: "2026-11-20" },
  { id: "demo-s6", itemId: "demo-i1", locationId: "demo-l0", qty: 30, required: 20, lot: "G-2190", expiry: "2027-10-01" },
  { id: "demo-s7", itemId: "demo-i5", locationId: "demo-l0", qty: 5, required: 5, lot: "M-3", expiry: "2027-07-24" },
];

/** The search source (F1.4) built from the DEMO records, by ID (R5). */
export function demoSearchSource() {
  const item = (id: string) => demoItems.find(i => i.id === id)!;
  const loc = (id: string) => demoLocations.find(l => l.id === id)!;
  return {
    people: demoPeople.map(p => ({ id: p.id, name: p.name, job: p.job })),
    stock: demoLines.map(l => ({ id: l.id, item: item(l.itemId).name, location: loc(l.locationId).name, qty: l.qty, unit: item(l.itemId).unit, expiry: l.expiry })),
  };
}
