// F13 — Backup, export and import. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";
import { makeXlsx } from "./xlsx-fixture.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;

async function launch({ who = "Cara Demo", fresh = true, empty = false } = {}) {
  if (fresh || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir, ...(empty ? { MD_TEST_EMPTY: "1" } : {}) } });
  page = await app.firstWindow();
  if (empty) return;
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="settings"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const panel = () => page.getByTestId("backup-import");
const backupsDir = () => path.join(dir, "backups");
const exportFile = async () => {
  await panel().getByRole("button", { name: "Export backup" }).click();
  const f = path.join(dir, "downloads", "medical-suite-backup-" + (await page.evaluate(() => window.__mdTest.backups.today())) + ".json");
  await expect.poll(() => { try { return JSON.parse(fs.readFileSync(f, "utf8")).data.messages.length > 0; } catch { return false; } }).toBe(true);
  return f;
};
const writeTmp = (name, text) => { const f = path.join(dir, name); fs.writeFileSync(f, text); return f; };

test("F13.1 a backup every day (the last 30 kept); on this computer until the server keeps them (REACH SD2)", async () => {
  await launch();
  await expect.poll(() => fs.existsSync(backupsDir()) && fs.readdirSync(backupsDir()).filter(n => /^medical-suite-backup-\d{4}-\d{2}-\d{2}\.json$/.test(n)).length).toBe(1);
  const today = fs.readdirSync(backupsDir())[0];
  expect(JSON.parse(fs.readFileSync(path.join(backupsDir(), today), "utf8"))).toMatchObject({ app: "MD", kind: "backup" });
  await expect(panel().getByTestId("saved-backups").locator("li")).toHaveCount(1);
  await expect(panel()).toContainText("The server's nightly backups come with the server (REACH SD2).");
  // 40 more days: only the newest 30 stay
  await page.evaluate(async () => { for (let d = 1; d <= 40; d++) await window.md.backups.save(`medical-suite-backup-2025-${String(Math.ceil(d / 28) + 9).padStart(2, "0")}-${String(((d - 1) % 28) + 1).padStart(2, "0")}.json`, "{}"); });
  expect(fs.readdirSync(backupsDir()).filter(n => n.endsWith(".json")).length).toBe(30);
  expect(fs.readdirSync(backupsDir())).toContain(today);                                    // today's is among the newest
  // the folder takes no other names
  const why = await page.evaluate(async () => { try { await window.md.backups.save("../../evil.json", "{}"); return "saved"; } catch (e) { return "refused"; } });
  expect(why).toBe("refused");
  // reopening the same day doesn't make a second one
  await app.close();
  await launch({ fresh: false });
  await expect(panel().getByTestId("saved-backups").locator("li")).toHaveCount(30);
});

test("F13.2 export a backup file in the REACH backup shape: app code MD, data version, when exported, the data", async () => {
  await launch();
  const f = await exportFile();
  const o = JSON.parse(fs.readFileSync(f, "utf8"));
  expect(Object.keys(o)).toEqual(["app", "kind", "dataVersion", "exportedAt", "exportedBy", "data"]);
  expect(o).toMatchObject({ app: "MD", kind: "backup", dataVersion: 2, exportedBy: "demo-p3" });
  expect(Date.parse(o.exportedAt)).toBeGreaterThan(0);
  expect(o.data.messages.length).toBe(await page.evaluate(() => window.__mdTest.door.messages().length));
  expect(fs.readFileSync(f, "utf8")).not.toMatch(/"salt"|"hash"/);                           // no password or PIN check values
});

test("F13.3 an import with no stock, or with no people, is refused with the reason; nothing changes (B15)", async () => {
  await launch();
  const o = JSON.parse(fs.readFileSync(await exportFile(), "utf8"));
  const before = await page.evaluate(() => window.__mdTest.door.messages().length);
  const cases = [
    ["no-stock.json", { ...o, data: { messages: o.data.messages.filter(m => m.recordType !== "line") } }, "This backup has no stock in it. Restoring it would delete all 10 stock lines, the stock takes and the register. Refused: nothing was changed."],
    ["no-people.json", { ...o, data: { messages: o.data.messages.filter(m => m.recordType !== "person") } }, "This backup has no people in it. Nobody could sign in afterwards. Refused: nothing was changed."],
    ["june-backup.json", { people: [{ name: "x" }], courses: [] }, "This isn't a REACH Medical Suite backup (for example a backup of the June app). Refused: nothing was changed."],
  ];
  for (const [name, content, why] of cases) {
    await panel().getByLabel("Restore from a backup file").setInputFiles(writeTmp(name, JSON.stringify(content)));
    await expect(page.getByTestId("restore-refused")).toHaveText(why);
    await expect(page.getByTestId("restore").getByRole("button", { name: "Restore" })).toHaveCount(0);
    await page.getByTestId("restore").getByRole("button", { name: "OK" }).click();
  }
  expect(await page.evaluate(() => window.__mdTest.door.messages().length)).toBe(before);
});

test("F13.4 a restore shows now vs after, needs a tick, and saves a backup of today first (B15)", async () => {
  await launch();
  await page.evaluate(() => window.__mdTest.setOnline(false));   // no server yet (SD2): a restore is this computer only. With a server, what a restore undoes is Q30.
  const f = await exportFile();
  await page.evaluate(async () => { const t = window.__mdTest; await t.inventory.addItem(t.door.get("person", "demo-p2"), { name: "Burn dressing", locationId: "demo-l0", qty: 4 }); });
  await panel().getByLabel("Restore from a backup file").setInputFiles(f);
  const d = page.getByTestId("restore");
  await expect(d.locator('tr[data-row="items"] td')).toHaveText(["Items", "9", "8"]);           // now vs after
  await expect(d.locator('tr[data-row="lines"] td')).toHaveText(["Stock lines", "11", "10"]);
  await expect(d.locator('tr[data-row="items"]')).toHaveClass(/diff/);
  await expect(d.locator('tr[data-row="people"]')).not.toHaveClass(/diff/);
  await expect(d).toContainText(/made \d{1,2} \w{3} 2026, \d\d:\d\d \(base time\)/);           // base time, not UTC
  await expect(d.getByRole("button", { name: "Restore" })).toBeDisabled();                    // the tick first
  await d.getByRole("checkbox").check();
  await d.getByRole("button", { name: "Restore" }).click();
  await expect(d).toHaveCount(0);
  const safety = fs.readdirSync(backupsDir()).find(n => n.includes("before-restore"));
  expect(safety).toMatch(/^medical-suite-backup-\d{4}-\d{2}-\d{2}-before-restore-\d{6}\.json$/);
  expect(fs.readFileSync(path.join(backupsDir(), safety), "utf8")).toContain("Burn dressing");   // what was there is kept
  await expect(panel().getByTestId("saved-backups")).toContainText("before a restore at");
  // and it can be restored from the list
  await panel().getByTestId("saved-backups").locator("li", { hasText: "before a restore" }).getByRole("button", { name: "Restore…" }).click();
  await expect(page.getByTestId("restore").locator('tr[data-row="items"] td')).toHaveText(["Items", "8", "9"]);
});

test("F13.5 after a restore every screen shows the restored data at once, with no reload (B2)", async () => {
  await launch();
  await page.evaluate(() => window.__mdTest.setOnline(false));   // no server yet (SD2): a restore is this computer only. With a server, what a restore undoes is Q30.
  const f = await exportFile();
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -12 } }));
  await page.click('.side [data-view="overview"]');
  await expect(page.locator('[data-ov="out"] .v')).toHaveText("2");
  await page.click('.side [data-view="settings"]');
  await panel().getByLabel("Restore from a backup file").setInputFiles(f);
  await page.getByTestId("restore").getByRole("checkbox").check();
  await page.getByTestId("restore").getByRole("button", { name: "Restore" }).click();
  await page.click('.side [data-view="overview"]');
  await expect(page.locator('[data-ov="out"] .v')).toHaveText("1");                         // no reload
  await page.click('.side [data-view="where"]');
  await expect(page.locator('tr[data-line="demo-s1"] td').nth(3)).toContainText("12");
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log").locator("li.entry", { hasText: "took 12 from Gauze" })).toHaveCount(1);          // Q32 = B: every entry stays
  await expect(page.getByTestId("log").locator("li.entry").first()).toContainText("restored the backup made");
  expect(await page.evaluate(() => document.body.innerText.includes("undefined"))).toBe(false);
});

test("F13.6 an Excel list shows its problems first: impossible dates, doubles, double spaces, missing units, lots that look like dates; the list can be copied", async () => {
  await launch();
  const x = await makeXlsx({
    "Store (DEMO)": [[null, "Medication /Consumables", "Unites", "Batch", "Expiry", "SOH FEB"],
      [null, "Gauze 10×10 cm", "pack", "G-1", 46357, 28],
      [null, "Needle  20G", "", "N-1", 2, 50],
      [null, "Betadine 10%", "bottle", 46539, null, 3],
      [null, "Gauze 10×10 cm", "pack", "G-1", 46357, 2]],   // same lot and expiry (another lot would be fine, B40)
    "Bag 1 (DEMO)": [["Section", "List Items", "Required Qty", "Batch", "Exp Date", "Feb"], ["Airway", "Oxygen mask", 2, "O-1", "05/2028", 2]],
  });
  await panel().getByLabel("Check a stock list (Excel)").setInputFiles({ name: "Stock list (DEMO).xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from(x) });
  const d = page.getByTestId("list-check");
  await expect(d.getByTestId("list-summary")).toHaveText("5 rows in 2 sheets · 3 must be fixed in the spreadsheet · 0 with notes only");
  const store = d.locator('[data-sheet="Store (DEMO)"]');
  await expect(store.locator('tr[data-row="3"]')).toContainText("double spaces in the name, tidied to “Needle 20G”");
  await expect(store.locator('tr[data-row="3"]')).toContainText("no unit");
  await expect(store.locator('tr[data-row="3"]')).toContainText("must fix: the date looks wrong (1900)");
  await expect(store.locator('tr[data-row="4"]')).toContainText("must fix: the lot number looks like a date: is it the expiry?");
  await expect(store.locator('tr[data-row="5"]')).toContainText("must fix: the same item twice in this place, same lot and expiry (also row 2)");
  await expect(d.locator('[data-sheet="Bag 1 (DEMO)"] tr')).toHaveCount(0);                    // a clean sheet lists nothing
  await expect(d).toContainText("Nothing has been loaded.");
  expect(await page.evaluate(() => window.__mdTest.door.records("item").some(i => i.name === "Betadine 10%"))).toBe(false);
  await app.evaluate(({ clipboard }) => clipboard.writeText(""));
  await d.getByRole("button", { name: "Copy the list for the medics" }).click();
  await expect.poll(() => app.evaluate(({ clipboard }) => clipboard.readText())).toContain("row 3, Needle 20G: double spaces in the name, tidied to “Needle 20G”; no unit; MUST FIX: the date looks wrong (1900)");
  // not an Excel file
  await d.getByRole("button", { name: "Close" }).click();
  await panel().getByLabel("Check a stock list (Excel)").setInputFiles({ name: "notes.xlsx", mimeType: "text/plain", buffer: Buffer.from("hello") });
  await expect(panel().getByTestId("refusal")).toContainText("This isn't an Excel file (.xlsx)");
});

test("F13.7 the real stock and staff lists come only through import: nothing real is built in or in Git (B9)", async () => {
  // a new, empty program has no stock and no people until something is imported or set up
  await launch({ empty: true });
  await page.waitForSelector('[data-testid="setup"], [data-testid="signin"]');
  expect(await page.evaluate(() => [window.__mdTest.door.records("line").length, window.__mdTest.door.records("item").length])).toEqual([0, 0]);
  expect(await page.evaluate(() => window.__mdTest.door.messages().length)).toBe(0);         // nothing built in at all (DEMO marking: unit test)
  // Git holds no spreadsheets, backups or CSV
  const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, env: { ...process.env, DEVELOPER_DIR: "/Library/Developer/CommandLineTools" } }).toString().split("\n");
  expect(tracked.filter(f => /\.(xlsx|xls|csv)$|medical-suite-backup|(^|\/)data\//i.test(f))).toEqual([]);
  const ignore = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8");
  for (const p of ["*.xlsx", "*.csv", "data/"]) expect(ignore).toContain(p);
});

test("F13.8 only Manage level imports or restores", async () => {
  await launch({ who: "Anna Example" });
  await expect(page.getByTestId("backup-import")).toHaveCount(0);
  const why = await page.evaluate(async () => {
    const t = window.__mdTest; const anna = t.door.get("person", "demo-p1"); const out = [];
    for (const f of [() => t.backups.exportFile(anna), () => t.backups.check(anna, "{}"), () => t.backups.restore(anna, "{}", true)]) {
      try { await f(); out.push("done"); } catch (e) { out.push(e.message); }
    }
    return out;
  });
  expect(why).toEqual(Array(3).fill("Only Manage level exports, imports or restores backups."));
});

test("F13.6 loading (Q26 = A, A, A): only without must-fix rows; newest month; sheets to places; controlled drugs wait for the Head Doctor", async () => {
  await launch();
  const upload = async (name, sheets) => panel().getByLabel("Check a stock list (Excel)").setInputFiles({ name, mimeType: "application/octet-stream", buffer: Buffer.from(await makeXlsx(sheets)) });
  // a list with a row to fix can't be loaded
  await upload("Bad list (DEMO).xlsx", { "Store (DEMO)": [[null, "Medication /Consumables", "Unites", "Batch", "Expiry", "SOH FEB"], [null, "Needle 20G", "box", "N-1", 2, 50]] });
  await expect(page.getByTestId("list-next")).toContainText("Loading is possible once the 1 “must fix” row is corrected");
  await expect(page.getByTestId("list-check").getByRole("button", { name: "Prepare loading…" })).toHaveCount(0);
  await page.getByTestId("list-check").getByRole("button", { name: "Close" }).click();
  // a clean list
  await upload("Stock Take (DEMO).xlsx", {
    Sheet1: [[null, "Medication /Consumables", "Unites", "Batch", "Expiry", "SOH Jan", "SOH FEB", "SOH MAR"],
      [null, "Gauze 10×10 cm", "pack", "G-2190", 46661, 30, 28, null],            // the Store line already there: a count of 28 (Feb)
      [null, "Burn dressing (DEMO)", "pack", "B-1", 46661, 6, null, 5],
      [null, "Morphine 10 mg/ml (demo)", "amp", "M-3", 46592, 5, 5, 5],           // already controlled: waits
      [null, "Ketamine (DEMO)", "vial", "K-1", 46600, 3, 3, 3]],                    // ticked as controlled: waits
    "Snake Bite Kit (DEMO)": [["Items  List", "Standard", "Batch", "Expiry", "SOH Mar", 46113], ["Crepe bandage", 6, "C-1", "05/2028", 6, 4]],
  });
  await page.getByTestId("list-check").getByRole("button", { name: "Prepare loading…" }).click();
  const d = page.getByTestId("load-preview");
  await expect(d.getByLabel("Place for Sheet1")).toHaveValue("demo-l0");                                // the stock take is the Store
  await expect(d.getByLabel("Place for Snake Bite Kit (DEMO)")).toHaveValue("new");                       // no such bag: a new one
  await expect(d.locator('[data-sheet="Sheet1"] tr[data-row="2"] [data-testid="lp-qty"]')).toHaveText("28 pack (SOH FEB)");
  await expect(d.locator('[data-sheet="Sheet1"] tr[data-row="3"] [data-testid="lp-qty"]')).toHaveText("5 pack (SOH MAR)");
  await expect(d.locator('[data-sheet="Sheet1"] tr[data-row="4"]')).toContainText("controlled drug: waits for the Head Doctor");
  await d.getByLabel("Controlled drug: Ketamine (DEMO) (Sheet1)").check();
  await expect(d.getByTestId("load-summary")).toContainText("3 lines load now · 2 wait for the Head Doctor · 3 new items · new bag: Snake Bite Kit (DEMO)");
  await d.getByRole("button", { name: "Load 3 lines" }).click();
  await expect(d).toHaveCount(0);
  expect(await page.evaluate(() => window.__mdTest.door.get("line", "demo-s6").qty)).toBe(28);
  await page.click('.side [data-view="where"]');
  await expect(page.getByTestId("lines").locator("tr", { hasText: "Burn dressing (DEMO)" })).toHaveCount(1);
  await expect(page.getByTestId("lines").locator("tr", { hasText: "Ketamine" })).toHaveCount(0);           // waits, not loaded
  await expect(page.getByTestId("lines").locator("tr", { hasText: "Crepe bandage" })).toContainText("Snake Bite Kit (DEMO)");
  expect(await page.evaluate(() => window.__mdTest.door.get("line", "demo-s7").qty)).toBe(5);              // Morphine untouched
  // Cara (not a doctor) sees what waits but can't decide
  await page.click('.side [data-view="cd"]');
  await expect(page.getByTestId("import-waits")).toContainText("Only the Head Doctor decides these.");
  await expect(page.getByTestId("import-waits").getByRole("button")).toHaveCount(0);
  // the Head Doctor decides
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "Dr Ben Sample");
  await page.click('.side [data-view="cd"]');
  const w = page.getByTestId("import-waits");
  const ket = w.locator("li", { hasText: "Ketamine" });
  await ket.getByRole("button", { name: "Controlled drug…" }).click();
  await ket.getByRole("button", { name: "Confirm as controlled drug" }).click();
  await expect(w.getByTestId("refusal")).toContainText("A witness has to sign");
  await ket.getByLabel("Witness for Ketamine (DEMO)").selectOption({ label: "Dina Test" });
  await ket.getByRole("button", { name: "Confirm as controlled drug" }).click();
  await expect(w.locator("li")).toHaveCount(1);
  const mor = w.locator("li", { hasText: "Morphine" });
  await expect(mor.getByRole("button", { name: "Not a controlled drug" })).toHaveCount(0);                   // it is one already
  await mor.getByRole("button", { name: "Controlled drug…" }).click();
  await mor.getByLabel("Witness for Morphine 10 mg/ml (demo)").selectOption({ label: "Dina Test" });
  await mor.getByRole("button", { name: "Confirm as controlled drug" }).click();
  await expect(page.getByTestId("import-waits")).toHaveCount(0);
  await page.locator('[data-drug="demo-i5"]').click();
  await expect(page.getByTestId("balance")).toHaveText("Balance 10 amp");
  await expect(page.getByTestId("mismatch")).toHaveCount(0);
  const k = await page.evaluate(() => { const t = window.__mdTest; const i = t.door.records("item").find(x => x.name === "Ketamine (DEMO)"); return [i.controlled, t.register.balance(i.id), t.register.onShelves(i.id)]; });
  expect(k).toEqual([true, 3, 3]);
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log")).toContainText("imported the stock list Stock Take (DEMO).xlsx: 3 lines loaded, 2 waiting for the Head Doctor");
});
