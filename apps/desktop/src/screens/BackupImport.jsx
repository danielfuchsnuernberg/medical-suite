import { useEffect, useState } from "react";
import { readXlsx, checkStockList, problemsText } from "@md/core";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";

// F13 — Settings › Backup and import (June J11). Manage level only (F13.8); the store checks that again.
// Backups: export a file, the daily backups on this computer, restore from either with a preview and a tick (B15, B2).
// Stock lists: an Excel file is checked first, problems listed (B6); loading it waits for Q26 (how the sheets are read).

const ROWS = [["people", "People"], ["items", "Items"], ["lines", "Stock lines"], ["register", "Controlled-drug register lines"], ["stockTakes", "Stock takes"], ["messages", "Activity log entries"]];

export default function BackupImport({ me, store, tick, toast }) {
  const [saved, setSaved] = useState([]);
  const [preview, setPreview] = useState(null);     // { label, check, text }
  const [list, setList] = useState(null);           // { file, checked }
  const [why, setWhy] = useState("");
  const refresh = () => store.list().then(setSaved, () => setSaved([]));
  useEffect(() => { refresh(); }, [tick]);

  const download = (name, text, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const exportNow = () => { setWhy(""); try { const f = store.exportFile(me); download(f.name, f.text, "application/json"); toast(`Backup saved: ${f.name}`, "success"); } catch (e) { setWhy(e.message); } };
  const openFile = async (file) => {
    setWhy("");
    const text = await file.text();
    setPreview({ label: file.name, text, check: store.check(me, text) });
  };
  const openSaved = async (name) => {
    setWhy("");
    try { setPreview({ label: name, text: null, name, check: await store.readSaved(me, name) }); } catch (e) { setWhy(e.message); }
  };
  const checkList = async (file) => {
    setWhy("");
    try { setList({ file: file.name, checked: checkStockList(await readXlsx(new Uint8Array(await file.arrayBuffer()))) }); }
    catch (e) { setWhy(String(e.message || e)); }
  };

  return (
    <section className="panel" data-testid="backup-import">
      <div className="panel-head"><div><h2>Backup and import</h2><p className="muted">Manage level only. Everything: stock, the register, stock takes, people, settings and the activity log.</p></div></div>
      <div className="bk-row">
        <button type="button" className="btn" onClick={exportNow}><Icon name="download" width={14} stroke={2} />Export backup</button>
        <label className="btn filebtn"><input type="file" accept=".json,application/json" aria-label="Restore from a backup file" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) openFile(f); }} />Restore from a file…</label>
        <label className="btn filebtn"><input type="file" accept=".xlsx" aria-label="Check a stock list (Excel)" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) checkList(f); }} />Check a stock list (Excel)…</label>
      </div>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
      <div className="bk-saved">
        <b>Backups on this computer</b>
        <span className="muted small">One a day, the last 30 kept, plus a copy before every restore. The server's nightly backups come with the server (REACH SD2).</span>
        {saved.length ? (
          <ul className="entries" data-testid="saved-backups">
            {saved.map(f => (
              <li key={f.name} data-backup={f.name}><span className="en"><span>{f.name.replace(/^medical-suite-backup-/, "").replace(/\.json$/, "").replace("-before-restore-", " · before a restore at ").replace(/ at (\d\d)(\d\d)(\d\d)$/, " at $1:$2")}</span><small>{Math.round(f.size / 1024)} KB</small></span>
                <button type="button" className="btn small" onClick={() => openSaved(f.name)}>Restore…</button></li>
            ))}
          </ul>
        ) : <span className="muted small">None yet.</span>}
      </div>
      {preview ? <RestoreDialog me={me} store={store} preview={preview} close={() => setPreview(null)} done={(r) => { setPreview(null); refresh(); toast(`Restored. A copy of what was there before is kept: ${r.safety}`, "success"); }} /> : null}
      {list ? <ListCheck list={list} close={() => setList(null)} toast={toast} /> : null}
    </section>
  );
}

function RestoreDialog({ me, store, preview, close, done }) {
  const [tick, setTick] = useState(false);
  const [why, setWhy] = useState("");
  const c = preview.check;
  const now = store.current();
  const restore = async () => {
    setWhy("");
    try { const text = preview.text ?? await window.md.backups.read(preview.name); done(await store.restore(me, text, tick)); }
    catch (e) { setWhy(String(e.message || e)); }
  };
  if (!c.ok) return (
    <Dialog title="Restore refused" onClose={close} testid="restore" footer={<button type="button" className="btn primary" onClick={close}>OK</button>}>
      <p className="muted">{preview.label}</p>
      <div className="form-err" data-testid="restore-refused">{c.why}</div>
    </Dialog>
  );
  return (
    <Dialog title="Restore this backup?" onClose={close} testid="restore" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary danger-fill" disabled={!tick} onClick={restore}>Restore</button></>}>
      <p className="muted">{preview.label}{c.exportedAt ? ` · made ${store.madeAt(c.exportedAt)} (base time)` : ""}</p>
      <table className="table nowafter" data-testid="now-after">
        <thead><tr><th></th><th className="n">Now</th><th className="n">After the restore</th></tr></thead>
        <tbody>
          {ROWS.map(([k, l]) => <tr key={k} data-row={k} className={now[k] !== c.summary[k] ? "diff" : ""}><td>{l}</td><td className="n">{now[k]}</td><td className="n">{c.summary[k]}</td></tr>)}
          <tr data-row="baseName"><td>Base</td><td className="n">{now.baseName ?? "—"}</td><td className="n">{c.summary.baseName ?? "—"}</td></tr>
        </tbody>
      </table>
      <label className="check"><input type="checkbox" checked={tick} onChange={e => setTick(e.target.checked)} /><span>I understand: everything on this computer is replaced by this backup. A copy of today is saved first.</span></label>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
    </Dialog>
  );
}

function ListCheck({ list, close, toast }) {
  const c = list.checked;
  const copy = async () => {
    try { await navigator.clipboard.writeText(problemsText(c, list.file)); toast("Copied. Paste it into an email or message for the medics.", "success"); }
    catch { toast("Couldn't copy here. Select the list and copy it by hand.", "danger"); }
  };
  return (
    <Dialog title={`Stock list: ${list.file}`} onClose={close} testid="list-check" footer={<><button type="button" className="btn" onClick={copy}>Copy the list for the medics</button><button type="button" className="btn primary" onClick={close}>Close</button></>}>
      <p data-testid="list-summary"><b>{c.rows}</b> rows in {c.sheets.filter(s => s.rows.length).length} {c.sheets.filter(s => s.rows.length).length === 1 ? "sheet" : "sheets"} · <b className="danger">{c.blocking}</b> must be fixed in the spreadsheet · {c.notes} with notes only</p>
      <p className="muted small">Nothing has been loaded. Rows marked “must fix” have to be corrected in the medics' spreadsheet first, so the file stays the true list. Loading the lists waits for your answer to Q26 (how the sheets are read).</p>
      <div className="listcheck">
        {c.sheets.map(s => (
          <div key={s.name} className="lc-sheet" data-sheet={s.name}>
            <b>{s.name}</b> <span className="muted small">{s.note ?? `${s.rows.length} ${s.rows.length === 1 ? "row" : "rows"} · ${s.rows.filter(r => r.flags.some(f => f.blocking)).length} must fix`}</span>
            {s.rows.filter(r => r.flags.length).length ? (
              <table className="table lc-table"><tbody>
                {s.rows.filter(r => r.flags.length).map(r => (
                  <tr key={r.row} data-row={r.row}><td className="n nowrap">row {r.row}</td><td><b>{r.tidied}</b></td>
                    <td>{r.flags.map((f, i) => <span key={i} className={`badge nodot ${f.blocking ? "b-danger" : "b-muted"}`} data-blocking={f.blocking}>{f.blocking ? "must fix: " : ""}{f.text}</span>)}</td></tr>
                ))}
              </tbody></table>
            ) : null}
          </div>
        ))}
      </div>
    </Dialog>
  );
}
