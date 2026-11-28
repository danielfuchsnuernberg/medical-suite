import { useState } from "react";
import { itemRows, filterItems, itemsCsv, ITEM_STATUS_WORD, can, mayChangeStock, stockRefusal, csvFileName } from "@md/core";
import Icon from "../components/Icon.jsx";
import ExpiryBadge from "../components/ExpiryBadge.jsx";
import { AddItem } from "./StockList.jsx";

// B74 (A5, Q41 = A) — the Item list (F22): one row per item, its stock added up over every place.
// Store and bags shows the lines (one per item, place and lot); this shows the catalogue EDP will share (same item numbers).
// A row opens the item page; Back comes back here with the search kept.

const STATUS_BADGE = { below: "b-danger", out: "b-danger", low: "b-warning", none: "b-muted nodot", ok: "b-success" };

export default function ItemList({ inv, door, me, today, dateStyle, openItem, store, toast, tick, filter, setFilter }) {
  const [adding, setAdding] = useState(false);
  void tick;
  const work = mayChangeStock(me);   // A9 (B78)
  const f = filter || {};
  const set = (k, v) => setFilter({ ...f, [k]: v || undefined });
  const isStore = (id) => inv.locs.get(id)?.kind === "store";
  const rows = itemRows(door.records("item"), inv.lines, isStore);
  const shown = filterItems(rows, f);
  const catName = (id) => String(inv.categories.find(c => c.id === id)?.name ?? inv.categoryName(id));
  const usedCats = new Set(rows.map(r => r.categoryId).filter(Boolean));
  const cats = inv.categories.filter(c => usedCats.has(c.id) || c.id === f.categoryId);
  const active = rows.filter(r => !r.archived).length;

  const exportCsv = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([itemsCsv(shown, catName)], { type: "text/csv;charset=utf-8" }));
    a.download = csvFileName("item-list", today);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="itemlist" data-testid="item-list">
      <div className="filters" data-testid="item-filters">
        <label className="findbox"><Icon name="search" width={15} /><input aria-label="Search items" placeholder="Search by name or item number" value={f.q ?? ""} onChange={e => set("q", e.target.value)} /></label>
        <select aria-label="Category" value={f.categoryId ?? ""} onChange={e => set("categoryId", e.target.value)}>
          <option value="">All categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{String(c.name)}</option>)}
        </select>
        <label className="check inline small"><input type="checkbox" checked={!!f.archived} onChange={e => set("archived", e.target.checked)} /><span>Show archived</span></label>
        {f.q || f.categoryId ? <button type="button" className="btn small" onClick={() => setFilter({ archived: f.archived })}>Clear filters</button> : null}
      </div>
      {!work && can(me.level, "changeStock") ? <p className="lockm" data-testid="not-clinical">{stockRefusal(me)}</p> : null}
      <section className="panel">
        <div className="panel-head">
          <div><h2>All items</h2><p className="muted" data-testid="count">{shown.length} of {active} {active === 1 ? "item" : "items"} · totals over the Store and every bag</p></div>
          <div className="acts">
            <button type="button" className="btn small" onClick={exportCsv} disabled={shown.length === 0}><Icon name="download" width={14} stroke={2} />Export CSV</button>
            {work ? <button type="button" className="btn small primary" onClick={() => setAdding(true)}><Icon name="plus" width={14} stroke={2.2} />Add item</button> : null}
          </div>
        </div>
        {shown.length === 0 ? <p className="empty">{rows.length ? "No items match." : "No items yet."}</p> : (
          <table className="table stock" data-testid="items">
            <thead><tr><th>No.</th><th>Item</th><th className="hide-sm">Category</th><th>Total</th><th className="hide-sm">Places</th><th>Next expiry</th><th>Stock</th></tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.id} data-item={r.id} className={`click${r.archived ? " archived" : ""}`} onClick={() => openItem(r.id)}>
                  <td className="muted">{r.itemNo || "—"}</td>
                  <td><button type="button" className="rowlink" onClick={(e) => { e.stopPropagation(); openItem(r.id); }}>{r.name}</button>
                    {r.controlled ? <span className="badge b-danger nodot arch" title="Controlled drug">CD</span> : null}
                    {r.archived ? <span className="badge b-muted nodot arch">Archived</span> : null}</td>
                  <td className="muted hide-sm">{r.categoryId ? catName(r.categoryId) : "—"}</td>
                  <td data-testid="total"><b>{r.total}</b> <span className="muted">{r.unit}</span></td>
                  <td className="muted hide-sm" data-testid="places">{r.places}</td>
                  <td>{r.nextExpiry ? <ExpiryBadge expiry={r.nextExpiry} today={today} dateStyle={dateStyle} /> : <span className="muted">—</span>}</td>
                  <td><span className={`badge ${STATUS_BADGE[r.status]}`} data-stock={r.status}>{ITEM_STATUS_WORD[r.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {adding ? <AddItem inv={inv} close={() => setAdding(false)} go={async (p) => { const id = await store.addItem(me, p); setAdding(false); toast("Item added. Set its required amount with Edit.", "success"); openItem(id); }} /> : null}
    </div>
  );
}
