// Stage 8 (28 Nov 2026): the audit gaps that show on screen. Each test failed before its fix.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;
async function launch(who, { empty = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  const env = { ...process.env, TZ: "UTC", MD_TEST: "1", MD_USER_DATA: dir };
  if (empty) env.MD_TEST_EMPTY = "1"; else delete env.MD_TEST_EMPTY;
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 20, 0)) });
  await page.reload();
  if (who) { await signIn(page, who); await page.waitForSelector(".shell"); }
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

test("B67 a stock result in the search opens its item page", async () => {
  await launch("Anna Example");
  await page.getByLabel("Search staff and inventory").fill("Gauze");
  await page.locator(".results .r", { hasText: "Gauze" }).first().click();
  await expect(page.getByTestId("item-page")).toHaveAttribute("data-item", "demo-i1");
});

test("B68 every Overview card opens a list; below zero lists only the lines below zero", async () => {
  await launch("Anna Example");
  await page.evaluate(async () => { const t = window.__mdTest; await t.door.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -20 }, by: "demo-p4" }); });
  await page.click('.side [data-view="overview"]');
  await page.locator('[data-ov="types"]').click();
  await expect(page.locator('.side [data-view="where"]')).toHaveAttribute("aria-current", "page");
  await page.click('.side [data-view="overview"]');
  await page.locator('[data-ov="units"]').click();
  await expect(page.locator('.side [data-view="where"]')).toHaveAttribute("aria-current", "page");
  await page.click('.side [data-view="overview"]');
  await page.locator('[data-att="below"]').click();
  await expect(page.locator("table.stock tbody tr[data-line]")).toHaveCount(1);
  await expect(page.locator('tr[data-line="demo-s1"]')).toBeVisible();
});

test("B69 Clear filters clears the place too", async () => {
  await launch("Anna Example");
  await page.click('.side [data-view="where"]');
  const all = await page.locator("table.stock tbody tr[data-line]").count();
  await page.getByLabel("Place").selectOption({ index: 1 });
  await expect.poll(() => page.locator("table.stock tbody tr[data-line]").count()).toBeLessThan(all);
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("table.stock tbody tr[data-line]")).toHaveCount(all);
});

test("B61 + B59 the program's name and a new country are set in Settings", async () => {
  await launch("Cara Demo");
  await page.click('.side [data-view="settings"]');
  await page.getByLabel("Program name").fill("Bush Clinic Stores");
  await page.getByTestId("base-settings").getByRole("button", { name: "Save" }).click();
  await expect(page.locator(".side .name")).toHaveText(/^Bush Clinic Stores/);
  await expect(page).toHaveTitle("Bush Clinic Stores");
  await page.getByRole("button", { name: "Country not in the list? Add it" }).click();
  const f = page.getByTestId("add-country");
  await f.getByLabel("Country code").fill("CL");
  await f.getByLabel("Country name").fill("Chile");
  await f.getByLabel("Country time zone").selectOption("America/Santiago");
  await f.getByRole("button", { name: "Add country" }).click();
  await expect(page.getByLabel("Country", { exact: true }).locator("option", { hasText: "Chile" })).toHaveCount(1);
});

test("B63 (Q31 = A) Management can't change a listed doctor's profession", async () => {
  await launch("Cara Demo");
  await page.click('.side [data-view="settings"]');
  await page.getByLabel("Profession of Dr Ben Sample").selectOption("Nurse");
  await expect(page.getByTestId("people-access").getByTestId("refusal")).toContainText("Dr Ben Sample is on the doctors' list. A doctor removes them first");
  await expect(page.getByLabel("Profession of Dr Ben Sample")).toHaveValue("Doctor");
});

test("B65 set-up asks for the REACH office", async () => {
  await launch(null, { empty: true });
  await page.getByLabel("Your name").fill("Cara Real");
  await expect(page.getByLabel("Your REACH office")).toHaveValue("Management");
  await page.getByLabel("New password", { exact: true }).fill("cara-secret-1");
  await page.getByLabel("New password again").fill("cara-secret-1");
  await page.getByRole("button", { name: "Set up and sign in" }).click();
  await page.waitForSelector(".shell");
  expect(await page.evaluate(() => window.__mdTest.door.records("person")[0].office)).toBe("Management");
});
