// B62 (R4): a short readable number where people say it out loud: staff S-006, items I-0012.
// The next number is one more than the highest in the list. Two computers offline can pick the same one: then the one
// made later reads with "-2" (then "-3" …), so every number on screen is unique without changing what was saved.

type R = { id: string; createdAt?: unknown } & Record<string, unknown>;
const num = (v: unknown, prefix: string) => { const m = new RegExp(`^${prefix}-(\\d+)`).exec(String(v ?? "")); return m ? Number(m[1]) : 0; };

/** The next readable number, e.g. nextNumber("S", people, "staffNo", 3) → "S-006". */
export function nextNumber(prefix: string, records: R[], field: string, width: number): string {
  const max = records.reduce((m, r) => Math.max(m, num(r[field], prefix)), 0);
  return `${prefix}-${String(max + 1).padStart(width, "0")}`;
}

/** Each record's number as shown: the first to use a number keeps it, a later one gets "-2", "-3" … */
export function shownNumbers(records: R[], field: string): Map<string, string> {
  const out = new Map<string, string>(), seen = new Map<string, number>();
  for (const r of [...records].sort((a, b) => Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0) || a.id.localeCompare(b.id))) {
    const v = r[field]; if (typeof v !== "string" || !v) continue;
    const n = (seen.get(v) ?? 0) + 1; seen.set(v, n);
    out.set(r.id, n === 1 ? v : `${v}-${n}`);
  }
  return out;
}
