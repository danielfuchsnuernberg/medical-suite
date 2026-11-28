import { describe, it, expect } from "vitest";
import { Door, MemoryBackend, Accounts, TrainingStore } from "../src";
import { demoSeedChanges, addMonths, trainingStatus, completionProblem, personTrainingSummary, trainingCounts, coursesOffered, expiryFor } from "@md/core";

// F15 — Training and certificates. The clock: 28 Nov 2026, 09:00 in Port Moresby (UTC+10).
let clock = Date.UTC(2026, 10, 27, 23, 0);
const now = () => (clock += 1000);
const open = async () => { const door = await Door.open({ backend: new MemoryBackend(), seed: demoSeedChanges, now }); return { door, acc: new Accounts(door), tr: new TrainingStore(door) }; };
const T = "2026-11-28";

describe("F15 training rules", () => {
  it("F15.3 month-safe expiry: 31 Jan + 1 month = end of February, never 3 March", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");          // leap year
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(addMonths("2026-11-28", 24)).toBe("2028-11-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");          // over the year end
    expect(expiryFor("2026-01-31", { id: "c", validMonths: 1 })).toBe("2026-02-28");
    expect(expiryFor("2026-01-31", { id: "c", validMonths: null })).toBe(null);
  });

  it("F15.1 Valid, Expires in N days (30 or fewer), Expired, Required, In progress", () => {
    expect(trainingStatus({ status: "required" }, T).label).toBe("Required");
    expect(trainingStatus({ status: "in progress" }, T).label).toBe("In progress");
    expect(trainingStatus({ status: "done", expires: "2026-11-27" }, T).label).toBe("Expired");
    expect(trainingStatus({ status: "done", expires: "2026-11-28" }, T).label).toBe("Expires today");
    expect(trainingStatus({ status: "done", expires: "2026-12-18" }, T).label).toBe("Expires in 20 days");
    expect(trainingStatus({ status: "done", expires: "2026-12-28" }, T).label).toBe("Expires in 30 days");
    expect(trainingStatus({ status: "done", expires: "2026-12-29" }, T).label).toBe("Valid");
    expect(trainingStatus({ status: "done", expires: null }, T).label).toBe("Done");
  });

  it("F15.5 a completion date can't be in the future", () => {
    expect(completionProblem("2026-11-29", T)).toMatch(/can't be in the future/);
    expect(completionProblem("2026-11-28", T)).toBe(null);
    expect(completionProblem("2026-02-30", T)).toMatch(/Pick the date/);
    expect(completionProblem("", T)).toMatch(/Pick the date/);
  });

  it("summary, counts (active people only) and courses offered (none for archived)", () => {
    expect(personTrainingSummary([{ status: "done", expires: "2027-01-01" }, { status: "done", expires: "2026-01-01" }], T).label).toBe("Expired certificate");
    expect(personTrainingSummary([{ status: "required" }], T).label).toBe("Due soon / required");
    expect(personTrainingSummary([], T).label).toBe("No courses");
    const recs = [{ personId: "a", status: "done", expires: "2026-01-01" }, { personId: "b", status: "done", expires: "2026-01-01" }, { personId: "a", status: "done", expires: "2026-12-01" }];
    expect(trainingCounts([{ id: "a", state: "Active" }, { id: "b", state: "Archived" }], recs, T)).toEqual({ expired: 1, due: 1 });
    const courses = [{ id: "k1", state: "Active" }, { id: "k2", state: "Active" }, { id: "k3", state: "Archived" }];
    expect(coursesOffered({ id: "a", state: "Active" }, courses, [{ personId: "a", courseId: "k1" }]).map(c => c.id)).toEqual(["k2"]);
    expect(coursesOffered({ id: "b", state: "Archived" }, courses, [])).toEqual([]);
  });
});

describe("F15 training store", () => {
  it("the DEMO data: Anna's ACLS expired, Dina's BLS in 20 days; stats 1 expired, 1 due (archived Finn not counted)", async () => {
    const { door, tr } = await open();
    expect(tr.today()).toBe(T);
    expect(tr.status(door.get("training", "demo-t2")!).label).toBe("Expired");
    expect(tr.status(door.get("training", "demo-t7")!).label).toBe("Expires in 20 days");
    expect(trainingCounts(door.records("person"), tr.records(), T)).toEqual({ expired: 1, due: 1 });
  });

  it("F15.2 renew an expired certificate and a valid one early; the expiry is worked out; logged old → new", async () => {
    const { door, tr } = await open();
    const ben = door.get("person", "demo-p2")!;
    expect(await tr.complete(ben, "demo-t2", "2026-11-28")).toBe("2028-11-28");          // ACLS, 24 months
    expect(tr.status(door.get("training", "demo-t2")!).label).toBe("Valid");
    expect(await tr.complete(ben, "demo-t1", "2026-11-20")).toBe("2027-11-20");          // BLS renewed early
    const log = door.log().filter(e => e.recordId === "demo-t2" && e.op === "set");
    expect(log.length).toBe(1);
    expect(log[0]!.changes).toEqual(expect.arrayContaining([{ field: "expires", from: "2026-11-18", to: "2028-11-28" }, { field: "completedOn", from: "2024-11-18", to: "2026-11-28" }]));
  });

  it("F15.3 + F15.5 in the store: 31 Jan + 1 month; a future date refused", async () => {
    const { door, tr } = await open();
    const cara = door.get("person", "demo-p3")!;
    await expect(tr.complete(cara, "demo-t8", "2026-11-29")).rejects.toThrow(/can't be in the future/);
    expect(door.get("training", "demo-t8")!.status).toBe("in progress");
    expect(await tr.complete(cara, "demo-t8", "2026-01-31")).toBe("2026-02-28");         // Oxygen refresher, 1 month
    expect(door.get("training", "demo-t8")!.status).toBe("done");
  });

  it("F15.4 + F15.6 assign: Manage only; archived people get none; a course they have is refused", async () => {
    const { door, acc, tr } = await open();
    const cara = door.get("person", "demo-p3")!, anna = door.get("person", "demo-p1")!;
    await expect(tr.assign(anna, "demo-p4", "demo-k3")).rejects.toThrow(/Only Manage level/);
    await expect(tr.complete(anna, "demo-t3", "2026-11-28")).rejects.toThrow(/Only Manage level/);
    await expect(tr.assign(cara, "demo-p5", "demo-k3")).rejects.toThrow(/archived/);
    expect(tr.offered("demo-p5")).toEqual([]);
    await expect(tr.assign(cara, "demo-p4", "demo-k1")).rejects.toThrow(/already has/);
    const id = await tr.assign(cara, "demo-p4", "demo-k3");
    expect(door.get("training", id)).toMatchObject({ personId: "demo-p4", courseId: "demo-k3", status: "required" });
    // archived after: their courses can't be changed
    await acc.archive(cara, "demo-p4");
    await expect(tr.complete(cara, id, "2026-11-28")).rejects.toThrow(/archived/);
  });
});
