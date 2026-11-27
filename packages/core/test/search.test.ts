import { describe, it, expect } from "vitest";
import { search, normalise } from "../src/search/search";
import { demoSearchSource } from "../src/demo/seed";
import { MENU, MENU_BOTTOM, findEntry } from "../src/shell/menu";

const src = demoSearchSource();

describe("search (F1.4)", () => {
  it("finds stock and staff", () => {
    expect(search(src, "gauze").stock.map(s => s.location)).toEqual(["Bag 1 (adult)", "Store (main)"]);
    expect(search(src, "anna").people.map(p => p.name)).toEqual(["Anna Example"]);
    expect(search(src, "nurse").people.length).toBe(2);
  });
  it("every word must match; extra spaces don't matter", () => {
    expect(search(src, "gauze   store").stock.length).toBe(1);
    expect(normalise("Asprin  100mg ")).toBe("asprin 100mg");
  });
  it("empty query finds nothing", () => expect(search(src, "   ")).toEqual({ people: [], stock: [], query: "" }));
  it("odd characters are just text: no match, no error (B4)", () => {
    const r = search(src, "<img src=x onerror=alert(1)>");
    expect(r.stock.length + r.people.length).toBe(0);
    expect(search(src, "\"").stock.length).toBe(0);
  });
});

describe("menu (F1.1)", () => {
  it("has the June groups in order, Settings at the bottom", () => {
    expect(MENU.map(g => g.label)).toEqual([null, "Inventory", "Team", "Later"]);
    expect(MENU[1].entries.map(e => e.label)).toEqual(["Overview", "Store and bags", "Item list", "Count a bag", "Stock takes", "Controlled drugs", "Activity"]);
    expect(MENU_BOTTOM.label).toBe("Settings");
  });
  it("every entry names its feature", () => {
    for (const g of MENU) for (const e of g.entries) expect(e.feature).toMatch(/^F\d+$/);
    expect(findEntry("cd")?.feature).toBe("F12");
  });
});
