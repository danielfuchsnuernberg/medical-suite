// F12 — the controlled-drug register behind the store door. Every rule is checked here, against people as stored now,
// one change at a time (as Accounts, B27). Each booking is saved together with the stock line it changes, all or nothing,
// so the register and Store and bags can never drift apart.
//
// Rights (F2.8, F12.2, Q16): the doctors' list (person.cdRight) decides, never the level. Manage level gives nothing here,
// except setting the very first doctor once, while there is none (F12.6: "set once at setup").
import { can, nextNumber, ledger, balanceOf, waiting, checkWitness, pinProblem, wholeNumber, matchingLine, expiryProblem, makeCredential, verifyPassword, newRecordId,
  mayApprove, isDoctorByProfession, needsMedicalCode, headDoctors,
  type CdLine, type CdDecision, type LedgerRow, type Credential, type StoredRecord } from "@md/core";
import { Door } from "./door";
import { Refused } from "./accounts";

/** DEMO doctors (R11) approve with this PIN until they set their own on this computer, like the DEMO password. */
export const DEMO_PIN = "1234";
const pinKey = (id: string) => "pin:" + id;
const triesKey = (id: string) => "pintries:" + id;
/** B46: after this many wrong PINs for one doctor, PIN approval for that doctor stops on this computer for a while. */
export const PIN_TRIES = 5, PIN_LOCK_MS = 15 * 60 * 1000;
type Msg = { recordType: string; recordId?: string; op: "create" | "delta" | "set" | "archive"; data: Record<string, unknown>; by: string };

export class RegisterStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private door: Door) {}
  private one<T>(fn: () => Promise<T>): Promise<T> { const done = this.door.hold(); const p = this.queue.then(fn, fn).finally(done); this.queue = p.catch(() => undefined); return p; }   // B37: counted from the click

  // ---- reading ----
  person(id: string | null | undefined) { return id ? this.door.get("person", id) : undefined; }
  /** May approve: a doctor by profession (with their medical code) on the doctors' list (F12.13). */
  isDoctor(id: string | null | undefined) { return mayApprove(this.person(id)); }
  doctors() { return this.door.records("person").filter(p => mayApprove(p)).sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  /** Head Doctors (F12.14): named by Management, or the lone doctor automatically. */
  heads() { return headDoctors(this.door.records("person")).sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  isHead(id: string | null | undefined) { return this.heads().some(p => p.id === id); }
  drugs() { return this.door.records("item").filter(i => i.controlled === true && i.state === "Active").sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  /** No longer controlled, but with a register: shown read-only (F12.15). */
  formerDrugs() { const ids = new Set(this.lines().map(l => l.itemId)); return this.door.records("item").filter(i => i.controlled !== true && ids.has(i.id)).sort((a, b) => String(a.name).localeCompare(String(b.name))); }
  private lines() { return this.door.records("cdline") as unknown as CdLine[]; }
  private decisions() { return this.door.records("cddecision") as unknown as CdDecision[]; }
  ledger(itemId: string): LedgerRow[] { return ledger(this.lines(), this.decisions(), itemId); }
  balance(itemId: string) { return balanceOf(this.ledger(itemId)); }
  /** What the stock lines of this drug hold now; should equal the register balance. */
  onShelves(itemId: string) { return this.door.records("line").filter(l => l.itemId === itemId && l.state === "Active").reduce((s, l) => s + Number(l.qty), 0); }
  waitingAll(): LedgerRow[] { return this.drugs().flatMap(d => waiting(this.ledger(d.id))); }
  placesOf(itemId: string) { return this.door.records("line").filter(l => l.itemId === itemId && l.state === "Active"); }
  rightsLog() { return this.door.log().filter(e => e.recordType === "person" && e.changes.some(c => c.field === "cdRight")).slice(0, 10); }

  // ---- checks ----
  /** B36: once a drug is no longer controlled, its register is read-only. */
  private stillControlled(itemId: string) {
    const it = this.door.get("item", itemId);
    if (!it || it.controlled !== true) throw new Refused(`${String(it?.name ?? "This item")} is no longer a controlled drug. Its register is kept, read-only.`);
  }
  private worker(actor: StoredRecord): StoredRecord {
    const p = this.person(actor.id);
    if (!p || p.state !== "Active" || !can(p.level, "changeStock")) throw new Refused("View level can look but not change anything.");
    return p;
  }
  private doctor(actor: StoredRecord): StoredRecord {
    const p = this.worker(actor);
    if (!mayApprove(p)) throw new Refused(p.cdRight === true && needsMedicalCode(p) ? "Type your medical code first (you're asked when you sign in)." : "Only a doctor can do this. Manage level gives no right here.");
    return p;
  }
  private head(actor: StoredRecord): StoredRecord {
    const p = this.worker(actor);
    if (!this.isHead(p.id)) throw new Refused(this.heads().length ? "Only a Head Doctor marks a drug as controlled." : "There is no Head Doctor. Management names one in Settings › People and access.");
    return p;
  }
  private drug(itemId: string): StoredRecord {
    const i = this.door.get("item", itemId);
    if (!i || i.controlled !== true) throw new Refused("That isn't a controlled drug.");
    return i;
  }
  private stockLine(lineId: string, itemId: string): StoredRecord {
    const l = this.door.get("line", lineId);
    if (!l || l.state !== "Active" || l.itemId !== itemId) throw new Refused("Pick where it is (the Store or a bag).");
    return l;
  }
  private witnessOk(witness: string | null | undefined, actor: string, doctor?: string | null) {
    const c = checkWitness(witness, actor, doctor); if (!c.ok) throw new Refused(c.why);
    const w = this.person(witness); if (!w || w.state !== "Active") throw new Refused("Pick a witness from the people list.");
  }
  private amount(raw: unknown, max?: number) {
    const q = wholeNumber(raw, max === undefined ? { min: 1 } : { min: 1, max }); if (!q.ok) throw new Refused(q.why);
    return q.n;
  }
  private reason(r: unknown, what = "Give a reason or case.") { const s = String(r ?? "").trim(); if (!s) throw new Refused(what); return s; }
  private async save(msgs: Msg[]) { await this.door.applyAll(msgs as any); }
  private line(data: Record<string, unknown>, by: string, id = newRecordId()): Msg { return { recordType: "cdline", recordId: id, op: "create", data, by }; }
  private take(lineId: string, n: number, cdlineId: string, by: string): Msg { return { recordType: "line", recordId: lineId, op: "delta", data: { field: "qty", by: -n, cdline: cdlineId }, by }; }
  private add(lineId: string, n: number, cdlineId: string, by: string): Msg { return { recordType: "line", recordId: lineId, op: "delta", data: { field: "qty", by: n, cdline: cdlineId }, by }; }

  // ---- PIN (Q13): a check value on this computer only, never sent anywhere ----
  hasPin(personId: string): "own" | "demo" | "none" {
    if (this.door.local<Credential>(pinKey(personId))) return "own";
    return this.person(personId)?.demo === true ? "demo" : "none";
  }
  async setPin(actor: StoredRecord, pin: string, repeat: string) {
    this.doctor(actor);
    const why = pinProblem(pin, repeat); if (why) throw new Refused(why);
    await this.door.setLocal(pinKey(actor.id), await makeCredential(pin, { mustChange: false, setBy: actor.id, at: this.door.now() }));
  }
  private async pinOk(doctorId: string, pin: string): Promise<boolean> {
    const c = this.door.local<Credential>(pinKey(doctorId));
    if (c) return verifyPassword(c, String(pin));
    return this.person(doctorId)?.demo === true && String(pin) === DEMO_PIN;
  }

  /** B46: is PIN approval for this doctor paused on this computer (too many wrong PINs)? Minutes left, or 0. */
  pinLocked(doctorId: string): number {
    const t = this.door.local<{ n: number; until: number }>(triesKey(doctorId));
    const left = t && t.until ? t.until - this.door.now() : 0;
    return left > 0 ? Math.ceil(left / 60000) : 0;
  }
  /** B46: wrong-PIN pauses for this doctor (logged, synced), newest first: shown to the doctor in the register. */
  pinAlerts(doctorId: string) { return this.door.records("event").filter(e => e.what === "PIN approval paused" && e.personId === doctorId).sort((a, b) => Number(b.createdAt) - Number(a.createdAt)); }
  private async pinTry(doctorId: string, pin: string, me: StoredRecord): Promise<void> {
    const name = String(this.person(doctorId)!.name);
    const mins = this.pinLocked(doctorId);
    if (mins) throw new Refused(`Too many wrong PINs for ${name}. PIN approval for ${name} is paused for ${mins} more minute${mins === 1 ? "" : "s"}; ask for approval another way.`);
    if (await this.pinOk(doctorId, pin)) { await this.door.setLocal(triesKey(doctorId), null); return; }
    const t = this.door.local<{ n: number; until: number }>(triesKey(doctorId));
    const n = (t && !t.until ? t.n : 0) + 1;
    if (n >= PIN_TRIES) {
      await this.door.setLocal(triesKey(doctorId), { n, until: this.door.now() + PIN_LOCK_MS });
      await this.door.apply({ recordType: "event", op: "create", data: { what: "PIN approval paused", personId: doctorId, tries: n }, by: me.id });
      throw new Refused(`That isn't ${name}'s PIN. After ${n} wrong tries, PIN approval for ${name} is paused for 15 minutes, and ${name} is told.`);
    }
    await this.door.setLocal(triesKey(doctorId), { n, until: 0 });
    throw new Refused(`That isn't ${name}'s PIN. ${PIN_TRIES - n} ${PIN_TRIES - n === 1 ? "try" : "tries"} left.`);
  }

  // ---- taking out (F12.2, F12.3, F12.4, F12.10) ----
  /**
   * how: "self" (the actor is a doctor), "pin" (a doctor in the room types their PIN), "request" (sent to a doctor; nothing comes off
   * until approved), "emergency" (no doctor reachable: booked at once, flagged until a doctor approves or queries it).
   */
  takeOut(actor: StoredRecord, p: { itemId: string; lineId: string; qty: unknown; witness: string; reason: string; how: "self" | "pin" | "request" | "emergency"; doctor?: string; pin?: string }) {
    return this.one(async () => {
      const me = this.worker(actor);
      this.drug(p.itemId);
      const l = this.stockLine(p.lineId, p.itemId);
      const n = this.amount(p.qty, Math.min(Number(l.qty), this.balance(p.itemId)));
      const reason = this.reason(p.reason);
      const id = newRecordId();
      const base = { itemId: p.itemId, kind: "out", qty: n, lineId: p.lineId, witness: p.witness, reason };
      if (p.how === "self") {
        this.doctor(me); this.witnessOk(p.witness, me.id);
        await this.save([this.line({ ...base, how: "self", doctor: me.id }, me.id, id), this.take(p.lineId, n, id, me.id)]);
      } else if (p.how === "pin") {
        if (!this.isDoctor(p.doctor)) throw new Refused("Pick a doctor from the doctors' list.");
        if (p.doctor === me.id) throw new Refused("You're the doctor: take it out yourself.");
        this.witnessOk(p.witness, me.id, p.doctor);
        await this.pinTry(String(p.doctor), String(p.pin ?? ""), me);
        await this.save([this.line({ ...base, how: "pin", doctor: p.doctor }, me.id, id), this.take(p.lineId, n, id, me.id)]);
      } else if (p.how === "request") {
        if (!this.isDoctor(p.doctor)) throw new Refused("Pick a doctor from the doctors' list.");
        if (p.doctor === me.id) throw new Refused("You're the doctor: take it out yourself.");
        this.witnessOk(p.witness, me.id, p.doctor);
        await this.save([this.line({ ...base, how: "request", askedDoctor: p.doctor }, me.id, id)]);   // nothing comes off yet
      } else if (p.how === "emergency") {
        this.witnessOk(p.witness, me.id);
        await this.save([this.line({ ...base, how: "emergency" }, me.id, id), this.take(p.lineId, n, id, me.id)]);
      } else throw new Refused("Say how it is approved: by you as a doctor, a doctor in the room, a request, or an emergency.");   // never guessed
      return id;
    });
  }

  /** A doctor answers a request or an emergency: approve, refuse (requests only) or query ("Ask"). */
  decide(actor: StoredRecord, cdlineId: string, decision: "approve" | "refuse" | "query", note = "") {
    return this.one(async () => {
      const me = this.doctor(actor);
      const l = this.door.get("cdline", cdlineId) as unknown as CdLine | undefined;
      if (!l) throw new Refused("That register line isn't there.");
      this.stillControlled(l.itemId);
      const row = this.ledger(l.itemId).find(r => r.line.id === cdlineId)!;
      if (row.status !== "pending" && row.status !== "emergency" && row.status !== "queried") throw new Refused("This line has already been answered.");
      if (l.createdBy === me.id) throw new Refused("A doctor can't approve their own request or emergency.");
      if (l.witness === me.id) throw new Refused("You were the witness, so another doctor has to answer it.");
      if (decision === "refuse" && l.how !== "request") throw new Refused("An emergency has already been given; approve it or ask about it.");
      const msgs: Msg[] = [{ recordType: "cddecision", op: "create", data: { cdlineId, decision, note: String(note ?? "").trim() }, by: me.id }];
      if (decision === "approve" && l.how === "request") {
        const s = this.door.get("line", String(l.lineId));
        if (!s || s.state !== "Active" || Number(s.qty) < l.qty || this.balance(l.itemId) < l.qty) throw new Refused("Not enough on the balance any more. Ask the nurse.");
        msgs.push(this.take(String(l.lineId), l.qty, cdlineId, me.id));                        // it comes off now
      }
      await this.save(msgs);
    });
  }

  // ---- receiving (F12.9), moving (F12.11, Q25 = A), correcting (F12.8) ----
  receive(actor: StoredRecord, p: { itemId: string; locationId: string; qty: unknown; witness: string; reason: string; lot?: string; expiry?: string }) {
    return this.one(async () => {
      const me = this.worker(actor);
      this.drug(p.itemId);
      const place = this.door.get("location", p.locationId); if (!place || place.state !== "Active") throw new Refused("Pick where it goes (the Store or a bag).");
      const n = this.amount(p.qty);
      this.witnessOk(p.witness, me.id);
      const reason = this.reason(p.reason, "Say where it came from.");
      const lot = String(p.lot ?? "").trim(), expiry = String(p.expiry ?? "").trim();
      const ep = expiryProblem(expiry); if (ep) throw new Refused(ep);
      const probe = { id: "", itemId: p.itemId, locationId: p.locationId, lot, expiry: expiry || null };
      const dest = matchingLine(this.door.records("line"), probe, p.locationId);
      const id = newRecordId(), destId = dest ? dest.id : newRecordId();
      const msgs: Msg[] = [this.line({ itemId: p.itemId, kind: "in", qty: n, lineId: destId, witness: p.witness, reason }, me.id, id)];
      if (!dest) msgs.push({ recordType: "line", recordId: destId, op: "create", data: { itemId: p.itemId, locationId: p.locationId, qty: 0, required: null, lot, expiry: expiry || null }, by: me.id });
      msgs.push(this.add(destId, n, id, me.id));
      await this.save(msgs);
      return id;
    });
  }

  move(actor: StoredRecord, p: { itemId: string; lineId: string; toLocationId: string; qty: unknown; witness: string }) {
    return this.one(async () => {
      const me = this.worker(actor);
      this.drug(p.itemId);
      const from = this.stockLine(p.lineId, p.itemId);
      if (from.locationId === p.toLocationId) throw new Refused("Pick a different place to move to.");
      const place = this.door.get("location", p.toLocationId); if (!place || place.state !== "Active") throw new Refused("Pick a place that is in use.");
      const n = this.amount(p.qty, Number(from.qty));
      this.witnessOk(p.witness, me.id);
      const dest = matchingLine(this.door.records("line"), from as any, p.toLocationId);
      const id = newRecordId(), destId = dest ? dest.id : newRecordId();
      const msgs: Msg[] = [this.line({ itemId: p.itemId, kind: "moved", qty: n, fromLineId: p.lineId, toLineId: destId, witness: p.witness,
        reason: `${String(this.door.get("location", String(from.locationId))?.name)} → ${String(place.name)}` }, me.id, id)];
      msgs.push(this.take(p.lineId, n, id, me.id));
      if (!dest) msgs.push({ recordType: "line", recordId: destId, op: "create", data: { itemId: p.itemId, locationId: p.toLocationId, qty: 0, required: null, lot: from.lot ?? "", expiry: from.expiry ?? null }, by: me.id });
      msgs.push(this.add(destId, n, id, me.id));
      // Q24 = C, as for any move: an emptied line with no required amount is archived
      if (n === Number(from.qty) && (from.required === null || from.required === undefined)) msgs.push({ recordType: "line", recordId: p.lineId, op: "archive", data: {}, by: me.id });
      await this.save(msgs);
      return id;
    });
  }

  /** F12.8: a doctor adds a correction line naming the original, with a witness and a reason; nothing is edited; the balance can't go below 0. */
  correct(actor: StoredRecord, p: { refId: string; change: unknown; witness: string; reason: string }) {
    return this.one(async () => {
      const me = this.doctor(actor);
      const ref = this.door.get("cdline", p.refId) as unknown as CdLine | undefined;
      if (!ref) throw new Refused("That register line isn't there.");
      this.stillControlled(ref.itemId);
      const row = this.ledger(ref.itemId).find(r => r.line.id === ref.id)!;
      if (!row.counts) throw new Refused("Only a booked line can be corrected.");
      if (ref.kind === "moved") throw new Refused("A move doesn't change the balance. Correct the line that does.");
      const s = String(p.change ?? "").trim().replace("−", "-");
      const n = /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : NaN;
      if (!Number.isInteger(n) || n === 0) throw new Refused("Type a whole number other than 0, like 1 or -1.");
      if (this.balance(ref.itemId) + n < 0) throw new Refused("That would take the balance below 0.");
      this.witnessOk(p.witness, me.id);
      const reason = this.reason(p.reason, "Say what was wrong.");
      const stockId = ref.lineId ? String(ref.lineId) : this.placesOf(ref.itemId)[0]?.id;
      const stock = stockId ? this.door.get("line", stockId) : undefined;
      if (!stock || stock.state !== "Active") throw new Refused("The stock line this line booked is gone. Reactivate it first.");
      if (Number(stock.qty) + n < 0) throw new Refused(`That would take ${String(this.door.get("location", String(stock.locationId))?.name)} below 0.`);
      const id = newRecordId();
      await this.save([this.line({ itemId: ref.itemId, kind: "correction", qty: n, lineId: stock.id, ref: ref.id, witness: p.witness, reason, doctor: me.id, how: "self" }, me.id, id),
        { recordType: "line", recordId: stock.id, op: "delta", data: { field: "qty", by: n, cdline: id }, by: me.id }]);
      return id;
    });
  }

  /**
   * A drug with stock on the shelves but no register lines yet (data from before F12): a doctor opens the register at what is
   * there now, with a witness. Only while the drug has no register line at all; after that, only corrections.
   */
  openRegister(actor: StoredRecord, itemId: string, witness: string) {
    return this.one(async () => {
      const me = this.doctor(actor);
      this.drug(itemId);
      if (this.ledger(itemId).length) throw new Refused("This drug's register is already open. Use a correction line.");
      this.witnessOk(witness, me.id);
      const n = this.onShelves(itemId);
      await this.save([this.line({ itemId, kind: "opening", qty: n, witness, reason: "Opening balance: what the Store and bags held", doctor: me.id, how: "self" }, me.id)]);
    });
  }

  // ---- Head Doctors and the Controlled drug tick (F12.14, F12.15) ----
  /** Management names the Head Doctor (exactly one: naming someone takes it from whoever had it), or takes it away. Management can do nothing else around controlled drugs. */
  setHead(actor: StoredRecord, personId: string, on: boolean) {
    return this.one(async () => {
      const me = this.worker(actor);
      if (!can(me.level, "changeLevels")) throw new Refused("Only Management names Head Doctors.");
      const t = this.person(personId); if (!t || t.state !== "Active") throw new Refused("Pick someone from the people list.");
      if (on && !mayApprove(t)) throw new Refused(`Only a doctor on the doctors' list can be Head Doctor. ${String(t.name)} isn't one.`);
      if ((t.headDoctor === true) === on) return;
      const others = on ? this.door.records("person").filter(p => p.id !== personId && p.headDoctor === true) : [];
      await this.door.applyAll([...others.map(p => ({ recordType: "person", recordId: p.id, op: "set" as const, data: { headDoctor: false }, by: me.id })),
        { recordType: "person", recordId: personId, op: "set" as const, data: { headDoctor: on }, by: me.id }]);
    });
  }
  /**
   * Only a Head Doctor ticks or unticks "Controlled drug", after a confirm box (the screen). Ticking asks for a witness and,
   * in the same save, puts what the shelves hold into the register (an opening line, or a correction if it had a register before).
   * Unticking asks for a reason; the register history stays, read-only.
   */
  setControlled(actor: StoredRecord, itemId: string, on: boolean, p: { witness?: string; reason?: string } = {}) {
    return this.one(async () => {
      const me = this.head(actor);
      const it = this.door.get("item", itemId); if (!it || it.state !== "Active") throw new Refused("That item isn't there any more.");
      if ((it.controlled === true) === on) throw new Refused(on ? "It is already a controlled drug." : "It isn't a controlled drug.");
      if (!on) {
        // B36: nothing may be left half-open: a request or an emergency is decided first
        const open = this.ledger(itemId).filter(r => r.status === "pending" || r.status === "emergency" || r.status === "queried").length;
        if (open) throw new Refused(`${open} take-out${open === 1 ? "" : "s"} of ${String(it.name)} still wait${open === 1 ? "s" : ""} for a doctor. Decide ${open === 1 ? "it" : "them"} first.`);
        const reason = this.reason(p.reason, "Say why it is no longer a controlled drug.");
        await this.door.apply({ recordType: "item", recordId: itemId, op: "set", data: { controlled: false, controlledNote: reason }, by: me.id });
        return;
      }
      this.witnessOk(p.witness, me.id);
      const shelves = this.onShelves(itemId), had = this.ledger(itemId), bal = balanceOf(had);
      const msgs: Msg[] = [{ recordType: "item", recordId: itemId, op: "set", data: { controlled: true, controlledNote: "" }, by: me.id }];
      if (!had.length) msgs.push(this.line({ itemId, kind: "opening", qty: shelves, witness: p.witness, reason: "Made a controlled drug: what the Store and bags held", doctor: me.id, how: "self" }, me.id));
      else if (shelves !== bal) msgs.push(this.line({ itemId, kind: "correction", qty: shelves - bal, witness: p.witness, reason: "Made a controlled drug again: the register set to what the Store and bags hold", doctor: me.id, how: "self", ref: null }, me.id));
      await this.save(msgs);
    });
  }

  // ---- import rows waiting for the Head Doctor (F13.6, Head Doctor page part 6 = A) ----
  waitingImports() { return this.door.records("importwait").filter(w => w.state === "Active").sort((a, b) => Number(a.createdAt) - Number(b.createdAt)); }
  /**
   * The Head Doctor decides a waiting import row: a controlled drug (with a witness: the stock comes in through the register,
   * opening it if needed) or not one (it loads as ordinary stock). Either way the row is then done.
   */
  confirmImport(actor: StoredRecord, waitId: string, controlled: boolean, witness?: string) {
    return this.one(async () => {
      const me = this.head(actor);
      const w = this.door.get("importwait", waitId); if (!w || w.state !== "Active") throw new Refused("That row has already been decided.");
      const place = this.door.get("location", String(w.locationId)); if (!place || place.state !== "Active") throw new Refused("Its place isn't in use any more. Restore it first.");
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();
      let item = (w.itemId ? this.door.get("item", String(w.itemId)) : undefined) ?? this.door.records("item").find(i => i.state === "Active" && norm(String(i.name)) === norm(String(w.item)));
      if (!controlled && item?.controlled === true) throw new Refused(`${String(item.name)} is a controlled drug: its stock comes in through the register.`);
      if (controlled) this.witnessOk(witness, me.id);
      const qty = Number(w.qty) || 0;
      const msgs: Msg[] = [];
      const itemId = item ? item.id : newRecordId();
      if (!item) msgs.push({ recordType: "item", recordId: itemId, op: "create", data: { itemNo: nextNumber("I", this.door.records("item"), "itemNo", 4), name: String(w.item), categoryId: null, unit: String(w.unit ?? ""), controlled }, by: me.id });
      else if (controlled && item.controlled !== true) msgs.push({ recordType: "item", recordId: itemId, op: "set", data: { controlled: true, controlledNote: "" }, by: me.id });
      const probe = { id: "", itemId, locationId: place.id, lot: String(w.lot ?? ""), expiry: (w.expiry as string) ?? null };
      const dest = item ? matchingLine(this.door.records("line"), probe, place.id) : undefined;
      const destId = dest ? dest.id : newRecordId();
      const cdId = newRecordId();
      if (!dest) msgs.push({ recordType: "line", recordId: destId, op: "create", data: { itemId, locationId: place.id, qty: 0, required: w.required ?? null, lot: String(w.lot ?? ""), expiry: w.expiry ?? null }, by: me.id });
      msgs.push({ recordType: "line", recordId: destId, op: "delta", data: { field: "qty", by: qty, ...(controlled ? { cdline: cdId } : {}), from: String(w.file ?? "") }, by: me.id });
      if (controlled) {
        const had = this.ledger(itemId), before = this.onShelves(itemId), bal = balanceOf(had);
        if (!had.length) msgs.push(this.line({ itemId, kind: "opening", qty: before + qty, witness, reason: `Opening balance: the Store and bags, with ${qty} from the import of ${String(w.file)}`, doctor: me.id, how: "self" }, me.id, cdId));
        else {
          if (item?.controlled !== true && before !== bal) msgs.push(this.line({ itemId, kind: "correction", qty: before - bal, witness, reason: "Made a controlled drug again: the register set to what the Store and bags hold", doctor: me.id, how: "self", ref: null }, me.id));
          msgs.push(this.line({ itemId, kind: "in", qty, lineId: destId, witness, reason: `From the import of ${String(w.file)} (${String(w.sheet)}, row ${String(w.row)})` }, me.id, cdId));
        }
      }
      msgs.push({ recordType: "importwait", recordId: waitId, op: "archive", data: { decided: controlled ? "controlled" : "ordinary" }, by: me.id });
      await this.save(msgs);
    });
  }

  // ---- the doctors' list (F12.6, F12.7, Q16 = B) ----
  /** Only a doctor gives the right, never to themselves. While nobody has it, a Manage-level person sets the first doctor, once. */
  grant(actor: StoredRecord, personId: string) {
    return this.one(async () => {
      const me = this.worker(actor);
      const t = this.person(personId); if (!t || t.state !== "Active") throw new Refused("Pick someone from the people list.");
      if (mayApprove(t)) throw new Refused(`${String(t.name)} already has the right.`);
      const first = this.doctors().length === 0;
      if (first) { if (!can(me.level, "changeLevels")) throw new Refused("The first doctor is set by Management, once."); }
      else {
        if (!mayApprove(me)) throw new Refused("Only a doctor can give this right. Manage level can't change the list.");
        if (personId === me.id) throw new Refused("Nobody can give the right to themselves.");
      }
      if (!isDoctorByProfession(t)) throw new Refused(`Only a doctor with a medical code can be on this list. ${String(t.name)} ${t.profession === "Doctor" ? "hasn't typed their medical code yet" : "isn't entered as a doctor"}.`);
      await this.door.apply({ recordType: "person", recordId: personId, op: "set", data: { cdRight: true }, by: me.id });
    });
  }
  /** A doctor removes someone's right (themselves included); logged and shown to every doctor; the last doctor can't be removed. */
  revoke(actor: StoredRecord, personId: string) {
    return this.one(async () => {
      const me = this.doctor(actor);
      const t = this.person(personId); if (!t || !mayApprove(t)) throw new Refused("That person doesn't have the right.");
      if (this.doctors().length <= 1) throw new Refused(`${String(t.name)} is the only person who can approve controlled drugs. Give the right to someone else first.`);
      await this.door.apply({ recordType: "person", recordId: personId, op: "set", data: { cdRight: false }, by: me.id });
    });
  }
}
