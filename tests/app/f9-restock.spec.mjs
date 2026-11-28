// F9 — Restock and dispense. One test per Master Checklist line, in the real program.
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
  await page.click('.side [data-view="where"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const dlg = () => page.getByTestId("adjust");
const qtyOf = (id) => page.evaluate((id) => window.__mdTest.door.get("line", id).qty, id);
const row = (id) => page.locator(`tr[data-line="${id}"]`);
const changes = () => page.evaluate(() => window.__mdTest.door.messages().length);

test("F9.1 + and − ask for a whole number, 1 or more; 0, negatives, decimals and an empty box are refused with a message, and nothing changes (B17)", async () => {
  await launch();
  const before = await changes();
  for (const kind of ["Restock", "Dispense"]) {
    await page.getByRole("button", { name: `${kind} Gauze 10×10 cm in Bag 1 (adult)` }).click();
    await expect(dlg()).toContainText("Bag 1 (adult) · currently 12 pack");
    const box = dlg().getByRole("textbox");
    for (const [bad, msg] of [["0", "It has to be at least 1. 0 isn't allowed."], ["-5", "It has to be at least 1. -5 isn't allowed."], ["2.7", "Whole numbers only. 2.7 isn't allowed: type it without commas or points, for example 1000."], ["", "Type the amount."]]) {
      await box.fill(bad);
      await dlg().getByRole("button", { name: kind }).click();
      await expect(dlg().getByTestId("refusal")).toHaveText(`${msg} Nothing was changed.`);
    }
    await dlg().getByRole("button", { name: "Cancel" }).click();
  }
  expect(await qtyOf("demo-s1")).toBe(12);
  expect(await changes()).toBe(before);                                                  // nothing was saved
  // a good amount works, by button and by Enter
  await page.getByRole("button", { name: "Restock Gauze 10×10 cm in Bag 1 (adult)" }).click();
  await dlg().getByRole("textbox").fill("3");
  await dlg().getByRole("button", { name: "Restock" }).click();
  await expect(page.getByTestId("toast").last()).toHaveText("Restocked 3 · Gauze 10×10 cm now 15");
  await expect(row("demo-s1").locator("td").nth(3)).toContainText("15");            // On hand (Item, Category, Place, On hand)
  await page.getByRole("button", { name: "Dispense Gauze 10×10 cm in Bag 1 (adult)" }).click();
  await dlg().getByRole("textbox").fill("2");
  await dlg().getByRole("textbox").press("Enter");
  await expect(dlg()).toHaveCount(0);
  expect(await qtyOf("demo-s1")).toBe(13);
});

test("F9.2 taking out more than is there is refused", async () => {
  await launch();
  await page.getByRole("button", { name: "Dispense Saline 0.9% 500 ml in Bag 1 (adult)" }).click();
  await dlg().getByRole("textbox").fill("5");
  await dlg().getByRole("button", { name: "Dispense" }).click();
  await expect(dlg().getByTestId("refusal")).toHaveText("Only 4 on hand, so 5 can't be taken. Nothing was changed.");
  expect(await qtyOf("demo-s2")).toBe(4);
  await dlg().getByRole("textbox").fill("4");                                            // all of it is fine
  await dlg().getByRole("button", { name: "Dispense" }).click();
  await expect(row("demo-s2").locator("[data-stock]")).toHaveText("Out of stock");
});

test("F9.3 every booked movement is logged old → new (B19)", async () => {
  await launch();
  await page.getByRole("button", { name: "Dispense Gauze 10×10 cm in Bag 1 (adult)" }).click();
  await dlg().getByRole("textbox").fill("2");
  await dlg().getByRole("button", { name: "Dispense" }).click();
  await page.getByRole("button", { name: "Restock Gauze 10×10 cm in Store (main)" }).click();
  await dlg().getByRole("textbox").fill("6");
  await dlg().getByRole("button", { name: "Restock" }).click();
  await page.click('.side [data-view="log"]');
  const e = page.getByTestId("log").locator("li.entry");
  await expect(e.nth(0)).toContainText("restocked 6 to Gauze 10×10 cm in Store (main)");
  await expect(e.nth(0).locator(".oldnew")).toHaveText("quantity: 30 → 36");
  await expect(e.nth(0).locator(".src")).toContainText("Anna Example · ");
  await expect(e.nth(1)).toContainText("dispensed 2 from Gauze 10×10 cm in Bag 1 (adult)");
  await expect(e.nth(1).locator(".oldnew")).toHaveText("quantity: 12 → 10");
  // and on the item page
  await page.click('.side [data-view="where"]');
  await page.getByTestId("lines").locator(".rowlink", { hasText: "Gauze" }).first().click();
  await expect(page.getByTestId("moves").locator("li.entry").first()).toContainText("restocked 6");
  // the item page has the same + and −
  await page.getByRole("button", { name: "Dispense Bag 1 (adult)" }).click();
  await dlg().getByRole("textbox").fill("1");
  await dlg().getByRole("button", { name: "Dispense" }).click();
  await expect(page.getByTestId("moves").locator("li.entry").first().locator(".oldnew")).toHaveText("quantity: 10 → 9");
});

test("F9.4 for a controlled drug, − leads to the register (F12); there's no plain dispense (Q8)", async () => {
  await launch("Cara Demo");
  for (const kind of ["Dispense", "Restock"]) {
    await page.getByRole("button", { name: `${kind} Morphine 10 mg/ml (demo) in Store (main)` }).click();
    await expect(dlg().getByTestId("cd-note")).toContainText("This is a controlled drug.");
    await expect(dlg().getByRole("textbox")).toHaveCount(0);                              // nothing to type, nothing to book
    await expect(dlg().getByRole("button", { name: kind, exact: true })).toHaveCount(0);
    await dlg().getByRole("button", { name: "Close" }).click();
  }
  await page.getByRole("button", { name: "Dispense Morphine 10 mg/ml (demo) in Store (main)" }).click();
  await dlg().getByRole("button", { name: "Open the register" }).click();
  await expect(page.locator('.side [data-view="cd"]')).toHaveAttribute("aria-current", "page");
  // not behind the screen either, and not through Edit or Move on the item page
  const why = await page.evaluate(async () => {
    const t = window.__mdTest; const cara = t.door.get("person", "demo-p3"); const out = [];
    for (const f of [() => t.inventory.adjust(cara, "demo-s7", "dispense", 1), () => t.inventory.editLine(cara, "demo-s7", { qty: 1, required: 5, lot: "M-3", expiry: "2027-07-24" }), () => t.inventory.move(cara, "demo-s7", "demo-l1", 1)]) {
      try { await f(); out.push("changed"); } catch (e) { out.push(e.message.includes("controlled-drug register") ? "register" : e.message); }
    }
    return out;
  });
  expect(why).toEqual(["register", "register", "register"]);
  expect(await qtyOf("demo-s7")).toBe(5);
});
