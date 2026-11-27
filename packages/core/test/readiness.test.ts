import { describe, it, expect } from "vitest";
import { stockStatus, readiness, verdictWord, readinessLine, overview, matches, demoLines, demoLocations } from "../src";

const T = "2026-11-28";
const line = (qty: number, required: number | null, expiry: string | null = "2027-12-01", locationId = "b") => ({ id: Math.random().toString(36), itemId: "i" + qty, locationId, qty, required, expiry });

describe("F6 stock status", () => {
  it("B1: exactly the required amount is OK; one below is low; none left is out", () => {
    expect(stockStatus({ qty: 4, required: 4 })).toBe("ok");
    expect(stockStatus({ qty: 3, required: 4 })).toBe("low");
    expect(stockStatus({ qty: 0, required: 4 })).toBe("out");
    expect(stockStatus({ qty: -1, required: null })).toBe("out");
  });
  it("B25: no required amount is 'none', never OK", () => {
    expect(stockStatus({ qty: 99, required: null })).toBe("none");
    expect(stockStatus({ qty: 99, required: undefined })).toBe("none");
  });
});

describe("F6 bag readiness", () => {
  it("B1: every line at exactly its required amount and in date → Ready", () => {
    const r = readiness([line(4, 4), line(10, 10)], T);
    expect(r.verdict).toBe("ready");
    expect(verdictWord(r.verdict, false)).toBe("Ready");
  });
  it("B25: one line with no required amount → Not set up, even if the rest are fine", () => {
    const r = readiness([line(4, 4), line(2, null)], T);
    expect(r.verdict).toBe("notSetUp");
    expect(readinessLine(r, false)).toBe("1 of 2 at or above required · 1 with no required amount");
  });
  it("short beats not set up; out or expired beats short", () => {
    expect(readiness([line(3, 4), line(2, null)], T).verdict).toBe("short");
    expect(readiness([line(3, 4), line(0, 4)], T).verdict).toBe("notReady");
    expect(readiness([line(4, 4, "2026-11-27")], T).verdict).toBe("notReady");     // expired yesterday
    expect(readiness([line(4, 4, "2026-11-28")], T).verdict).toBe("ready");        // expires today: still in date
    expect(readiness([], T).verdict).toBe("empty");
  });
  it("B10: the Store says Reorder / Stocked and 'reorder level'", () => {
    const r = readiness([line(6, 10)], T);
    expect(verdictWord(r.verdict, true)).toBe("Reorder");
    expect(readinessLine(r, true)).toBe("0 of 1 at or above reorder level · 1 below reorder level");
    expect(verdictWord("ready", true)).toBe("Stocked");
  });
});

describe("F6 overview and what each card opens", () => {
  const lines = demoLines;
  it("the DEMO data shows every case: Bag 1 Ready, Bag 2 Not ready, Trauma kit Not set up, Store below reorder", () => {
    const v = (id: string) => readiness(lines.filter(l => l.locationId === id), T).verdict;
    expect(demoLocations.map(l => [l.name, v(l.id)])).toEqual([["Store (main)", "notReady"], ["Bag 1 (adult)", "ready"], ["Bag 2 (child)", "notReady"], ["Trauma kit", "notSetUp"]]);
    expect(lines.filter(l => l.locationId === "demo-l0" && stockStatus(l) === "low").length).toBe(1);
  });
  it("counts match the lines each warning opens", () => {
    const o = overview(lines, T);
    expect(o.out).toBe(lines.filter(l => matches(l, { stock: "out" }, T)).length);
    expect(o.out).toBe(1);
    expect(o.low).toBe(1);
    expect(o.none).toBe(2);
    expect(o.expired).toBe(1);
    expect(o.soon).toBe(1);                                                    // Glucose gel, expires today
    expect(o.soonest.map(l => l.id)).toEqual(["demo-s5", "demo-s3"]);          // soonest first
    expect(o.units).toBe(lines.reduce((s, l) => s + l.qty, 0));
  });
});

import { listLines, csvCell, linesCsv, csvFileName, demoItems, demoCategories } from "../src";

describe("F7 Store and bags: filters, sort, CSV", () => {
  const itemOf = (id: string) => demoItems.find(i => i.id === id);
  const names = (ls: { itemId: string; locationId: string }[]) => ls.map(l => `${itemOf(l.itemId)!.name}@${l.locationId}`);
  const archived = [{ id: "x1", itemId: "demo-i6", locationId: "demo-l1", qty: 1, required: 1, expiry: null }];
  it("filters by place, category, stock level (incl. no amount) and expiry; archived only on request", () => {
    expect(listLines(demoLines, archived, { locationId: "demo-l2" }, T, itemOf).length).toBe(2);
    expect(names(listLines(demoLines, archived, { categoryId: "cat-fluids" }, T, itemOf))).toEqual(["Saline 0.9% 500 ml@demo-l1", "Saline 0.9% 500 ml@demo-l0"]);
    expect(listLines(demoLines, archived, { stock: "none" }, T, itemOf).map(l => l.id).sort()).toEqual(["demo-s8", "demo-s9"]);
    expect(listLines(demoLines, archived, { expiry: "soon" }, T, itemOf).map(l => l.id)).toEqual(["demo-s3"]);
    expect(listLines(demoLines, archived, { expiry: "inDate" }, T, itemOf).length).toBe(8);
    expect(listLines(demoLines, archived, {}, T, itemOf).some(l => l.id === "x1")).toBe(false);
    expect(listLines(demoLines, archived, { archived: true }, T, itemOf).some(l => l.id === "x1")).toBe(true);
  });
  it("sorts by name both ways, worst stock first, soonest expiry first, lowest amount first", () => {
    const by = (sort: any) => listLines(demoLines, [], { sort }, T, itemOf).map(l => l.id);
    expect(by("name")[0]).toBe("demo-s9");                     // Bandage
    expect(by("nameZ")[0]).toBe("demo-s8");                    // Tourniquet
    expect(by("stock")[0]).toBe("demo-s4");                    // out of stock first
    expect(by("expiry").slice(0, 2)).toEqual(["demo-s5", "demo-s3"]);
    expect(by("expiry").slice(-2).sort()).toEqual(["demo-s10", "demo-s8"]);   // no expiry last
    expect(by("qtyLow")[0]).toBe("demo-s4");
  });
  it("CSV: quotes, formulas never run, plain dates, Excel-readable", () => {
    expect(csvCell('Gauze "big", 10×10')).toBe('"Gauze ""big"", 10×10"');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("-5")).toBe("'-5");
    const text = linesCsv([demoLines[2]], { item: itemOf, category: id => demoCategories.find(c => c.id === id)!.name, place: () => "Bag 2 (child)", archived: () => false, stockWord: () => "At or above required" });
    expect(text.startsWith("﻿")).toBe(true);
    expect(text.slice(1).split("\r\n")).toEqual(["Item,Category,Place,On hand,Unit,Required / reorder at,Stock,Lot,Expiry,Archived", "Glucose gel 15 g,Medication,Bag 2 (child),2,tube,2,At or above required,GG-5,2026-11-28,", ""]);
    expect(csvFileName("Bag 1 (adult)", T)).toBe("inventory-bag-1-adult-2026-11-28.csv");
  });
});
