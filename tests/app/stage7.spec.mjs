// Stage 7 (28 Nov 2026): the bugs that only show in the real program. Each test failed before its fix.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;
async function launch(who) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "UTC", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 20, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
}
test.afterEach(async () => { if (app) await app.close(); app = null; });
const messages = () => page.evaluate(() => window.__mdTest.door.messages().length);

test("B37 a double click on Restock, Freeze it or Save saves once", async () => {
  await launch("Cara Demo");
  await page.click('.side [data-view="where"]');
  await page.locator("button[aria-label='Restock Bandage 8 cm in Trauma kit']").click();
  const qty = () => page.evaluate(() => { const d = window.__mdTest.door; return d.records("line").find(l => d.get("item", l.itemId)?.name === "Bandage 8 cm" && d.get("location", l.locationId)?.name === "Trauma kit")?.qty; });
  const q0 = await qty();
  await page.getByTestId("adjust").getByLabel("How many to add").fill("2");
  await page.getByTestId("adjust").getByRole("button", { name: "Restock" }).dblclick();
  await expect(page.getByTestId("adjust")).toHaveCount(0);
  await page.waitForTimeout(700);
  expect(await qty()).toBe(q0 + 2);
  // stock take
  await page.click('.side [data-view="takes"]');
  await page.getByRole("button", { name: "Freeze stock take now" }).click();
  await page.getByTestId("freeze").getByRole("button", { name: "Freeze it" }).dblclick();
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__mdTest.door.records("stocktake").length)).toBe(1);
  // completing a course
  await page.click('.side [data-view="staff"]');
  await page.locator('.staff-table tr[data-person="demo-p1"]').click();
  await page.locator('[data-testid="prof-training"] li[data-training="demo-t3"]').getByRole("button", { name: "Mark complete" }).click();
  const m0 = await messages();
  await page.getByTestId("complete-course").getByRole("button", { name: "Save" }).dblclick();
  await page.waitForTimeout(700);
  expect(await messages() - m0).toBe(1);
});

test("B37 after a refusal the button works again at once; Q28 commas are refused", async () => {
  await launch("Anna Example");
  await page.click('.side [data-view="where"]');
  await page.locator("button[aria-label='Restock Bandage 8 cm in Trauma kit']").click();
  const d = page.getByTestId("adjust");
  await d.getByLabel("How many to add").fill("1,000");
  await d.getByRole("button", { name: "Restock" }).click();
  await expect(d.getByTestId("refusal")).toHaveText("Whole numbers only. 1,000 isn't allowed: type it without commas or points, for example 1000. Nothing was changed.");
  await d.getByLabel("How many to add").fill("1000");
  await d.getByRole("button", { name: "Restock" }).click();
  await expect(d).toHaveCount(0);
});

test("B51 on a phone every part of a register line is visible, with its label", async () => {
  await launch("Cara Demo");
  await page.setViewportSize({ width: 375, height: 760 });
  await page.getByRole("button", { name: "Open the menu" }).click();
  await page.click('.side [data-view="cd"]');
  const cells = await page.evaluate(() => [...document.querySelectorAll('table.ledger tr[data-cd="demo-cd1"] td[data-label]')].map(td => { const b = td.getBoundingClientRect(); return { label: td.dataset.label, inside: b.left >= 0 && b.right <= innerWidth + 1 && b.width > 0 }; }));
  expect(cells.length).toBe(8);
  expect(cells.filter(c => !c.inside).map(c => c.label)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  await expect(page.locator(".shell.drawer")).toHaveCount(0); await page.waitForTimeout(400);   // the menu has slid away
  await page.screenshot({ path: path.join(ROOT, "docs/stage7/b51-register-phone.png") });
});

test("B31 (Q27 = A) stock below zero is shown in red on Overview, Home and the line until it is counted", async () => {
  await launch("Anna Example");
  // what two offline computers leave behind: both dispensed the 12 Gauze in Bag 1
  await page.evaluate(async () => { const t = window.__mdTest; await t.door.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -24 }, by: "demo-p4" }); });
  await expect(page.getByTestId("home-below")).toContainText("1 stock line is below zero.");
  await page.click('.side [data-view="overview"]');
  await expect(page.locator('[data-att="below"]')).toContainText("1 below zero: two computers took the same stock. Count it.");
  await page.click('.side [data-view="where"]');
  await expect(page.locator('[data-line="demo-s1"] [data-stock="below"]')).toHaveText("Below zero: count it");
  await page.click('.side [data-view="count"]');
  await page.getByLabel("Place to count").selectOption(await page.evaluate(() => window.__mdTest.door.get("line", "demo-s1").locationId));
  await page.locator('tr[data-line="demo-s1"] input').fill("10");
  await page.getByRole("button", { name: "Save counts" }).click();
  await page.click('.side [data-view="home"]');
  await expect(page.getByTestId("home-below")).toHaveCount(0);
});
