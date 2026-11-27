// F2 — Sign-in and levels. One test per Master Checklist line, in the real program.
// Until the server exists: a password per person on each computer; a Manage-level person gives one-time passwords (Q22 = A).
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page, dir;

async function launch({ fresh = true, offline = false, empty = false } = {}) {
  if (fresh || !dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  const env = { ...process.env, TZ: "Pacific/Port_Moresby", MD_USER_DATA: dir, MD_TEST: "1" };
  if (offline) env.MD_TEST_OFFLINE = "1"; else delete env.MD_TEST_OFFLINE;
  if (empty) env.MD_TEST_EMPTY = "1"; else delete env.MD_TEST_EMPTY;
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env });
  page = await app.firstWindow();
  await page.waitForSelector('.shell, [data-testid="signin"], [data-testid="setup"]');
}
async function close() { if (app) await app.close(); app = null; }
test.afterEach(close);

const signOut = async () => { await page.getByRole("button", { name: "Sign out" }).click(); await expect(page.getByTestId("signin")).toBeVisible(); };
const openSettings = () => page.click('.side [data-view="settings"]');
const row = (name) => page.locator("[data-person]", { hasText: name });

test("F2.1 everyone signs in as themselves; wrong passwords are refused; no 'Acting as'; changes carry the person", async () => {
  await launch();
  await expect(page.getByTestId("signin")).toBeVisible();
  await expect(page.getByTestId("demo-password")).toContainText("demo");
  await expect(page.locator("body")).not.toContainText(/acting as/i);
  await signIn(page, "Anna Example", "wrong-password");
  await expect(page.getByTestId("signin-error")).toHaveText("Wrong password. DEMO people use the password demo.");
  await expect(page.locator(".shell")).toHaveCount(0);
  await signIn(page, "Anna Example", "demo");
  await expect(page.getByTestId("who")).toHaveText("Anna Example · Work");
  await expect(page.locator("body")).not.toContainText(/acting as/i);
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 } }));
  expect(await page.evaluate(() => window.__mdTest.door.messages().at(-1).by)).toBe("demo-p1");
});

test("F2.1 (Q22 = A) a new computer: the first Management person sets it up; others get a one-time password and choose their own", async () => {
  await launch({ empty: true });
  await expect(page.getByTestId("setup")).toBeVisible();
  await page.getByLabel("Your name").fill("Cara Real");
  await page.getByLabel("Your job").fill("Base manager");
  await page.getByLabel("New password", { exact: true }).fill("short");
  await page.getByLabel("New password again").fill("short");
  await page.getByRole("button", { name: "Set up and sign in" }).click();
  await expect(page.getByTestId("signin-error")).toHaveText("At least 8 characters.");
  await page.getByLabel("New password", { exact: true }).fill("cara-pass-123");
  await page.getByLabel("New password again").fill("cara-pass-123");
  await page.getByRole("button", { name: "Set up and sign in" }).click();
  await expect(page.getByTestId("who")).toHaveText("Cara Real · Manage");
  await expect(page.locator(".demo-mark")).toHaveCount(0);                 // no DEMO data on this computer
  // Cara adds Anna and gives her a one-time password
  await openSettings();
  await page.getByRole("button", { name: "Add a person" }).click();
  await page.getByLabel("New person's name").fill("Anna Real");
  await page.getByLabel("New person's job").fill("Nurse");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(row("Anna Real")).toContainText("No password on this computer");
  await row("Anna Real").getByRole("button", { name: "One-time password" }).click();
  const code = (await page.getByTestId("one-time-code").textContent()).trim();
  expect(code).toMatch(/^[2-9A-Z]{3}-[2-9A-Z]{3}$/);
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("one-time-code")).toHaveCount(0);           // shown once
  await expect(row("Anna Real")).toContainText("One-time, not used yet");
  await signOut();
  // Anna: the one-time password, typed loosely, then her own
  await signIn(page, "Anna Real", code.toLowerCase().replace("-", " "));
  await expect(page.getByTestId("choose-own")).toBeVisible();
  await page.getByLabel("New password", { exact: true }).fill("anna-pass-123");
  await page.getByLabel("New password again").fill("anna-pass-124");
  await page.getByRole("button", { name: "Save and open" }).click();
  await expect(page.getByTestId("signin-error")).toHaveText("The two passwords are not the same.");
  await page.getByLabel("New password again").fill("anna-pass-123");
  await page.getByRole("button", { name: "Save and open" }).click();
  await expect(page.getByTestId("who")).toHaveText("Anna Real · Work");
  await signOut();
  await signIn(page, "Anna Real", code);                                    // the one-time password no longer works
  await expect(page.getByTestId("signin-error")).toHaveText("Wrong password.");
  await signIn(page, "Anna Real", "anna-pass-123");
  await expect(page.getByTestId("who")).toHaveText("Anna Real · Work");
  // passwords never leave this computer
  await page.evaluate(() => window.__mdTest.door.sync());
  const sent = await page.evaluate(() => JSON.stringify(window.__mdTest.server.log));
  for (const secret of ["cara-pass-123", "anna-pass-123", code, '"hash"', '"salt"']) expect(sent).not.toContain(secret);
});

test("F2.2 three levels, set in Settings by Management; a change takes effect at once", async () => {
  await launch();
  await signIn(page, "Cara Demo");
  await openSettings();
  const level = page.getByLabel("Level of Anna Example");
  expect(await level.locator("option").allTextContents()).toEqual(["View", "Work", "Manage"]);
  await level.selectOption("View");
  await expect(level).toHaveValue("View");
  expect(await page.evaluate(() => window.__mdTest.door.get("person", "demo-p1").level)).toBe("View");
  await signOut();
  await signIn(page, "Anna Example");
  await expect(page.getByTestId("who")).toHaveText("Anna Example · View");
  await page.evaluate(() => window.__mdTest.save({ recordType: "line", recordId: "demo-s1", op: "delta", data: { field: "qty", by: -1 } }));
  await expect(page.getByTestId("toast")).toContainText("View level can look but not change anything.");
  expect(await page.evaluate(() => window.__mdTest.door.get("line", "demo-s1").qty)).toBe(12);
});

test("F2.3 a Work-level person can't open Settings or change anyone's level (B12)", async () => {
  await launch();
  await signIn(page, "Anna Example");
  await openSettings();
  await expect(page.getByTestId("settings-locked")).toContainText("Settings are for Manage level");
  await expect(page.locator("select[aria-label^='Level of']")).toHaveCount(0);
  // and not behind the screen either: the rule is checked again where the change is saved
  const why = await page.evaluate(async () => {
    const a = window.__mdTest.accounts;
    try { await a.setLevel(a.person("demo-p1"), "demo-p1", "Manage"); return "changed"; } catch (e) { return e.message; }
  });
  expect(why).toBe("Only Manage level can change levels.");
  expect(await page.evaluate(() => window.__mdTest.door.get("person", "demo-p1").level)).toBe("Work");
  const why2 = await page.evaluate(async () => {
    const a = window.__mdTest.accounts;
    try { await a.giveOneTime(a.person("demo-p1"), "demo-p2"); return "given"; } catch (e) { return e.message; }
  });
  expect(why2).toBe("Only Manage level can give passwords.");             // nobody below Manage can become Dr Ben
  expect(await page.evaluate(() => window.__mdTest.accounts.passwordState(window.__mdTest.accounts.person("demo-p2")))).toBe("demo");
});

test("F2.4 the last Manage-level person can't be lowered; the message says why (B14)", async () => {
  await launch();
  await signIn(page, "Cara Demo");
  await openSettings();
  await page.getByLabel("Level of Dr Ben Sample").selectOption("Work");     // Ben → Work: Cara is now the only one
  await expect(page.getByLabel("Level of Dr Ben Sample")).toHaveValue("Work");
  await page.getByLabel("Level of Cara Demo").selectOption("Work");
  await expect(page.getByTestId("refusal")).toHaveText("Cara Demo is the last Manage-level person. Give someone else Manage level first, so somebody can still change settings and levels.");
  await expect(page.getByLabel("Level of Cara Demo")).toHaveValue("Manage");
  expect(await page.evaluate(() => window.__mdTest.door.get("person", "demo-p3").level)).toBe("Manage");
});

test("F2.5 nobody can archive themselves (B23); archiving someone else works and can be undone", async () => {
  await launch();
  await signIn(page, "Cara Demo");
  await openSettings();
  await row("Cara Demo").getByRole("button", { name: "Archive" }).click();
  await expect(page.getByTestId("refusal")).toHaveText("Nobody can archive themselves. Ask another Manage-level person.");
  expect(await page.evaluate(() => window.__mdTest.door.get("person", "demo-p3").state)).toBe("Active");
  await row("Dina Test").getByRole("button", { name: "Archive" }).click();
  await expect(row("Dina Test")).toHaveCount(0);
  await page.getByLabel("Show archived people").check();
  await expect(row("Dina Test")).toContainText("Archived");
  await signOut();
  expect(await page.getByLabel("Your name").locator("option").allTextContents()).not.toContain("Dina Test · Nurse");
  await signIn(page, "Cara Demo");
  await openSettings();
  await page.getByLabel("Show archived people").check();
  await row("Dina Test").getByRole("button", { name: "Restore" }).click();
  await expect(row("Dina Test").getByLabel("Level of Dina Test")).toHaveValue("Work");
});

test("F2.6 'Stay signed in on this computer' opens the program without internet, signed in; without it, the sign-in screen", async () => {
  await launch();
  await signIn(page, "Anna Example", "demo", { stay: true });
  await expect(page.getByTestId("who")).toHaveText("Anna Example · Work");
  await close();
  await launch({ fresh: false, offline: true });
  await expect(page.getByTestId("who")).toHaveText("Anna Example · Work");
  await expect(page.getByTestId("sync")).toHaveText("Offline");
  await signOut();
  await expect(page.getByTestId("signin")).toBeVisible();
  await close();
  await launch({ fresh: false, offline: true });
  await expect(page.getByTestId("signin")).toBeVisible();                   // signed out stays signed out
  await signIn(page, "Anna Example");                                       // not ticked this time
  await expect(page.getByTestId("who")).toBeVisible();
  await close();
  await launch({ fresh: false });
  await expect(page.getByTestId("signin")).toBeVisible();
});

test("F2.7 delete for good: only a mistake within 24 hours, by Manage level, logged; after that only archive", async () => {
  await launch();
  await signIn(page, "Cara Demo");
  await openSettings();
  await expect(row("Anna Example").getByRole("button", { name: "Delete (mistake)" })).toHaveCount(0); // added weeks ago
  await page.getByRole("button", { name: "Add a person" }).click();
  await page.getByLabel("New person's name").fill("Typo Persn");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await row("Typo Persn").getByRole("button", { name: "Delete (mistake)" }).click();
  await expect(row("Typo Persn")).toHaveCount(0);
  const ops = await page.evaluate(() => window.__mdTest.door.messages().filter(m => m.recordType === "person" && m.data.name === "Typo Persn" || m.op === "delete").map(m => m.op));
  expect(ops).toEqual(["create", "delete"]);                                // the log keeps both
  const late = await page.evaluate(async () => {                           // Anna was added weeks ago: archive only
    const a = window.__mdTest.accounts;
    try { await a.deleteMistake(a.person("demo-p3"), "demo-p1"); return "deleted"; } catch (e) { return e.message; }
  });
  expect(late).toBe("Delete for good is only for a mistake, within 24 hours of creating it. After that, archive it instead.");
  expect(await page.evaluate(() => window.__mdTest.door.get("person", "demo-p1").state)).toBe("Active");
  // Work level: no Settings, so no archive or delete of people
  const why = await page.evaluate(async () => {
    const a = window.__mdTest.accounts;
    try { await a.archive(a.person("demo-p1"), "demo-p4"); return "archived"; } catch (e) { return e.message; }
  });
  expect(why).toBe("Only Manage level can archive people.");
});
