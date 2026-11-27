// Levels inside this app (REACH Core R3, Q20 = A): View, Work, Manage. Set by Management.
// The rules for who may do what live here, once; screens and the accounts code ask these functions.
import type { StoredRecord } from "../reachCore/stamps";

export type Level = "View" | "Work" | "Manage";
export const LEVELS: Level[] = ["View", "Work", "Manage"];
const RANK: Record<Level, number> = { View: 0, Work: 1, Manage: 2 };
export const isLevel = (x: unknown): x is Level => x === "View" || x === "Work" || x === "Manage";

export type Action =
  | "changeStock"    // counts, movements (Work)
  | "archiveStock"   // archive stock (Work and Manage, F2.7)
  | "changeSettings" // F5.7: only Manage changes settings (everyone may look, Q23 = C)
  | "seePeopleAccess" // F2.3 (Q23 = C): People and access shows only for Manage level
  | "changeLevels"   // F2.2, F2.3
  | "managePeople"   // add people, give one-time passwords (Q22 = A)
  | "archivePeople"  // F2.7
  | "deleteMistake"; // F2.7, REACH Q38
const NEED: Record<Action, Level> = {
  changeStock: "Work", archiveStock: "Work",
  changeSettings: "Manage", seePeopleAccess: "Manage", changeLevels: "Manage", managePeople: "Manage", archivePeople: "Manage", deleteMistake: "Manage",
};

export function can(level: unknown, action: Action): boolean {
  return isLevel(level) && RANK[level] >= RANK[NEED[action]];
}

export type Check = { ok: true } | { ok: false; why: string };
const OK: Check = { ok: true };
const no = (why: string): Check => ({ ok: false, why });

type Person = StoredRecord;
const activeManagers = (people: Person[]) => people.filter(p => p.state === "Active" && p.level === "Manage");

/** F2.2, F2.3, F2.4: may `actor` give `target` the level `to`? */
export function checkLevelChange(people: Person[], actor: Person, target: Person, to: unknown): Check {
  if (!can(actor.level, "changeLevels")) return no("Only Manage level can change levels.");
  if (!isLevel(to)) return no("A level is View, Work or Manage.");
  if (target.level === "Manage" && to !== "Manage" && activeManagers(people).length <= 1)
    return no(`${target.name} is the last Manage-level person. Give someone else Manage level first, so somebody can still change settings and levels.`);
  return OK;
}

/** F2.4, F2.5, F2.7: may `actor` archive the person `target`? */
export function checkArchivePerson(people: Person[], actor: Person, target: Person): Check {
  if (!can(actor.level, "archivePeople")) return no("Only Manage level can archive people.");
  if (actor.id === target.id) return no("Nobody can archive themselves. Ask another Manage-level person.");
  if (target.level === "Manage" && target.state === "Active" && activeManagers(people).length <= 1)
    return no(`${target.name} is the last Manage-level person and can't be archived. Give someone else Manage level first.`);
  return OK;
}

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Patient files, the change log and stock takes are never deleted (F2.7, F11.1). */
export const NEVER_DELETED = new Set(["patient", "event", "log", "stocktake"]);

/** F2.7, REACH Q38: delete for good only a mistake, within 24 hours of creating it, by Manage level. */
export function checkDelete(recordType: string, record: StoredRecord, actor: Person, now: number): Check {
  if (NEVER_DELETED.has(recordType)) return no("Patient files, the change log and stock takes are never deleted.");
  if (!can(actor.level, "deleteMistake")) return no("Only Manage level can delete a mistake.");
  if (now - Number(record.createdAt) > DAY_MS) return no("Delete for good is only for a mistake, within 24 hours of creating it. After that, archive it instead.");
  return OK;
}

/** F2.8: controlled-drug rights don't follow the levels. Only the doctors' list (F12) gives them. */
export function hasControlledDrugRight(person: Person): boolean {
  return person.cdRight === true && person.state === "Active";
}
