import { can } from "@md/core";
import { InventoryStore } from "@md/store";
import Icon from "../components/Icon.jsx";

// F10 — Count a bag (June J8). Type what you find; an empty box means "not counted" and leaves the line as it was (B16).
// The typed counts live in the app (not on this screen), so searching and switching place never wipe them (B16);
// leaving the screen with unsaved counts asks first (App). Controlled drugs are counted in the register (F12).

export default function Count({ inv, me, state, setState, save, result }) {
  const { lines, items, locations } = inv;
  const loc = state.locationId && locations.some(l => l.id === state.locationId) ? state.locationId : locations.find(l => l.kind === "bag")?.id ?? locations[0]?.id;
  const placeLines = lines.filter(l => l.locationId === loc).sort((a, b) => String(items.get(a.itemId)?.name ?? "").localeCompare(String(items.get(b.itemId)?.name ?? "")));
  const q = state.q.trim().toLowerCase();
  const shown = placeLines.filter(l => !q || String(items.get(l.itemId)?.name ?? "").toLowerCase().includes(q));
  const typed = Object.entries(state.drafts).filter(([, v]) => String(v).trim() !== "");
  const work = can(me.level, "changeStock");
  const set = (patch) => setState(s => ({ ...s, ...patch }));
  const setDraft = (id, v) => setState(s => ({ ...s, drafts: { ...s.drafts, [id]: v } }));

  return (
    <div className="count">
      {result ? <div className="att att-ok" data-testid="count-result"><Icon name="check" width={16} stroke={2} /><span>{result}</span></div> : null}
      <div className="filters">
        <select aria-label="Place to count" value={loc ?? ""} onChange={e => set({ locationId: e.target.value })}>
          {locations.map(l => <option key={l.id} value={l.id}>{String(l.name)}</option>)}
        </select>
        <label className="findbox"><Icon name="search" width={15} stroke={2} /><input aria-label="Find in this list" placeholder="Find in this list…" value={state.q} onChange={e => set({ q: e.target.value })} /></label>
      </div>
      <section className="panel">
        <div className="panel-head"><div><h2>Count {String(locations.find(l => l.id === loc)?.name ?? "")}</h2>
          <p className="muted">{placeLines.length} lines · type what you find; leave a box empty if you didn't count that line</p></div></div>
        {!work ? <p className="lockm">View level can look but not count.</p> : null}
        {shown.length === 0 ? <p className="empty">{placeLines.length ? `Nothing in this list matches “${state.q}”. Your typed counts are still kept.` : "No lines in this place yet."}</p> : (
          <table className="table counttable" data-testid="count-lines">
            <thead><tr><th>Item</th><th>Expected</th><th>Counted</th><th>Difference</th></tr></thead>
            <tbody>
              {shown.map(l => {
                const it = items.get(l.itemId);
                const v = state.drafts[l.id] ?? "";
                const has = String(v).trim() !== "";
                const why = has ? InventoryStore.countProblem(v) : null;
                const diff = has && !why ? Number(String(v).trim()) - Number(l.qty) : null;
                const cd = it?.controlled === true;
                return (
                  <tr key={l.id} data-line={l.id}>
                    <td><b>{String(it?.name ?? "?")}</b>{it?.unit ? <span className="muted"> {String(it.unit)}</span> : null}{l.lot ? <div className="muted lot">Lot {String(l.lot)}</div> : null}</td>
                    <td data-label="Expected">{Number(l.qty)}</td>
                    <td>{cd ? <span className="muted small" data-testid="cd-count">Counted in the controlled-drug register</span> : <>
                      <input className={`cnt-in${has ? (why ? " bad" : " typed") : ""}`} aria-label={`Counted ${String(it?.name ?? "")}${l.lot ? ` lot ${String(l.lot)}` : ""}`} aria-invalid={!!why}
                        inputMode="numeric" placeholder="—" value={v} disabled={!work} onChange={e => setDraft(l.id, e.target.value)} />
                      {why ? <div className="cnt-err" data-testid="count-error">{why}</div> : null}</>}</td>
                    <td data-testid="diff">{cd ? null : diff === null ? <span className="muted">{has ? "" : "not counted"}</span> : diff === 0 ? <span className="muted">same</span> : <span className={diff > 0 ? "delta-p" : "delta-m"}>{diff > 0 ? "+" : ""}{diff}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      {typed.length ? (
        <div className="savebar" data-testid="savebar">
          <b>{typed.length} {typed.length === 1 ? "count" : "counts"} typed, not saved yet</b>
          <span className="muted small">Search, switch place or come back: they stay.</span>
          <span className="spacer" />
          <button type="button" className="btn" onClick={() => set({ drafts: {} })}>Throw away</button>
          <button type="button" className="btn primary" onClick={save}><Icon name="check" width={14} stroke={2.2} />Save counts</button>
        </div>
      ) : null}
    </div>
  );
}
