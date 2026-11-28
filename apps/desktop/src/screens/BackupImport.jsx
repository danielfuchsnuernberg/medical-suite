import { useEffect, useState } from "react";
import { readXlsx, checkStockList, problemsText, planImport, rowKey, juneStaff } from "@md/core";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";

// F13 — Settings › Backup and import (June J11). Manage level only (F13.8); the store checks that again.
// Backups: export a file, the daily backups on this computer, restore from either with a preview and a tick (B15, B2).
// Stock lists: an Excel file is checked first, problems listed (B6); loading it waits for Q26 (how the sheets are read).

const ROWS = [["people", "People"], ["items", "Items"], ["lines", "Stock lines"], ["register", "Controlled-drug register lines"], ["stockTakes", "Stock takes"], ["messages", "Activity log entries"]];

export default function BackupImport({ me, store, tick, toast, door, inventory, accounts }) {
  const trial = !!(window.md && window.md.trial);
  const [people, setPeople] = useState(null);       // B76: what loading the June people did
  // B76 (A7, Q42 = A): the real-data trial only. Names, jobs and emails from the archived June app; professions from the job.
  const loadJune = async (file) => {
    setWhy(""); setPeople(null);
    const found = juneStaff(await file.text());
    if (!found.length) { setWhy("That isn't the June app: no people found in it. Nothing was added."); return; }
    const out = [];
    for (const p of found) {
      try {
        const added = await accounts.addPerson(me, { name: p.name, job: p.job, level: "Work", email: p.email || undefined });
        if (p.profession !== "Other") await accounts.setProfession(me, added.id, p.profession);
        out.push({ name: p.name, ok: `added: ${p.job || "no job"} → ${p.profession}${p.profession === "Doctor" ? " (types their medical code at first sign-in)" : ""}` });
      } catch (e) { out.push({ name: p.name, ok: `not added: ${String(e.message || e)}` }); }
    }
    setPeople(out);
  };
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
    try { setList({ file: file.name, checked: checkStockList(await readXlsx(new Uint8Array(await file.arrayBuffer())), { trial: !!(window.md && window.md.trial) }) }); }
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
      {trial && accounts ? <div className="trial-people" data-testid="june-people">
        <label className="btn filebtn"><input type="file" accept=".html,text/html" aria-label="Load people from the June app" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) loadJune(f); }} /><Icon name="users" width={14} stroke={2} />Load people from the June app…</label>
        <span className="muted small">Real-data trial only. Names, jobs and emails; the June training records were made up by that app and are not loaded. Everyone comes in at Work level with no password: give each a one-time password in People and access.</span>
        {people ? <ul data-testid="june-result">{people.map((p, i) => <li key={i}><b>{p.name}</b>: {p.ok}</li>)}</ul> : null}
      </div> : null}
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
      {list && !list.load ? <ListCheck list={list} close={() => setList(null)} toast={toast} prepare={() => setList(l => ({ ...l, load: true }))} /> : null}
      {list?.load ? <LoadPreview list={list} door={door} me={me} inventory={inventory} close={() => setList(null)} done={(r) => { setList(null); toast(`Loaded ${r.loaded} ${r.loaded === 1 ? "line" : "lines"}${r.newBags ? `, ${r.newBags} new ${r.newBags === 1 ? "bag" : "bags"}` : ""}. ${r.waiting ? `${r.waiting} wait for the Head Doctor under Controlled drugs.` : ""}`, "success"); }} /> : null}
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

function ListCheck({ list, close, toast, prepare }) {
  const c = list.checked;
  const copy = async () => {
    try { await navigator.clipboard.writeText(problemsText(c, list.file)); toast("Copied. Paste it into an email or message for the medics.", "success"); }
    catch { toast("Couldn't copy here. Select the list and copy it by hand.", "danger"); }
  };
  return (
    <Dialog title={`Stock list: ${list.file}`} onClose={close} testid="list-check" footer={<><button type="button" className="btn" onClick={copy}>Copy the list for the medics</button>
      {c.blocking ? <button type="button" className="btn primary" onClick={close}>Close</button> : <><button type="button" className="btn" onClick={close}>Close</button><button type="button" className="btn primary" onClick={prepare}>Prepare loading…</button></>}</>}>
      <p data-testid="list-summary"><b>{c.rows}</b> rows in {c.sheets.filter(s => s.rows.length).length} {c.sheets.filter(s => s.rows.length).length === 1 ? "sheet" : "sheets"} · <b className="danger">{c.blocking}</b> must be fixed in the spreadsheet · {c.notes} with notes only</p>
      <p className="muted small" data-testid="list-next">Nothing has been loaded. {c.blocking ? `Loading is possible once the ${c.blocking} “must fix” ${c.blocking === 1 ? "row is" : "rows are"} corrected in the medics' spreadsheet and the file is checked again, so the file stays the true list.` : "No row has to be fixed: the next step shows exactly what would be loaded, before anything is."}</p>
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

// F13.6 — what would be loaded, before anything is (Q26 = A, A, A; Head Doctor page part 6 = A). One save; Manage only.
function LoadPreview({ list, door, me, inventory, close, done }) {
  const places = door.records("location").filter(l => l.state === "Active").map(l => ({ id: l.id, name: String(l.name), kind: l.kind, state: l.state }))
    .sort((a, b) => (a.kind === "store" ? 0 : 1) - (b.kind === "store" ? 0 : 1) || a.name.localeCompare(b.name));
  const items = door.records("item").map(i => ({ id: i.id, name: String(i.name), unit: i.unit, controlled: i.controlled, state: i.state }));
  const [targets, setTargets] = useState({});
  const [suggested, setSuggested] = useState(() => new Set());
  const [why, setWhy] = useState("");
  const plan = planImport(list.checked, list.file, places, items, { targets, suggested });
  const pick = (sheet, v) => setTargets(t => ({ ...t, [sheet]: v === "skip" ? { kind: "skip" } : v === "new" ? { kind: "new", name: sheet.trim().replace(/\s+/g, " ") } : { kind: "place", id: v } }));
  const toggle = (key) => setSuggested(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const load = async () => { setWhy(""); try { done(await inventory.loadImport(me, plan, list.file, list.checked.blocking)); } catch (e) { setWhy(String(e.message || e)); } };
  return (
    <Dialog title={`Load: ${list.file}`} onClose={close} testid="load-preview" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={load}>Load {plan.load} {plan.load === 1 ? "line" : "lines"}</button></>}>
      <p data-testid="load-summary"><b>{plan.load}</b> {plan.load === 1 ? "line loads" : "lines load"} now · <b>{plan.waiting}</b> {plan.waiting === 1 ? "waits" : "wait"} for the Head Doctor · {plan.newItems} new {plan.newItems === 1 ? "item" : "items"}{plan.newBags.length ? ` · new ${plan.newBags.length === 1 ? "bag" : "bags"}: ${plan.newBags.join(", ")}` : ""}{plan.skipped ? ` · ${plan.skipped} skipped` : ""}</p>
      <p className="muted small">For each row the newest month with a number is loaded. A line already there (same item, place, lot and expiry) gets this number as a count. Tick a row if it is a controlled drug: it then waits for the Head Doctor, who confirms it with a witness. Controlled drugs never come in as ordinary stock.</p>
      <div className="listcheck">
        {plan.sheets.map(s => (
          <div key={s.name} className="lc-sheet" data-sheet={s.name}>
            <div className="lp-head"><b>{s.name}</b>
              <select aria-label={`Place for ${s.name}`} value={s.target.kind === "place" ? s.target.id : s.target.kind} onChange={e => pick(s.name, e.target.value)}>
                {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                <option value="new">New bag: {s.name.trim().replace(/\s+/g, " ")}</option>
                <option value="skip">Skip this sheet</option>
              </select></div>
            {s.target.kind === "skip" ? <span className="muted small">Skipped: nothing from this sheet is loaded.</span> : (
              <table className="table lc-table"><tbody>
                {s.rows.map(r => (
                  <tr key={r.key} data-row={r.row} className={r.waits ? "waits" : ""}>
                    <td className="n nowrap">row {r.row}</td>
                    <td><b>{r.item}</b>{r.itemId ? null : <span className="badge b-accent nodot">new item</span>}</td>
                    <td className="n nowrap" data-testid="lp-qty">{r.qty}{r.unit ? ` ${r.unit}` : ""} <span className="muted">{r.month ? `(${r.month})` : "(no count)"}</span></td>
                    <td className="muted">{[r.lot && `lot ${r.lot}`, r.expiry && `exp ${r.expiry}`, r.required !== null && `required ${r.required}`].filter(Boolean).join(" · ")}</td>
                    <td>{r.waits === "controlled" ? <span className="badge b-warning nodot">controlled drug: waits for the Head Doctor</span>
                      : <label className="check inline small"><input type="checkbox" aria-label={`Controlled drug: ${r.item} (${s.name})`} checked={r.waits === "suggested"} onChange={() => toggle(r.key)} /><span>controlled drug?</span></label>}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        ))}
      </div>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
    </Dialog>
  );
}
