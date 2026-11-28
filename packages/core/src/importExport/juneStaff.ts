// B76 (A7, Q42 = A): the people of the archived June app, for the real-data trial on this Mac only.
// Read: name (with title), job, email. Not read: the June training records and departments: the June app made those up
// each time it opened (dates counted from “today”, a hospital template's wards), so they are not REACH's real records.
// The “System Administrator” placeholder is left out. Profession from the job: Physician / Doctor → Doctor; Nurse, Midwife → Nurse.

export interface JunePerson { juneId: string; name: string; job: string; email: string; profession: "Doctor" | "Nurse" | "Other" }

const field = (chunk: string, k: string) => { const m = new RegExp(`\\b${k}:'((?:[^'\\\\]|\\\\.)*)'`).exec(chunk); return m ? m[1].replace(/\\'/g, "'").trim() : ""; };
export const professionFromJob = (job: string): JunePerson["profession"] => /physician|doctor|\bdr\b|medical officer/i.test(job) ? "Doctor" : /nurse|midwife/i.test(job) ? "Nurse" : "Other";

/** The June app's people list, or [] when the file isn't the June app. */
export function juneStaff(html: string): JunePerson[] {
  const start = html.indexOf("const personnel=[");
  if (start < 0) return [];
  const end = html.indexOf("];", start);
  const block = html.slice(start, end < 0 ? undefined : end);
  const out: JunePerson[] = [];
  for (const chunk of block.split(/\bp\(\{/).slice(1)) {
    const first = field(chunk, "firstName"), last = field(chunk, "lastName"), title = field(chunk, "title");
    const name = [title, first, last].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!name || /^system administrator$/i.test(`${first} ${last}`.trim())) continue;
    const job = field(chunk, "jobRole");
    out.push({ juneId: field(chunk, "id"), name, job, email: field(chunk, "email"), profession: professionFromJob(job) });
  }
  return out;
}
