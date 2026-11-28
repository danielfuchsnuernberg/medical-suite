// B74 (A5) — the Item list's sums, and B70 (A1) — one icon per menu entry.
import { describe, it, expect } from "vitest";
import { itemRows, filterItems, itemsCsv, MENU, MENU_BOTTOM } from "../src/index";

const items = [
  { id: "i1", itemNo: "I-0001", name: "Gauze swabs", categoryId: "c1", unit: "pack", state: "Active" },
  { id: "i2", itemNo: "I-0002", name: "Saline 500 ml", categoryId: "c2", unit: "bag", state: "Active" },
  { id: "i3", itemNo: "I-0003", name: "Morphine 10 mg", unit: "amp", controlled: true, state: "Active" },
  { id: "i4", itemNo: "I-0004", name: "Old splint", state: "Archived" },
  { id: "i5", itemNo: "I-0005", name: "Glucose gel", state: "Active" },
];
const line = (id: string, itemId: string, locationId: string, qty: number, required: number | null, expiry: string | null = null) => ({ id, itemId, locationId, qty, required, expiry });
const lines = [
  line("a", "i1", "store", 40, 20, "2027-05-01"), line("b", "i1", "bag1", 4, 4, "2026-12-31"), line("c", "i1", "bag2", 2, 4),
  line("d", "i2", "store", 9, null, "2027-01-01"), line("e", "i2", "bag1", 3, null),
  line("f", "i3", "bag1", 2, 2, "2027-03-01"),
  line("g", "i5", "bag1", -1, 2), line("h", "i5", "bag2", 0, 2),
];
const isStore = (id: string) => id === "store";

describe("B74 item rows", () => {
  const rows = itemRows(items, lines, isStore);
  const r = (id: string) => rows.find(x => x.id === id)!;
  it("adds up every place", () => { expect(r("i1").total).toBe(46); expect(r("i1").places).toBe(3); expect(r("i2").total).toBe(12); });
  it("the next expiry is the earliest of the lines that hold something", () => { expect(r("i1").nextExpiry).toBe("2026-12-31"); expect(r("i2").nextExpiry).toBe("2027-01-01"); });
  it("status over all places", () => {
    expect(r("i1").status).toBe("low");       // bag 2 holds 2 of 4
    expect(r("i2").status).toBe("none");      // no line has an amount set
    expect(r("i3").status).toBe("ok");
    expect(r("i5").status).toBe("below");     // two computers offline took more than there was
    expect(itemRows([{ id: "x", name: "No lines", state: "Active" }], [], isStore)[0]).toMatchObject({ total: 0, places: 0, status: "out", nextExpiry: null });
  });
  it("keeps the controlled mark and the archived state", () => { expect(r("i3").controlled).toBe(true); expect(r("i4").archived).toBe(true); });
  it("search by name or number, a category, archived only when asked, sorted by name", () => {
    expect(filterItems(rows, {}).map(x => x.id)).toEqual(["i1", "i5", "i3", "i2"]);
    expect(filterItems(rows, { q: "  GAUZE  " }).map(x => x.id)).toEqual(["i1"]);
    expect(filterItems(rows, { q: "i-0002" }).map(x => x.id)).toEqual(["i2"]);
    expect(filterItems(rows, { categoryId: "c2" }).map(x => x.id)).toEqual(["i2"]);
    expect(filterItems(rows, { archived: true })).toHaveLength(5);
  });
  it("the CSV holds exactly the rows given, formulas never run", () => {
    const csv = itemsCsv([r("i1"), { ...r("i2"), name: "=HYPERLINK(1)" }], (id) => id === "c1" ? "Dressings" : "Fluids");
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    const out = csv.slice(1).trimEnd().split("\r\n");
    expect(out).toHaveLength(3);
    expect(out[1]).toBe("I-0001,Gauze swabs,Dressings,pack,,46,3,2026-12-31,Short somewhere,");
    expect(out[2].split(",")[1]).toBe("'=HYPERLINK(1)");
  });
});

describe("B70 menu icons", () => {
  it("every menu entry has its own icon", () => {
    const all = [...MENU.flatMap(g => g.entries), MENU_BOTTOM];
    expect(new Set(all.map(e => e.icon)).size).toBe(all.length);
    expect(MENU_BOTTOM.icon).toBe("settings");
  });
});
