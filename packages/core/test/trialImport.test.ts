// B76 (A7, Q33 = A): the real-data trial reads the must-fix rows where it is safe, each guess marked “to check”.
// The nurses' program keeps the strict rule. Made-up rows, shaped like the problems found in the real files (counts only).
import { describe, it, expect } from "vitest";
import { checkStockList, planImport } from "../src";
import type { Sheet } from "../src/importExport/xlsx";

const sheet: Sheet = { name: "Bag 1 (example)", rows: [
  ["Item", "Unit", "Batch", "Expiry", "Required", "SOH FEB", "SOH MAR"],
  ["Gauze swabs", "pack", "G-1", "01/03/2027", 4, 3, "2 pkt"],
  ["Gloves M", "box", "", "", 2, null, "3pairs"],
  ["Splint set", "set", "", "", 4, null, "Full"],
  ["Glucose gel", "tube", "", "", 2, null, "Half"],
  ["Saline 500 ml", "bag", "", "03/27 & 08/27", 2, null, 2],
  ["Bandage", "roll", "", "01/01/1900", 2, null, 1],
  ["Crepe", "roll", "", 0, 2, null, 1],
  ["Swab", "pk", 46000, "", 2, null, 5],
  ["Tape", "roll", "", "", 2, null, "1 +2 +3 = 6"],
  ["Gauze swabs", "pack", "G-1", "01/03/2027", 4, null, 1],
] };

describe("B76 trial reading", () => {
  it("strict (the nurses' program): every one of these rows must be fixed, nothing guessed", () => {
    const c = checkStockList([sheet]);
    expect(c.blocking).toBe(10);
    expect(c.sheets[0].rows.some(r => r.check || r.skip)).toBe(false);
  });
  it("trial: safe readings, each named; unreadable counts left out; nothing blocks", () => {
    const c = checkStockList([sheet], { trial: true });
    expect(c.blocking).toBe(0);
    const row = (n: string) => c.sheets[0].rows.filter(r => r.tidied === n);
    expect(row("Gauze swabs")[0].counts).toEqual([3, 3]);                                  // 2 pkt → 2, then row 11 (1) added
    expect(row("Gauze swabs")[0].check!.join(" | ")).toMatch(/“2 pkt” in SOH MAR read as 2.*row 11 .*added to this one/);
    expect(row("Gauze swabs")[1].skip).toBe(true);                                         // the second line went into the first
    expect(row("Gloves M")[0].counts[1]).toBe(3);
    expect(row("Splint set")[0].counts[1]).toBe(4);                                        // “Full” → the required amount
    expect(row("Glucose gel")[0].skip).toBe(true);                                         // “Half”: not loaded
    expect(row("Saline 500 ml")[0].expiry).toBe("2027-03-01");                             // the earlier of 03/27 and 08/27
    expect(row("Bandage")[0].expiry).toBe("");                                             // year 1900: no expiry
    expect(row("Crepe")[0].expiry).toBe("");                                               // an Excel 0: no expiry
    expect(row("Swab")[0]).toMatchObject({ lot: "", expiry: "2025-12-09" });               // a lot that is a date, expiry empty → the expiry
    expect(row("Tape")[0].counts[1]).toBe(6);
    for (const n of ["Saline 500 ml", "Bandage", "Crepe", "Swab", "Tape", "Splint set", "Gloves M"]) expect(row(n)[0].check?.length).toBeGreaterThan(0);
  });
  it("the plan leaves out the rows that can't be read and carries the “to check” text", () => {
    const c = checkStockList([sheet], { trial: true });
    const p = planImport(c, "bags.xlsx", [], []);
    const rows = p.sheets[0].rows;
    expect(rows.map(r => r.item)).not.toContain("Glucose gel");
    expect(rows.filter(r => r.item === "Gauze swabs")).toHaveLength(1);
    expect(p.skipped).toBe(2);
    expect(rows.find(r => r.item === "Splint set")).toMatchObject({ qty: 4, check: expect.stringContaining("required amount") });
    expect(rows.every(r => !r.blocking)).toBe(true);
  });
});
