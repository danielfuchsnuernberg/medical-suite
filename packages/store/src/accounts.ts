// Accounts until the server exists (Stage 5; Q22 = A), behind the store door.
// - The people list is ordinary records (synced). Passwords are this computer's own (door.local), never synced.
// - First start: the first Management person sets up the computer with their own account.
// - After that, a Manage-level person gives each person a one-time starting password; it must be changed at first sign-in.
// - DEMO people (R11) sign in with "demo" until someone gives them a password on this computer.
// Every rule is checked here, not only in the screens.
import { can, checkLevelChange, checkArchivePerson, checkDelete, makeCredential, verifyPassword, passwordProblem,
  oneTimePassword, normaliseOneTime, isLevel, type Credential, type Level, type StoredRecord } from "@md/core";
import { Door, DoorError } from "./door";

export const DEMO_PASSWORD = "demo";
export class Refused extends Error {}
export type SignInResult = { ok: true; mustChange: boolean } | { ok: false; why: string };
export type PasswordState = "own" | "one-time" | "demo" | "none";

const credKey = (id: string) => "cred:" + id;

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

  /** At first sign-in with a one-time password, or any time later: the person's own password. */
  private async _setOwnPassword(personId: string, password: string, repeat?: string): Promise<void> {
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
      if (!p || p.level !== "Manage") throw new Refused("Only a Manage-level person can set up this computer.");
    } else {
      const name = String(o.name ?? "").trim();
      if (!name) throw new Refused("Type your name.");
      if (this.people().some(p => p.level === "Manage")) throw new Refused("Pick your name from the list of Manage-level people.");
      const ch = await this.door.apply({ recordType: "person", op: "create", data: { name, job: String(o.job ?? "").trim(), level: "Manage" }, by: "setup" });
      id = ch.recordId;
    }
    await this._setOwnPassword(id, password);
    await this.log(this.person(id)!, "this computer set up", id);
    return this.person(id)!;
  }

  private async _addPerson(actor: StoredRecord, o: { name: string; job: string; level: Level }): Promise<StoredRecord> {
    actor = this.current(actor);
    if (!can(actor.level, "managePeople")) throw new Refused("Only Manage level can add people.");
    const name = o.name.trim();
    if (!name) throw new Refused("Type a name.");
    if (!isLevel(o.level)) throw new Refused("A level is View, Work or Manage.");
    if (this.people(true).some(p => String(p.name).toLowerCase() === name.toLowerCase())) throw new Refused(`${name} is already in the list (look under archived too).`);
    const ch = await this.door.apply({ recordType: "person", op: "create", data: { name, job: o.job.trim(), level: o.level }, by: actor.id });
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
    await this.door.apply({ recordType: "person", recordId: targetId, op: "delete", data: { reason: "mistake", name: t.name }, by: actor.id });
    await this.door.setLocal(credKey(targetId), null);
  }

  // One change at a time, each checked against the result of the one before (two quick level changes must not
  // both pass the "last Manage-level person" check, found 28 Nov). Signing in only reads, so it isn't queued.
  private queue: Promise<unknown> = Promise.resolve();
  private one<T>(fn: () => Promise<T>): Promise<T> { const p = this.queue.then(fn, fn); this.queue = p.catch(() => undefined); return p; }
  /** The actor as stored now: a level lowered a moment ago counts at once. */
  private current(actor: StoredRecord): StoredRecord {
    const p = this.person(actor.id);
    if (!p || p.state !== "Active") throw new Refused("You are no longer an active person here. Sign out and ask Management.");
    return p;
  }
  setOwnPassword(personId: string, password: string, repeat?: string) { return this.one(() => this._setOwnPassword(personId, password, repeat)); }
  giveOneTime(actor: StoredRecord, targetId: string) { return this.one(() => this._giveOneTime(actor, targetId)); }
  setUp(o: { personId?: string; name?: string; job?: string }, password: string, repeat?: string) { return this.one(() => this._setUp(o, password, repeat)); }
  addPerson(actor: StoredRecord, o: { name: string; job: string; level: Level }) { return this.one(() => this._addPerson(actor, o)); }
  setLevel(actor: StoredRecord, targetId: string, to: Level) { return this.one(() => this._setLevel(actor, targetId, to)); }
  archive(actor: StoredRecord, targetId: string) { return this.one(() => this._archive(actor, targetId)); }
  restore(actor: StoredRecord, targetId: string) { return this.one(() => this._restore(actor, targetId)); }
  deleteMistake(actor: StoredRecord, targetId: string) { return this.one(() => this._deleteMistake(actor, targetId)); }

  // "Stay signed in on this computer" (F2.6): kept on this computer only.
  stayed(): string | null { return this.door.local<{ personId: string }>("session")?.personId ?? null; }
  async stay(personId: string | null): Promise<void> { await this.door.setLocal("session", personId ? { personId } : null); }

  private async log(actor: StoredRecord, what: string, aboutId: string) {
    await this.door.apply({ recordType: "event", op: "create", data: { what, personId: aboutId }, by: actor.id });
  }
}
export { DoorError };
