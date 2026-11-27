// F12 — Controlled-drug register. One test per Master Checklist line, in the real program.
import { test, expect, _electron as electron } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { signIn } from "./sign-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let app, page;

async function launch(who = "Anna Example") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "md-test-"));
  app = await electron.launch({ args: [path.join(ROOT, "apps/desktop")], env: { ...process.env, TZ: "Pacific/Port_Moresby", MD_TEST: "1", MD_USER_DATA: dir } });
  page = await app.firstWindow();
  await signIn(page, who);
  await page.waitForSelector(".shell");
  await page.click('.side [data-view="cd"]');
}
const switchTo = async (who) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, who);
  await page.click('.side [data-view="cd"]');
};
test.afterEach(async () => { if (app) await app.close(); app = null; });

const dlg = (id) => page.getByTestId(id);
const pick = (scope, label, text) => scope.getByLabel(label, { exact: true }).selectOption({ label: text });
const balance = () => page.getByTestId("balance");
const rows = () => page.getByTestId("ledger").locator("tbody tr");
const lastRow = () => rows().last();
const store = () => page.evaluate(() => window.__mdTest.door.get("line", "demo-s7").qty);
async function takeOut({ mode, qty = "1", witness = "Dina Test", reason = "Pain relief · case 117", doctor, pin } = {}) {
  await page.getByRole("button", { name: "Take out" }).click();
  const d = dlg("take-out");
  if (mode) await d.getByRole("button", { name: mode }).click();
  await d.getByLabel("How many").fill(qty);
  if (witness) await pick(d, "Witness", witness);
  await d.getByLabel("Reason / case").fill(reason);
  if (doctor) await pick(d, "Doctor", doctor);
  if (pin !== undefined) await d.getByLabel("Doctor's PIN").fill(pin);
  return d;
}

test("F12.1 a running balance; every line has when, in / out / moved / correction, amount, balance, who, doctor and how, witness, reason", async () => {
  await launch("Dr Ben Sample");
  await expect(balance()).toHaveText("Balance 5 amp");
  await expect(rows()).toHaveCount(1);
  await expect(rows().first()).toContainText("Opening");
  const d = await takeOut({ qty: "2" });
  await d.getByRole("button", { name: "Take out" }).click();
  await expect(balance()).toHaveText("Balance 3 amp");
  const cells = await lastRow().locator("td").allTextContents();
  expect(cells.slice(1, 8)).toEqual(["Out", "2", "3", "Dr Ben Sample", "Dr Ben Sampletook it out personally", "Dina Test", "Pain relief · case 117"]);
  expect(cells[0]).toMatch(/^\d{1,2} \w{3} 2026, \d\d:\d\d$/);
  expect(await store()).toBe(3);                                                                   // Store and bags moved with it
  await expect(page.getByTestId("mismatch")).toHaveCount(0);
  // Activity says it in words
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log")).toContainText("took out 2 Morphine 10 mg/ml (demo) as a doctor (witness Dina Test)");
});

test("F12.2 only a doctor takes out or approves; Manage level gives no right here", async () => {
  await launch("Cara Demo");                                                                       // Manage, not a doctor
  const d = await takeOut({});
  await expect(d.getByRole("group", { name: "Doctor's approval" })).toBeVisible();                 // she needs a doctor like any nurse
  await expect(d.getByText("You're a doctor")).toHaveCount(0);
  await d.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByTestId("doctors-lock")).toHaveText(/Only a doctor can change this list. Manage level doesn't change that./);
  const why = await page.evaluate(async () => {
    const t = window.__mdTest; const cara = t.door.get("person", "demo-p3");
    try { await t.register.takeOut(cara, { itemId: "demo-i5", lineId: "demo-s7", qty: 1, witness: "demo-p4", reason: "x", how: "self" }); return "booked"; } catch (e) { return e.message; }
  });
  expect(why).toBe("Only a doctor can do this. Manage level gives no right here.");
  expect(await store()).toBe(5);
});

test("F12.3 with a doctor's approval: PIN in the room, or a request (Approve / Ask / Refuse, red badge until answered); nothing comes off until approved; a refusal stays, crossed out", async () => {
  await launch();
  // in the room: wrong PIN, then right
  let d = await takeOut({ doctor: "Dr Ben Sample", pin: "0000" });
  await d.getByRole("button", { name: "Take out" }).click();
  await expect(d.getByTestId("refusal")).toHaveText("That isn't Dr Ben Sample's PIN. Nothing was booked.");
  await d.getByLabel("Doctor's PIN").fill("1234");                                                // the DEMO doctor's PIN
  await d.getByRole("button", { name: "Take out" }).click();
  await expect(balance()).toHaveText("Balance 4 amp");
  await expect(lastRow()).toContainText("in the room (PIN)");
  // by request
  d = await takeOut({ mode: "Ask a doctor", qty: "2", doctor: "Dr Ben Sample" });
  await d.getByRole("button", { name: "Send for approval" }).click();
  await expect(balance()).toHaveText("Balance 4 amp");                                            // nothing off yet
  expect(await store()).toBe(4);
  await expect(lastRow()).toContainText("waiting for doctor");
  await expect(page.getByTestId("my-requests")).toContainText("Your request: 2 × Morphine 10 mg/ml (demo) is waiting for Dr Ben Sample");
  // the doctor: red badge, Ask, then Approve
  await switchTo("Dr Ben Sample");
  await expect(page.getByTestId("badge-cd")).toHaveText("1");
  await page.getByTestId("waiting").getByRole("button", { name: "Ask Anna" }).click();
  await dlg("ask").getByRole("button", { name: "Send" }).click();
  await expect(page.getByTestId("badge-cd")).toHaveText("1");                                     // still waiting
  await page.getByTestId("waiting").getByRole("button", { name: "Approve" }).click();
  await expect(page.getByTestId("badge-cd")).toHaveCount(0);
  await expect(balance()).toHaveText("Balance 2 amp");
  expect(await store()).toBe(2);
  // a refusal stays visible, crossed out, and never counts
  await switchTo("Anna Example");
  await expect(page.getByTestId("my-requests")).toHaveCount(0);
  d = await takeOut({ mode: "Ask a doctor", doctor: "Dr Ben Sample" });
  await d.getByRole("button", { name: "Send for approval" }).click();
  await switchTo("Dr Ben Sample");
  await page.getByTestId("waiting").getByRole("button", { name: "Refuse" }).click();
  await expect(lastRow()).toHaveAttribute("data-status", "refused");
  await expect(lastRow()).toContainText("refused");
  expect(await lastRow().locator("td").nth(2).evaluate(el => getComputedStyle(el).textDecorationLine)).toBe("line-through");
  await expect(balance()).toHaveText("Balance 2 amp");
});

test("F12.4 emergency: reason and witness required; booked at once; red on Home and in the register until a doctor approves or queries", async () => {
  await launch();
  let d = await takeOut({ mode: "Emergency, no doctor reachable", reason: "" });
  await d.getByRole("button", { name: "Book as emergency" }).click();
  await expect(d.getByTestId("refusal")).toHaveText("Give a reason or case. Nothing was booked.");
  await d.getByLabel("Reason / case").fill("Cardiac arrest on the airstrip");
  await d.getByRole("button", { name: "Book as emergency" }).click();
  await expect(balance()).toHaveText("Balance 4 amp");                                            // booked at once
  await expect(lastRow()).toContainText("emergency · waiting for doctor");
  await page.click(".logo");
  await expect(page.getByTestId("home-emergency")).toContainText("1 controlled-drug emergency waiting for a doctor");
  await switchTo("Dr Ben Sample");
  await expect(page.getByTestId("waiting")).toContainText("gave as an emergency");
  await expect(page.getByTestId("waiting").getByRole("button", { name: "Refuse" })).toHaveCount(0);   // already given
  await page.getByTestId("waiting").getByRole("button", { name: "Approve" }).click();
  await expect(lastRow()).toContainText("approved afterwards");
  await page.click(".logo");
  await expect(page.getByTestId("home-emergency")).toHaveCount(0);
});

test("F12.5 every line has a witness: never yourself, never the approving doctor", async () => {
  await launch();
  const d = await takeOut({ witness: null, doctor: "Dr Ben Sample", pin: "1234" });
  await d.getByRole("button", { name: "Take out" }).click();
  await expect(d.getByTestId("refusal")).toHaveText("A witness has to sign: someone who was there. Nothing was booked.");
  // you and the chosen doctor aren't offered as witnesses
  const offered = await d.getByLabel("Witness", { exact: true }).locator("option").allTextContents();
  expect(offered).not.toContain("Anna Example");
  expect(offered).not.toContain("Dr Ben Sample");
  // and not behind the screen either
  const why = await page.evaluate(async () => {
    const t = window.__mdTest; const anna = t.door.get("person", "demo-p1"); const out = [];
    for (const w of ["demo-p1", "demo-p2"]) {
      try { await t.register.takeOut(anna, { itemId: "demo-i5", lineId: "demo-s7", qty: 1, witness: w, reason: "x", how: "pin", doctor: "demo-p2", pin: "1234" }); out.push("booked"); } catch (e) { out.push(e.message); }
    }
    return out;
  });
  expect(why).toEqual(["You can't be your own witness. Pick a second person.", "The approving doctor can't also be the witness. Pick a second person."]);
});

test("F12.6 only a doctor gives the right, never to themselves; the first doctor is set once; Manage can't change the list", async () => {
  await launch("Dr Ben Sample");
  const doctors = page.getByTestId("doctors");
  const offered = await doctors.getByLabel("Give the right to").locator("option").allTextContents();
  expect(offered.some(o => o.startsWith("Dr Ben Sample"))).toBe(false);                             // not himself
  await doctors.getByLabel("Give the right to").selectOption({ label: "Dina Test · Nurse" });
  await doctors.getByRole("button", { name: "Give the right" }).click();
  await expect(doctors.locator("li[data-doctor]")).toHaveCount(2);
  await expect(page.getByTestId("rights-log")).toContainText("Dr Ben Sample gave Dina Test the right");
  // Manage level can't
  await switchTo("Cara Demo");
  await expect(page.getByTestId("doctors").getByLabel("Give the right to")).toHaveCount(0);
  const why = await page.evaluate(async () => { const t = window.__mdTest; try { await t.register.grant(t.door.get("person", "demo-p3"), "demo-p1"); return "given"; } catch (e) { return e.message; } });
  expect(why).toBe("Only a doctor can give this right. Manage level can't change the list.");   // not behind the screen either
  // the first doctor: when nobody has the right, Management sets one, once
  await page.evaluate(async () => { const t = window.__mdTest; for (const id of ["demo-p2", "demo-p4"]) await t.door.apply({ recordType: "person", recordId: id, op: "set", data: { cdRight: false }, by: "demo-p3" }); });
  await expect(page.getByTestId("no-doctor")).toContainText("Set the first doctor now: this is done once.");
  await page.getByTestId("doctors").getByLabel("Give the right to").selectOption({ label: "Dr Ben Sample · Doctor" });
  await page.getByTestId("doctors").getByRole("button", { name: "Set as first doctor" }).click();
  await expect(page.getByTestId("no-doctor")).toHaveCount(0);
  await expect(page.getByTestId("doctors").getByLabel("Give the right to")).toHaveCount(0);        // once: then it's doctors only
});

test("F12.7 a doctor removes a right with ✕; logged and every doctor sees it; the last doctor can't be removed", async () => {
  await launch("Dr Ben Sample");
  await page.getByRole("button", { name: "Remove Dr Ben Sample's right to approve" }).click();
  await dlg("revoke").getByRole("button", { name: "Remove" }).click();
  await expect(dlg("revoke").getByTestId("refusal")).toContainText("Dr Ben Sample is the only person who can approve controlled drugs. Give the right to someone else first.");
  await dlg("revoke").getByRole("button", { name: "Cancel" }).click();
  await page.getByTestId("doctors").getByLabel("Give the right to").selectOption({ label: "Dina Test · Nurse" });
  await page.getByTestId("doctors").getByRole("button", { name: "Give the right" }).click();
  await page.getByRole("button", { name: "Remove Dina Test's right to approve" }).click();
  await dlg("revoke").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByTestId("doctors").locator("li[data-doctor]")).toHaveCount(1);
  await expect(page.getByTestId("rights-log")).toContainText("Dr Ben Sample removed Dina Test's right");
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log").locator("li.entry").first().locator(".oldnew")).toHaveText("doctor's right: yes → no");
});

test("F12.8 lines are never edited or deleted; a doctor adds a correction naming the original; the balance can't go below 0", async () => {
  await launch("Dr Ben Sample");
  const d = await takeOut({ qty: "2" });
  await d.getByRole("button", { name: "Take out" }).click();
  await expect(page.getByTestId("ledger").getByRole("button", { name: /Edit|Delete/ })).toHaveCount(0);
  await lastRow().getByRole("button", { name: "Correct" }).click();
  const c = dlg("correct");
  await c.getByLabel("Change to the balance").fill("-4");
  await pick(c, "Witness", "Dina Test");
  await c.getByLabel("What was wrong").fill("x");
  await c.getByRole("button", { name: "Add correction" }).click();
  await expect(c.getByTestId("refusal")).toHaveText("That would take the balance below 0. Nothing was added.");
  await c.getByLabel("Change to the balance").fill("+1");
  await c.getByLabel("What was wrong").fill("1 ampoule not given, put back");
  await c.getByRole("button", { name: "Add correction" }).click();
  await expect(balance()).toHaveText("Balance 4 amp");
  await expect(lastRow()).toContainText("Correction");
  await expect(lastRow()).toContainText("corrects the line of");
  await expect(rows().nth(1)).toContainText("Out");                                                 // the original stays as it was
  await expect(rows().nth(1).locator("td").nth(2)).toHaveText("2");
  // behind the screen: a change message is ignored, and Activity says so
  await page.evaluate(async () => { const t = window.__mdTest; const id = t.door.records("cdline").find(l => l.kind === "out").id; await t.door.apply({ recordType: "cdline", recordId: id, op: "set", data: { qty: 0 }, by: "demo-p2" }); });
  await expect(rows().nth(1).locator("td").nth(2)).toHaveText("2");
  await page.click('.side [data-view="log"]');
  await expect(page.getByTestId("log").locator("li.entry").first()).toContainText("tried to change the controlled-drug register: ignored");
});

test("F12.9 receiving needs a witness, no doctor", async () => {
  await launch();                                                                                  // Anna, a nurse
  await page.getByRole("button", { name: "Receive" }).click();
  const r = dlg("receive");
  await r.getByLabel("How many").fill("3");
  await r.getByLabel("From where").fill("Delivery, invoice 4471");
  await r.getByLabel("Lot").fill("M-3");
  await r.getByLabel("Expiry").fill("2027-07-24");
  await r.getByRole("button", { name: "Receive" }).click();
  await expect(r.getByTestId("refusal")).toHaveText("A witness has to sign: someone who was there. Nothing was booked.");
  await pick(r, "Witness", "Dina Test");
  await r.getByRole("button", { name: "Receive" }).click();
  await expect(balance()).toHaveText("Balance 8 amp");
  await expect(lastRow()).toContainText("not needed");                                             // no doctor
  expect(await store()).toBe(8);                                                                   // joined the same lot
});

test("F12.10 taking out more than the balance is refused", async () => {
  await launch("Dr Ben Sample");
  const d = await takeOut({ qty: "6" });
  await d.getByRole("button", { name: "Take out" }).click();
  await expect(d.getByTestId("refusal")).toHaveText("Only 5 on hand, so 6 can't be taken. Nothing was booked.");
  await expect(balance()).toHaveText("Balance 5 amp");
});

test("F12.11 moving between the Store and a bag: a Moved line with a witness, no doctor; the balance doesn't change; the item page shows where it is (Q25 = A)", async () => {
  await launch();
  await page.getByRole("button", { name: "Move" }).click();
  const m = dlg("cd-move");
  await m.getByLabel("Move to").selectOption({ label: "Bag 1 (adult)" });
  await m.getByLabel("How many").fill("2");
  await m.getByRole("button", { name: "Move" }).click();
  await expect(m.getByTestId("refusal")).toContainText("A witness has to sign");
  await pick(m, "Witness", "Dina Test");
  await m.getByRole("button", { name: "Move" }).click();
  await expect(rows()).toHaveCount(2);                                                            // the balance is 5 before and after, so wait for the line
  await expect(balance()).toHaveText("Balance 5 amp");
  const cells = await lastRow().locator("td").allTextContents();
  expect(cells.slice(1, 8)).toEqual(["Moved", "2", "5", "Anna Example", "not needed", "Dina Test", "Store (main) → Bag 1 (adult)"]);
  await expect(page.locator('[data-drug="demo-i5"]')).toContainText("Store (main), Bag 1 (adult)");
  // the item page shows both places
  await page.click('.side [data-view="where"]');
  await page.getByTestId("lines").locator(".rowlink", { hasText: "Morphine" }).first().click();
  await expect(page.getByTestId("total")).toHaveText("5 on hand · 2 lines");
  await expect(page.getByTestId("lines").locator("li[data-line]", { hasText: "Bag 1 (adult)" }).locator(".d")).toContainText("2 amp");
});

test("data from before F12: a drug with stock but no register; a doctor opens it at what is on the shelves, with a witness", async () => {
  await launch("Dr Ben Sample");
  await page.evaluate(async () => {
    const d = window.__mdTest.door;
    await d.apply({ recordType: "item", recordId: "old-cd", op: "create", data: { name: "Ketamine (old)", controlled: true, unit: "vial" }, by: "demo-p3" });
    await d.apply({ recordType: "line", recordId: "old-line", op: "create", data: { itemId: "old-cd", locationId: "demo-l0", qty: 3, required: null, lot: "", expiry: null }, by: "demo-p3" });
  });
  await page.locator('[data-drug="old-cd"]').click();
  await expect(page.getByTestId("not-opened")).toContainText("This drug has no register yet; the Store and bags hold 3.");
  await page.getByRole("button", { name: "Open the register at 3" }).click();
  await pick(dlg("open-register"), "Witness", "Dina Test");
  await dlg("open-register").getByRole("button", { name: "Open at 3" }).click();
  await expect(balance()).toHaveText("Balance 3 vial");
  await expect(page.getByTestId("not-opened")).toHaveCount(0);
  await expect(page.getByTestId("mismatch")).toHaveCount(0);
});
