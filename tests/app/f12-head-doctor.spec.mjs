// F12.12–F12.15 — Doctors, medical codes, Head Doctors and the Controlled drug tick (Danny with the medical staff, 28 Nov).
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
const switchTo = async (who) => { await page.getByRole("button", { name: "Sign out" }).click(); await signIn(page, who); };
test.afterEach(async () => { if (app) await app.close(); app = null; });

const row = (id) => page.locator(`[data-person="${id}"]`);
const settings = () => page.click('.side [data-view="settings"]');
const get = (id) => page.evaluate((id) => window.__mdTest.door.get("person", id), id);
const openItem = async (name) => { await page.click('.side [data-view="where"]'); await page.getByTestId("lines").locator(".rowlink", { hasText: name }).first().click(); };

test("F12.12 Management sets the profession; someone entered as a doctor types their own medical code at sign-in; unique; logged", async () => {
  await launch();
  await settings();
  await expect(row("demo-p1").getByLabel("Profession of Anna Example")).toHaveValue("Nurse");
  await row("demo-p4").getByLabel("Profession of Dina Test").selectOption("Doctor");
  await expect(row("demo-p4").getByTestId("code-missing")).toHaveText("medical code not typed yet");
  await switchTo("Dina Test");
  await expect(page.getByTestId("medical-code")).toBeVisible();                                  // asked before the program opens
  await expect(page.locator(".shell")).toHaveCount(0);
  await page.getByLabel("Medical code").fill("demo-md-0001");                                     // Dr Ben's
  await page.getByRole("button", { name: "Save and open" }).click();
  await expect(page.getByTestId("medical-code")).toContainText("That medical code belongs to someone else here.");
  await page.getByLabel("Medical code").fill("PNG-MB 4471");
  await page.getByRole("button", { name: "Save and open" }).click();
  await page.waitForSelector(".shell");
  expect((await get("demo-p4")).medicalCode).toBe("PNG-MB 4471");
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log").locator("li.entry").first()).toContainText("Dina Test");
  await expect(page.getByTestId("log").locator("li.entry").first().locator(".oldnew")).toHaveText("medical code: — → PNG-MB 4471");
  // Work level can't set a profession, not even behind the screen
  const why = await page.evaluate(async () => { const t = window.__mdTest; try { await t.accounts.setProfession(t.door.get("person", "demo-p4"), "demo-p1", "Doctor"); return "set"; } catch (e) { return e.message; } });
  expect(why).toBe("Only Manage level sets a profession.");
});

test("F12.13 only a doctor with a medical code can be on the doctors' list", async () => {
  await launch("Dr Ben Sample");
  await page.click('.side [data-view="cd"]');
  const offered = () => page.getByTestId("doctors").getByLabel("Give the right to").locator("option").allTextContents();
  expect((await offered()).some(o => o.startsWith("Anna") || o.startsWith("Dina"))).toBe(false);   // nurses aren't offered
  await page.evaluate(() => window.__mdTest.door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { profession: "Doctor" }, by: "demo-p3" }));
  expect((await offered()).some(o => o.startsWith("Dina"))).toBe(false);                            // no code yet
  await page.evaluate(() => window.__mdTest.door.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { medicalCode: "MD-44" }, by: "demo-p4" }));
  expect((await offered()).some(o => o.startsWith("Dina"))).toBe(true);
  const why = await page.evaluate(async () => { const t = window.__mdTest; try { await t.register.grant(t.door.get("person", "demo-p2"), "demo-p1"); return "given"; } catch (e) { return e.message; } });
  expect(why).toBe("Only a doctor with a medical code can be on this list. Anna Example isn't entered as a doctor.");
});

test("F12.14 Management names the one Head Doctor; a lone doctor is it automatically; without one Management sees a red note", async () => {
  await launch();
  await settings();
  await expect(row("demo-p2").getByLabel("Head Doctor: Dr Ben Sample")).toBeChecked();              // the only doctor
  await expect(row("demo-p2").getByLabel("Head Doctor: Dr Ben Sample")).toBeDisabled();
  await expect(row("demo-p2")).toContainText("Head Doctor (the only doctor)");
  // a second doctor joins: nobody is Head Doctor until Management names one
  await page.evaluate(async () => { const d = window.__mdTest.door; await d.apply({ recordType: "person", recordId: "demo-p4", op: "set", data: { profession: "Doctor", medicalCode: "MD-44", cdRight: true }, by: "demo-p2" }); });
  await page.click(".logo");
  await expect(page.getByTestId("home-no-head")).toContainText("No Head Doctor.");
  await settings();
  await row("demo-p4").getByLabel("Head Doctor: Dina Test").click();
  await expect(row("demo-p4").getByLabel("Head Doctor: Dina Test")).toBeChecked();
  await row("demo-p2").getByLabel("Head Doctor: Dr Ben Sample").click();                            // only one: it moves to Ben
  await expect(row("demo-p2").getByLabel("Head Doctor: Dr Ben Sample")).toBeChecked();
  await expect(row("demo-p4").getByLabel("Head Doctor: Dina Test")).not.toBeChecked();
  expect(await page.evaluate(() => window.__mdTest.register.heads().map(p => p.id))).toEqual(["demo-p2"]);
  await page.click(".logo");
  await expect(page.getByTestId("home-no-head")).toHaveCount(0);
  await page.click('.side [data-view="cd"]');
  await expect(page.getByTestId("doctors").getByTestId("head-badge")).toHaveCount(1);
  await expect(page.getByTestId("doctors").locator('[data-doctor="demo-p2"]').getByTestId("head-badge")).toHaveText("Head Doctor");
  // Management still can't do anything else: no ticking of drugs
  await openItem("Saline");
  await expect(page.getByTestId("cd-box").getByLabel("Controlled drug")).toBeDisabled();
  // and not as Work level
  const why = await page.evaluate(async () => { const t = window.__mdTest; try { await t.register.setHead(t.door.get("person", "demo-p1"), "demo-p2", false); return "done"; } catch (e) { return e.message; } });
  expect(why).toBe("Only Management names Head Doctors.");
});

test("F12.15 only a Head Doctor ticks Controlled drug, after a confirm box with a witness that opens the register; unticking asks why; the history stays", async () => {
  await launch("Anna Example");
  await openItem("Saline");
  await expect(page.getByTestId("cd-box").getByLabel("Controlled drug")).toBeDisabled();
  await expect(page.getByTestId("cd-box")).toContainText("only a Head Doctor changes this");
  await switchTo("Dr Ben Sample");                                                                    // the only doctor: Head Doctor
  await openItem("Saline");
  await page.getByTestId("cd-box").getByLabel("Controlled drug").click();
  const c = page.getByTestId("cd-confirm");
  await expect(c).toContainText("Make Saline 0.9% 500 ml a controlled drug?");
  await expect(c.getByTestId("cd-shelves")).toHaveText("28");                                         // Bag 1 and the Store
  await c.getByRole("button", { name: "Yes, make it controlled" }).click();
  await expect(c.getByTestId("refusal")).toHaveText("A witness has to sign: someone who was there. Nothing was changed.");
  await c.getByLabel("Witness").selectOption({ label: "Dina Test" });
  await c.getByRole("button", { name: "Yes, make it controlled" }).click();
  await expect(c).toHaveCount(0);
  await expect(page.getByTestId("cd-box").getByLabel("Controlled drug")).toBeChecked();
  // now its stock goes through the register only
  await page.getByRole("button", { name: "Dispense Bag 1 (adult)" }).click();
  await expect(page.getByTestId("cd-note")).toContainText("This is a controlled drug.");
  await page.getByTestId("adjust").getByRole("button", { name: "Close" }).click();
  await page.click('.side [data-view="cd"]');
  await page.locator('[data-drug="demo-i2"]').click();
  await expect(page.getByTestId("balance")).toHaveText("Balance 28 bag");
  await expect(page.getByTestId("ledger").locator("tbody tr")).toHaveCount(1);
  await expect(page.getByTestId("ledger").locator("tbody tr").first().locator("td").nth(1)).toHaveText("Opening");
  await expect(page.getByTestId("ledger").locator("tbody tr").first()).toContainText("Made a controlled drug: what the Store and bags held");
  // untick: a reason, and the register stays read-only
  await openItem("Saline");
  await page.getByTestId("cd-box").getByLabel("Controlled drug").click();
  await page.getByTestId("cd-confirm").getByRole("button", { name: "Yes, no longer controlled" }).click();
  await expect(page.getByTestId("cd-confirm").getByTestId("refusal")).toContainText("Say why it is no longer a controlled drug.");
  await page.getByTestId("cd-confirm").getByLabel("Why").fill("Ticked by mistake");
  await page.getByTestId("cd-confirm").getByRole("button", { name: "Yes, no longer controlled" }).click();
  await expect(page.getByTestId("cd-box").getByLabel("Controlled drug")).not.toBeChecked();
  await page.click('.side [data-view="cd"]');
  await page.locator('[data-drug="demo-i2"]').click();
  await expect(page.getByTestId("former")).toContainText("No longer a controlled drug: Ticked by mistake. Its register stays here, read-only.");
  await expect(page.getByRole("button", { name: "Take out" })).toHaveCount(0);
  // a Manage-level non-doctor can't, even behind the screen
  const why = await page.evaluate(async () => { const t = window.__mdTest; try { await t.register.setControlled(t.door.get("person", "demo-p3"), "demo-i1", true, { witness: "demo-p4" }); return "ticked"; } catch (e) { return e.message; } });
  expect(why).toBe("Only a Head Doctor marks a drug as controlled.");
});
