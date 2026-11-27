// The store door (REACH Core R7): the only way into or out of stored data.
// - Every change becomes a message with its own ID (R8); records are worked out from the messages (fold).
// - A change is shown only after it has been saved; a failed save changes nothing and turns the light red (B22, F3.6).
// - Old saved data is carried into a new version; built-in data is only ever added to an empty store (B3, F3.7).
// - With a server, waiting messages are sent and other computers' messages fetched; each counted once (F3.2, F3.4).
import { makeChange, APP_CODE, type Change, type ChangeOp, type StoredRecord, type Moment } from "@md/core";
import type { Backend } from "./backend";
import type { Transport } from "./transport";
import { fold, type CountFlag } from "./fold";

export const SCHEMA_VERSION = 1;
export type ServerState = "none" | "online" | "offline";
export interface DoorStatus { server: ServerState; waiting: number; lastSyncAt: Moment | null; error: string | null; openedOffline: boolean; version: number }
export class DoorError extends Error {}

// One step per version. Each step only ever adds or reshapes; it never drops a message (B3).
const MIGRATIONS: Record<number, (c: Change) => Change> = {
  0: (c) => ({ ...c, app: c.app || APP_CODE }),
};

export interface OpenOptions { backend: Backend; transport?: Transport | null; device?: string; seed?: () => Change[]; now?: () => Moment }

export class Door {
  private changes = new Map<string, Change>();
  private outbox = new Set<string>();
  private meta: Record<string, unknown> = {};
  private folded = fold([]);
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
      while (v < SCHEMA_VERSION) { const step = MIGRATIONS[v]; changes = changes.map(step); v++; }
      await o.backend.rewrite(changes);
    }
    await o.backend.setMeta({ schemaVersion: SCHEMA_VERSION });
    d.meta.schemaVersion = SCHEMA_VERSION;
    for (const c of changes) d.changes.set(c.messageId, c);
    for (const id of loaded.outbox) d.outbox.add(id);
    // Built-in (DEMO) data only goes into an empty store, once; never over existing data (B3).
    if (d.changes.size === 0 && !d.meta.seeded && o.seed) {
      const seed = o.seed();
      await o.backend.commit(seed, { toOutbox: false });
      for (const c of seed) d.changes.set(c.messageId, c);
      await o.backend.setMeta({ seeded: true });
    }
    d.refold();
    d.st.lastSyncAt = (d.meta.lastSyncAt as number) ?? null;
    d.st.server = !o.transport ? "none" : o.transport.online() ? "online" : "offline";
    d.st.openedOffline = d.st.server === "offline";
    d.st.waiting = d.outbox.size;
    return d;
  }

  private refold() { this.folded = fold([...this.changes.values()]); }
  private emit() { for (const f of this.listeners) f(); }
  subscribe(f: () => void): () => void { this.listeners.add(f); return () => this.listeners.delete(f); }

  status(): DoorStatus { return { ...this.st }; }
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
  async apply(p: { recordType: string; recordId?: string; op: ChangeOp; data?: Record<string, unknown>; by: string }): Promise<Change> {
    const c = makeChange({ ...p, at: this.o.now ? this.o.now() : Date.now(), device: this.o.device });
    try {
      await this.o.backend.commit([c], { toOutbox: true });
    } catch (e) {
      this.st.error = "Not saved. This computer couldn't store the change, so nothing was changed.";
      this.emit();
      throw new DoorError(this.st.error);
    }
    this.st.error = null;
    this.changes.set(c.messageId, c);
    this.outbox.add(c.messageId);
    this.st.waiting = this.outbox.size;
    this.refold();
    this.emit();
    if (this.o.transport && this.o.transport.online()) void this.sync();
    return c;
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
      if (fresh.length) { await this.o.backend.commit(fresh, { toOutbox: false }); for (const c of fresh) this.changes.set(c.messageId, c); this.refold(); }
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
