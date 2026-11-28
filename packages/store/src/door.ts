// The store door (REACH Core R7): the only way into or out of stored data.
// - Every change becomes a message with its own ID (R8); records are worked out from the messages (fold).
// - A change is shown only after it has been saved; a failed save changes nothing and turns the light red (B22, F3.6).
// - Old saved data is carried into a new version; built-in data is only ever added to an empty store (B3, F3.7).
// - With a server, waiting messages are sent and other computers' messages fetched; each counted once (F3.2, F3.4).
import { makeChange, APP_CODE, categoryId, type Change, type ChangeOp, type StoredRecord, type Moment } from "@md/core";
import type { Backend } from "./backend";
import type { Transport } from "./transport";
import { fold, FROZEN, type CountFlag } from "./fold";
import { buildLog, type LogEntry } from "./log";

/** Q32 = B: the fields a restore compares and sets back (stamps and bookkeeping left out; a base's own country is a field). */
const NOT_SET_BACK = new Set(["id", "createdAt", "createdBy", "changedAt", "changedBy", "state", "lastCountAt", "lastCountBy"]);
function fieldsOf(type: string, r: StoredRecord): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) if (!NOT_SET_BACK.has(k) && !(k === "country" && type !== "settings" && type !== "country")) out[k] = v;
  return out;
}
const sameValue = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** A message, once stored, can't be changed by anyone holding it (F4.4). */
function deepFreeze<T>(o: T): T { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o as object)) deepFreeze(v); } return o; }
function frozen(c: Change): Change { return deepFreeze(c); }

export const SCHEMA_VERSION = 2;
export type ServerState = "none" | "online" | "offline";
export interface DoorStatus { server: ServerState; waiting: number; lastSyncAt: Moment | null; error: string | null; openedOffline: boolean; version: number }
export class DoorError extends Error {}

// One step per version. Each step only ever adds or reshapes; it never drops a message (B3).
const MIGRATIONS: Record<number, (cs: Change[]) => Change[]> = {
  0: (cs) => cs.map(c => ({ ...c, app: c.app || APP_CODE })),
  // 1 → 2 (F5): an item's category was text; now it points to a category record by ID (R5). The category records are
  // made from the text that was there, with IDs and message IDs worked out from the name, so two computers that
  // migrate on their own make the very same messages (counted once). The text stays in the item too.
  1: (cs) => {
    const have = new Set(cs.filter(c => c.recordType === "category" && c.op === "create").map(c => c.recordId));
    const out = cs.map(c => {
      if (c.recordType !== "item" || c.op !== "create" || typeof c.data.category !== "string" || c.data.categoryId) return c;
      return { ...c, data: { ...c.data, categoryId: categoryId(c.data.category) } };
    });
    const firstAt = new Map<string, Change>();
    for (const c of cs) if (c.recordType === "item" && typeof c.data.category === "string" && c.data.category.trim()) {
      const id = categoryId(c.data.category); if (!have.has(id) && (!firstAt.has(id) || c.at < firstAt.get(id)!.at)) firstAt.set(id, c);
    }
    for (const [id, c] of firstAt) out.push({ messageId: "mig2-" + id, at: c.at, by: "system", app: APP_CODE, recordType: "category", recordId: id, op: "create", data: { name: String(c.data.category).trim() } });
    return out;
  },
};

export interface OpenOptions { backend: Backend; transport?: Transport | null; device?: string; seed?: () => Change[]; now?: () => Moment }

export class Door {
  private changes = new Map<string, Change>();
  private outbox = new Set<string>();
  private meta: Record<string, unknown> = {};
  private folded = fold([]);
  private logCache: readonly LogEntry[] | null = null;
  private listeners = new Set<() => void>();
  private st: DoorStatus = { server: "none", waiting: 0, lastSyncAt: null, error: null, openedOffline: false, version: SCHEMA_VERSION };
  private constructor(private o: OpenOptions) {}

  static async open(o: OpenOptions): Promise<Door> {
    const d = new Door(o);
    const loaded = await o.backend.load();
    d.meta = loaded.meta;
    let changes = loaded.changes;
    // Carry old data into this version (B3).
    let v = typeof d.meta.schemaVersion === "number" ? (d.meta.schemaVersion as number) : (changes.length ? 0 : SCHEMA_VERSION);
    if (v < SCHEMA_VERSION) {
      while (v < SCHEMA_VERSION) { const step = MIGRATIONS[v]; changes = step(changes); v++; }
      await o.backend.rewrite(changes);
    }
    await o.backend.setMeta({ schemaVersion: SCHEMA_VERSION });
    d.meta.schemaVersion = SCHEMA_VERSION;
    for (const c of changes) d.changes.set(c.messageId, frozen(c));
    for (const id of loaded.outbox) d.outbox.add(id);
    // Built-in (DEMO) data only goes into an empty store, once; never over existing data (B3).
    if (d.changes.size === 0 && !d.meta.seeded && o.seed) {
      const seed = o.seed();
      await o.backend.commit(seed, { toOutbox: false });
      for (const c of seed) d.changes.set(c.messageId, frozen(c));
      await o.backend.setMeta({ seeded: true });
    }
    d.refold();
    d.st.lastSyncAt = (d.meta.lastSyncAt as number) ?? null;
    d.st.server = !o.transport ? "none" : o.transport.online() ? "online" : "offline";
    d.st.openedOffline = d.st.server === "offline";
    d.st.waiting = d.outbox.size;
    return d;
  }

  private refold() { this.folded = fold([...this.changes.values()]); this.logCache = null; }
  /** The activity log, newest first (F4). Read-only: there is no way to edit or remove an entry. */
  log(): readonly LogEntry[] { if (!this.logCache) this.logCache = deepFreeze(buildLog([...this.changes.values()])); return this.logCache; }
  private emit() { for (const f of this.listeners) f(); }
  subscribe(f: () => void): () => void { this.listeners.add(f); return () => this.listeners.delete(f); }

  status(): DoorStatus { return { ...this.st }; }

  // B37: the screens keep a save button locked while anything is queued or saving (busy), and for a moment after something
  // was really saved (saved() went up), so a double click can't save twice; a refusal (nothing saved) unlocks at once.
  private busyN = 0; private savedN = 0;
  busy(): number { return this.busyN; }
  saved(): number { return this.savedN; }
  /** Counts a queued change from the moment it is asked for; call the returned function when it is done. */
  hold(): () => void { this.busyN++; let open = true; return () => { if (open) { open = false; this.busyN--; } }; }
  private async counted<T>(fn: () => Promise<T>): Promise<T> { const done = this.hold(); try { const r = await fn(); this.savedN++; return r; } finally { done(); } }
  apply(p: Parameters<Door["_apply"]>[0]) { return this.counted(() => this._apply(p)); }
  applyAll(ps: Parameters<Door["_applyAll"]>[0]) { return this.counted(() => this._applyAll(ps)); }

  /**
   * Q32 = B (B66): a restore that keeps every log entry. It works out how each record looked in the backup and adds
   * ordinary changes that set it back (fields, Active / Archived; a record deleted since is made again; a record made
   * since is archived, never deleted). Register lines, doctors' decisions and stock takes are never touched (F11.1, F12.8),
   * nor the log itself. One save, all or nothing; with a server, these changes reach every computer (Q30).
   * Returns how many records were set back. `keep` is never archived (the person restoring).
   */
  async rollBackTo(changes: Change[], fromVersion: number, by: string, note: Record<string, unknown>, keep: string[] = []): Promise<number> {
    if (!Number.isInteger(fromVersion) || fromVersion < 0 || fromVersion > SCHEMA_VERSION) throw new DoorError("This backup is damaged. Refused: nothing was changed.");
    let cs = changes;
    for (let v = fromVersion; v < SCHEMA_VERSION; v++) cs = MIGRATIONS[v](cs);
    const want = fold(cs).records, have = this.folded.records;
    const msgs: { recordType: string; recordId?: string; op: ChangeOp; data?: Record<string, unknown>; by: string }[] = [];
    const touched = new Set<string>();
    for (const t of new Set([...want.keys(), ...have.keys()])) {
      if (FROZEN.has(t) || t === "event") continue;
      const W = want.get(t) ?? new Map(), H = have.get(t) ?? new Map();
      for (const [id, w] of W) {
        const h = H.get(id), wd = fieldsOf(t, w);
        if (!h) { msgs.push({ recordType: t, recordId: id, op: "create", data: wd, by }); if (w.state === "Archived") msgs.push({ recordType: t, recordId: id, op: "archive", by }); touched.add(t + id); continue; }
        const hd = fieldsOf(t, h), diff: Record<string, unknown> = {};
        for (const k of new Set([...Object.keys(wd), ...Object.keys(hd)])) if (!sameValue(wd[k], hd[k])) diff[k] = wd[k] ?? null;
        if (Object.keys(diff).length) { msgs.push({ recordType: t, recordId: id, op: "set", data: diff, by }); touched.add(t + id); }
        if (w.state !== h.state) { msgs.push({ recordType: t, recordId: id, op: w.state === "Active" ? "restore" : "archive", by }); touched.add(t + id); }
      }
      for (const [id, h] of H) if (!W.has(id) && h.state === "Active" && !keep.includes(id)) { msgs.push({ recordType: t, recordId: id, op: "archive", data: { reason: "restore" }, by }); touched.add(t + id); }
    }
    msgs.push({ recordType: "event", op: "create", data: { what: "restored a backup", records: touched.size, ...note }, by });
    await this.applyAll(msgs);
    return touched.size;
  }
  records(type: string): StoredRecord[] { return [...(this.folded.records.get(type)?.values() ?? [])]; }
  get(type: string, id: string): StoredRecord | undefined { return this.folded.records.get(type)?.get(id); }
  flags(): CountFlag[] { return this.folded.flags; }
  messages(): Change[] { return [...this.changes.values()]; }
  waiting(): Change[] { return [...this.outbox].map(id => this.changes.get(id)!).filter(Boolean); }

  // Things that belong to this computer only (passwords' check values, "stay signed in"). Never sent to a server.
  local<T = unknown>(key: string): T | undefined { const v = this.meta["local:" + key]; return v == null ? undefined : (v as T); }
  async setLocal(key: string, value: unknown): Promise<void> {
    try { await this.o.backend.setMeta({ ["local:" + key]: value ?? null }); }
    catch { throw new DoorError("Not saved. This computer couldn't store it, so nothing was changed."); }
    this.meta["local:" + key] = value ?? null;
    this.emit();
  }
  now(): Moment { return this.o.now ? this.o.now() : Date.now(); }

  /** Saves one change. Throws DoorError if this computer couldn't store it; then nothing changed. */
  private async _apply(p: { recordType: string; recordId?: string; op: ChangeOp; data?: Record<string, unknown>; by: string }): Promise<Change> {
    const c = makeChange({ ...this.stamped(p), at: this.o.now ? this.o.now() : Date.now(), device: this.o.device });
    try {
      await this.o.backend.commit([c], { toOutbox: true });
    } catch (e) {
      this.st.error = "Not saved. This computer couldn't store the change, so nothing was changed.";
      this.emit();
      throw new DoorError(this.st.error);
    }
    this.st.error = null;
    this.changes.set(c.messageId, frozen(c));
    this.outbox.add(c.messageId);
    this.st.waiting = this.outbox.size;
    this.refold();
    this.emit();
    if (this.o.transport && this.o.transport.online()) void this.sync();
    return c;
  }

  /** B59: a new record is stamped with the base's country (Settings), once, in its own message. */
  private stamped<T extends { op: ChangeOp; data?: Record<string, unknown>; recordType: string }>(p: T): T {
    if (p.op !== "create" || p.recordType === "settings" || (p.data && typeof p.data.country === "string" && p.data.country)) return p;
    const country = String(this.get("settings", "base")?.country ?? "");
    return country ? { ...p, data: { ...(p.data ?? {}), country } } : p;
  }

  /** Saves several changes together: all of them or none (a move is a take here and an add there, F8.2). */
  private async _applyAll(ps: { recordType: string; recordId?: string; op: ChangeOp; data?: Record<string, unknown>; by: string }[]): Promise<Change[]> {
    const at = this.o.now ? this.o.now() : Date.now();
    const cs = ps.map((p, i) => makeChange({ ...this.stamped(p), at: at + i, device: this.o.device }));     // one after the other, in this order
    try {
      await this.o.backend.commit(cs, { toOutbox: true });
    } catch (e) {
      this.st.error = "Not saved. This computer couldn't store the change, so nothing was changed.";
      this.emit();
      throw new DoorError(this.st.error);
    }
    this.st.error = null;
    for (const c of cs) { this.changes.set(c.messageId, frozen(c)); this.outbox.add(c.messageId); }
    this.st.waiting = this.outbox.size;
    this.refold();
    this.emit();
    if (this.o.transport && this.o.transport.online()) void this.sync();
    return cs;
  }

  /** Sends what's waiting and fetches what other computers sent. Safe to call any time; does nothing without a server. */
  async sync(): Promise<void> {
    const t = this.o.transport;
    if (!t) { this.st.server = "none"; this.emit(); return; }
    if (!t.online()) { this.st.server = "offline"; this.emit(); return; }
    try {
      const out = this.waiting();
      if (out.length) { const ok = await t.push(out); await this.o.backend.ackOutbox(ok); ok.forEach(id => this.outbox.delete(id)); }
      const cursor = Number(this.meta.cursor ?? 0);
      const got = await t.pull(cursor);
      const fresh = got.changes.filter(c => !this.changes.has(c.messageId)); // counted once (R8)
      if (fresh.length) { await this.o.backend.commit(fresh, { toOutbox: false }); for (const c of fresh) this.changes.set(c.messageId, frozen(c)); this.refold(); }
      const now = this.o.now ? this.o.now() : Date.now();
      this.meta.cursor = got.cursor; this.meta.lastSyncAt = now;
      await this.o.backend.setMeta({ cursor: got.cursor, lastSyncAt: now });
      this.st.server = "online"; this.st.lastSyncAt = now; this.st.waiting = this.outbox.size; this.st.openedOffline = false;
    } catch {
      this.st.server = "offline"; this.st.waiting = this.outbox.size;
    }
    this.emit();
  }
}
