// Accounts until the server exists (Stage 5; Q22 = A), behind the store door.
// - The people list is ordinary records (synced). Passwords are this computer's own (door.local), never synced.
// - First start: the first Management person sets up the computer with their own account.
// - After that, a Manage-level person gives each person a one-time starting password; it must be changed at first sign-in.
// - DEMO people (R11) sign in with "demo" until someone gives them a password on this computer.
// Every rule is checked here, not only in the screens.
import { can, checkLevelChange, checkArchivePerson, checkDelete, makeCredential, verifyPassword, passwordProblem,
  oneTimePassword, normaliseOneTime, isLevel, type Credential, type Level, type StoredRecord, PROFESSIONS, medicalCodeProblem, emailProblem, normaliseEmail, isOffice } from "@md/core";
import { Door, DoorError } from "./door";

export const DEMO_PASSWORD = "demo";
export class Refused extends Error {}
export type SignInResult = { ok: true; mustChange: boolean } | { ok: false; why: string };
export type PasswordState = "own" | "one-time" | "demo" | "none";

const credKey = (id: string) => "cred:" + id;
/** B56: names compared after tidying: one kind of space, one space at a time, each letter written one way, any capitals. */
export const tidyName = (s: unknown) => String(s ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
const sameName = (a: unknown, b: unknown) => tidyName(a).toLowerCase() === tidyName(b).toLowerCase();
export type PersonInput = { name: string; job: string; level: Level; email?: string; office?: string; departmentId?: string | null };

export class Accounts {
  constructor(private door: Door) {}

  people(all = false): StoredRecord[] {
    return this.door.records("person").filter(p => all || p.state === "Active").sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }
  person(id: string | null | undefined): StoredRecord | undefined { return id ? this.door.get("person", id) : undefined; }
  private cred(id: string): Credential | undefined { return this.door.local<Credential>(credKey(id)); }

  passwordState(p: StoredRecord): PasswordState {
    const c = this.cred(p.id);
    if (c) return c.mustChange ? "one-time" : "own";
    return p.demo === true ? "demo" : "none";
  }

  /** No one can sign in on this computer yet: the first Management person must set it up. */
  needsSetUp(): boolean {
    return !this.people().some(p => this.passwordState(p) !== "none");
  }

  async signIn(personId: string, password: string): Promise<SignInResult> {
    const p = this.person(personId);
    if (!p || p.state !== "Active") return { ok: false, why: "Pick your name from the list." };
    const c = this.cred(p.id);
    if (c) {
      const typed = c.mustChange ? normaliseOneTime(password) : password;
      if (!(await verifyPassword(c, typed))) return { ok: false, why: c.mustChange ? "That one-time password is not right. Check it, or ask for a new one." : "Wrong password." };
      return { ok: true, mustChange: c.mustChange };
    }
    if (p.demo === true) return password === DEMO_PASSWORD ? { ok: true, mustChange: false } : { ok: false, why: "Wrong password. DEMO people use the password demo." };
    return { ok: false, why: "You have no password on this computer yet. Ask a Manage-level person for a one-time password." };
  }

  /**
   * B43: a person changes their own password only by proving who they are: their current password, or at first sign-in the
   * one-time password (or "demo" for a DEMO person without one). Archived and unknown people are refused. Logged, never the password.
   */
  private async _setOwnPassword(personId: string, current: string, password: string, repeat?: string): Promise<void> {
    const p = this.person(personId);
    if (!p || p.state !== "Active") throw new Refused("Pick your name from the list.");
    const c = this.cred(personId);
    const proven = c ? await verifyPassword(c, c.mustChange ? normaliseOneTime(current) : String(current ?? ""))
      : p.demo === true && current === DEMO_PASSWORD;
    if (!proven) throw new Refused(c?.mustChange ? "That one-time password is not right." : "Your current password is not right. Nothing was changed.");
    await this.storePassword(personId, password, repeat);
    await this.log(p, "own password chosen", personId);
  }
  /** Stores a new own password (checked first). Only after the person proved who they are, or at the first set-up. */
  private async storePassword(personId: string, password: string, repeat?: string): Promise<void> {
    const problem = passwordProblem(password, repeat);
    if (problem) throw new Refused(problem);
    const c = await makeCredential(password, { mustChange: false, setBy: personId, at: this.door.now() });
    await this.door.setLocal(credKey(personId), c);
  }

  /** Q22 = A: a Manage-level person gives `targetId` a one-time starting password, shown once. */
  private async _giveOneTime(actor: StoredRecord, targetId: string): Promise<string> {
    actor = this.current(actor);
    if (!can(actor.level, "managePeople")) throw new Refused("Only Manage level can give passwords.");
    const t = this.person(targetId);
    if (!t || t.state !== "Active") throw new Refused("That person is archived.");
    const code = oneTimePassword();
    const c = await makeCredential(normaliseOneTime(code), { mustChange: true, setBy: actor.id, at: this.door.now() });
    await this.door.setLocal(credKey(targetId), c);
    await this.log(actor, "one-time password given", targetId);   // the log says who and when; never the password
    return code;
  }

  /** First start (Q22 = A): the first Management person, picked from the list or added, with their own password. */
  private async _setUp(o: { personId?: string; name?: string; job?: string }, password: string, repeat?: string): Promise<StoredRecord> {
    if (!this.needsSetUp()) throw new Refused("This computer is already set up. Sign in instead.");
    const problem = passwordProblem(password, repeat);
    if (problem) throw new Refused(problem);
    let id = o.personId;
    if (id) {
      const p = this.person(id);
      if (!p || p.level !== "Manage" || p.state !== "Active") throw new Refused("Only an active Manage-level person can set up this computer.");   // B47
    } else {
      const name = String(o.name ?? "").trim();
      if (!name) throw new Refused("Type your name.");
      if (this.people().some(p => p.level === "Manage")) throw new Refused("Pick your name from the list of Manage-level people.");
      const ch = await this.door.apply({ recordType: "person", op: "create", data: { name, job: String(o.job ?? "").trim(), level: "Manage" }, by: "setup" });
      id = ch.recordId;
    }
    await this.storePassword(id, password);
    await this.log(this.person(id)!, "this computer set up", id);
    return this.person(id)!;
  }

  private async _addPerson(actor: StoredRecord, o: PersonInput): Promise<StoredRecord> {
    actor = this.current(actor);
    if (!can(actor.level, "managePeople")) throw new Refused("Only Manage level can add people.");
    const name = tidyName(o.name);   // B56: one space, one way of writing each letter
    if (!name) throw new Refused("Type a name.");
    if (!isLevel(o.level)) throw new Refused("A level is View, Work or Manage.");
    if (name.length > 80) throw new Refused("A name of at most 80 letters, please.");   // B56
    if (this.people(true).some(p => sameName(p.name, name))) throw new Refused(`${name} is already in the list (look under archived too).`);
    const extra = this.details(o);
    const ch = await this.door.apply({ recordType: "person", op: "create", data: { name, job: String(o.job ?? "").trim(), level: o.level, ...extra }, by: actor.id });
    return this.person(ch.recordId)!;
  }

  private async _setLevel(actor: StoredRecord, targetId: string, to: Level): Promise<void> {
    actor = this.current(actor);
    const t = this.person(targetId); if (!t) throw new Refused("Not found.");
    const ok = checkLevelChange(this.people(), actor, t, to);
    if (!ok.ok) throw new Refused(ok.why);
    if (t.level === to) return;
    await this.door.apply({ recordType: "person", recordId: targetId, op: "set", data: { level: to }, by: actor.id });
  }

  private async _archive(actor: StoredRecord, targetId: string): Promise<void> {
    actor = this.current(actor);
    const t = this.person(targetId); if (!t) throw new Refused("Not found.");
    const ok = checkArchivePerson(this.people(), actor, t);
    if (!ok.ok) throw new Refused(ok.why);
    await this.door.apply({ recordType: "person", recordId: targetId, op: "archive", by: actor.id });
  }

  private async _restore(actor: StoredRecord, targetId: string): Promise<void> {
    actor = this.current(actor);
    if (!can(actor.level, "archivePeople")) throw new Refused("Only Manage level can restore people.");
    const t = this.person(targetId); if (!t) throw new Refused("Not found.");   // B54
    if (t.state === "Active") return;
    await this.door.apply({ recordType: "person", recordId: targetId, op: "restore", by: actor.id });
  }

  canDelete(actor: StoredRecord, targetId: string): boolean {
    const t = this.person(targetId);
    return !!t && actor.id !== targetId && checkDelete("person", t, actor, this.door.now()).ok;
  }
  private async _deleteMistake(actor: StoredRecord, targetId: string): Promise<void> {
    actor = this.current(actor);
    const t = this.person(targetId); if (!t) throw new Refused("Not found.");
    if (actor.id === targetId) throw new Refused("Nobody can delete themselves.");
    const ok = checkDelete("person", t, actor, this.door.now());
    if (!ok.ok) throw new Refused(ok.why);
    // B52: their training records go in the same save (they were all made within the same 24 hours, by mistake)
    const training = this.door.records("training").filter(r => r.personId === targetId);
    await this.door.applyAll([...training.map(r => ({ recordType: "training", recordId: r.id, op: "delete" as const, data: { reason: "mistake", person: t.name }, by: actor.id })),
      { recordType: "person", recordId: targetId, op: "delete", data: { reason: "mistake", name: t.name }, by: actor.id }]);
    await this.door.setLocal(credKey(targetId), null);
  }

  // One change at a time, each checked against the result of the one before (two quick level changes must not
  // both pass the "last Manage-level person" check, found 28 Nov). Signing in only reads, so it isn't queued.
  private queue: Promise<unknown> = Promise.resolve();
  private one<T>(fn: () => Promise<T>): Promise<T> { const done = this.door.hold(); const p = this.queue.then(fn, fn).finally(done); this.queue = p.catch(() => undefined); return p; }   // B37: counted from the click
  /** The actor as stored now: a level lowered a moment ago counts at once. */
  private current(actor: StoredRecord): StoredRecord {
    const p = this.person(actor.id);
    if (!p || p.state !== "Active") throw new Refused("You are no longer an active person here. Sign out and ask Management.");
    return p;
  }
  // ---- Staff details (F14.1): email (unique, archived people too), office (one of the six REACH offices), department ----
  private details(o: { email?: unknown; office?: unknown; departmentId?: unknown }, exceptId?: string): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (o.email !== undefined) { const why = emailProblem(o.email, this.door.records("person"), exceptId); if (why) throw new Refused(why); out.email = normaliseEmail(o.email) || null; }
    if (o.office !== undefined) { if (!isOffice(o.office)) throw new Refused("Pick one of the six REACH offices."); out.office = o.office; }
    if (o.departmentId !== undefined) {
      if (o.departmentId !== null && o.departmentId !== "") { const d = this.door.get("department", String(o.departmentId)); if (!d || d.state !== "Active") throw new Refused("Pick a department from the list."); out.departmentId = d.id; }
      else out.departmentId = null;
    }
    return out;
  }
  private async _setDetails(actor: StoredRecord, targetId: string, o: { job?: string; email?: unknown; office?: unknown; departmentId?: unknown }): Promise<void> {
    actor = this.current(actor);
    if (!can(actor.level, "managePeople")) throw new Refused("Only Manage level changes a person's details.");
    const t = this.person(targetId); if (!t) throw new Refused("Not found.");
    if (t.state !== "Active") throw new Refused("That person is archived. Restore them first.");
    if (o.departmentId !== undefined && (o.departmentId || null) === (t.departmentId ?? null)) delete o.departmentId;   // B50: keeping an archived department is fine
    const data = this.details(o, targetId);
    if (o.job !== undefined) data.job = String(o.job).trim();
    for (const k of Object.keys(data)) if ((t[k] ?? null) === (data[k] ?? null)) delete data[k];
    if (!Object.keys(data).length) return;
    await this.door.apply({ recordType: "person", recordId: targetId, op: "set", data, by: actor.id });
  }
  setDetails(actor: StoredRecord, targetId: string, o: { job?: string; email?: unknown; office?: unknown; departmentId?: unknown }) { return this.one(() => this._setDetails(actor, targetId, o)); }

  // ---- Profession and medical code (Danny with the medical staff, 28 Nov; F12.12) ----
  /** Management sets each person's profession: Doctor, Nurse or Other. */
  private async _setProfession(actor: StoredRecord, targetId: string, to: string): Promise<void> {
    actor = this.current(actor);
    if (!can(actor.level, "managePeople")) throw new Refused("Only Manage level sets a profession.");
    if (!(PROFESSIONS as readonly string[]).includes(to)) throw new Refused("Pick Doctor, Nurse or Other.");
    const t = this.person(targetId); if (!t || t.state !== "Active") throw new Refused("Not found.");
    if (t.profession === to) return;
    await this.door.apply({ recordType: "person", recordId: targetId, op: "set", data: { profession: to }, by: actor.id });
  }
  /** A doctor types their own medical code (never someone else's). There has to be a level of trust: it is checked to be there and unique. */
  private async _setMedicalCode(actor: StoredRecord, code: string): Promise<void> {
    actor = this.current(actor);
    if (actor.profession !== "Doctor") throw new Refused("Only someone entered as a doctor types a medical code.");
    const why = medicalCodeProblem(code, this.door.records("person"), actor.id); if (why) throw new Refused(why);
    const c = String(code).trim().replace(/\s+/g, " ");
    if (actor.medicalCode === c) return;
    await this.door.apply({ recordType: "person", recordId: actor.id, op: "set", data: { medicalCode: c }, by: actor.id });
  }
  setProfession(actor: StoredRecord, targetId: string, to: string) { return this.one(() => this._setProfession(actor, targetId, to)); }
  setMedicalCode(actor: StoredRecord, code: string) { return this.one(() => this._setMedicalCode(actor, code)); }

  setOwnPassword(personId: string, current: string, password: string, repeat?: string) { return this.one(() => this._setOwnPassword(personId, current, password, repeat)); }
  giveOneTime(actor: StoredRecord, targetId: string) { return this.one(() => this._giveOneTime(actor, targetId)); }
  setUp(o: { personId?: string; name?: string; job?: string }, password: string, repeat?: string) { return this.one(() => this._setUp(o, password, repeat)); }
  addPerson(actor: StoredRecord, o: PersonInput) { return this.one(() => this._addPerson(actor, o)); }
  setLevel(actor: StoredRecord, targetId: string, to: Level) { return this.one(() => this._setLevel(actor, targetId, to)); }
  archive(actor: StoredRecord, targetId: string) { return this.one(() => this._archive(actor, targetId)); }
  restore(actor: StoredRecord, targetId: string) { return this.one(() => this._restore(actor, targetId)); }
  deleteMistake(actor: StoredRecord, targetId: string) { return this.one(() => this._deleteMistake(actor, targetId)); }

  /**
   * B48: two computers offline can each pass the "last Manage-level person" check and together leave nobody at Manage level.
   * When that is found (after the computers meet), the latest change that took Manage away (an archive or a lower level) is
   * undone, and logged with the reason, so Management sees it. Safe to call often; does nothing when someone is at Manage.
   */
  async repairLockout(): Promise<string | null> {
    const ppl = this.door.records("person");
    if (!ppl.length || ppl.some(p => p.state === "Active" && p.level === "Manage")) return null;
    const msgs = this.door.messages().filter(m => m.recordType === "person").sort((a, b) => b.at - a.at);
    for (const m of msgs) {
      const p = this.person(m.recordId); if (!p) continue;
      const tookArchive = m.op === "archive" && p.level === "Manage" && p.state !== "Active";
      const tookLevel = m.op === "set" && (m.data as any)?.level !== undefined && (m.data as any).level !== "Manage" && p.state === "Active";
      if (!tookArchive && !tookLevel) continue;
      if (tookArchive) await this.door.apply({ recordType: "person", recordId: p.id, op: "restore", by: "system" });
      else await this.door.apply({ recordType: "person", recordId: p.id, op: "set", data: { level: "Manage" }, by: "system" });
      await this.door.apply({ recordType: "event", op: "create", data: { what: "nobody was left at Manage level", personId: p.id, undone: tookArchive ? "archive" : "level" }, by: "system" });
      return p.id;
    }
    return null;
  }

  // "Stay signed in on this computer" (F2.6): kept on this computer only.
  stayed(): string | null { return this.door.local<{ personId: string }>("session")?.personId ?? null; }
  async stay(personId: string | null): Promise<void> { await this.door.setLocal("session", personId ? { personId } : null); }

  private async log(actor: StoredRecord, what: string, aboutId: string) {
    await this.door.apply({ recordType: "event", op: "create", data: { what, personId: aboutId }, by: actor.id });
  }
}
export { DoorError };
