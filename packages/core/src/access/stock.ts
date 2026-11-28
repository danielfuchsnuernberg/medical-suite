// A9 (B78, Danny 28 Nov 2026; Q43 = A, Q44 = C): only doctors (Head Doctor included) and nurses change stock, and only at
// Work or Manage level. Every stock change: restock, take out, move, count, add, edit, archive, delete a mistake.
// Not stock changes: freezing a stock take (a record of the counts), loading the medics' Excel list (Q45 = A: Management),
// and the controlled-drug register (its own rules: doctors' list and witness, F12).
import { can } from "./levels";

export const CLINICAL = ["Doctor", "Nurse"] as const;
type P = { level?: unknown; profession?: unknown; state?: unknown } | null | undefined;
export const isClinical = (p: P) => !!p && (p.profession === "Doctor" || p.profession === "Nurse");
export const mayChangeStock = (p: P) => !!p && can(p.level, "changeStock") && isClinical(p);
/** Why this person can't change stock, or null if they can. */
export function stockRefusal(p: P): string | null {
  if (!p || !can(p.level, "changeStock")) return "View level can look but not change anything.";
  if (!isClinical(p)) return p.profession ? `Only doctors and nurses change stock (your profession is ${String(p.profession)}). Management sets professions in Settings › People and access.`
    : "Only doctors and nurses change stock, and your profession isn't set yet. Management sets it in Settings › People and access.";
  return null;
}
