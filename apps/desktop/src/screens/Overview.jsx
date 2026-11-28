import { overview, readiness, readinessLine, verdictWord } from "@md/core";
import Icon from "../components/Icon.jsx";
import ExpiryBadge from "../components/ExpiryBadge.jsx";

// F6 — Inventory overview (June J4). Every number comes from @md/core's readiness rules (B1, B10, B25);
// every card and warning opens the lines it means (F6.1).

const VERDICT_CLASS = { empty: "b-muted", notReady: "b-danger", short: "b-warning", notSetUp: "b-info", ready: "b-success" };

export default function Overview({ inv, today, dateStyle, open, openItem }) {
  const { lines, items, locations } = inv;
  const o = overview(lines, today);
  const Stat = ({ k, icon, children, filter }) => filter
    ? <button type="button" className="stat click" data-ov={k} onClick={() => open(filter)}>{children}</button>
    : <div className="stat" data-ov={k}>{children}</div>;
  return (
    <div className="overview">
      <div className="stats">
        <Stat k="types" filter={{}}><div className="k"><Icon name="box" width={14} />Item types</div><div className="v">{o.itemTypes}</div></Stat>
        <Stat k="units" filter={{}}><div className="k"><Icon name="check" width={14} />Units everywhere</div><div className="v">{o.units}</div></Stat>
        <Stat k="out" filter={{ stock: "out" }}><div className="k"><Icon name="alertC" width={14} />Out of stock</div><div className="v">{o.out}</div></Stat>
        <Stat k="expired" filter={{ expiry: "expired" }}><div className="k"><Icon name="alertT" width={14} />Expired</div><div className="v">{o.expired} <small>/ {o.soon} soon</small></div></Stat>
      </div>

      <div className="attention" data-testid="attention">
        {o.below ? <button type="button" className="att att-danger" data-att="below" onClick={() => open({ stock: "below" })}><Icon name="alertC" width={16} stroke={2} /><span><b>{o.below}</b> below zero: two computers took the same stock. Count {o.below === 1 ? "it" : "them"}.</span></button> : null}
        {o.out ? <button type="button" className="att att-danger" data-att="out" onClick={() => open({ stock: "out" })}><Icon name="alertC" width={16} stroke={2} /><span><b>{o.out}</b> out of stock, everywhere</span></button> : null}
        {o.low ? <button type="button" className="att att-warning" data-att="low" onClick={() => open({ stock: "low" })}><Icon name="alertT" width={16} stroke={2} /><span><b>{o.low}</b> below required or reorder level</span></button> : null}
        {o.expired + o.soon ? <button type="button" className="att att-danger" data-att="expsoon" onClick={() => open({ expiry: "expiredOrSoon" })}><Icon name="alertT" width={16} stroke={2} /><span><b>{o.expired + o.soon}</b> expired or expiring soon</span></button> : null}
        {o.none ? <button type="button" className="att att-info" data-att="none" onClick={() => open({ stock: "none" })}><Icon name="alertC" width={16} stroke={2} /><span><b>{o.none}</b> with no required amount or reorder level set</span></button> : null}
        {!(o.out || o.low || o.expired || o.soon || o.none) && lines.length ? <div className="att att-ok"><Icon name="check" width={16} stroke={2} /><span>Nothing needs attention.</span></div> : null}
      </div>

      <section className="panel">
        <div className="panel-head"><div><h2>Bag readiness</h2><p className="muted">Grab-ready status per place</p></div></div>
        {locations.length === 0 ? <p className="empty">No Store or bags yet. Bags are added in Settings.</p> : (
          <div className="cards" data-testid="readiness">
            {locations.map(lc => {
              const store = lc.kind === "store";
              const r = readiness(lines.filter(l => l.locationId === lc.id), today);
              return (
                <button type="button" className="appcard rcard" key={lc.id} data-loc={lc.id} data-verdict={r.verdict} onClick={() => open({ locationId: lc.id })}>
                  <span className="rtop"><span className="appcard-name">{String(lc.name)}</span><span className={`badge ${VERDICT_CLASS[r.verdict]}`} data-testid="verdict">{verdictWord(r.verdict, store)}</span></span>
                  <span className="appcard-desc">{readinessLine(r, store)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><div><h2>Soonest to expire</h2><p className="muted">Across the Store and every bag · expired or within 60 days</p></div></div>
        {o.soonest.length === 0 ? <p className="empty">Nothing expires in the next 60 days.</p> : (
          <ul className="soonest" data-testid="soonest">
            {o.soonest.map(l => (
              <li key={l.id}>
                <button type="button" className="srow" data-line={l.id} onClick={() => openItem(l.itemId)}>
                  <span className="ti"><span className="t">{String(items.get(l.itemId)?.name ?? "?")}</span><span className="d">{String(locations.find(x => x.id === l.locationId)?.name ?? "?")} · {Number(l.qty)} {String(items.get(l.itemId)?.unit ?? "")}</span></span>
                  <ExpiryBadge expiry={l.expiry} today={today} dateStyle={dateStyle} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
