// A small made-up .xlsx (DEMO rows) for the program tests, written the way Excel writes it: a zip of XML.
async function deflate(b) { return new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer()); }
async function zip(files) {
  const enc = new TextEncoder(); const parts = []; const central = []; let offset = 0, count = 0;
  const w16 = (a, v) => a.push(v & 255, (v >> 8) & 255);
  const w32 = (a, v) => a.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255);
  for (const [name, content] of Object.entries(files)) {
    const raw = enc.encode(content), data = await deflate(raw), nm = enc.encode(name);
    const local = []; w32(local, 0x04034b50); w16(local, 20); w16(local, 0); w16(local, 8); w16(local, 0); w16(local, 0); w32(local, 0); w32(local, data.length); w32(local, raw.length); w16(local, nm.length); w16(local, 0);
    const c = []; w32(c, 0x02014b50); w16(c, 20); w16(c, 20); w16(c, 0); w16(c, 8); w16(c, 0); w16(c, 0); w32(c, 0); w32(c, data.length); w32(c, raw.length); w16(c, nm.length); w16(c, 0); w16(c, 0); w16(c, 0); w16(c, 0); w32(c, 0); w32(c, offset);
    central.push(...c, ...nm); parts.push(...local, ...nm, ...data); offset += local.length + nm.length + data.length; count++;
  }
  const end = []; w32(end, 0x06054b50); w16(end, 0); w16(end, 0); w16(end, count); w16(end, count); w32(end, central.length); w32(end, offset); w16(end, 0);
  return new Uint8Array([...parts, ...central, ...end]);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const cell = (ref, v) => typeof v === "number" ? `<c r="${ref}"><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
export async function makeXlsx(sheets) {
  const names = Object.keys(sheets);
  return zip({
    "xl/workbook.xml": `<workbook><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<Relationships>${names.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}</Relationships>`,
    ...Object.fromEntries(names.map((n, i) => [`xl/worksheets/sheet${i + 1}.xml`, `<worksheet><sheetData>${sheets[n].map((r, ri) => `<row r="${ri + 1}">${r.map((v, j) => v === null ? "" : cell(String.fromCharCode(65 + j) + (ri + 1), v)).join("")}</row>`).join("")}</sheetData></worksheet>`])),
  });
}
