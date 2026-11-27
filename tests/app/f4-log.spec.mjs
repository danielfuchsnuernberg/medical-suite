// F4 — Activity log. One test per Master Checklist line, in the real program.
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
  await signIn(page, who);
  await page.waitForSelector(".shell");
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const save = (p) => page.evaluate((p) => window.__mdTest.save(p), p);
const openLog = () => page.click('.side [data-view="log"]');
const entries = () => page.getByTestId("log").locator("li.entry");

test("F4.1 one log for all REACH apps, newest first, filter by app; who, which record, what changed, when, which app", async () => {
  await launch();
  await save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 } });              // Inventory
  await save({ recordType: "person", recordId: "demo-p4", op: "set", data: { level: "View" } });                      // People
  // EDP sends a change through the shared server (stand-in in test mode)
  await page.evaluate(() => {
    const t = window.__mdTest;
    t.server.receive([{ messageId: "edp-msg-1", at: Date.now() + 1000, by: "edp-dispatcher", app: "EDP", recordType: "case", recordId: "case-1", op: "create", data: { caseNo: "C-0042" } }]);
    return t.door.sync();
  });
  await openLog();
  const first = entries().nth(0), second = entries().nth(1), third = entries().nth(2);
  await expect(first).toContainText("EDP");
  await expect(first).toContainText("added case C-0042");
  await expect(first).toContainText("from EDP");
  await expect(second).toContainText("PEOPLE");
  await expect(second).toContainText("changed person Dina Test");
  await expect(second.locator(".oldnew")).toHaveText("level: Work → View");
  await expect(second.locator(".src")).toHaveText(/^Cara Demo · \d{1,2} \w+ 2026, \d\d:\d\d$/);   // who · when (base time, 24-hour)
  await expect(third).toContainText("INVENTORY");
  await expect(third).toContainText("took 1 from Gauze 10×10 cm in Bag 1 (adult)");
  await expect(third.locator(".oldnew")).toHaveText("quantity: 12 → 11");
  // filter by app
  await page.click('[data-area="Inventory"]');
  await expect(page.getByTestId("log").locator(".tagapp")).not.toContainText(["PEOPLE"]);
  expect(new Set(await page.getByTestId("log").locator(".tagapp").allTextContents())).toEqual(new Set(["INVENTORY"]));
  await page.click('[data-area="EDP"]');
  await expect(entries()).toHaveCount(1);
  await page.click('[data-area="Settings"]');
  await expect(page.getByTestId("log-empty")).toBeVisible();
  // every entry has the R9 shape
  const shapeOk = await page.evaluate(() => window.__mdTest.door.log().every(e => e.by && e.recordType && e.recordId && typeof e.at === "number" && e.app && Array.isArray(e.changes)));
  expect(shapeOk).toBe(true);
});

test("F4.2 every change shows old → new; a renamed item keeps its history (B19)", async () => {
  await launch();
  await save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -2 } });
  await save({ recordType: "item", recordId: "demo-i1", op: "set", data: { name: "Gauze pad 10×10 cm" } });
  await openLog();
  await expect(entries().nth(0).locator(".oldnew")).toHaveText("name: Gauze 10×10 cm → Gauze pad 10×10 cm");
  await expect(entries().nth(1)).toContainText("took 2 from Gauze pad 10×10 cm in Bag 1 (adult)");   // earlier entry, current name
  await entries().nth(0).locator(".reclink").click();                                               // the item's history
  await expect(page.getByTestId("history")).toContainText("History of Gauze pad 10×10 cm");
  await expect(entries()).toHaveCount(2);                                                           // renamed + added (DEMO)
  await expect(entries().nth(1)).toContainText("added item Gauze pad 10×10 cm");
  await page.getByRole("button", { name: "Show everything" }).click();
  await expect(page.getByTestId("history")).toHaveCount(0);
});

test("F4.3 every delete for good is logged with who, when and what was there (B18)", async () => {
  await launch();
  await page.click('.side [data-view="settings"]');
  await page.getByRole("button", { name: "Add a person" }).click();
  await page.getByLabel("New person's name").fill("Typo Persn");
  await page.getByLabel("New person's job").fill("Nurse");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.locator("[data-person]", { hasText: "Typo Persn" }).getByRole("button", { name: "Delete (mistake)" }).click();
  await openLog();
  const del = entries().nth(0);
  await expect(del).toHaveAttribute("data-op", "delete");
  await expect(del).toContainText("deleted person Typo Persn for good (a mistake, within 24 hours)");
  await expect(del.getByTestId("was")).toHaveText("What was there: name Typo Persn · job Nurse · level Work · state Active");
  await expect(del.locator(".src")).toContainText("Cara Demo · ");
  await expect(entries().nth(1)).toContainText("added person Typo Persn");                         // its creation stays too
});

test("F4.4 nobody can edit or delete a log entry, Manage level included", async () => {
  await launch("Cara Demo");                                                                       // Manage level
  await save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 } });
  await openLog();
  await expect(page.getByTestId("log-lock")).toHaveText("Nobody can edit or delete log entries, Manage level included.");
  // the only buttons in the log open a record's history; nothing edits or deletes
  const labels = await page.getByTestId("log").locator("button").evaluateAll(bs => [...new Set(bs.map(b => b.className))]);
  expect(labels).toEqual(["reclink"]);
  await expect(page.getByTestId("log").locator("input, textarea, select, [contenteditable]")).toHaveCount(0);
  // and not behind the screen: stored messages and log entries are locked
  const after = await page.evaluate(() => {
    const d = window.__mdTest.door;
    const attempt = (f) => { try { f(); } catch { /* refused */ } };
    attempt(() => { d.messages().at(-1).by = "someone"; });
    attempt(() => { d.messages().at(-1).data.by = -50; });
    attempt(() => { d.log()[0].by = "someone"; });
    attempt(() => { d.log()[0].changes.length = 0; });
    attempt(() => { d.log().length = 0; });
    return { by: d.messages().at(-1).by, delta: d.messages().at(-1).data.by, logBy: d.log()[0].by, logChanges: d.log()[0].changes.length, logLength: d.log().length };
  });
  expect(after).toEqual({ by: "demo-p3", delta: -1, logBy: "demo-p3", logChanges: 1, logLength: expect.any(Number) });
  expect(after.logLength).toBeGreaterThan(1);
  await expect(entries().nth(0).locator(".src")).toContainText("Cara Demo");
  await expect(entries().nth(0).locator(".oldnew")).toHaveText("quantity: 12 → 11");
});
