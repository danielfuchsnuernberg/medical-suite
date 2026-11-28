// F15 — Training and certificates. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHOTS = path.join(ROOT, "docs/stage6");
let app, page;

// 27 Nov 2026, 20:00 UTC = 28 Nov, 06:00 in Port Moresby: "today" is 28 Nov at the base.
async function launch(who = "Cara Demo") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "UTC", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 20, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="staff"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const openPerson = (id) => page.locator(`.staff-table tr[data-person="${id}"]`).click();
const course = (id) => page.locator(`[data-testid="prof-training"] li[data-training="${id}"]`);

test("F15.1 each course shows Valid, Expires in N days, Expired, Required or In progress; the list and stats agree", async () => {
  await launch("Anna Example");
  await expect(page.locator('[data-st="expired"] .v')).toHaveText("1");          // Anna's ACLS; archived Finn's not counted
  await expect(page.locator('[data-st="due"] .v')).toHaveText("1");              // Dina's BLS
  await expect(page.locator('tr[data-person="demo-p1"] [data-train]')).toHaveText("Expired certificate");
  await expect(page.locator('tr[data-person="demo-p4"] [data-train]')).toHaveText("Due soon / required");
  await expect(page.locator('tr[data-person="demo-p2"] [data-train]')).toHaveText("All valid");
  await openPerson("demo-p1");
  await expect(course("demo-t1").locator(".badge")).toHaveText("Valid");
  await expect(course("demo-t2").locator(".badge")).toHaveText("Expired");
  await expect(course("demo-t2")).toContainText("Completed 18 Nov 2024 · expires 18 Nov 2026 · valid 24 months");
  await expect(course("demo-t3").locator(".badge")).toHaveText("Required");
  await expect(page.getByTestId("prof-training").getByRole("button")).toHaveCount(0);   // Work level only looks
  await page.getByRole("button", { name: "All staff" }).click();
  await openPerson("demo-p4");
  await expect(course("demo-t7").locator(".badge")).toHaveText("Expires in 20 days");
  await expect(course("demo-t8").locator(".badge")).toHaveText("In progress");
});

test("F15.2 an expired certificate can be renewed, and a valid one renewed early", async () => {
  await launch();
  await openPerson("demo-p1");
  await course("demo-t2").getByRole("button", { name: "Renew" }).click();
  const d = page.getByTestId("complete-course");
  await expect(d).toContainText("Renew: ACLS");
  await expect(d.getByTestId("new-expiry")).toContainText("New expiry: 28 Nov 2028");
  await page.screenshot({ path: path.join(SHOTS, "f15-renew.png") });
  await d.getByRole("button", { name: "Save" }).click();
  await expect(d).toHaveCount(0);
  await expect(course("demo-t2").locator(".badge")).toHaveText("Valid");
  await expect(course("demo-t2")).toContainText("Completed 28 Nov 2026 · expires 28 Nov 2028");
  await course("demo-t1").getByRole("button", { name: "Renew early" }).click();
  await d.getByLabel("Completed on").fill("2026-11-20");
  await expect(d.getByTestId("new-expiry")).toContainText("New expiry: 20 Nov 2027");
  await d.getByRole("button", { name: "Save" }).click();
  await expect(course("demo-t1")).toContainText("expires 20 Nov 2027");
  await page.getByRole("button", { name: "All staff" }).click();
  await expect(page.locator('[data-st="expired"] .v')).toHaveText("0");
  await expect(page.locator('tr[data-person="demo-p1"] [data-train]')).toHaveText("Due soon / required");   // Fire safety still required
  await page.click('.side [data-view="log"]');
  await expect(page.locator(".entry").first()).toContainText("renewed BLS (basic life support) for Anna Example");
  await expect(page.locator(".entry").nth(1)).toContainText("renewed ACLS for Anna Example");
  await expect(page.locator(".entry").nth(1)).toContainText("18 Nov 2026");
});

test("F15.3 expiry is month-safe: 31 Jan + 1 month = end of February", async () => {
  await launch();
  await openPerson("demo-p4");
  await course("demo-t8").getByRole("button", { name: "Mark complete" }).click();
  const d = page.getByTestId("complete-course");
  await d.getByLabel("Completed on").fill("2026-01-31");
  await expect(d.getByTestId("new-expiry")).toContainText("New expiry: 28 Feb 2026");
  await d.getByRole("button", { name: "Save" }).click();
  await expect(course("demo-t8")).toContainText("Completed 31 Jan 2026 · expires 28 Feb 2026");
  await expect(course("demo-t8").locator(".badge")).toHaveText("Expired");
});

test("F15.4 archived people are offered no courses", async () => {
  await launch();
  await page.getByLabel("Show archived staff").check();
  await openPerson("demo-p5");
  await expect(page.getByTestId("no-courses")).toHaveText("Archived: no new courses are offered.");
  await expect(page.getByRole("button", { name: "Assign course" })).toHaveCount(0);
  await expect(page.getByTestId("prof-training").getByRole("button")).toHaveCount(0);   // no Renew either
  const why = await page.evaluate(async () => { const t = window.__mdTest; try { await t.training.assign(t.door.get("person", "demo-p3"), "demo-p5", "demo-k3"); return "saved"; } catch (e) { return e.message; } });
  expect(why).toMatch(/archived: no courses are offered/);
});

test("F15.5 a completion date can't be in the future; every change logged old → new", async () => {
  await launch();
  await openPerson("demo-p1");
  await course("demo-t3").getByRole("button", { name: "Mark complete" }).click();
  const d = page.getByTestId("complete-course");
  await d.getByLabel("Completed on").fill("2026-11-29");
  await expect(d.getByTestId("new-expiry")).toHaveText("A completion date can't be in the future.");
  await d.getByRole("button", { name: "Save" }).click();
  await expect(d.getByTestId("refusal")).toHaveText("A completion date can't be in the future.");
  await d.getByLabel("Completed on").fill("2026-11-28");
  await d.getByRole("button", { name: "Save" }).click();
  await expect(course("demo-t3")).toContainText("Completed 28 Nov 2026 · expires 28 Nov 2027");
  await page.click('.side [data-view="log"]');
  const e = page.locator(".entry").first();
  await expect(e).toContainText("completed Fire safety for Anna Example");
  await expect(e).toContainText("status: required → done");
  await expect(e).toContainText("28 Nov 2027");
});

test("F15.6 Manage level assigns and completes courses; Work level can't, behind the screen too", async () => {
  await launch();
  await openPerson("demo-p4");
  await page.getByRole("button", { name: "Assign course" }).click();
  const a = page.getByTestId("assign-course");
  const options = await a.getByLabel("Course").locator("option").allTextContents();
  expect(options).toEqual(["ACLS (24 months)", "Controlled-drug handling (12 months)", "Fire safety (12 months)"]);   // not BLS or Oxygen: she has them
  await a.getByLabel("Course").selectOption({ label: "Fire safety (12 months)" });
  await a.getByRole("button", { name: "Assign" }).click();
  await expect(a).toHaveCount(0);
  await expect(page.getByTestId("prof-training").locator("li", { hasText: "Fire safety" }).locator(".badge")).toHaveText("Required");
  await page.screenshot({ path: path.join(SHOTS, "f15-training.png") });
  await page.click('.side [data-view="log"]');
  await expect(page.locator(".entry").first()).toContainText("assigned Fire safety to Dina Test");
  const why = await page.evaluate(async () => {
    const t = window.__mdTest, anna = t.door.get("person", "demo-p1"), out = [];
    for (const fn of [() => t.training.assign(anna, "demo-p4", "demo-k2"), () => t.training.complete(anna, "demo-t3", "2026-11-28")]) {
      try { await fn(); out.push("saved"); } catch (e) { out.push(e.message); }
    }
    return out;
  });
  expect(why).toEqual(["Only Manage level assigns and completes courses.", "Only Manage level assigns and completes courses."]);
});
