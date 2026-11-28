// F14 — Staff. This app keeps its own people list in the REACH Core shape (R2, Q37): hidden ID, name, office, stamps,
// Active or Archived. Ops Management becomes the keeper of the one list later; then the lists are merged.
// - Office: one of the six REACH offices (REACH Q10, R3). Fixed by REACH, not by this app.
// - Email: optional, but an email already in the list (archived people too) is refused (F14.1).
// - Counts never include archived people, even when they're shown (B26).

export const OFFICES = ["Management", "Dispatch", "Pilots", "Medics", "Engineering", "Ground Crew"] as const;
export type Office = (typeof OFFICES)[number];
export const isOffice = (x: unknown): x is Office => (OFFICES as readonly unknown[]).includes(x);

type P = { id: string; state?: unknown; email?: unknown; departmentId?: unknown };

export const normaliseEmail = (s: unknown) => String(s ?? "").trim().toLowerCase();

/** Why this email can't be used, or null. Empty is allowed (not everyone has one). */
export function emailProblem(email: unknown, people: P[], exceptId?: string): string | null {
  const e = normaliseEmail(email);
  if (!e) return null;
  if (e.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "That doesn't look like an email address.";
  if (people.some(p => p.id !== exceptId && normaliseEmail(p.email) === e)) return "Someone already has that email in the people list (look under archived too).";
  return null;
}

/** F14.3: how many people, per department, and how many archived. Archived people are never in the counts. */
export function staffCounts(people: P[], departments: { id: string; name?: unknown }[]) {
  const active = people.filter(p => p.state === "Active");
  const byDept = departments.map(d => ({ id: d.id, name: String(d.name ?? ""), count: active.filter(p => p.departmentId === d.id).length })).filter(d => d.count > 0);
  const none = active.filter(p => !p.departmentId || !departments.some(d => d.id === p.departmentId)).length;
  return { staff: active.length, archived: people.filter(p => p.state === "Archived").length, byDept, none };
}

export const initials = (name: unknown) => String(name ?? "").replace(/^(dr|mr|mrs|ms)\.?\s+/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join("") || "?";
