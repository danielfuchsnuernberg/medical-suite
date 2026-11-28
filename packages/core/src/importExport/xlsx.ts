// A small reader for .xlsx files (F13.6), with no library: an .xlsx file is a zip of XML files.
// It reads cell values only (text, numbers, true/false), the way the medics' stock lists are written. No formulas are run.
// Works in the program (Chromium) and in the tests (Node), which both have DecompressionStream.

export interface Sheet { name: string; rows: (string | number | boolean | null)[][] }

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const text = new TextDecoder("utf-8");

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const out = new Response(new Blob([new Uint8Array(data)]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

/** The files inside a zip, by name. */
export async function unzip(b: Uint8Array): Promise<Map<string, Uint8Array>> {
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("This isn't an Excel file (.xlsx), or it is damaged.");
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const files = new Map<string, Uint8Array>();
  for (let n = 0; n < count; n++) {
    if (u32(b, p) !== 0x02014b50) throw new Error("This Excel file is damaged.");
    const method = u16(b, p + 10), size = u32(b, p + 20), nameLen = u16(b, p + 28), extraLen = u16(b, p + 30), commentLen = u16(b, p + 32), local = u32(b, p + 42);
    const name = text.decode(b.subarray(p + 46, p + 46 + nameLen));
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const raw = b.subarray(start, start + size);
    if (method === 0) files.set(name, raw);
    else if (method === 8) files.set(name, await inflate(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const unescape = (s: string) => s.replace(/&(lt|gt|quot|apos|amp|#x[0-9a-fA-F]+|#\d+);/g, (_, e: string) =>
  e === "lt" ? "<" : e === "gt" ? ">" : e === "quot" ? "\"" : e === "apos" ? "'" : e === "amp" ? "&" : String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)));
const attr = (tag: string, name: string) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? unescape(m[1]) : null; };
/** All text in <t> pieces of one element (rich text has several). */
const tText = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)].map(m => unescape(m[1] ?? "")).join("");

/** Column letters to a number: A → 0, Z → 25, AA → 26. */
export function colIndex(ref: string): number { let n = 0; for (const ch of ref.replace(/\d+/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; }

export async function readXlsx(bytes: Uint8Array): Promise<Sheet[]> {
  const files = await unzip(bytes);
  const get = (n: string) => { const f = files.get(n); return f ? text.decode(f) : null; };
  const wb = get("xl/workbook.xml"); if (!wb) throw new Error("This isn't an Excel file (.xlsx).");
  const rels = get("xl/_rels/workbook.xml.rels") ?? "";
  const target = new Map([...rels.matchAll(/<Relationship\b[^>]*>/g)].map(m => [attr(m[0], "Id"), attr(m[0], "Target")] as const));
  const shared = [...(get("xl/sharedStrings.xml") ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => tText(m[1]));
  const sheets: Sheet[] = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*\/?>/g)) {
    const name = attr(m[0], "name") ?? "Sheet";
    const t = target.get(attr(m[0], "r:id")) ?? "";
    const path = t.startsWith("/") ? t.slice(1) : "xl/" + t.replace(/^\.\//, "");
    const xml = get(path); if (!xml) continue;
    const rows: Sheet["rows"] = [];
    for (const r of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {   // B42: the short empty row first
      const ri = Number(attr(r[0], "r") ?? rows.length + 1) - 1;
      const row: Sheet["rows"][number] = [];
      for (const c of (r[2] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const tag = "<c" + c[1] + ">", body = c[2] ?? "";
        const ref = attr(tag, "r"), type = attr(tag, "t");
        const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
        let val: string | number | boolean | null = null;
        if (type === "s") val = v !== undefined ? shared[Number(v)] ?? "" : null;
        else if (type === "inlineStr") val = tText(body);
        else if (type === "str") val = v !== undefined ? unescape(v) : null;
        else if (type === "b") val = v === "1";
        else if (type === "e") val = null;
        else if (v !== undefined) val = Number(v);
        row[ref ? colIndex(ref) : row.length] = val;
      }
      rows[ri] = Array.from(row, x => x ?? null);
    }
    sheets.push({ name, rows: Array.from(rows, r => r ?? []) });
  }
  return sheets;
}

/** An Excel date number (days since 30 Dec 1899) as a plain calendar date, never through a clock (B13). */
export function excelDate(n: number): string {
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
