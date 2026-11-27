// F1 — Program window, menu and search. One test per Master Checklist line, run in the real program (Electron).
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;

async function launch() {
  // Each test gets its own empty data folder: tests never touch the data of a program someone has open.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await signIn(page);
  await page.waitForSelector(".shell");
}

async function setSize(w, h) {
  await app.evaluate(({ BrowserWindow }, [w, h]) => { const win = BrowserWindow.getAllWindows()[0]; win.setMinimumSize(320, 480); win.setContentSize(w, h); }, [w, h]);
  await page.waitForFunction(([w]) => window.innerWidth === w, [w]);
}

test.afterEach(async () => { if (app) await app.close(); app = null; });

test("F1.1 menu as in the June app, Home cards, Settings at the bottom", async () => {
  await launch();
  await expect(page).toHaveTitle("REACH Medical Suite");
  const groups = await page.locator(".side .navlabel").allTextContents();
  expect(groups).toEqual(["Inventory", "Team", "Later"]);
  const items = (await page.locator(".side .nav button").allTextContents()).map(t => t.replace(/LATER$/, "").trim());
  expect(items).toEqual(["Home", "Overview", "Store and bags", "Item list", "Count a bag", "Stock takes", "Controlled drugs", "Activity",
    "Staff and training", "Roster", "Patient Archive", "Settings"]);
  await expect(page.locator(".side .bottom button")).toHaveText("Settings");
  expect(await page.locator(".home-grid .appcard").count()).toBe(6);
  // every menu entry opens: Home, or a screen that says which feature brings it
  for (const id of ["items", "cd", "staff", "roster"]) {
    await page.click(`.side [data-view="${id}"]`);
    await expect(page.locator(`.side [data-view="${id}"]`)).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("placeholder")).toContainText(/Comes (with F\d+|later)/);
  }
  await page.click('.side [data-view="settings"]');                       // since F2: Settings › People and access
  await expect(page.getByTestId("people-access")).toBeVisible();
  await page.click(".logo");
  await expect(page.getByTestId("today")).toBeVisible();
});

test("F1.2 below 720 px the menu sits behind ☰; every screen reachable; no sideways scroll at 375 px (B5)", async () => {
  await launch();
  await setSize(375, 760);
  const side = page.locator(".side");
  await expect(page.locator(".hamb")).toBeVisible();
  await page.waitForFunction(() => document.querySelector(".side").getBoundingClientRect().right <= 0); // drawer off screen
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
  for (const id of ["overview", "count", "cd", "staff", "settings", "home"]) {
    await page.click(".hamb");
    await expect(side).toBeInViewport();
    await page.click(`.side [data-view="${id}"]`);
    await expect(page.locator(`.side [data-view="${id}"]`)).toHaveAttribute("aria-current", "page");
    await page.waitForFunction(() => document.querySelector(".side").getBoundingClientRect().right <= 0);
  }
  // tap outside closes it
  await page.click(".hamb");
  await page.locator(".scrim").click({ position: { x: 340, y: 400 } });
  await page.waitForFunction(() => document.querySelector(".side").getBoundingClientRect().right <= 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test("F1.3 quotes, <b> and script tags show as plain text; nothing runs, no button breaks (B4)", async () => {
  await launch();
  await page.evaluate(() => { window.__ran = false; });
  const nasty = `<img src=x onerror="window.__ran=true"><b>Gauze</b> "quote' <script>window.__ran=true</script>`;
  await page.fill('[aria-label="Search staff and inventory"]', nasty);
  await expect(page.getByTestId("echo")).toHaveText(nasty);
  expect(await page.locator(".results img, .results b, .results script").count()).toBe(0);
  expect(await page.evaluate(() => window.__ran)).toBe(false);
  await expect(page.locator(".results .none")).toContainText("Nothing found");
  // the program still works afterwards
  await page.fill('[aria-label="Search staff and inventory"]', "gauze");
  await expect(page.locator(".results .r")).toHaveCount(2);
});

test("F1.4 search finds staff and stock from any screen; a result opens it", async () => {
  await launch();
  await page.click('.side [data-view="cd"]');
  await page.fill('[aria-label="Search staff and inventory"]', "anna");
  await expect(page.locator(".results .r")).toHaveCount(1);
  await page.click(".results .r");
  await expect(page.locator('.side [data-view="staff"]')).toHaveAttribute("aria-current", "page");
  await page.fill('[aria-label="Search staff and inventory"]', "saline store");
  await expect(page.locator(".results .r")).toHaveCount(1);
  await expect(page.locator(".results .r")).toContainText("Store (main)");
  await page.click(".results .r");
  await expect(page.locator('.side [data-view="where"]')).toHaveAttribute("aria-current", "page");
});

test("F1.5 'today' moves on while the program stays open: badges change after midnight (B7)", async () => {
  // 27 Nov 2026, 23:58 in Port Moresby. Glucose gel (DEMO) expires 28 Nov.
  const ctxClock = async () => {
    await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 13, 58)) });
    await page.reload();
    await signIn(page);
    await page.waitForSelector(".shell");
  };
  await launch();
  await ctxClock();
  await expect(page.getByTestId("today")).toHaveText("Friday 27 November 2026");
  await page.fill('[aria-label="Search staff and inventory"]', "glucose");
  await expect(page.locator(".results [data-expiry]")).toHaveText("Expires tomorrow");
  await page.clock.runFor(3 * 60 * 1000);                     // three minutes later, past midnight, no reopening
  await expect(page.locator(".results [data-expiry]")).toHaveText("Expires today");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("today")).toHaveText("Saturday 28 November 2026");
});
