import { describe, it, expect } from "vitest";
import { readXlsx, unzip, excelDate, colIndex, checkStockList, readExpiry, problemsText, findColumns } from "../src";

// A tiny .xlsx built here (made-up DEMO rows), the way Excel writes it: a zip of XML, some files compressed, some stored.
async function deflate(b: Uint8Array) { return new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer()); }
async function zip(files: Record<string, string>, compress = true): Promise<Uint8Array> {
  const enc = new TextEncoder(); const parts: number[] = []; const central: number[] = []; let offset = 0;
  const w16 = (a: number[], v: number) => a.push(v & 255, (v >> 8) & 255);
  const w32 = (a: number[], v: number) => a.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255);
  let count = 0;
  for (const [name, content] of Object.entries(files)) {
    const raw = enc.encode(content); const data = compress ? await deflate(raw) : raw; const nm = enc.encode(name);
    const local: number[] = []; w32(local, 0x04034b50); w16(local, 20); w16(local, 0); w16(local, compress ? 8 : 0); w16(local, 0); w16(local, 0); w32(local, 0); w32(local, data.length); w32(local, raw.length); w16(local, nm.length); w16(local, 0);
    const c: number[] = []; w32(c, 0x02014b50); w16(c, 20); w16(c, 20); w16(c, 0); w16(c, compress ? 8 : 0); w16(c, 0); w16(c, 0); w32(c, 0); w32(c, data.length); w32(c, raw.length); w16(c, nm.length); w16(c, 0); w16(c, 0); w16(c, 0); w16(c, 0); w32(c, 0); w32(c, offset);
    c.push(...nm); central.push(...c);
    parts.push(...local, ...nm, ...data); offset += local.length + nm.length + data.length; count++;
  }
  const end: number[] = []; w32(end, 0x06054b50); w16(end, 0); w16(end, 0); w16(end, count); w16(end, count); w32(end, central.length); w32(end, offset); w16(end, 0);
  return new Uint8Array([...parts, ...central, ...end]);
}
const cell = (ref: string, v: unknown) => typeof v === "number" ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</t></is></c>`;
function sheetXml(rows: unknown[][]) {
  return `<worksheet><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v, j) => v === null ? "" : cell(String.fromCharCode(65 + j) + (i + 1), v)).join("")}</row>`).join("")}</sheetData></worksheet>`;
}
async function xlsx(sheets: Record<string, unknown[][]>, compress = true) {
  const names = Object.keys(sheets);
  return zip({
    "xl/workbook.xml": `<workbook><sheets>${names.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships>${names.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
    "xl/sharedStrings.xml": `<sst><si><t>Shared &amp; text</t></si><si><r><t>Rich </t></r><r><t>text</t></r></si></sst>`,
    ...Object.fromEntries(names.map((n, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheets[n])])),
  }, compress);
}

describe("reading .xlsx without a library (F13.6)", () => {
  it("reads sheets, text, numbers, shared and rich text; compressed or stored", async () => {
    for (const compress of [true, false]) {
      const b = await xlsx({ "Store (DEMO)": [["Item", "Qty"], ["Gauze <10×10>", 12]] }, compress);
      const [s] = await readXlsx(b);
      expect(s.name).toBe("Store (DEMO)");
      expect(s.rows).toEqual([["Item", "Qty"], ["Gauze <10×10>", 12]]);
    }
    const files = await unzip(await xlsx({ A: [[1]] }));
    expect(files.has("xl/workbook.xml")).toBe(true);
    await expect(readXlsx(new Uint8Array([1, 2, 3]))).rejects.toThrow("This isn't an Excel file (.xlsx)");
  });
  it("Excel dates become plain calendar dates; column letters become numbers", () => {
    expect(excelDate(46357)).toBe("2026-12-01");
    expect(excelDate(1)).toBe("1899-12-31");
    expect([colIndex("A1"), colIndex("Z9"), colIndex("AA10")]).toEqual([0, 25, 26]);
  });
});

describe("checking a stock list before loading (F13.6, B6)", () => {
  const demo = {
    "Store (DEMO)": [
      [null, "Medication /Consumables", "Unites", "Batch", "Expiry", "SOH Jan", "SOH FEB"],
      [null, "Gauze 10×10 cm", "pack", "G-1", 46357, 30, 28],
      [null, "Needle  20G", "", "N-1", 2, 50, 50],                         // 1900, double space, no unit
      [null, "Betadine 10%", "bottle", 46539, null, 3, 3],                    // lot looks like a date
      [null, "Saline 0.9% 500 ml", "bag", "S-1", "NA", 24, 24],               // NA: no expiry, fine
      [null, "Saline 0.9%  500 ml", "bag", "S-2", "3/12/2027 & 05/2028", 2, 2], // the same item twice; two dates in a cell
      [null, "Oxygen mask", "", "O-1", "31/13/2027", 1, 1],                   // not a date
    ],
    "Bag 1 (DEMO)": [["Section", "List Items", "Required Qty", "Batch", "Exp Date", "Jan", "Feb"], ["Airway", "Oxygen mask", 2, "O-1", "05/2028", 2, 2]],
    Empty: [],
  };
  it("finds the columns by their names, whatever each sheet calls them", () => {
    expect(findColumns(demo["Store (DEMO)"] as any)!.columns).toMatchObject({ item: 1, unit: 2, lot: 3, expiry: 4, counts: [{ index: 5, label: "SOH Jan" }, { index: 6, label: "SOH FEB" }] });
    expect(findColumns(demo["Bag 1 (DEMO)"] as any)!.columns).toMatchObject({ section: 0, item: 1, required: 2, lot: 3, expiry: 4 });
  });
  it("lists every problem; the blocking ones must be fixed in the spreadsheet", async () => {
    const c = checkStockList(await readXlsx(await xlsx(demo)));
    const by = (sheet: string, item: string) => c.sheets.find(s => s.name === sheet)!.rows.find(r => r.tidied === item)!;
    expect(by("Store (DEMO)", "Gauze 10×10 cm").flags).toEqual([]);
    expect(by("Store (DEMO)", "Gauze 10×10 cm").expiry).toBe("2026-12-01");
    expect(by("Store (DEMO)", "Needle 20G").flags).toEqual([
      { text: "double spaces in the name, tidied to “Needle 20G”", blocking: false },
      { text: "no unit", blocking: false },
      { text: "the date looks wrong (1900)", blocking: true }]);
    expect(by("Store (DEMO)", "Betadine 10%").flags).toEqual([{ text: "the lot number looks like a date: is it the expiry?", blocking: true }]);
    expect(by("Store (DEMO)", "Saline 0.9% 500 ml").flags).toEqual([]);
    const second = c.sheets[0].rows.filter(r => r.tidied === "Saline 0.9% 500 ml")[1];
    expect(second.flags.map(f => f.text)).toEqual(["double spaces in the name, tidied to “Saline 0.9% 500 ml”", "two expiry dates in one cell (“3/12/2027 & 05/2028”): split it into two rows, one per lot"]);   // B40: another lot (S-2) is not the same line
    expect(by("Store (DEMO)", "Oxygen mask").flags.map(f => f.text)).toContain("“31/13/2027” isn't a date");
    expect(by("Bag 1 (DEMO)", "Oxygen mask").flags).toEqual([]);                 // the same item in another place is fine
    expect(by("Bag 1 (DEMO)", "Oxygen mask").expiry).toBe("2028-05-01");
    expect(c.sheets.find(s => s.name === "Empty")!.note).toBe("Empty sheet.");
    expect([c.rows, c.blocking]).toEqual([7, 4]);
    const text = problemsText(c, "Stock list (DEMO).xlsx");
    expect(text).toContain("row 3, Needle 20G: double spaces in the name, tidied to “Needle 20G”; no unit; MUST FIX: the date looks wrong (1900)");
    expect(text).not.toContain("Gauze");
  });
  it("expiry cells: dates in any written form, day first; NA is no expiry", () => {
    expect(readExpiry("2027-06-30")).toEqual({ date: "2027-06-30" });
    expect(readExpiry("30/06/2027")).toEqual({ date: "2027-06-30" });
    expect(readExpiry("06/2027")).toEqual({ date: "2027-06-01" });
    expect(readExpiry("n/a")).toBeNull();
    expect(readExpiry("")).toBeNull();
    expect(readExpiry(36526)).toEqual({ date: "2000-01-01" });
    expect(readExpiry(80000)).toEqual({ bad: "the date looks wrong (2119)" });
  });
});

import { demoSeedChanges } from "../src";
describe("nothing real is built in (F13.7, B9)", () => {
  it("every record the program brings with it is marked DEMO", () => {
    const made = demoSeedChanges().filter(c => c.op === "create");
    expect(made.length).toBeGreaterThan(30);
    expect(made.filter(c => c.data.demo !== true).map(c => c.recordType + ":" + c.recordId)).toEqual([]);
    expect(demoSeedChanges().every(c => c.messageId.startsWith("seed-"))).toBe(true);
  });
});

describe("Stage 7 group 5: the Excel check (B38–B42)", () => {
  const check = async (rows: unknown[][]) => checkStockList(await readXlsx(await xlsx({ "Store (DEMO)": rows })));
  it("B38 a count typed as text counts; text that isn't a whole number must be fixed", async () => {
    const c = await check([["Item", "Unit", "SOH JAN", "SOH FEB"], ["Gauze", "pack", 30, "5"], ["Tape", "roll", 3, "2 pkt"], ["Swab", "box", 4, "NA"]]);
    expect(c.sheets[0].rows[0].counts).toEqual([30, 5]);
    expect(c.sheets[0].rows[0].flags).toEqual([]);
    expect(c.sheets[0].rows[1].flags).toEqual([{ text: "the count “2 pkt” in SOH FEB isn't a whole number", blocking: true }]);
    expect(c.sheets[0].rows[2].flags).toEqual([]);                                  // NA is an empty cell
  });
  it("B39 month columns written in full, month-year or numbered are found; no count column at all must be fixed", async () => {
    for (const head of ["March 2026", "Mar-26", "MARCH SOH", "2026-03", "03/2026", "Quantity", "Sep-26"]) {
      const c = await check([["Item", head], ["Gauze", 30]]);
      expect([head, c.sheets[0].rows[0].counts]).toEqual([head, [30]]);
    }
    const none = await check([["Item", "Unit", "Notes"], ["Gauze", "pack", "x"]]);
    expect(none.blocking).toBe(1);
    expect(none.sheets[0].rows[0].flags[0].text).toMatch(/no month or SOH column found/);
    expect(problemsText(none, "x.xlsx")).not.toContain("No problems found");
  });
  it("B40 two lots of one item are fine; the same item, lot and expiry twice is flagged", async () => {
    const c = await check([["Item", "Batch", "Exp", "SOH FEB"], ["Gauze", "A1", "01/03/2027", 2], ["Gauze", "A2", "01/05/2027", 3], ["Gauze", "A2", "01/05/2027", 1]]);
    expect(c.sheets[0].rows.map(r => r.flags.length)).toEqual([0, 0, 1]);
    expect(c.sheets[0].rows[2].flags[0].text).toBe("the same item twice in this place, same lot and expiry (also row 3)");
  });
  it("B41 names written slightly differently are compared the way loading compares them", async () => {
    const c = await check([["Item", "SOH FEB"], ["Paracetamol 500mg", 100], ["Paracetamol (500mg)", 40]]);
    expect(c.blocking).toBe(1);
    expect(c.sheets[0].rows[1].flags[0].text).toBe("the same item twice in this place, same lot and expiry (also row 2, written “Paracetamol 500mg”)");
  });
  it("B42 a short empty row (<row r=\"2\"/>) doesn't shift the next row's number", async () => {
    const b = await zip({
      "xl/workbook.xml": `<workbook><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      "xl/_rels/workbook.xml.rels": `<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>`,
      "xl/worksheets/sheet1.xml": `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Item</t></is></c><c r="B1" t="inlineStr"><is><t>SOH FEB</t></is></c></row><row r="2" spans="1:2"/><row r="3"><c r="A3" t="inlineStr"><is><t>Gauze</t></is></c><c r="B3"><v>30</v></c></row></sheetData></worksheet>`,
    });
    const c = checkStockList(await readXlsx(b));
    expect(c.sheets[0].rows.map(r => [r.tidied, r.row])).toEqual([["Gauze", 3]]);
  });
});
