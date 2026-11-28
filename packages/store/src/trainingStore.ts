// F15 — Training and certificates behind the store door. Everyone may look; Manage level assigns and completes
// (F15.6). Every rule is checked here, against the actor as stored now, one change at a time.
import { can, todayIn, coursesOffered, completionProblem, expiryFor, trainingStatus, type StoredRecord, type CalendarDate } from "@md/core";
import { Door } from "./door";
import { Refused } from "./accounts";

export class TrainingStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private door: Door) {}
  private one<T>(fn: () => Promise<T>): Promise<T> { const p = this.queue.then(fn, fn); this.queue = p.catch(() => undefined); return p; }
  private manager(actor: StoredRecord): StoredRecord {
    const p = this.door.get("person", actor.id);
    if (!p || p.state !== "Active" || !can(p.level, "manageTraining")) throw new Refused("Only Manage level assigns and completes courses.");
    return p;
  }
  /** Today at the base (its own time zone), so "in the future" means the same in PNG and on a computer elsewhere. */
  today(): CalendarDate {
    const tz = String(this.door.get("settings", "base")?.timeZone ?? "") || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return todayIn(tz, this.door.now());
  }

  records(personId?: string): StoredRecord[] {
    return this.door.records("training").filter(r => r.state === "Active" && (!personId || r.personId === personId));
  }
  courses(): StoredRecord[] { return this.door.records("course").sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  offered(personId: string): StoredRecord[] {
    const p = this.door.get("person", personId);
    return p ? coursesOffered(p, this.courses(), this.records()) as StoredRecord[] : [];
  }

  /** F15.6: give a person a course to do (Required). Archived people get none (F15.4); a course they already have is refused. */
  assign(actor: StoredRecord, personId: string, courseId: string) {
    return this.one(async () => {
      const me = this.manager(actor);
      const p = this.door.get("person", personId);
      if (!p) throw new Refused("Not found.");
      if (p.state !== "Active") throw new Refused(`${p.name} is archived: no courses are offered.`);
      const c = this.door.get("course", courseId);
      if (!c || c.state !== "Active") throw new Refused("Pick a course from the list.");
      if (!this.offered(personId).some(x => x.id === courseId)) throw new Refused(`${p.name} already has ${c.name}.`);
      const ch = await this.door.apply({ recordType: "training", op: "create", data: { personId, courseId, status: "required" }, by: me.id });
      return ch.recordId;
    });
  }

  /** F15.2, F15.3, F15.5: mark done, renew an expired one, or renew a valid one early. The expiry is worked out here. */
  complete(actor: StoredRecord, recordId: string, completedOn: string) {
    return this.one(async () => {
      const me = this.manager(actor);
      const r = this.door.get("training", recordId);
      if (!r || r.state !== "Active") throw new Refused("Not found.");
      const p = this.door.get("person", String(r.personId));
      if (!p || p.state !== "Active") throw new Refused(`${p?.name ?? "That person"} is archived: their courses can't be changed.`);
      const why = completionProblem(completedOn, this.today()); if (why) throw new Refused(why);
      const expires = expiryFor(completedOn, this.door.get("course", String(r.courseId)));
      await this.door.apply({ recordType: "training", recordId, op: "set", data: { status: "done", completedOn, expires }, by: me.id });
      return expires;
    });
  }

  status(r: StoredRecord) { return trainingStatus(r, this.today()); }
}
