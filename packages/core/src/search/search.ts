// Search across staff and stock from any screen (F1.4). Returns plain data only;
// the screens show it as text, never as HTML (B4).

export interface SearchPerson { id: string; name: string; job: string }
export interface SearchStock { id: string; item: string; location: string; qty: number; unit: string; expiry: string | null }
export interface SearchSource { people: SearchPerson[]; stock: SearchStock[] }
export interface SearchResult { people: SearchPerson[]; stock: SearchStock[]; query: string }

/** Lower case, single spaces: "Asprin  100mg" is found by "asprin 100mg". */
export function normalise(s: string): string {
  return String(s ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function search(src: SearchSource, rawQuery: string, limit = 8): SearchResult {
  const q = normalise(rawQuery);
  if (!q) return { people: [], stock: [], query: "" };
  const words = q.split(" ");
  const hit = (hay: string) => { const h = normalise(hay); return words.every(w => h.includes(w)); };
  return {
    query: q,
    people: src.people.filter(p => hit(`${p.name} ${p.job}`)).slice(0, limit),
    stock: src.stock.filter(s => hit(`${s.item} ${s.location}`)).slice(0, limit),
  };
}
