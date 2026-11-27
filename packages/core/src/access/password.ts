// Passwords on this computer, until the server exists (Stage 5, Q22 = A).
// Never stored as typed: only a salted PBKDF2 check value. They stay on this computer and are never synced.
export interface Credential { salt: string; hash: string; iterations: number; mustChange: boolean; setAt: number; setBy: string }
export const MIN_PASSWORD = 8;
const ITERATIONS = 210_000;
const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string): Uint8Array<ArrayBuffer> => new Uint8Array((s.match(/../g) || []).map(h => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

export async function makeCredential(password: string, o: { mustChange: boolean; setBy: string; at: number }): Promise<Credential> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: hex(salt), hash: await derive(password, salt, ITERATIONS), iterations: ITERATIONS, mustChange: o.mustChange, setAt: o.at, setBy: o.setBy };
}

export async function verifyPassword(c: Credential, password: string): Promise<boolean> {
  const h = await derive(password, unhex(c.salt), c.iterations);
  if (h.length !== c.hash.length) return false;
  let diff = 0; for (let i = 0; i < h.length; i++) diff |= h.charCodeAt(i) ^ c.hash.charCodeAt(i);
  return diff === 0;
}

/** Why a new own password isn't accepted, or null. */
export function passwordProblem(pw: string, repeat?: string): string | null {
  if (pw.length < MIN_PASSWORD) return `At least ${MIN_PASSWORD} characters.`;
  if (repeat !== undefined && pw !== repeat) return "The two passwords are not the same.";
  return null;
}

// No 0/O, 1/I/L: easy to read off paper.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
/** A one-time starting password like "47K-P9X", given by a Manage-level person (Q22 = A). */
export function oneTimePassword(): string {
  const r = crypto.getRandomValues(new Uint8Array(6));
  const s = [...r].map(x => ALPHABET[x % ALPHABET.length]).join("");
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}
/** People type one-time passwords from paper: ignore case, spaces and the dash. */
export const normaliseOneTime = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");
