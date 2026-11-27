// F3 — Works without internet (the store door). One test per Master Checklist line, in the real program.
// A stand-in server and a second "computer" exist only in test mode (MD_TEST=1); the real server waits for REACH SD2.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;

async function launch({ test: t = true, offline = false, fresh = true } = {}) {
  if (fresh || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  const env = { ...process.env, TZ: "Pacific/Port_Moresby", MD_USER_DATA: dir };
  if (t) env.MD_TEST = "1"; else delete env.MD_TEST;
  if (offline) env.MD_TEST_OFFLINE = "1"; else delete env.MD_TEST_OFFLINE;
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env });
  page = await app.firstWindow();
  await page.waitForSelector(".shell");
}
async function close() { if (app) await app.close(); app = null; }
test.afterEach(close);

const save = (p) => page.evaluate((p) => window.__mdTest.save(p), p);
const gauzeBag1 = { recordType: "line", recordId: "demo-s1" }; // DEMO: Gauze 10×10 cm in Bag 1 (adult), 12 packs
async function qtyShown(query, location) {
  await page.fill('[aria-label="Search staff and inventory"]', query);
  const row = page.locator(".results .r", { hasText: location });
  await expect(row).toHaveCount(1);
  const t = await row.locator("small").textContent();
  await page.keyboard.press("Escape");
  return Number(t.split("·")[1].trim().split(" ")[0]);
}

test("F3.1 the program opens with no internet, showing the data of the last sync and its time", async () => {
  await launch();
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
  await expect(page.getByTestId("sync")).toHaveText("Up to date");
  await close();
  await launch({ offline: true, fresh: false });                     // same computer, no internet
  await expect(page.getByTestId("banner-offline")).toContainText(/Opened without internet\. Showing the data from the last sync at \d\d:\d\d/);
  expect(await qtyShown("gauze", "Bag 1")).toBe(11);
  await expect(page.getByTestId("sync")).toHaveText("Offline");
});

test("F3.2 changes made offline are kept on the computer and sent by themselves when the internet is back", async () => {
  await launch();
  await page.evaluate(() => window.__mdTest.setOnline(false));
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
  await expect(page.getByTestId("sync")).toHaveText("Offline · 2 waiting");
  const before = await page.evaluate(() => window.__mdTest.server.log.length);
  await page.evaluate(() => window.__mdTest.setOnline(true));
  await expect(page.getByTestId("sync")).toHaveText("Up to date");
  expect(await page.evaluate(() => window.__mdTest.server.log.length)).toBe(before + 2);
  expect(await qtyShown("gauze", "Bag 1")).toBe(10);
});

test("F3.3 the sync light: grey this computer only, green, amber with the count, red; a click lists what's waiting", async () => {
  await launch({ test: false });                                     // everyday use today: no server exists yet
  await expect(page.getByTestId("sync")).toHaveText("This computer only");
  await page.getByTestId("sync").click();
  await expect(page.getByTestId("sync-pop")).toContainText("not set up yet");
  await close();
  await launch();
  await expect(page.getByTestId("sync")).toHaveAttribute("data-state", "sl-ok");
  await page.evaluate(() => window.__mdTest.setOnline(false));
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
  await expect(page.getByTestId("sync")).toHaveAttribute("data-state", "sl-off");
  await page.getByTestId("sync").click();
  await expect(page.getByTestId("sync-pop").locator("li")).toHaveText(["Gauze 10×10 cm in Bag 1 (adult): −1"]);
  await page.evaluate(() => window.__mdTest.failNextWrite());
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });
  await expect(page.getByTestId("sync")).toHaveAttribute("data-state", "sl-err");
});

test("F3.4 two computers change the same line: both movements count, and it's shown", async () => {
  await launch();
  await page.evaluate(() => window.__mdTest.setOnline(false));
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -1 }, by: "demo-p1" });           // this Mac: −1
  await page.evaluate(() => window.__mdTest.otherApplies({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: 2 }, by: "demo-p2" })); // the PC: +2
  expect(await qtyShown("gauze", "Bag 1")).toBe(11);                 // offline: only its own change so far
  await page.evaluate(() => window.__mdTest.setOnline(true));
  await expect(page.getByTestId("sync")).toHaveText("Up to date");
  expect(await qtyShown("gauze", "Bag 1")).toBe(13);                 // 12 − 1 + 2
});

test("F3.5 two counts that disagree: the later is used, both kept, flagged for checking", async () => {
  await launch();
  await page.evaluate(() => window.__mdTest.setOnline(false));
  await save({ ...gauzeBag1, op: "count", data: { qty: 11, basedOn: null }, by: "demo-p1" });
  await page.waitForTimeout(5);
  await page.evaluate(() => window.__mdTest.otherApplies({ recordType: "line", recordId: "demo-s1", op: "count", data: { qty: 9, basedOn: null }, by: "demo-p2" }));
  await page.evaluate(() => window.__mdTest.setOnline(true));
  await expect(page.getByTestId("banner-flag")).toContainText("Two counts of Gauze 10×10 cm in Bag 1 (adult) disagree: 11 and 9. The later count (9) is used; both are kept.");
  expect(await qtyShown("gauze", "Bag 1")).toBe(9);
  expect(await page.evaluate(() => window.__mdTest.door.messages().filter(m => m.op === "count").length)).toBe(2);
});

test("F3.6 a save that fails is shown in red, and nothing pretends to be saved (B22)", async () => {
  await launch();
  await page.evaluate(() => window.__mdTest.failNextWrite());
  await save({ ...gauzeBag1, op: "delta", data: { field: "qty", by: -5 }, by: "demo-p1" });
  await expect(page.getByTestId("sync")).toHaveText("Not saved");
  await expect(page.getByTestId("toast")).toContainText("Not saved. This computer couldn't store the change, so nothing was changed.");
  expect(await qtyShown("gauze", "Bag 1")).toBe(12);
  await close();
  await launch({ fresh: false });                                     // and after reopening: still not changed
  expect(await qtyShown("gauze", "Bag 1")).toBe(12);
});

test("F3.7 a new version carries all data over; nothing is replaced by built-in data (B3)", async () => {
  await launch();
  // Make this computer look like it was used by an older version: an extra line saved without the app code,
  // and no version number in the store.
  await page.evaluate(async () => {
    await new Promise((res, rej) => {
      const r = indexedDB.open("reach-medical-suite");
      r.onerror = () => rej(r.error);
      r.onsuccess = () => {
        const db = r.result; const tx = db.transaction(["changes", "meta"], "readwrite");
        tx.objectStore("changes").put({ messageId: "old-1", at: 1, by: "old", app: "", recordType: "line", recordId: "old-line", op: "create", data: { itemId: "demo-i1", locationId: "demo-l0", qty: 4242, expiry: null } });
        tx.objectStore("meta").delete("schemaVersion");
        tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => rej(tx.error);
      };
    });
  });
  await close();
  await launch({ fresh: false });                                     // "the new version" opens the same data
  await page.fill('[aria-label="Search staff and inventory"]', "gauze store");
  await expect(page.locator(".results .r")).toHaveCount(2);           // the demo Store line and the old one
  await expect(page.locator(".results .r", { hasText: "4242" })).toHaveCount(1);
  const seedLines = await page.evaluate(() => window.__mdTest.door.records("line").length);
  expect(seedLines).toBe(8);                                          // 7 DEMO lines + the old one; nothing re-added
  expect(await page.evaluate(() => window.__mdTest.door.messages().find(m => m.messageId === "old-1").app)).toBe("MD");
});
