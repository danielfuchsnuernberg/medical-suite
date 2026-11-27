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
