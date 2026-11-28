// Where the messages are kept on this computer. The door talks to a backend; the backend never decides anything.
import type { Change } from "@md/core";

export interface Loaded { changes: Change[]; outbox: string[]; meta: Record<string, unknown> }
export interface Backend {
  load(): Promise<Loaded>;
  /** Saves the messages (and, if toOutbox, marks them as waiting to send) in one go: all or nothing. */
  commit(changes: Change[], opts: { toOutbox: boolean }): Promise<void>;
  ackOutbox(messageIds: string[]): Promise<void>;
  setMeta(entries: Record<string, unknown>): Promise<void>;
  /** Replaces messages (used by version migrations only). */
  rewrite(changes: Change[]): Promise<void>;
  /** Replaces everything with these messages, nothing waiting to send (F13.4 restore): all or nothing. */
  replace(changes: Change[], opts?: { toOutbox?: boolean }): Promise<void>;
}

export class MemoryBackend implements Backend {
  changes = new Map<string, Change>();
  outbox = new Set<string>();
  meta: Record<string, unknown> = {};
  failNext = 0; // test hook: make the next N commits fail
  async load(): Promise<Loaded> { return { changes: [...this.changes.values()].map(c => structuredClone(c)), outbox: [...this.outbox], meta: { ...this.meta } }; }
  async commit(changes: Change[], opts: { toOutbox: boolean }) {
    if (this.failNext > 0) { this.failNext--; throw new Error("Storage failed (test)"); }
    for (const c of changes) { this.changes.set(c.messageId, structuredClone(c)); if (opts.toOutbox) this.outbox.add(c.messageId); }
  }
  async ackOutbox(ids: string[]) { for (const id of ids) this.outbox.delete(id); }
  async setMeta(e: Record<string, unknown>) { Object.assign(this.meta, e); }
  async rewrite(changes: Change[]) { for (const c of changes) this.changes.set(c.messageId, structuredClone(c)); }
  async replace(changes: Change[], opts: { toOutbox?: boolean } = {}) {
    if (this.failNext > 0) { this.failNext--; throw new Error("Storage failed (test)"); }
    this.changes = new Map(changes.map(c => [c.messageId, structuredClone(c)])); this.outbox = new Set(opts.toOutbox ? changes.map(c => c.messageId) : []);
  }
}
