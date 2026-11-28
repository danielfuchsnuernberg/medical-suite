// F14 — Staff. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SHOTS = path.join(ROOT, "docs/stage6");
let app, page, dir;

async function launch({ who = "Cara Demo", fresh = true } = {}) {
  if (fresh || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "UTC", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await page.clock.install({ time: new Date(Date.UTC(2026, 10, 27, 20, 0)) });
  await page.reload();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="staff"]');
}
test.afterEach(async () => { if (app) await app.close(); app = null; });

const row = (id) => page.locator(`.staff-table tr[data-person="${id}"]`);
const add = async (o) => {
  await page.getByRole("button", { name: "Add person" }).click();
  const d = page.getByTestId("add-person");
  await d.getByLabel("Name").fill(o.name);
  if (o.job) await d.getByLabel("Job").fill(o.job);
  if (o.dept) await d.getByLabel("Department").selectOption({ label: o.dept });
  if (o.office) await d.getByLabel("Office").selectOption(o.office);
  if (o.email !== undefined) await d.getByLabel("Email").fill(o.email);
  await d.getByRole("button", { name: "Add" }).click();
  return d;
};

test("F14.1 a new person in the Core shape; an email already in the list is refused (archived people too)", async () => {
  await launch();
  const d0 = await add({ name: "Eva Trial", job: "Doctor", dept: "Clinical", office: "Medics", email: "Eva@Example.org" });
  await expect(d0).toHaveCount(0);
  await expect(page.getByTestId("profile")).toBeVisible();
  await expect(page.getByTestId("prof-name")).toHaveText("Eva Trial");
  await expect(page.getByTestId("prof-email")).toHaveText("eva@example.org");
  await expect(page.getByTestId("prof-office")).toHaveText("Medics");
  await expect(page.getByTestId("prof-details")).toContainText("Added28 Nov 2026 by Cara Demo");
  await page.getByRole("button", { name: "Back to Staff and training" }).click();
  // the same email again, and Finn's (archived)
  let d = await add({ name: "Eva Two", email: "eva@example.org" });
  await expect(d.getByTestId("refusal")).toContainText("Someone already has that email");
  await d.getByLabel("Email").fill("finn@example.org");
  await d.getByRole("button", { name: "Add" }).click();
  await expect(d.getByTestId("refusal")).toContainText("Someone already has that email");
  await d.getByLabel("Email").fill("eva-two");
  await d.getByRole("button", { name: "Add" }).click();
  await expect(d.getByTestId("refusal")).toContainText("doesn't look like an email");
  await d.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".staff-table tbody tr")).toHaveCount(5);   // Anna, Ben, Cara, Dina, Eva
  // edit details: Dina can't take Anna's email; logged old → new
  await row("demo-p4").click();
  await page.getByRole("button", { name: "Edit details" }).click();
  const e = page.getByTestId("edit-details");
  await e.getByLabel("Email").fill("anna@example.org");
  await e.getByRole("button", { name: "Save" }).click();
  await expect(e.getByTestId("refusal")).toContainText("Someone already has that email");
  await e.getByLabel("Email").fill("dina.test@example.org");
  await e.getByLabel("Job").fill("Senior nurse");
  await e.getByRole("button", { name: "Save" }).click();
  await expect(e).toHaveCount(0);
  await expect(page.getByTestId("prof-email")).toHaveText("dina.test@example.org");
  await expect(page.getByTestId("profile")).toContainText("Senior nurse · Clinical");
  await page.screenshot({ path: path.join(SHOTS, "f14-profile-manage.png") });
  await page.click('.side [data-view="log"]');
  await expect(page.locator(".entry").first()).toContainText("dina.test@example.org");
});

test("F14.2 directory shows department, office, level and training; Show archived shows archived people faded", async () => {
  await launch({ who: "Anna Example" });
  await expect(page.locator(".staff-table tbody tr")).toHaveCount(4);
  await expect(row("demo-p1")).toContainText("Anna Example");
  await expect(row("demo-p1")).toContainText("Clinical");
  await expect(row("demo-p3")).toContainText("Management");
  await expect(row("demo-p1")).toContainText("Work");
  await expect(row("demo-p1")).toContainText("Expired certificate");
  await expect(row("demo-p5")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add person" })).toHaveCount(0);   // Work level only looks
  await page.screenshot({ path: path.join(SHOTS, "f14-staff.png") });
  await page.getByLabel("Show archived staff").check();
  await expect(row("demo-p5")).toBeVisible();
  await expect(row("demo-p5")).toHaveClass(/archived/);
  await expect(row("demo-p5")).toContainText("Archived");
  await expect(row("demo-p1")).not.toHaveClass(/archived/);
});

test("F14.3 counts never include archived people, even when shown", async () => {
  await launch();
  const staff = page.locator('[data-st="staff"] .v'), arch = page.locator('[data-st="archived"] .v');
  await expect(staff).toHaveText("4");
  await expect(arch).toHaveText("1");
  await expect(page.getByTestId("staff-counts")).toContainText("Clinical 3 · Management 1");
  await expect(page.getByTestId("staff-counts")).not.toContainText("Training");
  await page.getByLabel("Show archived staff").check();
  await expect(staff).toHaveText("4");
  await expect(page.getByTestId("staff-counts")).toContainText("even with “Show archived” ticked");
  await expect(page.getByTestId("staff-counts")).toContainText("Clinical 3 · Management 1");
  await expect(page.getByTestId("staff-counts")).not.toContainText("Training");
});

test("F14.4 archive keeps the history and can be undone; delete for good only a mistake within 24 hours, logged", async () => {
  await launch();
  await row("demo-p4").click();
  await expect(page.getByRole("button", { name: "Delete for good" })).toHaveCount(0);   // a DEMO person from the start: no mistake
  await page.locator(".prof-head").getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByTestId("confirm-archive")).toContainText("Everything they did stays in the history");
  await page.getByTestId("confirm-archive").getByRole("button", { name: "Archive" }).click();
  await expect(page.getByTestId("prof-archived")).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit details" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to Staff and training" }).click();
  await expect(row("demo-p4")).toHaveCount(0);
  await expect(page.locator('[data-st="staff"] .v')).toHaveText("3");
  await page.getByLabel("Show archived staff").check();
  await row("demo-p4").click();
  await page.getByRole("button", { name: "Restore" }).click();
  await expect(page.getByTestId("prof-archived")).toHaveCount(0);
  await page.getByRole("button", { name: "Back to Staff and training" }).click();
  // a mistake: added and deleted at once
  await add({ name: "Oops Person", email: "oops@example.org" });
  await expect(page.getByTestId("prof-name")).toHaveText("Oops Person");
  await page.getByRole("button", { name: "Delete for good" }).click();
  await page.getByTestId("confirm-delete").getByRole("button", { name: "Delete for good" }).click();
  await expect(page.getByTestId("profile")).toHaveCount(0);
  await page.getByLabel("Show archived staff").check();
  await expect(page.locator(".staff-table")).not.toContainText("Oops Person");
  await page.click('.side [data-view="log"]');
  await expect(page.locator('.entry[data-op="delete"]').first()).toContainText("(a mistake, within 24 hours)");
  await expect(page.locator(".entry", { hasText: "Dina Test" }).first()).toBeVisible();
});

test("F14.4 behind the screen: Work level can't archive or change details", async () => {
  await launch({ who: "Anna Example" });
  await row("demo-p4").click();
  await expect(page.locator(".prof-head").getByRole("button", { name: "Archive", exact: true })).toHaveCount(0);
  const why = await page.evaluate(async () => {
    const out = [];
    for (const fn of [a => a.archive(a.person("demo-p1"), "demo-p4"), a => a.setDetails(a.person("demo-p1"), "demo-p4", { job: "x" })]) {
      try { await fn(window.__mdTest.accounts); out.push("saved"); } catch (e) { out.push(String(e.message)); }
    }
    return out;
  });
  expect(why[0]).toMatch(/Manage/);
  expect(why[1]).toMatch(/Only Manage level/);
});

test("F14.5 a profile shows training, details and this week's duties; search opens it", async () => {
  await launch({ who: "Anna Example" });
  await page.getByLabel("Search staff and inventory").fill("Dina");
  await page.locator(".results .r", { hasText: "Dina Test" }).click();
  await expect(page.getByTestId("prof-name")).toHaveText("Dina Test");
  await expect(page.getByTestId("prof-email")).toHaveText("dina@example.org");
  await expect(page.getByTestId("prof-office")).toHaveText("Medics");
  await expect(page.getByTestId("prof-training")).toContainText("BLS (basic life support)");
  await expect(page.getByTestId("prof-duties")).toContainText("roster (F16, release 2)");
  await page.screenshot({ path: path.join(SHOTS, "f14-profile.png") });
  await page.click('.side [data-view="staff"]');                     // the menu goes back to the list
  await expect(page.getByTestId("profile")).toHaveCount(0);
  await expect(page.locator(".staff-table")).toBeVisible();
});
