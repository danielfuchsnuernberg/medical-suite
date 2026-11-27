// F12 — the controlled-drug register (Q8, Q13–Q16, Q25). New in this app; demo batch 3.
// A register line is never changed (F12.8). A doctor's decision on a line (approve, refuse, ask) is its own record that names the line.
// The ledger (balance, status of each line) is worked out from those two, the same way on every computer.

export type CdKind = "opening" | "in" | "out" | "moved" | "correction";
/** How an "out" was approved: by the doctor themself, a doctor's PIN in the room, a request to a doctor, or an emergency (Q13, Q14). */
export type CdHow = "self" | "pin" | "request" | "emergency";
export interface CdLine {
  id: string; createdAt: number; createdBy: string;
  itemId: string; kind: CdKind; qty: number;
  lineId?: string;                         // the stock line it came from or went to (opening: none)
  fromLineId?: string; toLineId?: string;  // moved (Q25)
  witness?: string | null; reason?: string; how?: CdHow; doctor?: string | null; askedDoctor?: string | null; ref?: string | null;
}
export interface CdDecision { id: string; createdAt: number; createdBy: string; cdlineId: string; decision: "approve" | "refuse" | "query"; note?: string }

export type CdStatus = "booked" | "pending" | "refused" | "emergency" | "approvedAfter" | "queried";
export interface LedgerRow { line: CdLine; status: CdStatus; at: number; counts: boolean; delta: number; balance: number | null; doctor: string | null; how: string | null; decision?: CdDecision; queries: CdDecision[] }

/** The change a line makes to the balance once it counts. Moves don't change it (Q25). */
export function cdDelta(l: Pick<CdLine, "kind" | "qty">): number {
  return l.kind === "out" ? -Math.abs(l.qty) : l.kind === "moved" ? 0 : l.kind === "correction" ? l.qty : Math.abs(l.qty);
}

/**
 * The register of one controlled drug, oldest first, with the running balance (F12.1).
 * A request counts from the moment it is approved, not before (F12.3); a refused one never counts and stays visible.
 * An emergency counts at once and is flagged until a doctor approves or queries it (F12.4).
 */
export function ledger(lines: CdLine[], decisions: CdDecision[], itemId: string): LedgerRow[] {
  const byLine = new Map<string, CdDecision[]>();
  for (const d of [...decisions].sort((a, b) => a.createdAt - b.createdAt)) { const l = byLine.get(d.cdlineId) ?? []; l.push(d); byLine.set(d.cdlineId, l); }
  const rows: LedgerRow[] = lines.filter(l => l.itemId === itemId).map(line => {
    const ds = byLine.get(line.id) ?? [];
    const final = ds.find(d => d.decision === "approve" || d.decision === "refuse");
    const queries = ds.filter(d => d.decision === "query");
    let status: CdStatus = "booked", at = line.createdAt, doctor = line.doctor ?? null, how: string | null = line.how ?? null;
    if (line.kind === "out" && line.how === "request") {
      if (final?.decision === "approve") { status = "booked"; at = final.createdAt; doctor = final.createdBy; how = "remote"; }
      else if (final?.decision === "refuse") { status = "refused"; doctor = final.createdBy; how = "remote"; }
      else status = "pending";
    } else if (line.kind === "out" && line.how === "emergency") {
      if (final?.decision === "approve") { status = "approvedAfter"; doctor = final.createdBy; how = "after"; }
      else if (queries.length) status = "queried";
      else status = "emergency";
    }
    const counts = status !== "pending" && status !== "refused";
    return { line, status, at, counts, delta: counts ? cdDelta(line) : 0, balance: null, doctor, how, decision: final, queries };
  });
  rows.sort((a, b) => a.at - b.at || a.line.createdAt - b.line.createdAt || (a.line.id < b.line.id ? -1 : 1));
  let bal = 0;
  for (const r of rows) if (r.counts) { bal += r.delta; r.balance = bal; }
  return rows;
}
export const balanceOf = (rows: LedgerRow[]) => rows.reduce((s, r) => s + r.delta, 0);
/** Waiting for a doctor: requests not yet answered, and emergencies not yet approved or queried (F12.3, F12.4). */
export const waiting = (rows: LedgerRow[]) => rows.filter(r => r.status === "pending" || r.status === "emergency");

import type { Check } from "../access/levels";
const no = (why: string): Check => ({ ok: false, why });
const OK: Check = { ok: true };

/** F12.5: every line has a witness, a second person who was there: never yourself, never the approving doctor. */
export function checkWitness(witness: string | null | undefined, actor: string, doctor?: string | null): Check {
  if (!witness) return no("A witness has to sign: someone who was there.");
  if (witness === actor) return no("You can't be your own witness. Pick a second person.");
  if (doctor && witness === doctor) return no("The approving doctor can't also be the witness. Pick a second person.");
  return OK;
}

/** A PIN for approving in the room (Q13): 4 to 8 digits. */
export function pinProblem(pin: string, repeat?: string): string | null {
  if (!/^\d{4,8}$/.test(pin)) return "A PIN is 4 to 8 digits.";
  if (/^(\d)\1+$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) return "Pick a PIN that isn't a row or the same digit repeated.";
  if (repeat !== undefined && repeat !== pin) return "The two PINs don't match.";
  return null;
}
