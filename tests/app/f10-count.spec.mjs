// F10 — Count stock. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;

async function launch(who = "Anna Example") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="count"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const qty = (id) => page.evaluate((id) => window.__mdTest.door.get("line", id).qty, id);
const box = (name) => page.getByLabel(`Counted ${name}`, { exact: false });
const place = (label) => page.getByLabel("Place to count").selectOption({ label });

test("F10.1 pick a bag or the Store and type what you find; an empty box means 'not counted' and leaves the line as it was (B16)", async () => {
  await launch();
  await expect(page.getByLabel("Place to count")).toHaveValue("demo-l1");                    // a bag first
  await expect(page.locator(".panel-head h2")).toHaveText("Count Bag 1 (adult)");
  await box("Saline 0.9% 500 ml").fill("7");                                                 // typed, then emptied again (the June B16 case)
  await box("Saline 0.9% 500 ml").fill("");
  await box("Gauze 10×10 cm").fill("11");                                                    // Saline left empty
  await expect(page.locator('tr[data-line="demo-s1"] [data-testid="diff"]')).toHaveText("-1");
  await expect(page.locator('tr[data-line="demo-s2"] [data-testid="diff"]')).toHaveText("not counted");
  await page.getByRole("button", { name: "Save counts" }).click();
  await expect(page.getByTestId("count-result")).toHaveText("Saved: 1 changed, 0 the same, 1 not counted (left as they were, not set to 0).");
  expect(await qty("demo-s1")).toBe(11);
  expect(await qty("demo-s2")).toBe(4);                                                     // not 0
  // the Store too; a count of 0 is a real count
  await place("Store (main)");
  await box("Gloves, size M").fill("0");
  await page.getByRole("button", { name: "Save counts" }).click();
  await expect.poll(() => qty("demo-s10")).toBe(0);
  // a controlled drug is shown but counted in the register
  await expect(page.locator('tr[data-line="demo-s7"] [data-testid="cd-count"]')).toHaveText("Counted in the controlled-drug register");
  await expect(page.locator('tr[data-line="demo-s7"] input')).toHaveCount(0);
});

test("F10.2 typed counts survive searching and switching place; leaving with unsaved counts asks Save / Throw away / Keep counting (B16)", async () => {
  await launch();
  await box("Gauze 10×10 cm").fill("10");
  await box("Saline 0.9% 500 ml").fill("3");
  // searching hides rows but keeps the numbers
  await page.getByLabel("Find in this list").fill("saline");
  await expect(page.getByTestId("count-lines").locator("tbody tr")).toHaveCount(1);
  await page.getByLabel("Find in this list").fill("zzz");
  await expect(page.locator(".count .empty")).toContainText("Your typed counts are still kept.");
  await page.getByLabel("Find in this list").fill("");
  await expect(box("Gauze 10×10 cm")).toHaveValue("10");
  // switching place and back
  await place("Bag 2 (child)");
  await box("Glucose gel 15 g").fill("2");
  await place("Bag 1 (adult)");
  await expect(box("Saline 0.9% 500 ml")).toHaveValue("3");
  await expect(page.getByTestId("savebar")).toContainText("3 counts typed, not saved yet");
  // leaving asks; Keep counting stays
  await page.click('.side [data-view="overview"]');
  await expect(page.getByTestId("leave-count")).toContainText("You typed 3 counts that aren't saved yet.");
  await page.getByTestId("leave-count").getByRole("button", { name: "Keep counting" }).click();
  await expect(page.locator('.side [data-view="count"]')).toHaveAttribute("aria-current", "page");
  await expect(box("Gauze 10×10 cm")).toHaveValue("10");
  // Save counts: saved, then it goes where you clicked
  await page.click('.side [data-view="overview"]');
  await page.getByTestId("leave-count").getByRole("button", { name: "Save counts" }).click();
  await expect(page.locator('.side [data-view="overview"]')).toHaveAttribute("aria-current", "page");
  expect([await qty("demo-s1"), await qty("demo-s2"), await qty("demo-s3")]).toEqual([10, 3, 2]);
  // Throw away: nothing saved
  await page.click('.side [data-view="count"]');
  await box("Gauze 10×10 cm").fill("1");
  await page.click(".logo");
  await page.getByTestId("leave-count").getByRole("button", { name: "Throw away" }).click();
  await expect(page.getByTestId("today")).toBeVisible();
  expect(await qty("demo-s1")).toBe(10);
  // signing out with typed counts asks too, and the next person never sees them
  await page.click('.side [data-view="count"]');
  await expect(box("Gauze 10×10 cm")).toHaveValue("");
  await box("Gauze 10×10 cm").fill("2");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByTestId("leave-count").getByRole("button", { name: "Throw away" }).click();
  await signIn(page, "Dina Test");
  await page.click('.side [data-view="count"]');
  await expect(box("Gauze 10×10 cm")).toHaveValue("");
  expect(await qty("demo-s1")).toBe(10);
  // Dina is archived while she has counts typed: the program goes to sign-in without asking; Cara, next, sees none of them
  await box("Saline 0.9% 500 ml").fill("1");
  await page.evaluate(() => window.__mdTest.door.apply({ recordType: "person", recordId: "demo-p4", op: "archive", data: {}, by: "demo-p3" }));
  await signIn(page, "Cara Demo");
  await page.click('.side [data-view="count"]');
  await expect(box("Saline 0.9% 500 ml")).toHaveValue("");
  await expect(page.getByTestId("savebar")).toHaveCount(0);
});

test("F10.3 a count that isn't a whole number of 0 or more shows red and blocks saving", async () => {
  await launch();
  await box("Gauze 10×10 cm").fill("11");
  for (const [bad, why] of [["-1", "It can't be below 0."], ["2.5", "Whole numbers only. 2.5 isn't allowed: type it without commas or points, for example 1000."], ["four", "“four” isn't a number."]]) {
    await box("Saline 0.9% 500 ml").fill(bad);
    await expect(box("Saline 0.9% 500 ml")).toHaveClass(/bad/);
    await expect(page.locator('tr[data-line="demo-s2"] [data-testid="count-error"]')).toHaveText(why);
    await page.getByRole("button", { name: "Save counts" }).click();
    await expect(page.getByTestId("toast").last()).toHaveText("1 count isn't a whole number of 0 or more. Fix the red box first. Nothing was saved.");
  }
  expect(await qty("demo-s1")).toBe(12);                                                    // the good one wasn't saved either
  await box("Saline 0.9% 500 ml").fill("4");
  await expect(box("Saline 0.9% 500 ml")).not.toHaveClass(/bad/);
  await page.getByRole("button", { name: "Save counts" }).click();
  await expect.poll(() => qty("demo-s1")).toBe(11);
});

test("F10.4 after saving: how many changed, the same, not counted; each change logged old → new", async () => {
  await launch();
  await place("Store (main)");
  await box("Gauze 10×10 cm").fill("28");
  await box("Saline 0.9% 500 ml").fill("24");                                                // the same
  await box("Gloves, size M").fill("9");
  await page.getByRole("button", { name: "Save counts" }).click();
  await expect(page.getByTestId("count-result")).toHaveText("Saved: 2 changed, 1 the same.");   // Morphine is counted in the register, not here
  await page.click('.side [data-view="log"]');
  const log = page.getByTestId("log");
  await expect(log.locator("li.entry", { hasText: "counted Gauze 10×10 cm in Store (main)" }).locator(".oldnew")).toHaveText("quantity: 30 → 28");
  await expect(log.locator("li.entry", { hasText: "counted Gloves, size M in Store (main)" }).locator(".oldnew")).toHaveText("quantity: 6 → 9");
  await expect(log.locator("li.entry", { hasText: "counted Saline 0.9% 500 ml in Store (main): the same as before" })).toHaveCount(1);
  await expect(log.locator("li.entry").first().locator(".src")).toContainText("Anna Example · ");
});

test("F10.2 closing the program with nothing typed closes at once, without a question", async () => {
  await launch();
  // the computer's own question box is answered by the test: first "Keep counting", then "Close and throw them away"
  await app.evaluate(({ dialog }) => { globalThis.__asked = []; dialog.showMessageBoxSync = (w, o) => { globalThis.__asked.push(o.message); return globalThis.__answer ?? 0; }; });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());           // nothing typed: no question
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(0);
  expect(await app.evaluate(() => globalThis.__asked)).toEqual([]);
});

test("F10.2 closing the program with typed counts: Keep counting stays, Close throws them away", async () => {
  await launch();
  await app.evaluate(({ dialog }) => { globalThis.__asked = []; dialog.showMessageBoxSync = (w, o) => { globalThis.__asked.push(o.message); return globalThis.__answer ?? 0; }; });
  await box("Gauze 10×10 cm").fill("3");
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  await expect.poll(() => app.evaluate(() => globalThis.__asked.length)).toBe(1);
  expect(await app.evaluate(() => globalThis.__asked[0])).toBe("Counts not saved yet");
  expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(1);
  await expect(box("Gauze 10×10 cm")).toHaveValue("3");
  await app.evaluate(() => { globalThis.__answer = 1; });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
  await expect.poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)).toBe(0);
});
