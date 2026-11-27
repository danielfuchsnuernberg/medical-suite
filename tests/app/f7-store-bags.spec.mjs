// F7 — Store and bags. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;

// The computer runs on UTC, as in the June bug B13: 27 Nov 2026, 20:00 UTC = 28 Nov, 06:00 in Port Moresby.
async function launch(who = "Cara Demo") {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "UTC", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 20, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="where"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const save = (p) => page.evaluate((p) => window.__mdTest.save(p), p);
const rows = () => page.getByTestId("lines").locator("tbody tr");
const names = () => rows().locator(".rowlink").allTextContents();
const places = () => rows().locator("td:nth-child(3)").allTextContents();

test("F7.1 filters: place, category, stock level (incl. no required amount), expiry; sort; show archived; clear filters", async () => {
  await launch();
  await expect(rows()).toHaveCount(10);
  expect(await names()).toEqual(["Bandage 8 cm", "Gauze 10×10 cm", "Gauze 10×10 cm", "Gloves, size M", "Glucose gel 15 g", "IV cannula 18G", "Morphine 10 mg/ml (demo)", "Saline 0.9% 500 ml", "Saline 0.9% 500 ml", "Tourniquet"]);
  await page.getByLabel("Place").selectOption({ label: "Bag 2 (child)" });
  expect(await names()).toEqual(["Glucose gel 15 g", "IV cannula 18G"]);
  await expect(page.getByTestId("verdict-line")).toContainText("Bag 2 (child)");
  await page.getByLabel("Place").selectOption("");
  await page.getByLabel("Category").selectOption({ label: "Fluids" });
  expect(await names()).toEqual(["Saline 0.9% 500 ml", "Saline 0.9% 500 ml"]);
  await page.getByLabel("Category").selectOption("");
  await page.getByLabel("Stock level").selectOption("none");
  expect(await names()).toEqual(["Bandage 8 cm", "Tourniquet"]);
  await expect(rows().first().locator("[data-stock]")).toHaveText("No required amount");
  await page.getByLabel("Stock level").selectOption("low");
  expect(await names()).toEqual(["Gloves, size M"]);
  await page.getByLabel("Stock level").selectOption("");
  await page.getByLabel("Expiry").selectOption("expired");
  expect(await names()).toEqual(["Saline 0.9% 500 ml"]);
  await page.getByLabel("Expiry").selectOption("soon");
  expect(await names()).toEqual(["Glucose gel 15 g"]);                      // expires 28 Nov = today at the base, though the computer still says 27 Nov
  // two filters at once, then Clear filters
  await page.getByLabel("Expiry").selectOption("inDate");
  await page.getByLabel("Stock level").selectOption("ok");
  await expect(page.getByTestId("count")).toHaveText("4 lines");                     // Gauze ×2, Saline in Bag 1, Morphine
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(rows()).toHaveCount(10);
  await expect(page.getByLabel("Expiry")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Clear filters" })).toHaveCount(0);
  // sort
  await page.getByLabel("Sort").selectOption("nameZ");
  expect((await names())[0]).toBe("Tourniquet");
  await page.getByLabel("Sort").selectOption("stock");
  expect((await names())[0]).toBe("IV cannula 18G");                        // out of stock first
  await page.getByLabel("Sort").selectOption("expiry");
  expect((await names()).slice(0, 2)).toEqual(["Saline 0.9% 500 ml", "Glucose gel 15 g"]);
  await page.getByLabel("Sort").selectOption("qtyLow");
  expect((await names())[0]).toBe("IV cannula 18G");
  // show archived: an archived line appears, marked, only when asked
  await save({ recordType: "line", recordId: "demo-s6", op: "archive", data: {} });
  await expect(rows()).toHaveCount(9);
  await page.getByLabel("Show archived").check();
  await expect(rows()).toHaveCount(10);
  await expect(page.locator('tr[data-line="demo-s6"]')).toHaveClass(/archived/);
  await expect(page.locator('tr[data-line="demo-s6"]')).toContainText("Archived");
});

test("F7.2 Export CSV holds exactly what the table shows, with local dates (B13)", async () => {
  await launch();
  await page.getByLabel("Place").selectOption({ label: "Bag 2 (child)" });
  await page.getByLabel("Sort").selectOption("expiry");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const file = path.join(dir, "downloads", "inventory-bag-2-child-2026-11-28.csv");    // today at the base, not the computer's 27 Nov
  await expect.poll(() => fs.existsSync(file)).toBe(true);
  const text = fs.readFileSync(file, "utf8");
  expect(text.charCodeAt(0)).toBe(0xFEFF);
  expect(text.slice(1).trimEnd().split("\r\n")).toEqual([
    "Item,Category,Place,On hand,Unit,Required / reorder at,Stock,Lot,Expiry,Archived",
    "Glucose gel 15 g,Medication,Bag 2 (child),2,tube,2,At or above required,GG-5,2026-11-28,",     // the stored date, never a day early
    "IV cannula 18G,Airway and IV,Bag 2 (child),0,,4,Out of stock,,2028-03-01,",
  ]);
  // the same rows, in the same order, as the table
  expect(await names()).toEqual(["Glucose gel 15 g", "IV cannula 18G"]);
  // a filter everywhere: the file follows it
  await page.getByLabel("Place").selectOption("");
  await page.getByLabel("Stock level").selectOption("low");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const all = path.join(dir, "downloads", "inventory-all-places-2026-11-28.csv");
  await expect.poll(() => fs.existsSync(all)).toBe(true);
  const lines = fs.readFileSync(all, "utf8").trimEnd().split("\r\n");
  expect(lines.length).toBe(2);
  expect(lines[1]).toBe("\"Gloves, size M\",PPE,Store (main),6,box,10,Below reorder level,,,");
});

test("F7.3 a row opens its item page", async () => {
  await launch();
  await page.getByLabel("Place").selectOption({ label: "Trauma kit" });
  await rows().filter({ hasText: "Tourniquet" }).locator("td").nth(3).click();      // anywhere on the row
  await expect(page.getByTestId("item-page")).toHaveAttribute("data-item", "demo-i8");
  await expect(page.locator(".topbar h1")).toHaveText("Tourniquet");
  await expect(page.locator('.side [data-view="where"]')).toHaveAttribute("aria-current", "page");
  // back keeps the filter
  await page.getByRole("button", { name: "Back to Store and bags" }).click();
  await expect(page.getByLabel("Place")).toHaveValue("demo-l3");
  // by keyboard: the name is a button
  await rows().filter({ hasText: "Bandage" }).locator(".rowlink").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("item-page")).toHaveAttribute("data-item", "demo-i7");
});
