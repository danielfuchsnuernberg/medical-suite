// F8 — Item page. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;

async function launch(who = "Cara Demo") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 28, 0, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const openItem = async (name) => {
  await page.click('.side [data-view="where"]');
  await page.getByTestId("lines").locator(".rowlink", { hasText: name }).first().click();
  await expect(page.getByTestId("item-page")).toBeVisible();
};
const pline = (place) => page.getByTestId("lines").locator("li[data-line]", { hasText: place });
const dlg = () => page.locator(".dialog");
const records = (type) => page.evaluate((t) => window.__mdTest.door.records(t), type);

test("F8.1 stock per place with lot, expiry and status, and the item's movements", async () => {
  await launch();
  await openItem("Gauze 10×10 cm");
  await expect(page.getByTestId("total")).toHaveText("42 on hand · 2 lines");
  // the Store first, then the bags
  expect(await page.getByTestId("lines").locator(".pl-main .t").allTextContents()).toEqual(["Store (main)", "Bag 1 (adult)"]);
  await expect(pline("Store (main)").locator(".d")).toHaveText("30 pack · reorder at 20 · lot G-2190");
  await expect(pline("Bag 1 (adult)").locator(".d")).toHaveText("12 pack · required 10 · lot G-2201");
  await expect(pline("Bag 1 (adult)").locator("[data-stock]")).toHaveText("At or above required");
  await expect(pline("Bag 1 (adult)").locator("[data-expiry]")).toHaveText("1 Dec 2027");
  // movements: what happened to this item and its lines, nothing else
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -2 } }));
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s2", op: "delta", data: { field: "qty", by: -1 } }));   // Saline: not shown here
  const moves = page.getByTestId("moves").locator("li.entry");
  await expect(moves.first()).toContainText("took 2 from Gauze 10×10 cm in Bag 1 (adult)");
  await expect(moves.first().locator(".oldnew")).toHaveText("quantity: 12 → 10");
  await expect(page.getByTestId("moves")).not.toContainText("Saline");
  await expect(page.getByTestId("total")).toHaveText("40 on hand · 2 lines");
});

test("F8.2 move part or all; joins a matching line (same lot and expiry) or starts a new one without a required amount; logged (B24)", async () => {
  await launch();
  await openItem("Gauze 10×10 cm");
  // part, to a place without this lot: a new line, no required amount
  await pline("Bag 1 (adult)").getByRole("button", { name: "Move" }).click();
  await expect(dlg().getByLabel("How many")).toHaveValue("12");                                   // all, by default
  await dlg().getByLabel("Move to").selectOption({ label: "Bag 2 (child)" });
  await dlg().getByLabel("How many").fill("13");
  await dlg().getByRole("button", { name: "Move" }).click();
  await expect(dlg().getByTestId("refusal")).toHaveText("Only 12 on hand, so 13 can't be taken. Nothing was moved.");
  await dlg().getByLabel("How many").fill("5");
  await dlg().getByRole("button", { name: "Move" }).click();
  await expect(dlg()).toHaveCount(0);
  await expect(pline("Bag 1 (adult)").locator(".d")).toContainText("7 pack · required 10");
  await expect(pline("Bag 2 (child)").locator(".d")).toHaveText("5 pack · lot G-2201");          // no required amount
  await expect(pline("Bag 2 (child)").locator("[data-stock]")).toHaveText("No required amount");
  await expect(pline("Bag 2 (child)").locator("[data-expiry]")).toHaveText("1 Dec 2027");          // the lot's expiry came along
  // the rest, to the same place: it joins that line
  await pline("Bag 1 (adult)").getByRole("button", { name: "Move" }).click();
  await dlg().getByLabel("Move to").selectOption({ label: "Bag 2 (child)" });
  await dlg().getByRole("button", { name: "Move" }).click();
  await expect(pline("Bag 2 (child)").locator(".d")).toHaveText("12 pack · lot G-2201");
  expect((await records("line")).filter(l => l.itemId === "demo-i1").length).toBe(3);             // not a 4th line
  await expect(pline("Bag 1 (adult)").locator("[data-stock]")).toHaveText("Out of stock");         // Q24 = C: it has a required amount, so it stays, at 0
  await expect(pline("Bag 1 (adult)")).not.toHaveClass(/archived/);
  // to the Store, which has Gauze with the same expiry but another lot: a new line, the old one untouched
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s6", op: "set", data: { expiry: "2027-12-01" } }));
  await pline("Bag 2 (child)").getByRole("button", { name: "Move" }).click();
  await dlg().getByLabel("Move to").selectOption({ label: "Store (main)" });
  await dlg().getByLabel("How many").fill("2");
  await dlg().getByRole("button", { name: "Move" }).click();
  await expect(page.getByTestId("lines").locator("li[data-line]", { hasText: "Store (main)" })).toHaveCount(2);
  // Q24 = C: the Bag 2 line has no required amount; emptying it archives it, and the message says so
  await pline("Bag 2 (child)").getByRole("button", { name: "Move" }).click();
  await dlg().getByLabel("Move to").selectOption({ label: "Trauma kit" });
  await dlg().getByRole("button", { name: "Move" }).click();
  await expect(page.locator(".toast").last()).toContainText("The emptied line had no amount set, so it was archived.");
  await expect(pline("Bag 2 (child)")).toHaveClass(/archived/);
  await expect(pline("Trauma kit").locator(".d")).toHaveText("10 pack · lot G-2201");
  // logged: from where to where
  const first = page.getByTestId("moves").locator("li.entry");
  await expect(page.getByTestId("moves")).toContainText("moved 2 from Gauze 10×10 cm in Bag 2 (child) to Store (main)");
  await expect(page.getByTestId("moves")).toContainText("2 moved in to Gauze 10×10 cm in Store (main) from Bag 2 (child)");
  await expect(first.filter({ hasText: "moved 7 from" }).locator(".oldnew")).toHaveText("quantity: 7 → 0");
});

test("F8.3 edit a line: the place can't be edited there (use Move); every change logged old → new; whole numbers", async () => {
  await launch();
  await openItem("Gauze 10×10 cm");
  await pline("Bag 1 (adult)").getByRole("button", { name: "Edit" }).click();
  await expect(dlg().getByLabel("Place")).toBeDisabled();
  await expect(dlg()).toContainText("To change the place, use Move.");
  for (const [bad, msg] of [["2.7", "Whole numbers only. 2.7 isn't allowed: type it without commas or points, for example 1000."], ["-5", "It can't be below 0."], ["", "Type the amount on hand."], ["ten", "“ten” isn't a number."]]) {
    await dlg().getByLabel("On hand").fill(bad);
    await dlg().getByRole("button", { name: "Save changes" }).click();
    await expect(dlg().getByTestId("refusal")).toHaveText(`${msg} Nothing was saved.`);
  }
  expect((await records("line")).find(l => l.id === "demo-s1").qty).toBe(12);
  // closing the box with a refusal in it leaves no message behind on the page
  await page.keyboard.press("Escape");
  await expect(dlg()).toHaveCount(0);
  await expect(page.getByTestId("refusal")).toHaveCount(0);
  await pline("Bag 1 (adult)").getByRole("button", { name: "Edit" }).click();
  await expect(dlg().getByTestId("expiry-reads")).toHaveText("Expires 1 Dec 2027");          // the date in words, whatever order the box shows
  await dlg().getByLabel("On hand").fill("11");
  await dlg().getByLabel("Required amount / reorder level").fill("12");
  await dlg().getByLabel("Lot").fill("G-2205");
  await dlg().getByLabel("Expiry").fill("2028-01-31");
  await expect(dlg().getByTestId("expiry-reads")).toHaveText("Expires 31 Jan 2028");
  await dlg().getByRole("button", { name: "Save changes" }).click();
  await expect(dlg()).toHaveCount(0);
  await expect(pline("Bag 1 (adult)").locator(".d")).toHaveText("11 pack · required 12 · lot G-2205");
  await expect(pline("Bag 1 (adult)").locator("[data-expiry]")).toHaveText("31 Jan 2028");
  const e = page.getByTestId("moves").locator("li.entry").first();
  expect(await e.locator(".oldnew").allTextContents()).toEqual(["quantity: 12 → 11", "required: 10 → 12", "lot: G-2201 → G-2205", "expiry: 2027-12-01 → 2028-01-31"]);
  expect((await records("line")).find(l => l.id === "demo-s1").expiry).toBe("2028-01-31");           // the plain date, no clock (B13)
});

test("F8.4 add a place; add an item (duplicate refused); archive and reactivate; delete only a mistake within 24 h, after a confirm, logged; rights per F2.7", async () => {
  await launch();
  // add an item; a duplicate name is refused
  await page.click('.side [data-view="where"]');
  await page.getByRole("button", { name: "Add item" }).click();
  await dlg().getByLabel("Name").fill("gauze 10×10 CM");
  await dlg().getByRole("button", { name: "Add item" }).click();
  await expect(dlg().getByTestId("refusal")).toHaveText("“Gauze 10×10 cm” is already there. Open it and add a place instead.");
  await dlg().getByLabel("Name").fill("Burn dressing 10×10 cm");
  await dlg().getByLabel("Category of the new item").selectOption({ label: "Dressings" });
  await dlg().getByLabel("Counted in").fill("pack");
  await dlg().getByLabel("On hand").fill("6");
  await dlg().getByRole("button", { name: "Add item" }).click();
  await expect(page.locator(".topbar h1")).toHaveText("Burn dressing 10×10 cm");                   // it opens
  await expect(page.getByTestId("total")).toHaveText("6 on hand · 1 line");
  // add a place
  await page.getByRole("button", { name: "Add a place" }).click();
  await dlg().getByLabel("Place").selectOption({ label: "Bag 1 (adult)" });
  await dlg().getByLabel("On hand").fill("2");
  await dlg().getByLabel("Required amount / reorder level").fill("2");
  await dlg().getByRole("button", { name: "Add place" }).click();
  await expect(pline("Bag 1 (adult)").locator("[data-stock]")).toHaveText("At or above required");
  // archive and reactivate a line
  await pline("Bag 1 (adult)").getByRole("button", { name: "Archive" }).click();
  await expect(pline("Bag 1 (adult)")).toHaveClass(/archived/);
  await expect(page.getByTestId("total")).toHaveText("6 on hand · 1 line");
  await pline("Bag 1 (adult)").getByRole("button", { name: "Reactivate" }).click();
  await expect(pline("Bag 1 (adult)")).not.toHaveClass(/archived/);
  // an item in use can't be archived
  await page.getByRole("button", { name: "Archive item" }).click();
  await expect(page.getByTestId("refusal")).toHaveText("Burn dressing 10×10 cm still has 2 lines in use. Archive or move them first.");
  // delete a mistake: confirm first; Cancel keeps it
  await pline("Bag 1 (adult)").getByRole("button", { name: "Delete (mistake)" }).click();
  await expect(page.getByTestId("confirm")).toContainText("will be deleted and can't be brought back");
  await page.getByTestId("confirm").getByRole("button", { name: "Cancel" }).click();
  await expect(pline("Bag 1 (adult)")).toHaveCount(1);
  await pline("Bag 1 (adult)").getByRole("button", { name: "Delete (mistake)" }).click();
  await page.getByTestId("confirm").getByRole("button", { name: "Delete for good" }).click();
  await expect(pline("Bag 1 (adult)")).toHaveCount(0);
  await expect(page.getByTestId("moves").locator("li.entry").first()).toContainText("deleted stock line Burn dressing 10×10 cm in Bag 1 (adult) for good (a mistake, within 24 hours)");
  // old DEMO lines (more than 24 hours) offer no delete, only archive
  await openItem("Gauze 10×10 cm");
  await expect(page.getByTestId("lines").getByRole("button", { name: "Delete (mistake)" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete (mistake)" })).toHaveCount(0);
  // Work level (Anna) can archive but never delete; View level changes nothing
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "Anna Example");
  await openItem("Burn dressing");
  await expect(page.getByRole("button", { name: "Archive item" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete (mistake)" })).toHaveCount(0);
  const refused = await page.evaluate(async () => {
    const t = window.__mdTest; const anna = t.door.get("person", "demo-p1");
    const id = t.door.records("item").find(i => i.name === "Burn dressing 10×10 cm").id;
    try { await t.inventory.deleteMistake(anna, "item", id); return "deleted"; } catch (e) { return e.message; }
  });
  expect(refused).toBe("Only Manage level can delete a mistake.");
  await page.evaluate(() => window.__mdTest.door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" }, by: "demo-p3" }));
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "Dina Test");
  await openItem("Burn dressing");
  await expect(page.locator(".itempage").getByRole("button", { name: /^(Move|Edit|Archive|Add a place|Archive item|Reactivate)$/ })).toHaveCount(0);
  await page.click('.side [data-view="where"]');
  await expect(page.getByRole("button", { name: "Add item" })).toHaveCount(0);
});

test("F8.5 a 'Used on EDP cases' panel waits for F17", async () => {
  await launch();
  await openItem("Saline 0.9% 500 ml");
  await expect(page.getByTestId("edp-panel")).toContainText("Used on EDP cases");
  await expect(page.getByTestId("edp-panel")).toContainText("Comes with F17");
});
