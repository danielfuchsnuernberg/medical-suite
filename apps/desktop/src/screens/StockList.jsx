import { useState } from "react";
import { listLines, readiness, readinessLine, stockStatus, linesCsv, csvFileName, can } from "@md/core";
import Dialog from "../components/Dialog.jsx";
import Icon from "../components/Icon.jsx";
import ExpiryBadge from "../components/ExpiryBadge.jsx";

// F7 — Store and bags (June J5): filters, sort, archived lines, CSV of what the table shows; a row opens its item.
// The Overview (F6) opens this screen with a filter already set.

const STOCK_WORDS = {
  out: () => ["b-danger", "Out of stock"],
  low: (store) => ["b-warning", store ? "Below reorder level" : "Below required"],
  none: (store) => ["b-muted nodot", store ? "No reorder level" : "No required amount"],
  ok: (store) => ["b-success", store ? "In stock" : "At or above required"],
};

export default function StockList({ inv, today, dateStyle, filter, setFilter, openItem, me, store, toast }) {
  const [adding, setAdding] = useState(false);
  const { lines, archivedLines, items, locations, categories } = inv;
  const f = filter || {};
  const set = (k, v) => setFilter({ ...f, [k]: v || undefined });
  const loc = f.locationId ? locations.find(l => l.id === f.locationId) : null;
  const placeName = (id) => String(locations.find(x => x.id === id)?.name ?? inv.locs.get(id)?.name ?? "?");
  const isStore = (id) => (locations.find(l => l.id === id) ?? inv.locs.get(id))?.kind === "store";
  const itemOf = (id) => { const i = items.get(id); return i ? { name: String(i.name), categoryId: i.categoryId ?? null, unit: i.unit ?? "" } : undefined; };
  const archivedIds = new Set(archivedLines.map(l => l.id));
  const shown = listLines(lines, archivedLines, f, today, itemOf);
  const r = loc ? readiness(lines.filter(l => l.locationId === loc.id), today) : null;
  const filtered = !!(f.categoryId || f.stock || f.expiry);
  const usedCats = new Set([...lines, ...archivedLines].map(l => items.get(l.itemId)?.categoryId).filter(Boolean));
  const catList = categories.filter(c => usedCats.has(c.id) || c.id === f.categoryId);

  const exportCsv = () => {
    const text = linesCsv(shown, {
      item: itemOf, category: (id) => String(categories.find(c => c.id === id)?.name ?? inv.categoryName(id)), place: placeName,
      archived: (l) => archivedIds.has(l.id), stockWord: (l) => STOCK_WORDS[stockStatus(l)](isStore(l.locationId))[1],
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    a.download = csvFileName(loc ? String(loc.name) : "all-places", today);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  let verdict = null;
  if (loc && r) {
    const store = loc.kind === "store";
    const cls = r.verdict === "notReady" ? "att-danger" : r.verdict === "short" ? "att-warning" : r.verdict === "ready" ? "att-ok" : "att-info";
    const text = r.verdict === "ready" ? (store ? "everything at or above its reorder level" : "grab-ready: everything at or above its required amount and in date")
      : r.verdict === "empty" ? "no lines yet" : readinessLine(r, store);
    verdict = <div className={`att ${cls}`} data-testid="verdict-line"><Icon name={r.verdict === "ready" ? "check" : "alertT"} width={16} stroke={2} /><span><b>{String(loc.name)}</b>: {text}{r.verdict === "notSetUp" && !store ? ". It can't show “Ready” until every line has a required amount." : ""}</span></div>;
  }

  return (
    <div className="stocklist">
      {verdict}
      <div className="filters" data-testid="filter-bar">
        <select aria-label="Place" value={f.locationId ?? ""} onChange={e => set("locationId", e.target.value)}>
          <option value="">All places</option>
          {locations.map(l => <option key={l.id} value={l.id}>{String(l.name)}</option>)}
        </select>
        <select aria-label="Category" value={f.categoryId ?? ""} onChange={e => set("categoryId", e.target.value)}>
          <option value="">All categories</option>
          {catList.map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>)}
        </select>
        <select aria-label="Stock level" value={f.stock ?? ""} onChange={e => set("stock", e.target.value)}>
          <option value="">Any stock level</option>
          <option value="out">Out of stock</option>
          <option value="low">Below required / reorder level</option>
          <option value="ok">At or above</option>
          <option value="none">No required amount set</option>
        </select>
        <select aria-label="Expiry" value={f.expiry ?? ""} onChange={e => set("expiry", e.target.value)}>
          <option value="">Any expiry</option>
          <option value="expired">Expired</option>
          <option value="soon">Expiring soon</option>
          <option value="expiredOrSoon">Expired or soon</option>
          <option value="inDate">In date</option>
        </select>
        <select aria-label="Sort" value={f.sort ?? "name"} onChange={e => set("sort", e.target.value === "name" ? "" : e.target.value)}>
          <option value="name">Sort: Name A–Z</option>
          <option value="nameZ">Name Z–A</option>
          <option value="stock">Stock (worst first)</option>
          <option value="expiry">Expiry (soonest first)</option>
          <option value="qtyLow">Amount (lowest first)</option>
        </select>
        <label className="check inline small"><input type="checkbox" checked={!!f.archived} onChange={e => set("archived", e.target.checked)} /><span>Show archived</span></label>
        {filtered ? <button type="button" className="btn small" onClick={() => setFilter({ locationId: f.locationId, sort: f.sort, archived: f.archived })}>Clear filters</button> : null}
      </div>
      <section className="panel">
        <div className="panel-head">
          <div><h2>{loc ? String(loc.name) : "All places"}</h2><p className="muted" data-testid="count">{shown.length} {shown.length === 1 ? "line" : "lines"}</p></div>
          <div className="acts">
            <button type="button" className="btn small" onClick={exportCsv} disabled={shown.length === 0}><Icon name="download" width={14} stroke={2} />Export CSV</button>
            {can(me.level, "changeStock") ? <button type="button" className="btn small primary" onClick={() => setAdding(true)}><Icon name="plus" width={14} stroke={2.2} />Add item</button> : null}
          </div>
        </div>
        {shown.length === 0 ? <p className="empty">No lines match these filters.</p> : (
          <table className="table stock" data-testid="lines">
            <thead><tr><th>Item</th><th className="hide-sm">Category</th>{loc ? null : <th>Place</th>}<th>On hand</th><th>{loc ? (loc.kind === "store" ? "Reorder at" : "Required") : "Required / reorder at"}</th><th>Stock</th><th>Expiry</th></tr></thead>
            <tbody>
              {shown.map(l => {
                const store = isStore(l.locationId);
                const [cls, word] = STOCK_WORDS[stockStatus(l)](store);
                const it = items.get(l.itemId);
                const arch = archivedIds.has(l.id);
                return (
                  <tr key={l.id} data-line={l.id} className={`click${arch ? " archived" : ""}`} onClick={() => openItem(l.itemId)}>
                    <td><button type="button" className="rowlink" onClick={(e) => { e.stopPropagation(); openItem(l.itemId); }}>{String(it?.name ?? "?")}</button>
                      {arch ? <span className="badge b-muted nodot arch">Archived</span> : null}
                      {l.lot ? <div className="muted lot">Lot {String(l.lot)}</div> : null}</td>
                    <td className="muted hide-sm">{it?.categoryId ? String(categories.find(c => c.id === it.categoryId)?.name ?? inv.categoryName(it.categoryId)) : "—"}</td>
                    {loc ? null : <td className="muted">{placeName(l.locationId)}</td>}
                    <td><b>{Number(l.qty)}</b> <span className="muted">{String(it?.unit ?? "")}</span></td>
                    <td className="muted" data-testid="required" data-label={store ? "Reorder at" : "Required"}>{l.required === null || l.required === undefined ? "—" : Number(l.required)}</td>
                    <td><span className={`badge ${cls}`} data-stock={stockStatus(l)}>{word}</span></td>
                    <td><ExpiryBadge expiry={l.expiry} today={today} dateStyle={dateStyle} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      {adding ? <AddItem inv={inv} at={f.locationId} close={() => setAdding(false)} go={async (p) => { const id = await store.addItem(me, p); setAdding(false); toast("Item added. Set its required amount with Edit.", "success"); openItem(id); }} /> : null}
    </div>
  );
}

// F8.4: a new item with its first place. A duplicate name is refused (in the store, any capitals, archived items too).
function AddItem({ inv, at, close, go }) {
  const [v, setV] = useState({ name: "", categoryId: "", unit: "", locationId: at || inv.locations[0]?.id || "", qty: "0" });
  const [why, setWhy] = useState("");
  const set = (k) => (e) => setV(x => ({ ...x, [k]: e.target.value }));
  const save = async () => { setWhy(""); try { await go(v); } catch (e) { setWhy(String(e.message || e)); } };
  return (
    <Dialog title="Add item" onClose={close} testid="add-item" footer={<>
      <button type="button" className="btn" onClick={close}>Cancel</button>
      <button type="button" className="btn primary" onClick={save}>Add item</button></>}>
      <div className="form-grid">
        <label className="field wide"><span>Name</span><input aria-label="Name" value={v.name} onChange={set("name")} placeholder="e.g. Burn dressing 10×10 cm" /></label>
        <label className="field"><span>Category</span><select aria-label="Category of the new item" value={v.categoryId} onChange={set("categoryId")}><option value="">No category</option>{inv.categories.map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>)}</select></label>
        <label className="field"><span>Counted in</span><input aria-label="Counted in" value={v.unit} onChange={set("unit")} placeholder="pack, tab, box…" /></label>
        <label className="field"><span>First place</span><select aria-label="First place" value={v.locationId} onChange={set("locationId")}>{inv.locations.map(l => <option key={l.id} value={l.id}>{String(l.name)}</option>)}</select></label>
        <label className="field"><span>On hand</span><input aria-label="On hand" inputMode="numeric" value={v.qty} onChange={set("qty")} /></label>
      </div>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
    </Dialog>
  );
}
