import { matches, readiness, readinessLine, stockStatus } from "@md/core";
import Icon from "../components/Icon.jsx";
import ExpiryBadge from "../components/ExpiryBadge.jsx";

// Store and bags — the first version, from F6: the lines a card or warning on the Overview means.
// F7 adds the filter boxes, sort, CSV and archived lines; F8 the item page behind each row.

const STOCK_WORDS = {
  out: () => ["b-danger", "Out of stock"],
  low: (store) => ["b-warning", store ? "Below reorder level" : "Below required"],
  none: (store) => ["b-muted nodot", store ? "No reorder level" : "No required amount"],
  ok: (store) => ["b-success", store ? "In stock" : "At or above required"],
};
const FILTER_WORDS = { out: "out of stock", low: "below required or reorder level", none: "with no required amount or reorder level", ok: "at or above required" };

export default function StockList({ inv, today, dateStyle, filter, clear }) {
  const { lines, items, locations } = inv;
  const f = filter || {};
  const loc = f.locationId ? locations.find(l => l.id === f.locationId) : null;
  const isStore = (id) => locations.find(l => l.id === id)?.kind === "store";
  const name = (l) => String(items.get(l.itemId)?.name ?? "?");
  const shown = lines.filter(l => matches(l, f, today)).sort((a, b) => name(a).localeCompare(name(b)));
  const r = loc ? readiness(shown, today) : null;
  const what = [f.stock ? FILTER_WORDS[f.stock] : null, f.expiry === "expired" ? "expired" : f.expiry === "expiredOrSoon" ? "expired or expiring soon" : null].filter(Boolean).join(", ");

  let verdict = null;
  if (loc && r) {
    const store = loc.kind === "store";
    const cls = r.verdict === "notReady" ? "att-danger" : r.verdict === "short" ? "att-warning" : r.verdict === "notSetUp" ? "att-info" : r.verdict === "ready" ? "att-ok" : "att-info";
    const text = r.verdict === "ready" ? (store ? "everything at or above its reorder level" : "grab-ready: everything at or above its required amount and in date")
      : r.verdict === "empty" ? "no lines yet" : readinessLine(r, store);
    verdict = <div className={`att ${cls}`} data-testid="verdict-line"><Icon name={r.verdict === "ready" ? "check" : "alertT"} width={16} stroke={2} /><span><b>{String(loc.name)}</b>: {text}{r.verdict === "notSetUp" && !store ? ". It can't show “Ready” until every line has a required amount." : ""}</span></div>;
  }

  return (
    <div className="stocklist">
      {verdict}
      {what ? <div className="history-bar" data-testid="filter-bar"><span>Showing lines {what}{loc ? ` in ${String(loc.name)}` : ", everywhere"}</span><button type="button" className="btn small" onClick={clear}>Show all lines</button></div>
        : loc ? <div className="history-bar" data-testid="filter-bar"><span>Showing {String(loc.name)}</span><button type="button" className="btn small" onClick={clear}>Show all places</button></div> : null}
      <section className="panel">
        <div className="panel-head"><div><h2>{loc ? String(loc.name) : "All places"}</h2><p className="muted" data-testid="count">{shown.length} {shown.length === 1 ? "line" : "lines"}</p></div></div>
        {shown.length === 0 ? <p className="empty">No lines match.</p> : (
          <table className="table stock" data-testid="lines">
            <thead><tr><th>Item</th>{loc ? null : <th>Place</th>}<th>On hand</th><th>{loc ? (loc.kind === "store" ? "Reorder at" : "Required") : "Required / reorder at"}</th><th>Stock</th><th>Expiry</th></tr></thead>
            <tbody>
              {shown.map(l => {
                const store = isStore(l.locationId);
                const [cls, word] = STOCK_WORDS[stockStatus(l)](store);
                return (
                  <tr key={l.id} data-line={l.id}>
                    <td><b>{name(l)}</b>{l.lot ? <div className="muted lot">Lot {String(l.lot)}</div> : null}</td>
                    {loc ? null : <td className="muted">{String(locations.find(x => x.id === l.locationId)?.name ?? "?")}</td>}
                    <td><b>{Number(l.qty)}</b> <span className="muted">{String(items.get(l.itemId)?.unit ?? "")}</span></td>
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
    </div>
  );
}
