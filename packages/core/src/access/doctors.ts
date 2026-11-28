// Doctors, medical codes and Head Doctors (Danny with the medical staff, 28 Nov 2026; F12.12–F12.15).
// - Each person has a profession: Doctor, Nurse or Other, set by Management.
// - Someone entered as a Doctor types their own medical code; only then do they count as a doctor. There has to be a
//   level of trust: the program can't check the code with the Medical Board; it checks it is there and not someone else's.
// - Only a doctor (profession Doctor with a code) can be on the doctors' list (may approve, F12) or be a Head Doctor.
// - Management names the Head Doctor: exactly one (Danny, 28 Nov); a lone doctor on the list is Head Doctor automatically.
// - Only a Head Doctor ticks or unticks "Controlled drug".

export const PROFESSIONS = ["Doctor", "Nurse", "Other"] as const;
export type Profession = (typeof PROFESSIONS)[number];

type P = { id: string; state?: unknown; profession?: unknown; medicalCode?: unknown; cdRight?: unknown; headDoctor?: unknown; changedAt?: unknown };
const active = (p: P | undefined) => !!p && p.state === "Active";
const hasCode = (p: P | undefined) => !!p && typeof p.medicalCode === "string" && p.medicalCode.trim() !== "";

/** A doctor by profession: entered as a Doctor, with their own medical code typed in. */
export const isDoctorByProfession = (p: P | undefined) => active(p) && p!.profession === "Doctor" && hasCode(p);
/** May approve controlled drugs: a doctor by profession on the doctors' list (F12.6, F12.13). */
export const mayApprove = (p: P | undefined) => isDoctorByProfession(p) && p!.cdRight === true;
/** Entered as a Doctor but hasn't typed their medical code yet: asked at sign-in. */
export const needsMedicalCode = (p: P | undefined) => active(p) && p!.profession === "Doctor" && !hasCode(p);

/**
 * The Head Doctor now (one at most): the doctor Management named, if they still may approve; with none named and exactly
 * one doctor, that doctor. Should two ever be named (two computers offline at once), the one named last counts.
 */
export function headDoctors<T extends P>(people: T[]): T[] {
  const doctors = people.filter(mayApprove);
  const named = doctors.filter(p => p.headDoctor === true).sort((a, b) => Number(b.changedAt ?? 0) - Number(a.changedAt ?? 0));
  if (named.length) return named.slice(0, 1);
  return doctors.length === 1 ? doctors : [];
}

const norm = (s: string) => s.trim().replace(/\s+/g, " ").toUpperCase();
/** A medical code: 3 to 40 characters, and nobody else's. */
export function medicalCodeProblem(code: string, people: P[], selfId: string): string | null {
  const c = String(code ?? "").trim().replace(/\s+/g, " ");
  if (!c) return "Type your medical code.";
  if (c.length < 3 || c.length > 40) return "A medical code is 3 to 40 characters.";
  if (people.some(p => p.id !== selfId && hasCode(p) && norm(String(p.medicalCode)) === norm(c))) return "That medical code belongs to someone else here. Check it, or ask Management.";
  return null;
}
