import { useState } from "react";
import { can, thenVsNow, stockTakeCsv, stockTakeFileName, todayIn, formatCalendarDate, formatTimeIn } from "@md/core";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";

// F11 — Stock takes (June J9): freeze every count with the date, who and a label; it never changes afterwards.
// Open one to see then vs now; export it as a spreadsheet file. Stored as change messages like everything else,
// so the server keeps them and a new version can't wipe them (B3).

export default function StockTakes({ door, me, store, tick, timeZone, dateStyle, toast, typedCounts }) {
  const [open, setOpen] = useState(null);
  const [freezing, setFreezing] = useState(false);
  const takes = door.records("stocktake").sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  const who = (id) => String(door.get("person", id)?.name ?? (id === "demo" ? "DEMO data" : id));
  const day = (at) => todayIn(timeZone, at);
  const when = (at) => `${formatCalendarDate(day(at), dateStyle === "short" ? "short" : "long")}, ${formatTimeIn(at, timeZone)}`;
  const take = open ? door.get("stocktake", open) : null;

  if (take) {
    const rows = thenVsNow(take, (id) => door.get("line", id));
    const lines = take.lines;
    const added = door.records("line").filter(l => l.state === "Active" && !lines.some(x => x.lineId === l.id)).length;
    const exportCsv = () => {
      const text = stockTakeCsv(take, rows, day(take.createdAt), formatTimeIn(take.createdAt, timeZone), who(take.createdBy));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
      a.download = stockTakeFileName(String(take.name), day(take.createdAt));
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    return (
      <div className="itempage" data-testid="stock-take" data-take={take.id}>
        <button type="button" className="btn small backlink" onClick={() => setOpen(null)}><Icon name="back" width={14} stroke={2} />Back to stock takes</button>
        <div className="prof-head">
          <span className="appcard-ic"><Icon name="clock" /></span>
          <div className="prof-main">
            <h2>{String(take.name)}</h2>
            <div className="muted" data-testid="frozen">Frozen {when(take.createdAt)} · by {who(take.createdBy)}</div>
            <div className="badges"><span className="badge b-accent nodot">{lines.length} lines</span><span className="badge b-muted nodot"><Icon name="lock" width={12} stroke={2} /> can't be changed</span></div>
          </div>
          <div className="acts"><button type="button" className="btn" onClick={exportCsv}><Icon name="download" width={14} stroke={2} />Export CSV</button></div>
        </div>
        <section className="panel">
          <div className="panel-head"><div><h2>Then vs now</h2><p className="muted">What each line held when it was frozen, and now{added ? ` · ${added} ${added === 1 ? "line" : "lines"} added since (not in this stock take)` : ""}</p></div></div>
          <table className="table thennow" data-testid="then-now">
            <thead><tr><th>Item</th><th>Place</th><th>Then</th><th>Now</th><th>Change</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.line.lineId} data-line={r.line.lineId} data-state={r.state} className={r.state === "archived" || r.state === "deleted" ? "archived" : ""}>
                  <td><b>{r.line.item}</b>{r.line.lot ? <div className="muted lot">Lot {r.line.lot}</div> : null}</td>
                  <td className="muted">{r.line.place}</td>
                  <td data-label="Then"><b>{r.line.qty}</b></td>
                  <td data-label="Now">{r.now === null ? "—" : r.now}</td>
                  <td data-testid="change">{r.state === "deleted" ? <span className="muted">removed (deleted since)</span>
                    : r.state === "archived" ? <span className="muted">removed (archived since)</span>
                    : r.change === 0 ? <span className="muted">no change</span>
                    : <span className={`badge nodot ${r.change > 0 ? "b-success" : "b-danger"}`}>{r.change > 0 ? "+" : ""}{r.change}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  return (
    <div className="takes">
      <section className="panel">
        <div className="panel-head">
          <div><h2>Stock takes</h2><p className="muted">Frozen, dated counts, like the monthly columns in the old spreadsheets. Live stock keeps moving; a stock take never changes.</p></div>
          {can(me.level, "changeStock") ? <button type="button" className="btn primary" onClick={() => setFreezing(true)}><Icon name="lock" width={14} stroke={2} />Freeze stock take now</button> : null}
        </div>
        {takes.length === 0 ? <p className="empty">No stock takes yet. Freeze one after the monthly count.</p> : (
          <ul className="soonest" data-testid="takes">
            {takes.map(t => (
              <li key={t.id}>
                <button type="button" className="srow" data-take={t.id} onClick={() => setOpen(t.id)}>
                  <span className="ti"><span className="t">{String(t.name)}</span><span className="d">{when(t.createdAt)} · {who(t.createdBy)} · {Array.isArray(t.lines) ? t.lines.length : 0} lines</span></span>
                  <span className="badge b-muted nodot">frozen</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {freezing ? <FreezeDialog defaultName={`Stock take, ${formatCalendarDate(todayIn(timeZone, Date.now()), "long").replace(/^\d+ /, "")}`} n={door.records("line").filter(l => l.state === "Active").length} typedCounts={typedCounts}
        close={() => setFreezing(false)} go={async (name) => { const id = await store.freezeStockTake(me, name); setFreezing(false); toast("Stock take frozen.", "success"); setOpen(id); }} /> : null}
    </div>
  );
}

function FreezeDialog({ defaultName, n, typedCounts, close, go }) {
  const [name, setName] = useState(defaultName);
  const [why, setWhy] = useState("");
  const save = async () => { setWhy(""); try { await go(name); } catch (e) { setWhy(String(e.message || e)); } };
  return (
    <Dialog title="Freeze a stock take" onClose={close} testid="freeze" footer={<>
      <button type="button" className="btn" onClick={close}>Cancel</button>
      <button type="button" className="btn primary" onClick={save}>Freeze it</button></>}>
      <p className="muted">Copies all {n} stock lines in the Store and bags, with today's date and your name. It can't be changed afterwards.</p>
      {typedCounts ? <div className="form-err" data-testid="typed-warning">{typedCounts} typed {typedCounts === 1 ? "count isn't" : "counts aren't"} saved yet and won't be in it. Save them in Count a bag first.</div> : null}
      <label className="field"><span>Label</span><input aria-label="Label" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") save(); }} /></label>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
    </Dialog>
  );
}
