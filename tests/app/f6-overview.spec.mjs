// F6 — Inventory overview. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;

// 28 Nov 2026, 10:00 in Port Moresby: Saline in the Store expired on 20 Nov, Glucose gel expires today.
async function launch(who = "Cara Demo") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 28, 0, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="overview"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const save = (p) => page.evaluate((p) => window.__mdTest.save(p), p);
const card = (name) => page.getByTestId("readiness").locator(".rcard", { hasText: name });
const rows = () => page.getByTestId("lines").locator("tbody tr");
const back = () => page.click('.side [data-view="overview"]');

test("F6.1 the June Overview: totals, attention strip, bag readiness, soonest to expire; every card and warning opens the matching list", async () => {
  await launch();
  await expect(page.locator('[data-ov="types"] .v')).toHaveText("8");
  await expect(page.locator('[data-ov="units"] .v')).toHaveText("89");
  await expect(page.locator('[data-ov="out"] .v')).toHaveText("1");
  await expect(page.locator('[data-ov="expired"] .v')).toHaveText("1 / 1 soon");
  expect(await page.getByTestId("readiness").locator(".rcard .appcard-name").allTextContents()).toEqual(["Store (main)", "Bag 1 (adult)", "Bag 2 (child)", "Trauma kit"]);
  expect(await page.getByTestId("soonest").locator(".t").allTextContents()).toEqual(["Saline 0.9% 500 ml", "Glucose gel 15 g"]);
  // each card and warning opens exactly the lines it counts
  const cases = [
    ['[data-ov="out"]', ["IV cannula 18G"], "Out of stock"],
    ['[data-ov="expired"]', ["Saline 0.9% 500 ml"], null],
    ['[data-att="out"]', ["IV cannula 18G"], null],
    ['[data-att="low"]', ["Gloves, size M"], "Below reorder level"],
    ['[data-att="expsoon"]', ["Glucose gel 15 g", "Saline 0.9% 500 ml"], null],
    ['[data-att="none"]', ["Bandage 8 cm", "Tourniquet"], "No required amount"],
  ];
  for (const [sel, names, badge] of cases) {
    await page.click(sel);
    await expect(page.locator('.side [data-view="where"]')).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("filter-bar")).toBeVisible();
    expect(await rows().locator(".rowlink").allTextContents()).toEqual(names);
    if (badge) await expect(rows().first().locator("[data-stock]")).toHaveText(badge);
    await back();
  }
  // a readiness card opens its place's list; "Show all places" clears it
  await card("Bag 2 (child)").click();
  await expect(page.locator(".panel-head h2")).toHaveText("Bag 2 (child)");
  await expect(rows()).toHaveCount(2);
  await page.getByLabel("Place").selectOption("");
  await expect(rows()).toHaveCount(10);
  // a soonest-to-expire row opens the list it is in
  await back();
  await page.getByTestId("soonest").locator(".srow").first().click();
  await expect(page.locator(".panel-head h2")).toHaveText("Store (main)");
  // the numbers follow a change at once
  await back();
  await save({ recordType: "line", recordId: "demo-s4", op: "delta", data: { field: "qty", by: 4 } });
  await expect(page.locator('[data-ov="out"] .v')).toHaveText("0");
  await expect(page.locator('[data-att="out"]')).toHaveCount(0);
});

test("F6.2 a line holding exactly its required amount is OK; a bag is Ready only when every line is at or above it and in date (B1)", async () => {
  await launch();
  // Bag 1: Gauze 12 of 10, Saline 4 of exactly 4
  await expect(card("Bag 1 (adult)").getByTestId("verdict")).toHaveText("Ready");
  await expect(card("Bag 1 (adult)")).toContainText("2 of 2 at or above required");
  await card("Bag 1 (adult)").click();
  await expect(page.getByTestId("verdict-line")).toContainText("grab-ready");
  await expect(rows().filter({ hasText: "Saline" }).locator("[data-stock]")).toHaveText("At or above required");
  // one below → Short; back to exactly → Ready again
  await save({ recordType: "line", recordId: "demo-s2", op: "delta", data: { field: "qty", by: -1 } });
  await back();
  await expect(card("Bag 1 (adult)").getByTestId("verdict")).toHaveText("Short");
  await save({ recordType: "line", recordId: "demo-s2", op: "delta", data: { field: "qty", by: 1 } });
  await expect(card("Bag 1 (adult)").getByTestId("verdict")).toHaveText("Ready");
  // out of date → Not ready, even with enough
  await save({ recordType: "line", recordId: "demo-s1", op: "set", data: { expiry: "2026-11-27" } });
  await expect(card("Bag 1 (adult)").getByTestId("verdict")).toHaveText("Not ready");
  await expect(card("Bag 1 (adult)")).toContainText("1 expired");
});

test("F6.3 a line with no required amount makes its bag 'Not set up', never Ready (B25)", async () => {
  await launch();
  await expect(card("Trauma kit").getByTestId("verdict")).toHaveText("Not set up");
  await expect(card("Trauma kit")).toContainText("0 of 2 at or above required · 2 with no required amount");
  await card("Trauma kit").click();
  await expect(page.getByTestId("verdict-line")).toContainText("It can't show “Ready” until every line has a required amount.");
  await expect(rows().first().getByTestId("required")).toHaveText("—");
  // give one line its amount: still Not set up; give the other: Ready
  await save({ recordType: "line", recordId: "demo-s8", op: "set", data: { required: 2 } });
  await back();
  await expect(card("Trauma kit").getByTestId("verdict")).toHaveText("Not set up");
  await save({ recordType: "line", recordId: "demo-s9", op: "set", data: { required: 4 } });
  await expect(card("Trauma kit").getByTestId("verdict")).toHaveText("Ready");
});

test("F6.4 Store lines have reorder levels; below it shows 'Below reorder level', and the Store card warns (B10)", async () => {
  await launch();
  await expect(card("Store (main)")).toContainText("1 below reorder level");
  await card("Store (main)").click();
  await expect(page.locator("thead th").nth(3)).toHaveText("Reorder at");
  const gloves = rows().filter({ hasText: "Gloves" });
  await expect(gloves.getByTestId("required")).toHaveText("10");
  await expect(gloves.locator("[data-stock]")).toHaveText("Below reorder level");
  await expect(page.getByTestId("verdict-line")).toContainText("1 below reorder level");
  // take out the expired Saline: the Store card now says Reorder; refill the gloves: Stocked
  await save({ recordType: "line", recordId: "demo-s5", op: "archive", data: {} });
  await back();
  await expect(card("Store (main)").getByTestId("verdict")).toHaveText("Reorder");
  await save({ recordType: "line", recordId: "demo-s10", op: "delta", data: { field: "qty", by: 4 } });
  await expect(card("Store (main)").getByTestId("verdict")).toHaveText("Stocked");
});
