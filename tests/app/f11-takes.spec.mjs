// F11 — Stock takes. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;

// The computer runs on UTC: 27 Nov 2026, 20:00 UTC = 28 Nov, 06:00 in Port Moresby (B13).
async function launch({ who = "Anna Example", fresh = true } = {}) {
  if (fresh || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "UTC", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 20, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="takes"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const freeze = async (label) => {
  await page.getByRole("button", { name: "Freeze stock take now" }).click();
  if (label !== undefined) await page.getByTestId("freeze").getByLabel("Label").fill(label);
  await page.getByTestId("freeze").getByRole("button", { name: "Freeze it" }).click();
  await expect(page.getByTestId("stock-take")).toBeVisible();
};
const rowOf = (id) => page.locator(`[data-testid="then-now"] tr[data-line="${id}"]`);

test("F11.1 freeze a stock take: every line, date, who, label; it can't be changed afterwards", async () => {
  await launch();
  await expect(page.locator(".takes .empty")).toContainText("No stock takes yet.");
  await page.getByRole("button", { name: "Freeze stock take now" }).click();
  await expect(page.getByTestId("freeze").getByLabel("Label")).toHaveValue("Stock take, Nov 2026");   // the base's month, not the computer's
  await page.getByTestId("freeze").getByLabel("Label").fill("");
  await page.getByTestId("freeze").getByRole("button", { name: "Freeze it" }).click();
  await expect(page.getByTestId("freeze").getByTestId("refusal")).toContainText("Give the stock take a label");
  await page.getByTestId("freeze").getByLabel("Label").fill("Monthly count, November");
  await page.getByTestId("freeze").getByRole("button", { name: "Freeze it" }).click();
  await expect(page.getByTestId("stock-take")).toContainText("Monthly count, November");
  await expect(page.getByTestId("frozen")).toHaveText("Frozen 28 Nov 2026, 06:00 · by Anna Example");
  await expect(page.getByTestId("then-now").locator("tbody tr")).toHaveCount(10);
  await expect(page.getByTestId("stock-take")).toContainText("can't be changed");
  await expect(page.getByTestId("stock-take").getByRole("button", { name: /Edit|Delete|Rename/ })).toHaveCount(0);
  // not behind the screen either: a change message is ignored, a delete refused
  const after = await page.evaluate(async () => {
    const t = window.__mdTest; const id = t.door.records("stocktake")[0].id;
    await t.door.apply({ recordType: "stocktake", recordId: id, op: "set", data: { name: "changed", lines: [] }, by: "demo-p3" });
    await t.door.apply({ recordType: "stocktake", recordId: id, op: "delete", data: {}, by: "demo-p3" });
    const s = t.door.get("stocktake", id); return s ? [s.name, s.lines.length] : null;
  });
  expect(after).toEqual(["Monthly count, November", 10]);
  // in the list and in Activity
  await page.getByRole("button", { name: "Back to stock takes" }).click();
  await expect(page.getByTestId("takes").locator(".srow")).toHaveCount(1);
  await expect(page.getByTestId("takes")).toContainText("Monthly count, November");
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log").locator("li.entry", { hasText: "froze a stock take: Monthly count, November (10 lines)" })).toHaveCount(1);
  await expect(page.getByTestId("log").locator("li.entry").first()).toContainText("tried to change stock take Monthly count, November: ignored, a stock take never changes");
  await expect(page.getByTestId("log").locator("li.entry").first().locator(".oldnew")).toHaveCount(0);
  await expect(page.getByTestId("log").locator("li.entry").first().getByTestId("was")).toHaveCount(0);
});

test("F11.2 then vs now for every line; lines removed since are shown as removed", async () => {
  await launch({ who: "Dr Ben Sample" });   // A9: deleting a line is a stock change
  await freeze("November");
  const t = (p) => page.evaluate((p) => window.__mdTest.save(p), p);
  await t({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -3 } });
  await t({ recordType: "line", recordId: "demo-s10", op: "delta", data: { field: "qty", by: 4 } });
  await t({ recordType: "line", recordId: "demo-s9", op: "archive", data: {} });
  await expect(rowOf("demo-s1").getByTestId("change")).toHaveText("-3");
  await expect(rowOf("demo-s1").locator("td").nth(2)).toHaveText("12");
  await expect(rowOf("demo-s1").locator("td").nth(3)).toHaveText("9");
  await expect(rowOf("demo-s10").getByTestId("change")).toHaveText("+4");
  await expect(rowOf("demo-s2").getByTestId("change")).toHaveText("no change");
  await expect(rowOf("demo-s9").getByTestId("change")).toHaveText("removed (archived since)");
  await expect(rowOf("demo-s9")).toContainText("Bandage 8 cm");                                        // still named
  // a line added after freezing isn't in it, and says so
  await page.evaluate(async () => { const t = window.__mdTest; await t.inventory.addLine(t.door.get("person", "demo-p2"), "demo-i4", "demo-l0", { qty: 1, required: "", lot: "", expiry: "" }); });
  await expect(page.getByTestId("stock-take")).toContainText("1 line added since (not in this stock take)");
  // deleted (a mistake within 24 h): removed, still named. The menu goes back to the list from inside a stock take.
  await page.click('.side [data-view="takes"]');
  await expect(page.getByTestId("takes")).toBeVisible();
  await freeze("After adding");
  const lid = await page.evaluate(() => window.__mdTest.door.records("line").find(l => l.itemId === "demo-i4" && l.locationId === "demo-l0").id);
  await page.evaluate(async (lid) => { const t = window.__mdTest; await t.inventory.deleteMistake(t.door.get("person", "demo-p2"), "line", lid); }, lid);
  await expect(rowOf(lid).getByTestId("change")).toHaveText("removed (deleted since)");
  await expect(rowOf(lid)).toContainText("IV cannula 18G");
});

test("F11.3 export a stock take as a spreadsheet file, with local dates", async () => {
  await launch();
  await freeze("Stock take, November 2026");
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -2 } }));
  await page.getByRole("button", { name: "Export CSV" }).click();
  const file = path.join(dir, "downloads", "stock-take-november-2026-2026-11-28.csv");      // the base's date: still 27 Nov on the computer
  await expect.poll(() => fs.existsSync(file) && fs.readFileSync(file, "utf8").split("\r\n").length).toBe(12);
  const rows = fs.readFileSync(file, "utf8").slice(1).trimEnd().split("\r\n");
  expect(rows[0]).toBe("Stock take,Frozen on,Frozen at,By,Item,Place,Lot,Expiry,Counted then,Now,Change");
  expect(rows).toContain("\"Stock take, November 2026\",2026-11-28,06:00,Anna Example,Gauze 10×10 cm,Bag 1 (adult),G-2201,2027-12-01,12,10,-2");
  expect(rows).toContain("\"Stock take, November 2026\",2026-11-28,06:00,Anna Example,Glucose gel 15 g,Bag 2 (child),GG-5,2026-11-28,2,2,0");
});

test("F11.4 stock takes are kept on the server and survive every new version (B3)", async () => {
  await launch();
  await freeze("November");
  // on the server, and the other computer has it after syncing
  const onOther = await page.evaluate(async () => {
    const t = window.__mdTest; await t.door.sync(); await t.other.sync();
    return { server: t.server.log.some(c => c.recordType === "stocktake"), other: t.other.records("stocktake").map(s => s.name) };
  });
  expect(onOther).toEqual({ server: true, other: ["November"] });
  // "a new version": the program opens the same data again
  await app.close();
  await launch({ fresh: false });
  await expect(page.getByTestId("takes").locator(".srow")).toHaveCount(1);
  await expect(page.getByTestId("takes")).toContainText("November");
});
