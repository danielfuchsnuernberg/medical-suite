// The backend on a real computer: IndexedDB, through idb (8.0.4). One database per program.
import { openDB, type IDBPDatabase } from "idb";
import type { Change } from "@md/core";
import type { Backend, Loaded } from "./backend";

export class IdbBackend implements Backend {
  private dbp: Promise<IDBPDatabase>;
  failNext = 0; // test hook (only reachable in test mode)
  constructor(name = "reach-medical-suite") {
    this.dbp = openDB(name, 1, {
      upgrade(db) {
        db.createObjectStore("changes", { keyPath: "messageId" });
        db.createObjectStore("outbox");
        db.createObjectStore("meta");
      },
    });
  }
  async load(): Promise<Loaded> {
    const db = await this.dbp;
    const tx = db.transaction(["changes", "outbox", "meta"], "readonly");
    const [changes, outbox, metaKeys, metaVals] = await Promise.all([
      tx.objectStore("changes").getAll(), tx.objectStore("outbox").getAllKeys(), tx.objectStore("meta").getAllKeys(), tx.objectStore("meta").getAll(),
    ]);
    await tx.done;
    const meta: Record<string, unknown> = {};
    metaKeys.forEach((k, i) => { meta[String(k)] = metaVals[i]; });
    return { changes: changes as Change[], outbox: outbox.map(String), meta };
  }
  async commit(changes: Change[], opts: { toOutbox: boolean }) {
    if (this.failNext > 0) { this.failNext--; throw new Error("This computer couldn't store the change."); }
    const db = await this.dbp;
    const tx = db.transaction(["changes", "outbox"], "readwrite");
    for (const c of changes) { tx.objectStore("changes").put(c); if (opts.toOutbox) tx.objectStore("outbox").put(true, c.messageId); }
    await tx.done; // throws if anything in the transaction failed: then nothing was saved
  }
  async ackOutbox(ids: string[]) {
    const db = await this.dbp; const tx = db.transaction("outbox", "readwrite");
    for (const id of ids) tx.store.delete(id);
    await tx.done;
  }
  async setMeta(e: Record<string, unknown>) {
    const db = await this.dbp; const tx = db.transaction("meta", "readwrite");
    for (const [k, v] of Object.entries(e)) tx.store.put(v, k);
    await tx.done;
  }
  async replace(changes: Change[], opts: { toOutbox?: boolean } = {}) {
    if (this.failNext > 0) { this.failNext--; throw new Error("This computer couldn't store the change."); }
    const db = await this.dbp; const tx = db.transaction(["changes", "outbox"], "readwrite");
    await tx.objectStore("changes").clear(); await tx.objectStore("outbox").clear();
    for (const c of changes) { tx.objectStore("changes").put(c); if (opts.toOutbox) tx.objectStore("outbox").put(true, c.messageId); }
    await tx.done; // one transaction: if anything fails, the old data stays
  }
  async rewrite(changes: Change[]) {
    const db = await this.dbp; const tx = db.transaction("changes", "readwrite");
    for (const c of changes) tx.store.put(c);
    await tx.done;
  }
}
