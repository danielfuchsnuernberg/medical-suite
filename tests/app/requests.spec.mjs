// Danny's requests after release 1 (28 Nov 2026, GO on https://claude.ai/artifact/VLufvxzcRopvZqorRhTPDb, all answers A).
// B70 icons · B72 look and drop-downs · B71 sidebar · B73 Back · B75 Head Doctor mark · B74 Item list. Each test fails without its fix.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;
async function launch(who = "Cara Demo", { keepDir = false } = {}) {
  if (!keepDir || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await signIn(page, who, "demo", { stay: true });
  await page.waitForSelector(".shell");
}
test.afterEach(async () => { if (app) await app.close(); app = null; });
const width = () => page.locator(".side").evaluate(e => Math.round(e.getBoundingClientRect().width));

test("B70 one icon family: a gear for Settings and a different icon for every menu entry", async () => {
  await launch();
  const icons = await page.locator(".side .nav button[data-view] svg").evaluateAll(s => s.map(x => ({ name: x.dataset.icon, html: x.innerHTML })));
  expect(icons).toHaveLength(12);
  expect(icons.every(i => i.html.length > 20)).toBe(true);                         // every icon is drawn
  expect(new Set(icons.map(i => i.name)).size).toBe(12);                           // no two entries share one
  expect(new Set(icons.map(i => i.html)).size).toBe(12);
  const gear = await page.locator('.side [data-view="settings"] svg').innerHTML();
  expect(gear).toContain("M12.22 2h-.44");                                         // the gear's outline
  expect(gear).not.toContain("M12 2v3");                                           // not the eight rays of a sun
});

test("B72 the medical look: teal, plain-case labels, drop-downs like the text boxes", async () => {
  await launch();
  const btn = await page.locator(".side .nav button[aria-current=page]").evaluate(e => getComputedStyle(e).color);
  expect(btn).toBe("rgb(14, 116, 144)");                                           // #0E7490
  expect(await page.locator(".navlabel").first().evaluate(e => getComputedStyle(e).textTransform)).toBe("none");
  await page.click('.side [data-view="where"]');
  await expect(page.locator('.side [data-view="roster"] .tag')).toHaveText("Later");
  const place = page.getByLabel("Place");
  const s = await place.evaluate(e => { const c = getComputedStyle(e); return { app: c.appearance, r: c.borderTopLeftRadius, b: c.borderTopColor, h: Math.round(e.getBoundingClientRect().height) }; });
  const box = await page.locator(".filters select").last().evaluate(e => Math.round(e.getBoundingClientRect().height));
  expect(s.app).toBe("none");
  expect(s.r).toBe("6px");
  expect(Math.abs(s.h - box)).toBeLessThanOrEqual(1);
  // the program's own list: click opens it, a click on an option picks it and the screen's own change runs
  await place.click();
  const list = page.getByTestId("select-list");
  await expect(list).toBeVisible();
  await expect(list.getByRole("option", { name: "All places" })).toHaveAttribute("aria-selected", "true");
  await list.getByRole("option", { name: "Bag 2 (child)" }).click();
  await expect(list).toHaveCount(0);
  await expect(place).toHaveValue(/.+/);
  await expect(page.getByTestId("lines").locator("tbody tr")).toHaveCount(2);      // the filter took effect
  // keyboard: an arrow opens it, a letter jumps, Enter picks, Escape closes without a change
  await place.focus();
  await page.keyboard.press("ArrowDown");
  await expect(list).toBeVisible();
  await page.keyboard.press("a");                                                  // "All places"
  await page.keyboard.press("Enter");
  await expect(place).toHaveValue("");
  await place.focus(); await page.keyboard.press("Space"); await expect(list).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(list).toHaveCount(0);
  await expect(place).toHaveValue("");
  // a click elsewhere closes it, and the computer's own menu never opens (the select stays closed)
  await place.click(); await expect(list).toBeVisible();
  await page.locator(".topbar h1").click(); await expect(list).toHaveCount(0);
});

test("B71 the menu: drag its edge (180–320 px), fold it to icons, remembered on this computer", async () => {
  await launch();
  expect(await width()).toBe(220);
  const g = await page.getByTestId("sidegrip").boundingBox();
  await page.mouse.move(g.x + 3, g.y + 200); await page.mouse.down(); await page.mouse.move(300, g.y + 200, { steps: 5 }); await page.mouse.up();
  expect(await width()).toBe(300);
  await page.mouse.move(301, g.y + 200); await page.mouse.down(); await page.mouse.move(900, g.y + 200, { steps: 5 }); await page.mouse.up();
  expect(await width()).toBe(320);                                                 // never wider than 320
  await page.getByTestId("sidegrip").dblclick();
  expect(await width()).toBe(220);                                                 // double-click: the normal width
  await page.mouse.move(219, g.y + 200); await page.mouse.down(); await page.mouse.move(260, g.y + 200, { steps: 5 }); await page.mouse.up();
  expect(await width()).toBe(260);
  // fold: a strip of icons, names on pointing, still one click to any screen
  await page.getByTestId("fold").click();
  expect(await width()).toBe(56);
  await expect(page.locator('.side [data-view="cd"] .lbl')).toBeHidden();
  await expect(page.locator('.side [data-view="cd"]')).toHaveAttribute("title", "Controlled drugs");
  await page.click('.side [data-view="cd"]');
  await expect(page.locator(".topbar h1")).toHaveText("Controlled drugs");
  await expect(page.getByTestId("sidegrip")).toHaveCount(0);
  // remembered: close and open the program again on the same computer
  await app.close(); app = null;
  await launch("Cara Demo", { keepDir: true });
  expect(await width()).toBe(56);
  await page.keyboard.press(process.platform === "darwin" ? "Meta+Backslash" : "Control+Backslash");
  expect(await width()).toBe(260);                                                 // unfolds to the width it had
  await expect(page.locator('.side [data-view="cd"] .lbl')).toBeVisible();
});

test("B73 Back returns to where you came from, says its name and keeps your place", async () => {
  await launch("Anna Example");
  // a menu screen has no Back
  await page.click('.side [data-view="overview"]');
  await expect(page.getByTestId("back")).toHaveCount(0);
  // Overview → an item: Back to Overview (was always “Back to Store and bags”)
  await page.locator(".overview button.srow").first().click();
  await expect(page.getByTestId("item-page")).toBeVisible();
  await page.getByRole("button", { name: "Back to Overview" }).click();
  await expect(page.locator(".topbar h1")).toHaveText("Overview");
  // Home card → Overview → card → Store and bags, filtered → item → Back, Back, Back
  await page.click(".logo");
  await page.locator('.appcard[data-card="overview"]').click();
  await expect(page.getByTestId("back")).toHaveText("Back to Home");
  await page.locator('[data-ov="out"]').click();
  await expect(page.locator(".topbar h1")).toHaveText("Store and bags");
  await expect(page.getByLabel("Stock level")).toHaveValue("out");
  const first = page.locator("table.stock tbody tr[data-line]").first();
  await page.locator(".content").evaluate(e => { e.scrollTop = 0; });
  await first.locator(".rowlink").click();
  await expect(page.getByRole("button", { name: "Back to Store and bags" })).toBeVisible();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+BracketLeft" : "Alt+ArrowLeft");   // the key works too
  await expect(page.locator(".topbar h1")).toHaveText("Store and bags");
  await expect(page.getByLabel("Stock level")).toHaveValue("out");                 // the filter is kept
  await page.getByTestId("back").click();
  await expect(page.locator(".topbar h1")).toHaveText("Overview");
  await page.getByTestId("back").click();
  await expect(page.locator(".topbar h1")).toHaveText("Home");
  await expect(page.getByTestId("back")).toHaveCount(0);
  // the search: an item found from Activity goes back to Activity
  await page.click('.side [data-view="log"]');
  await page.getByLabel("Search staff and inventory").fill("Gauze");
  await page.locator(".results .r", { hasText: "Gauze" }).first().click();
  await expect(page.getByRole("button", { name: "Back to Activity" })).toBeVisible();
  // a menu click starts afresh
  await page.click('.side [data-view="staff"]');
  await expect(page.getByTestId("back")).toHaveCount(0);
  await page.locator("tr[data-person] .who-cell").first().click();
  await page.getByRole("button", { name: "Back to Staff and training" }).click();
  await expect(page.getByTestId("profile")).toHaveCount(0);
});

test("B73 Back with typed counts asks first (B16 rule)", async () => {
  await launch("Anna Example");
  await page.evaluate(async () => { const t = window.__mdTest; await t.door.apply({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -999 }, by: "demo-p4" }); });
  await page.click(".logo");
  await page.getByTestId("home-below").click();                                    // Home → Count a bag: Back to Home
  await expect(page.getByTestId("back")).toHaveText("Back to Home");
  await page.getByLabel("Place to count").selectOption({ index: 1 });
  await page.locator("input.cnt-in").first().fill("3");
  await page.getByTestId("back").click();
  await expect(page.getByTestId("leave-count")).toBeVisible();
  await page.getByRole("button", { name: "Keep counting" }).click();
  await expect(page.locator(".topbar h1")).toHaveText("Count a bag");
  await page.getByTestId("back").click();
  await page.getByTestId("leave-count").getByRole("button", { name: "Throw away" }).click();
  await expect(page.locator(".topbar h1")).toHaveText("Home");
});

test("B75 the Head Doctor shows on the profile and in the staff list", async () => {
  await launch("Anna Example");
  await page.click('.side [data-view="staff"]');
  const ben = page.locator("tr[data-person]", { hasText: "Dr Ben Sample" });
  await expect(ben.getByTestId("head-tag")).toHaveText("Head Doctor");
  await expect(page.locator("tr[data-person]", { hasText: "Anna Example" }).getByTestId("head-tag")).toHaveCount(0);
  await expect(page.getByTestId("head-tag")).toHaveCount(1);                       // exactly one Head Doctor
  await ben.locator(".who-cell").click();
  await expect(page.getByTestId("profile").getByTestId("head-tag")).toBeVisible();
  await expect(page.getByTestId("head-line")).toContainText("Head Doctor");
  await page.getByRole("button", { name: "Back to Staff and training" }).click();
  await page.locator("tr[data-person]", { hasText: "Anna Example" }).locator(".who-cell").click();
  await expect(page.getByTestId("head-line")).toHaveCount(0);
});

test("B74 the Item list: one row per item, totals over every place, search, opens the item, Back keeps the search", async () => {
  await launch("Anna Example");
  await page.click('.side [data-view="items"]');
  await expect(page.getByTestId("placeholder")).toHaveCount(0);
  await expect(page.getByTestId("item-list")).toBeVisible();
  // the expected rows, worked out here from the records: active items, lines in active places added up
  const want = await page.evaluate(() => {
    const d = window.__mdTest.door; const locs = new Map(d.records("location").map(l => [l.id, l]));
    return d.records("item").filter(i => i.state === "Active").map(i => ({ id: i.id, total: d.records("line").filter(l => l.itemId === i.id && l.state === "Active" && locs.get(l.locationId)?.state === "Active").reduce((s, l) => s + Number(l.qty), 0) }));
  });
  const rows = page.locator("table[data-testid=items] tbody tr[data-item]");
  await expect(rows).toHaveCount(want.length);
  for (const w of want) await expect(page.locator(`tr[data-item="${w.id}"] [data-testid=total] b`)).toHaveText(String(w.total));
  const gauze = want.find(w => w.id === "demo-i1");
  expect(gauze).toBeTruthy();
  // search by name, then open it: Back to Item list, with the search kept
  await page.getByLabel("Search items").fill("gauze");
  await expect(rows).toHaveCount(1);
  await rows.first().locator(".rowlink").click();
  await expect(page.getByTestId("item-page")).toHaveAttribute("data-item", "demo-i1");
  await expect(page.locator('.side [data-view="items"]')).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Back to Item list" }).click();
  await expect(page.getByLabel("Search items")).toHaveValue("gauze");
  await expect(rows).toHaveCount(1);
  // the Overview's “Item types” opens it, with the same count
  await page.click('.side [data-view="overview"]');
  const types = await page.locator('[data-ov="types"] .v').innerText();
  await page.locator('[data-ov="types"]').click();
  await expect(page.locator(".topbar h1")).toHaveText("Item list");
  await expect(rows).toHaveCount(Number(types));
  // CSV of what is shown
  await page.getByLabel("Search items").fill("gauze");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const found = () => { try { const n = fs.readdirSync(path.join(dir, "downloads")).find(f => /^inventory-item-list-\d{4}-\d{2}-\d{2}\.csv$/.test(f)); return n ? path.join(dir, "downloads", n) : ""; } catch { return ""; } };
  await expect.poll(() => { const p = found(); return p && fs.readFileSync(p, "utf8").split("\r\n").length; }).toBe(3);
  const file = found();
  const csv = fs.readFileSync(file, "utf8").slice(1).trimEnd().split("\r\n");
  expect(csv[0]).toBe("Item no.,Item,Category,Unit,Controlled drug,Total on hand,Places,Next expiry,Stock,Archived");
  expect(csv[1]).toContain(`,${gauze.total},`);
  // Add item from here (Work level), then it is in the list
  await page.getByLabel("Search items").fill("");
  await page.getByRole("button", { name: "Add item" }).click();
  await page.getByLabel("Name").fill("Burn gel 50 ml");
  await page.getByTestId("add-item").getByRole("button", { name: "Add item" }).click();
  await expect(page.getByTestId("item-page")).toBeVisible();
  await page.getByRole("button", { name: "Back to Item list" }).click();
  await expect(rows).toHaveCount(want.length + 1);
});

test("B74 the Item list at View level: no Add item", async () => {
  await launch("Cara Demo");
  await page.evaluate(async () => { const t = window.__mdTest; const anna = t.door.records("person").find(p => p.name === "Anna Example"); await t.door.apply({ recordType: "person", recordId: anna.id, op: "set", data: { level: "View" }, by: "demo-p1" }); });
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "Anna Example");
  await page.click('.side [data-view="items"]');
  await expect(page.getByTestId("item-list")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add item" })).toHaveCount(0);
});

test("B78 (A9) only doctors and nurses change stock: Cara (Manage, Other) sees no stock buttons and is told why; Anna (Nurse) has them", async () => {
  await launch("Cara Demo");
  const why = /Only doctors and nurses change stock \(your profession is Other\)/;
  await page.click('.side [data-view="where"]');
  await expect(page.getByTestId("not-clinical")).toHaveText(why);
  await expect(page.locator("button[aria-label^='Restock ']")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add item" })).toHaveCount(0);
  await page.locator("table.stock .rowlink").first().click();
  await expect(page.getByTestId("not-clinical")).toHaveText(why);
  await expect(page.getByRole("button", { name: /^(Move|Edit|Restock)/ })).toHaveCount(0);
  await page.click('.side [data-view="items"]');
  await expect(page.getByRole("button", { name: "Add item" })).toHaveCount(0);
  await page.click('.side [data-view="count"]');
  await expect(page.getByTestId("not-clinical")).toHaveText(why);
  await page.getByLabel("Place to count").selectOption({ index: 1 });
  await expect(page.locator("input.cnt-in").first()).toBeDisabled();
  // behind the screen too
  const err = await page.evaluate(async () => { const t = window.__mdTest; try { await t.inventory.adjust(t.door.get("person", "demo-p3"), "demo-s1", "restock", 1); return "changed"; } catch (e) { return e.message; } });
  expect(err).toMatch(why);
  // what stays with Management: settings, freezing a stock take
  await page.click('.side [data-view="takes"]');
  await expect(page.getByRole("button", { name: /Freeze/ }).first()).toBeVisible();
  // Settings flags who can't change stock
  await page.click('.side [data-view="settings"]');
  const row = (n) => page.getByTestId("people-access").locator("tr", { hasText: n });
  await expect(row("Cara Demo").getByTestId("no-stock")).toHaveText("can't change stock (not a doctor or nurse)");
  await expect(row("Anna Example").getByTestId("no-stock")).toHaveCount(0);
  await expect(row("Dr Ben Sample").getByTestId("no-stock")).toHaveCount(0);
  // Anna, a nurse at Work level, still restocks
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, "Anna Example");
  await page.click('.side [data-view="where"]');
  await expect(page.getByTestId("not-clinical")).toHaveCount(0);
  await expect(page.locator("button[aria-label^='Restock ']").first()).toBeVisible();
});

test("B76 (A7) the real-data trial: its own folder, no DEMO data, a red stripe; guessed rows load marked “to check”; June people load without training", async () => {
  const { makeXlsx } = await import("./xlsx-fixture.mjs");
  const tdir = fs.mkdtempSync(path.join(os.tmpdir(), "md-trial-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_TRIAL: "1", MD_USER_DATA: tdir } });
  page = await app.firstWindow();
  await expect(page.getByTestId("trial-stripe")).toBeVisible();
  await expect(page.getByTestId("setup")).toBeVisible();                            // no DEMO people: the first-start screen
  await expect(page).toHaveTitle("REACH Medical Suite – real trial");
  await page.getByLabel("Your name").fill("Trial Manager");
  await page.getByLabel("Your job").fill("Base manager");
  await page.getByLabel("New password", { exact: true }).fill("trial-pass-123");
  await page.getByLabel("New password again").fill("trial-pass-123");
  await page.getByRole("button", { name: "Set up and sign in" }).click();
  await page.waitForSelector(".shell");
  await expect(page.getByTestId("trial-stripe")).toBeVisible();
  expect(await page.evaluate(() => window.__mdTest.door.records("item").length)).toBe(0);
  // a list with rows the nurses' program refuses: here they load, marked
  await page.click('.side [data-view="settings"]');
  const x = await makeXlsx({ "Bag 1 (DEMO)": [["List Items", "Unit", "Required Qty", "Batch", "Exp Date", "Feb", "Mar"],
    ["Gauze swabs (DEMO)", "pack", 4, "G-1", "05/2028", 3, "2 pkt"],
    ["Splint set (DEMO)", "set", 2, "", "", null, "Full"],
    ["Glucose gel (DEMO)", "tube", 2, "", "", null, "Half"],
    ["Saline (DEMO)", "bag", 2, "", "03/27 & 08/27", null, 2]] });
  await page.getByTestId("backup-import").getByLabel("Check a stock list (Excel)").setInputFiles({ name: "Bags (DEMO).xlsx", mimeType: "application/octet-stream", buffer: Buffer.from(x) });
  const d = page.getByTestId("list-check");
  await expect(d.getByTestId("list-summary")).toContainText("0 must be fixed");
  await d.getByRole("button", { name: "Prepare loading…" }).click();
  const lp = page.getByTestId("load-preview");
  await lp.getByRole("button", { name: /^Load 3 lines/ }).click();
  await expect(lp).toHaveCount(0);
  const lines = await page.evaluate(() => window.__mdTest.door.records("line").map(l => ({ qty: l.qty, expiry: l.expiry, toCheck: l.toCheck ?? null })));
  expect(lines).toHaveLength(3);                                                    // “Half” left out
  expect(lines.map(l => l.qty).sort()).toEqual([2, 2, 2]);                           // 2 pkt → 2, Full → required 2, 2
  expect(lines.every(l => l.toCheck)).toBe(true);
  expect(lines.find(l => /two expiry dates/.test(l.toCheck)).expiry).toBe("2027-03-01");
  // Store and bags: marked, a filter for them; the item page names the guess and, for a nurse, a Checked button
  await page.click('.side [data-view="where"]');
  await expect(page.getByTestId("to-check")).toHaveCount(3);
  await page.getByLabel(/Only lines to check/).check();
  await expect(page.locator("table.stock tbody tr[data-line]")).toHaveCount(3);
  await page.evaluate(async () => { const t = window.__mdTest; const me = t.door.records("person")[0]; await t.accounts.setProfession(me, me.id, "Nurse"); });
  await page.locator("table.stock .rowlink", { hasText: "Saline" }).click();
  await expect(page.getByTestId("item-page").getByTestId("to-check")).toContainText("two expiry dates");
  await page.getByTestId("item-page").getByRole("button", { name: "Checked" }).click();
  await expect(page.getByTestId("item-page").getByTestId("to-check")).toHaveCount(0);
  // the June people: names, jobs, professions; no training records
  await page.click('.side [data-view="settings"]');
  const html = `<script>const personnel=[ p({id:'PR-1',title:'Dr.',firstName:'Alex',lastName:'Sample',jobRole:'Physician',department:'Maternity',email:'alex@example.org',trainingRecords:[tr('CT-1','Completed',{})]}),
    p({id:'PR-2',firstName:'Bea',lastName:'Demo',jobRole:'Midwife',email:'',trainingRecords:[]}), p({id:'PR-3',firstName:'System',lastName:'Administrator',jobRole:'Administrator',trainingRecords:[]}) ];</script>`;
  await page.getByTestId("june-people").getByLabel("Load people from the June app").setInputFiles({ name: "medical-suite.html", mimeType: "text/html", buffer: Buffer.from(html) });
  await expect(page.getByTestId("june-result").locator("li")).toHaveCount(2);
  const ppl = await page.evaluate(() => window.__mdTest.door.records("person").map(p => ({ name: p.name, profession: p.profession ?? null, level: p.level })));
  expect(ppl).toEqual(expect.arrayContaining([{ name: "Dr. Alex Sample", profession: "Doctor", level: "Work" }, { name: "Bea Demo", profession: "Nurse", level: "Work" }]));
  expect(ppl.some(p => /Administrator/.test(p.name))).toBe(false);
  expect(await page.evaluate(() => window.__mdTest.door.records("training").length)).toBe(0);
});

test("B76 the normal copy has no trial button and no stripe", async () => {
  await launch("Cara Demo");
  await expect(page.getByTestId("trial-stripe")).toHaveCount(0);
  await page.click('.side [data-view="settings"]');
  await expect(page.getByTestId("june-people")).toHaveCount(0);
});
