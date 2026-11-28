// F13 — backups and restore behind the store door. Only Manage level exports, imports or restores (F13.8): a backup holds
// every person and the whole register. Files on this computer go through `files` (the program's backups folder);
// the server's nightly backups wait for the server (REACH SD2).
import { can, todayIn, formatTimeIn, formatCalendarDate, type StoredRecord } from "@md/core";
import { Door } from "./door";
import { Refused } from "./accounts";
import { makeBackup, summaryOf, checkBackup, type BackupCheck, type Summary } from "./backup";

export interface BackupFiles {
  list(): Promise<{ name: string; size: number }[]>;
  save(name: string, text: string): Promise<void>;
  read(name: string): Promise<string>;
}
export const NIGHTLY = /^medical-suite-backup-(\d{4}-\d{2}-\d{2})\.json$/;
export const KEEP = 30;

export class BackupStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private door: Door, private files: BackupFiles) {}
  private one<T>(fn: () => Promise<T>): Promise<T> { const p = this.queue.then(fn, fn); this.queue = p.catch(() => undefined); return p; }
  private manager(actor: StoredRecord): StoredRecord {
    const p = this.door.get("person", actor.id);
    if (!p || p.state !== "Active" || !can(p.level, "changeSettings")) throw new Refused("Only Manage level exports, imports or restores backups.");
    return p;
  }
  private tz() { return String(this.door.get("settings", "base")?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone); }
  today() { return todayIn(this.tz(), this.door.now()); }
  /** When a backup was made, in base time (never UTC on screen, B13). */
  madeAt(iso: string) { const t = Date.parse(iso); return Number.isFinite(t) ? `${formatCalendarDate(todayIn(this.tz(), t), "long")}, ${formatTimeIn(t, this.tz())}` : ""; }
  current(): Summary { return summaryOf(this.door.messages()); }
  text(by: string) { return JSON.stringify(makeBackup(this.door.messages(), by, this.door.now()), null, 1); }

  /** F13.2: the whole store as a backup file, named with the base's date. */
  exportFile(actor: StoredRecord): { name: string; text: string } {
    const me = this.manager(actor);
    return { name: `medical-suite-backup-${this.today()}.json`, text: this.text(me.id) };
  }

  /** F13.1 (until the server exists): one backup a day on this computer, the last 30 kept (the folder keeps them). */
  async nightly(): Promise<string | null> {
    const name = `medical-suite-backup-${this.today()}.json`;
    const have = await this.files.list();
    if (have.some(f => f.name === name)) return null;
    await this.files.save(name, this.text("program"));
    return name;
  }
  list() { return this.files.list(); }

  /** F13.3: reads a backup and checks it; nothing changes. */
  check(actor: StoredRecord, text: string): BackupCheck { this.manager(actor); return checkBackup(text, this.current()); }
  async readSaved(actor: StoredRecord, name: string): Promise<BackupCheck> { this.manager(actor); return checkBackup(await this.files.read(name), this.current()); }

  /** F13.4: restore after the tick; a backup of today is saved first; F13.5: every screen shows it at once. */
  restore(actor: StoredRecord, text: string, confirmed: boolean) {
    return this.one(async () => {
      const me = this.manager(actor);
      if (!confirmed) throw new Refused("Tick the box to confirm. Nothing was changed.");
      const c = checkBackup(text, this.current()); if (!c.ok) throw new Refused(c.why);
      const now = this.door.now();
      const stamp = formatTimeIn(now, this.tz()).replace(":", "") + String(new Date(now).getUTCSeconds()).padStart(2, "0");   // base time (B13)
      const safety = `medical-suite-backup-${this.today()}-before-restore-${stamp}.json`;
      await this.files.save(safety, this.text(me.id));
      await this.door.restore(c.messages, c.dataVersion);
      return { safety, summary: c.summary };
    });
  }
}

/** Backups kept in memory (tests, and the stand-in computer). */
export class MemoryFiles implements BackupFiles {
  files = new Map<string, string>();
  async list() { return [...this.files].map(([name, t]) => ({ name, size: t.length })).sort((a, b) => b.name.localeCompare(a.name)); }
  async save(name: string, text: string) {
    this.files.set(name, text);
    const nightly = [...this.files.keys()].filter(n => NIGHTLY.test(n)).sort().reverse();
    for (const n of nightly.slice(KEEP)) this.files.delete(n);
  }
  async read(name: string) { const t = this.files.get(name); if (t === undefined) throw new Error("That backup isn't there."); return t; }
}
