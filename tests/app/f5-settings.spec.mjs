// F5 — Settings and country settings. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;

async function launch({ who = "Cara Demo", tz = "Pacific/Port_Moresby", fresh = true } = {}) {
  if (fresh || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: tz, MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await signIn(page, who);
  await page.waitForSelector(".shell");
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const openSettings = () => page.click('.side [data-view="settings"]');
const list = (kind) => page.getByTestId(`list-${kind}`);
const entry = (kind, name) => list(kind).locator("li[data-entry]", { hasText: name });

test("F5.1 country settings: base name, country, time zone, date style, shift times", async () => {
  await launch();
  await openSettings();
  const base = page.getByTestId("base-settings");
  await expect(page.getByLabel("Base name")).toHaveValue("Port Moresby base");
  await expect(page.getByLabel("Time zone")).toHaveValue("Pacific/Port_Moresby");
  await page.getByLabel("Base name").fill("Lima base");
  await page.getByLabel("Country").selectOption("PE");
  await expect(page.getByLabel("Time zone")).toHaveValue("America/Lima");          // the country's time zone is proposed
  await page.getByLabel("Date style").selectOption("short");
  await page.getByLabel("Day shift").fill("08:00-20:00");
  await page.getByLabel("Night shift").fill("20:00–08:00");
  await base.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("saved")).toHaveText("Saved");
  await expect(page.locator(".logo small")).toHaveText("Lima base");
  expect(await page.evaluate(() => window.__mdTest.door.get("settings", "base"))).toMatchObject({ baseName: "Lima base", country: "PE", timeZone: "America/Lima", dateStyle: "short", dayShift: "08:00–20:00", nightShift: "20:00–08:00" });
  await page.getByLabel("Day shift").fill("7 till 7");
  await base.getByRole("button", { name: "Save" }).click();
  await expect(base.getByTestId("refusal")).toHaveText("Day shift: write it as 07:00–19:00 (24-hour).");
  // the change is in the activity log, old → new
  await page.click('.side [data-view="log"]');
  const first = page.getByTestId("log").locator("li.entry").first();
  await expect(first).toContainText("changed the base settings");
  await expect(first.locator(".oldnew", { hasText: "country" })).toHaveText("country: PG → PE");
  await expect(first.locator(".oldnew", { hasText: "base name" })).toHaveText("base name: Port Moresby base → Lima base");
});

test("F5.2 'today' and every expiry follow the base's time zone, not the computer's: PNG after 10:00, Peru after 19:00 (B13)", async () => {
  // The computer runs on UTC (as the June bug did). It is 28 Nov 2026, 00:30 UTC:
  // 10:30 on 28 Nov in Port Moresby, 19:30 on 27 Nov in Lima. Glucose gel (DEMO) expires 28 Nov.
  await launch({ tz: "UTC" });
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 28, 0, 30)) });
  await page.reload();
  await signIn(page, "Cara Demo");
  await page.waitForSelector(".shell");
  await expect(page.getByTestId("today")).toHaveText("Saturday 28 November 2026");
  await page.fill('[aria-label="Search staff and inventory"]', "glucose");
  await expect(page.locator(".results [data-expiry]")).toHaveText("Expires today");             // not "Expired"
  await page.keyboard.press("Escape");
  await openSettings();
  await page.getByLabel("Country").selectOption("PE");
  await page.getByTestId("base-settings").getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("saved")).toBeVisible();
  await page.click(".logo");
  await expect(page.getByTestId("today")).toHaveText("Friday 27 November 2026");
  await page.fill('[aria-label="Search staff and inventory"]', "glucose");
  await expect(page.locator(".results [data-expiry]")).toHaveText("Expires tomorrow");          // not "Expires today" or "Expired"
});

test("F5.3 every box in Settings looks like every other box in the app (B8)", async () => {
  await launch();
  await openSettings();
  await page.getByRole("button", { name: "Add a person" }).click();                             // a box from elsewhere (F2)
  const looks = await page.evaluate(() => {
    const pick = (el) => { const s = getComputedStyle(el); return [s.borderTopWidth, s.borderTopStyle, s.borderTopColor, s.borderRadius, s.fontSize, s.fontFamily].join("|"); };
    const ref = pick(document.querySelector('[aria-label="New person\'s name"]'));
    const boxes = [...document.querySelectorAll('.settings input:not([type=checkbox]), .settings select')].filter(el => !el.closest("[data-testid=people-access]"));
    return { ref, n: boxes.length, odd: boxes.filter(el => pick(el) !== ref && !(el.matches(".rename input, .addrow input, .months input") && pick(el).split("|").slice(0, 4).join("|") === ref.split("|").slice(0, 4).join("|"))).map(el => el.getAttribute("aria-label")) };
  });
  expect(looks.n).toBeGreaterThan(8);
  expect(looks.odd).toEqual([]);
  expect(looks.ref.startsWith("1px|solid|")).toBe(true);                                        // not the browser's default 2px inset box
});

test("F5.4 a department or category in use, even only by archived records, can't be deleted; the message says who uses it (B21)", async () => {
  await launch();
  await openSettings();
  await entry("department", "Training").getByRole("button", { name: "Delete" }).click();
  await expect(list("department").getByTestId("refusal")).toHaveText("“Training” is still used by Finn Former (archived), so it can't be deleted. Archive it instead: it disappears from the lists, and those records keep it.");
  await entry("category", "icu").getByRole("button", { name: "Delete" }).click();
  await expect(list("category").getByTestId("refusal")).toContainText("“icu” is still used by Old suction tubing (demo) (archived)");
  await entry("department", "Training").getByRole("button", { name: "Archive" }).click();
  await expect(entry("department", "Training")).toHaveCount(0);
  expect(await page.evaluate(() => window.__mdTest.door.get("person", "demo-p5").departmentId)).toBe("demo-d4");   // Finn keeps it
  await page.getByLabel("Show archived departments").check();
  await expect(entry("department", "Training")).toContainText("archived");
  // a new, unused entry added by mistake can be deleted
  await list("department").getByLabel("New department").fill("Pharmcy");
  await list("department").getByRole("button", { name: "Add" }).click();
  await entry("department", "Pharmcy").getByRole("button", { name: "Delete" }).click();
  await expect(entry("department", "Pharmcy")).toHaveCount(0);
});

test("F5.5 renaming only the capitals is allowed (icu → ICU); a real duplicate is refused (B24 part)", async () => {
  await launch();
  await openSettings();
  await entry("category", "icu").getByRole("button", { name: "Rename" }).click();
  await page.getByLabel("New name for icu").fill("ICU");
  await list("category").getByRole("button", { name: "Save" }).click();
  await expect(entry("category", "ICU").locator(".en")).toContainText("ICU");
  await entry("category", "ICU").getByRole("button", { name: "Rename" }).click();
  await page.getByLabel("New name for ICU").fill("fluids");
  await list("category").getByRole("button", { name: "Save" }).click();
  await expect(list("category").getByTestId("refusal")).toHaveText("“Fluids” is already there.");
  await list("department").getByLabel("New department").fill("clinical");
  await list("department").getByRole("button", { name: "Add" }).click();
  await expect(list("department").getByTestId("refusal")).toHaveText("“Clinical” is already there.");
});

test("F5.6 departments, inventory categories, courses and bags are managed here", async () => {
  await launch();
  await openSettings();
  expect(await list("department").locator("li[data-entry] .en").evaluateAll(es => es.map(e => e.firstChild.textContent))).toEqual(["Clinical", "Logistics", "Management", "Training"]);
  await list("category").getByLabel("New category").fill("Obstetrics");
  await list("category").getByRole("button", { name: "Add" }).click();
  await expect(entry("category", "Obstetrics")).toBeVisible();
  await list("course").getByLabel("New course").fill("Neonatal resuscitation");
  await list("course").getByLabel("Valid for (months)").fill("24");
  await list("course").getByRole("button", { name: "Add" }).click();
  await expect(entry("course", "Neonatal resuscitation")).toContainText("valid 24 months");
  await entry("course", "Oxygen refresher").getByRole("button", { name: "Change" }).click();
  await page.getByLabel("Months valid for Oxygen refresher").fill("3");
  await list("course").getByRole("button", { name: "Save" }).click();
  await expect(entry("course", "Oxygen refresher")).toContainText("valid 3 months");
  await list("bag").getByLabel("New bag").fill("Bag 3 (obstetric)");
  await list("bag").getByRole("button", { name: "Add" }).click();
  await expect(entry("bag", "Bag 3 (obstetric)")).toContainText("not used");
  await entry("bag", "Bag 1 (adult)").getByRole("button", { name: "Archive" }).click();
  await expect(list("bag").getByTestId("refusal")).toHaveText("Bag 1 (adult) still has 2 stock lines. Move or archive them first.");
  await expect(list("bag").locator("li[data-entry]")).toHaveCount(4);                           // 3 DEMO bags + the new one; the Store isn't a bag
});

test("F5.7 only Manage level changes settings; everyone else can look (Q23 = C)", async () => {
  await launch({ who: "Anna Example" });
  await openSettings();
  await expect(page.getByTestId("settings-readonly")).toBeVisible();
  await expect(page.getByLabel("Base name")).toHaveValue("Port Moresby base");                 // she can look
  await expect(page.getByLabel("Base name")).toBeDisabled();
  await expect(page.getByLabel("Time zone")).toBeDisabled();
  await expect(entry("department", "Clinical")).toBeVisible();
  await expect(page.locator(".settings").getByRole("button", { name: /^(Save|Add|Rename|Change|Archive|Delete|Restore)$/ })).toHaveCount(0);
  await expect(page.getByTestId("people-access")).toHaveCount(0);
  const why = await page.evaluate(async () => {
    const t = window.__mdTest; const anna = t.door.get("person", "demo-p1");
    const out = [];
    for (const f of [() => t.settings.saveBase(anna, { ...t.door.get("settings", "base"), baseName: "Anna's base" }), () => t.settings.add(anna, "department", "X"), () => t.settings.delete(anna, "category", "cat-icu")]) {
      try { await f(); out.push("changed"); } catch (e) { out.push(e.message); }
    }
    return out;
  });
  expect(why).toEqual(["Only Manage level changes settings.", "Only Manage level changes settings.", "Only Manage level changes settings."]);
  expect(await page.evaluate(() => window.__mdTest.door.get("settings", "base").baseName)).toBe("Port Moresby base");
});
