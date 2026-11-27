import { describe, it, expect } from "vitest";
import { can, checkLevelChange, checkArchivePerson, checkDelete, hasControlledDrugRight, DAY_MS, LEVELS,
  makeCredential, verifyPassword, passwordProblem, oneTimePassword, normaliseOneTime, type StoredRecord } from "../src";

const P = (id: string, level: string, extra: object = {}): StoredRecord =>
  ({ id, name: id, level, state: "Active", createdAt: 0, createdBy: "x", changedAt: 0, changedBy: "x", country: "PG", ...extra });
const anna = P("Anna", "Work"), ben = P("Ben", "Manage"), cara = P("Cara", "Manage"), vic = P("Vic", "View");

describe("levels (F2.2, F2.3)", () => {
  it("there are exactly three levels", () => expect(LEVELS).toEqual(["View", "Work", "Manage"]));
  it("View looks, Work changes stock, only Manage opens Settings and changes levels", () => {
    expect(can("View", "changeStock")).toBe(false);
    expect(can("Work", "changeStock")).toBe(true);
    expect(can("Work", "openSettings")).toBe(false);
    expect(can("Work", "changeLevels")).toBe(false);
    expect(can("Manage", "openSettings")).toBe(true);
    expect(can("Admin", "openSettings")).toBe(false);          // unknown level: nothing
    expect(checkLevelChange([anna, cara], anna, anna, "Manage")).toEqual({ ok: false, why: "Only Manage level can change levels." });
  });
  it("F2.7 archive stock: Work and Manage; archive people and delete: Manage", () => {
    expect(can("Work", "archiveStock")).toBe(true);
    expect(can("Work", "archivePeople")).toBe(false);
    expect(can("Work", "deleteMistake")).toBe(false);
    expect(can("Manage", "archivePeople")).toBe(true);
  });
});

describe("last Manage-level person and archiving oneself (F2.4, F2.5)", () => {
  it("the last Manage-level person can't be lowered; the message says why", () => {
    const r = checkLevelChange([anna, cara], cara, cara, "Work");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.why).toMatch(/Cara is the last Manage-level person/);
    expect(checkLevelChange([anna, ben, cara], cara, ben, "Work").ok).toBe(true);
    expect(checkLevelChange([anna, ben, cara], cara, cara, "Work").ok).toBe(true); // Ben still manages
  });
  it("archived managers don't count", () => {
    const benGone = { ...ben, state: "Archived" };
    expect(checkLevelChange([anna, benGone, cara], cara, cara, "View").ok).toBe(false);
  });
  it("nobody can archive themselves", () => {
    const r = checkArchivePerson([anna, ben, cara], cara, cara);
    expect(!r.ok && r.why).toBe("Nobody can archive themselves. Ask another Manage-level person.");
    expect(checkArchivePerson([anna, ben, cara], cara, anna).ok).toBe(true);
    expect(checkArchivePerson([anna, ben, cara], anna, vic).ok).toBe(false);
  });
});

describe("delete for good (F2.7, REACH Q38)", () => {
  const now = Date.UTC(2026, 10, 28);
  const fresh = P("New", "Work", { createdAt: now - DAY_MS + 60_000 });
  const old = P("Old", "Work", { createdAt: now - DAY_MS - 60_000 });
  it("a mistake within 24 hours, by Manage level", () => {
    expect(checkDelete("person", fresh, cara, now).ok).toBe(true);
    expect(checkDelete("person", fresh, anna, now).ok).toBe(false);
  });
  it("after 24 hours: archive only", () => {
    const r = checkDelete("person", old, cara, now);
    expect(!r.ok && r.why).toMatch(/within 24 hours.*archive it instead/);
  });
  it("patient files and the change log are never deleted", () => {
    for (const t of ["patient", "event", "log"]) expect(checkDelete(t, fresh, cara, now).ok).toBe(false);
  });
});

describe("controlled-drug rights don't follow levels (F2.8)", () => {
  it("Manage level alone gives no controlled-drug right; the doctors' list does, at any level", () => {
    expect(hasControlledDrugRight(cara)).toBe(false);
    expect(hasControlledDrugRight(P("Doc", "Work", { cdRight: true }))).toBe(true);
    expect(hasControlledDrugRight(P("Doc", "Manage", { cdRight: true, state: "Archived" }))).toBe(false);
  });
});

describe("passwords (Q22 = A)", () => {
  it("only a check value is kept; the right password passes, a wrong one fails", async () => {
    const c = await makeCredential("correct horse", { mustChange: false, setBy: "Cara", at: 1 });
    expect(JSON.stringify(c)).not.toContain("correct horse");
    expect(await verifyPassword(c, "correct horse")).toBe(true);
    expect(await verifyPassword(c, "correct hors")).toBe(false);
    const c2 = await makeCredential("correct horse", { mustChange: false, setBy: "Cara", at: 1 });
    expect(c2.hash).not.toBe(c.hash);                          // salted
  });
  it("own passwords need 8 characters and the same twice", () => {
    expect(passwordProblem("short")).toBe("At least 8 characters.");
    expect(passwordProblem("longenough", "longenougH")).toBe("The two passwords are not the same.");
    expect(passwordProblem("longenough", "longenough")).toBeNull();
  });
  it("one-time passwords are easy to read off paper and typed loosely", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) { const p = oneTimePassword(); expect(p).toMatch(/^[2-9A-HJKMNP-Z]{3}-[2-9A-HJKMNP-Z]{3}$/); seen.add(p); }
    expect(seen.size).toBeGreaterThan(195);
    expect(normaliseOneTime("47k p9x")).toBe(normaliseOneTime("47K-P9X"));
  });
});
