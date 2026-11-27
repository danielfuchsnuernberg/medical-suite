// How the door talks to the shared server. The real server comes with REACH SD2 / EDP Q44; until then there is
// no transport ("this computer only"). FakeServer stands in for it in tests, so the sync rules can be proven now.
import type { Change } from "@md/core";

export interface Transport {
  online(): boolean;
  push(changes: Change[]): Promise<string[]>;            // returns the message ids the server accepted
  pull(sinceCursor: number): Promise<{ changes: Change[]; cursor: number }>;
}

/** One server, shared by several doors (several "computers") in a test. Each message is kept once. */
export class FakeServer {
  log: Change[] = [];
  private ids = new Set<string>();
  receive(changes: Change[]): string[] {
    const ok: string[] = [];
    for (const c of changes) { if (!this.ids.has(c.messageId)) { this.ids.add(c.messageId); this.log.push(c); } ok.push(c.messageId); }
    return ok;
  }
  since(cursor: number) { return { changes: this.log.slice(cursor), cursor: this.log.length }; }
  /** A transport for one computer, with its own internet switch. */
  connect(): Transport & { setOnline(v: boolean): void } {
    let on = true; const srv = this;
    return {
      setOnline(v: boolean) { on = v; },
      online: () => on,
      async push(changes) { if (!on) throw new Error("offline"); return srv.receive(changes); },
      async pull(cursor) { if (!on) throw new Error("offline"); return srv.since(cursor); },
    };
  }
}
