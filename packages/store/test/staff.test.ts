import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, Accounts } from "../src";
import { demoSeedChanges, staffCounts, emailProblem, OFFICES, initials } from "@md/core";

// F14 — Staff: this app's own people list in the REACH Core shape.
let clock = Date.UTC(2026, 10, 28, 9, 0);
const now = () => (clock += 1000);
const open = async () => { const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now }); return { door, acc: new Accounts(door) }; };

describe("F14 staff", () => {
  it("F14.1 a new person has a hidden ID, name, office and stamps; an email already in the list is refused, archived people too", async () => {
    const { door, acc } = await open();
    const cara = acc.person("demo-p3")!;
    const eva = await acc.addPerson(cara, { name: "Eva Trial", job: "Doctor", level: "Work", email: " Eva@Example.org ", office: "Medics", departmentId: "demo-d1" });
    expect(eva.id).not.toMatch(/^demo-/);
    expect(eva.id.length).toBeGreaterThan(10);
    expect(eva).toMatchObject({ name: "Eva Trial", email: "eva@example.org", office: "Medics", departmentId: "demo-d1", state: "Active", createdBy: "demo-p3" });
    expect(typeof eva.createdAt).toBe("number");
    expect(eva.country).toBeTruthy();
    // the same email (other case) is refused; Finn is archived but still holds his
    await expect(acc.addPerson(cara, { name: "Eva Two", job: "", level: "Work", email: "EVA@example.org" })).rejects.toThrow(/already has that email/);
    await expect(acc.addPerson(cara, { name: "New Finn", job: "", level: "Work", email: "finn@example.org" })).rejects.toThrow(/already has that email/);
    await expect(acc.addPerson(cara, { name: "Bad Mail", job: "", level: "Work", email: "not-an-email" })).rejects.toThrow(/doesn't look like an email/);
    await expect(acc.addPerson(cara, { name: "No Office", job: "", level: "Work", office: "Kitchen" })).rejects.toThrow(/six REACH offices/);
    await expect(acc.addPerson(cara, { name: "Old Dept", job: "", level: "Work", departmentId: "nope" })).rejects.toThrow(/department from the list/);
    // nobody without an email is fine, twice
    await acc.addPerson(cara, { name: "No Mail One", job: "", level: "View" });
    await acc.addPerson(cara, { name: "No Mail Two", job: "", level: "View", email: "" });
    expect(door.records("person").filter(p => p.name === "Eva Two" || p.name === "New Finn").length).toBe(0);
  });

  it("F14.1 details: Manage only, archived people can't be changed, keeping one's own email is fine, a taken one is refused", async () => {
    const { acc } = await open();
    const cara = acc.person("demo-p3")!, anna = acc.person("demo-p1")!;
    await expect(acc.setDetails(anna, "demo-p4", { job: "Senior nurse" })).rejects.toThrow(/Only Manage level/);
    await acc.setDetails(cara, "demo-p4", { job: "Senior nurse", email: "dina@example.org", office: "Medics", departmentId: "demo-d3" });
    expect(acc.person("demo-p4")).toMatchObject({ job: "Senior nurse", departmentId: "demo-d3", email: "dina@example.org" });
    await expect(acc.setDetails(cara, "demo-p4", { email: "anna@example.org" })).rejects.toThrow(/already has that email/);
    await expect(acc.setDetails(cara, "demo-p5", { job: "x" })).rejects.toThrow(/archived/);
    await acc.setDetails(cara, "demo-p4", { email: "" });
    expect(acc.person("demo-p4")!.email ?? null).toBe(null);
  });

  it("F14.3 counts never include archived people, even when they're shown", async () => {
    const { door, acc } = await open();
    const depts = door.records("department");
    let c = staffCounts(acc.people(true), depts);
    expect(c.staff).toBe(4);
    expect(c.archived).toBe(1);
    expect(c.byDept.find(d => d.name === "Clinical")!.count).toBe(3);
    expect(c.byDept.some(d => d.name === "Training")).toBe(false);   // only archived Finn is in Training
    await acc.archive(acc.person("demo-p3")!, "demo-p4");
    c = staffCounts(acc.people(true), depts);
    expect(c.staff).toBe(3);
    expect(c.archived).toBe(2);
    expect(c.byDept.find(d => d.name === "Clinical")!.count).toBe(2);
  });

  it("F14.4 archive keeps the history and can be undone; delete only a mistake within 24 hours, logged", async () => {
    const { door, acc } = await open();
    const cara = acc.person("demo-p3")!, ben = acc.person("demo-p2")!, anna = acc.person("demo-p1")!;
    await expect(acc.archive(anna, "demo-p4")).rejects.toThrow();
    await acc.archive(cara, "demo-p4");
    expect(acc.person("demo-p4")!.state).toBe("Archived");
    expect(acc.person("demo-p4")!.name).toBe("Dina Test");            // still there, with her history
    await acc.restore(cara, "demo-p4");
    expect(acc.person("demo-p4")!.state).toBe("Active");
    const oops = await acc.addPerson(cara, { name: "Oops Person", job: "", level: "View", email: "oops@example.org" });
    expect(acc.canDelete(anna, oops.id)).toBe(false);
    expect(acc.canDelete(ben, oops.id)).toBe(true);
    await acc.deleteMistake(ben, oops.id);
    expect(acc.person(oops.id)).toBeUndefined();
    const del = door.messages().filter(m => m.recordId === oops.id && m.op === "delete");
    expect(del.length).toBe(1);
    expect(del[0]!.data).toMatchObject({ reason: "mistake", name: "Oops Person" });
    // the email is free again once the mistake is gone
    const again = await acc.addPerson(cara, { name: "Right Person", job: "", level: "View", email: "oops@example.org" });
    clock += 25 * 3600 * 1000;
    expect(acc.canDelete(cara, again.id)).toBe(false);
    await expect(acc.deleteMistake(cara, again.id)).rejects.toThrow(/archive it instead/);
  });

  it("rules: six offices, email check, initials", () => {
    expect([...OFFICES]).toEqual(["Management", "Dispatch", "Pilots", "Medics", "Engineering", "Ground Crew"]);
    expect(emailProblem("a@b.org", [{ id: "x", email: "A@B.org" }], "x")).toBe(null);
    expect(emailProblem("a@b.org", [{ id: "x", email: "A@B.org" }], "y")).toMatch(/already/);
    expect(initials("Dr Ben Sample")).toBe("BS");
    expect(initials("")).toBe("?");
  });
});
