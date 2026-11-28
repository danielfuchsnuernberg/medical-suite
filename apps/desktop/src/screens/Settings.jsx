import { useEffect, useState } from "react";
import { can, LEVELS, COUNTRIES, PROFESSIONS, formatCalendarDate, todayIn, mayApprove, needsMedicalCode } from "@md/core";
import Icon from "../components/Icon.jsx";
import BackupImport from "./BackupImport.jsx";

// Settings (F5) and People and access (F2). Everyone may look at the base's settings and lists; only Manage level
// changes them, and only Manage level sees People and access (Q23 = C). Every rule is checked again where the
// change is saved (SettingsStore, Accounts), not only here.

export default function Settings({ me, accounts, store, door, tick, toast, backups, register }) {
  const edit = can(me.level, "changeSettings");
  return (
    <div className="settings">
      {edit ? null : <div className="lockm" data-testid="settings-readonly"><Icon name="lock" width={14} /> Only Manage level changes settings. You can look.</div>}
      {store.base() ? null : <div className="form-err" data-testid="base-unset">The base's settings aren't set yet. Until they are, dates follow this computer's own time zone.</div>}
      <div className="setgrid">
        <BaseForm me={me} store={store} edit={edit} toast={toast} tick={tick} />
        <div className="setcol">
          <ListPanel kind="department" title="Departments" me={me} store={store} edit={edit} toast={toast} tick={tick} />
          <ListPanel kind="category" title="Inventory categories" me={me} store={store} edit={edit} toast={toast} tick={tick} />
          <ListPanel kind="course" title="Courses" me={me} store={store} edit={edit} toast={toast} tick={tick} />
          <ListPanel kind="bag" title="Bags" me={me} store={store} edit={edit} toast={toast} tick={tick} />
        </div>
      </div>
      {can(me.level, "seePeopleAccess") ? <PeopleAccess me={me} accounts={accounts} tick={tick} toast={toast} register={register} /> : null}
      {can(me.level, "changeSettings") && backups ? <BackupImport me={me} store={backups} tick={tick} toast={toast} /> : null}
    </div>
  );
}

// Run a change; a refusal shows in the panel it came from, a failed save as a red message (F3.6).
function useRun(toast) {
  const [refusal, setRefusal] = useState("");
  const run = async (fn) => {
    setRefusal("");
    try { await fn(); return true; }
    catch (e) { const msg = String(e.message || e); if (/^Not saved/.test(msg)) toast(msg, "danger"); else setRefusal(msg); return false; }
  };
  return [refusal, run, setRefusal];
}

const ZONES = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return COUNTRIES.map(c => c.timeZone); } })();
const offsetOf = (tz) => { try { return new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find(p => p.type === "timeZoneName")?.value.replace("GMT", "UTC") || ""; } catch { return ""; } };

function BaseForm({ me, store, edit, toast, tick }) {
  const cur = store.base();
  const fromStore = () => ({ baseName: String(cur?.baseName ?? ""), country: String(cur?.country ?? ""), timeZone: String(cur?.timeZone ?? ""), dateStyle: String(cur?.dateStyle ?? "long"), dayShift: String(cur?.dayShift ?? ""), nightShift: String(cur?.nightShift ?? "") });
  const [v, setV] = useState(fromStore);
  const [refusal, run] = useRun(toast);
  const [saved, setSaved] = useState(false);
  const stored = fromStore();
  const dirty = Object.keys(v).some(k => v[k] !== stored[k]);
  // Follow changes from other computers while nothing is being typed, and show what was stored after a save
  // (a shift typed with "-" is stored with "–").
  useEffect(() => { if (!dirty || saved) setV(fromStore()); }, [tick, saved]);
  const set = (k) => (e) => { setSaved(false); const val = e.target.value; setV(o => k === "country" ? { ...o, country: val, timeZone: COUNTRIES.find(c => c.code === val)?.timeZone || o.timeZone } : { ...o, [k]: val }); };
  const sample = todayIn(v.timeZone && ZONES.includes(v.timeZone) ? v.timeZone : "UTC");
  return (
    <section className="panel" data-testid="base-settings">
      <div className="panel-head"><div><h2>Country and base</h2><p className="muted">Every country thing is a setting. “Today” and every expiry follow this time zone.</p></div></div>
      <form className="form" onSubmit={async (e) => { e.preventDefault(); if (await run(() => store.saveBase(me, v))) setSaved(true); }}>
        <label className="field"><span>Base name</span><input id="set-base" value={v.baseName} onChange={set("baseName")} disabled={!edit} aria-label="Base name" /></label>
        <div className="form-grid">
          <label className="field"><span>Country</span>
            <select id="set-country" value={v.country} onChange={set("country")} disabled={!edit} aria-label="Country">
              {v.country ? null : <option value="">Pick…</option>}
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select></label>
          <label className="field wide"><span>Time zone</span>
            <select id="set-tz" value={v.timeZone} onChange={set("timeZone")} disabled={!edit} aria-label="Time zone">
              {v.timeZone ? null : <option value="">Pick…</option>}
              {ZONES.map(z => <option key={z} value={z}>{z.replace(/_/g, " ")} ({offsetOf(z)})</option>)}
            </select></label>
          <label className="field"><span>Date style</span>
            <select id="set-ds" value={v.dateStyle} onChange={set("dateStyle")} disabled={!edit} aria-label="Date style">
              <option value="long">{formatCalendarDate(sample, "long")}</option>
              <option value="short">{formatCalendarDate(sample, "short")}</option>
            </select></label>
          <label className="field"><span>Day shift</span><input id="set-day" value={v.dayShift} onChange={set("dayShift")} disabled={!edit} aria-label="Day shift" placeholder="07:00–19:00" /></label>
          <label className="field"><span>Night shift</span><input id="set-night" value={v.nightShift} onChange={set("nightShift")} disabled={!edit} aria-label="Night shift" placeholder="19:00–07:00" /></label>
        </div>
        {refusal ? <div className="form-err" role="alert" data-testid="refusal">{refusal}</div> : null}
        {edit ? <div className="row"><button type="submit" className="btn primary" disabled={!dirty}>Save</button>
          {dirty ? <button type="button" className="btn" onClick={() => setV(stored)}>Undo changes</button> : saved ? <span className="saved" data-testid="saved">Saved</span> : null}</div> : null}
      </form>
    </section>
  );
}

function ListPanel({ kind, title, me, store, edit, toast, tick }) {
  void tick;
  const [refusal, run] = useRun(toast);
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(""); const [months, setMonths] = useState("12");
  const [renaming, setRenaming] = useState(null);      // { id, name, months }
  const all = store.entries(kind);
  const shown = all.filter(e => showArchived || e.state === "Active");
  const archivedCount = all.length - all.filter(e => e.state === "Active").length;
  const word = store.word(kind);
  return (
    <section className="panel" data-testid={`list-${kind}`}>
      <div className="panel-head"><h2>{title}</h2>
        {archivedCount ? <label className="check inline small"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} aria-label={`Show archived ${title.toLowerCase()}`} /><span>Show archived ({archivedCount})</span></label> : null}</div>
      <ul className="entries">
        {shown.map(e => {
          const archived = e.state !== "Active";
          const uses = store.uses(kind, e.id);
          return (
            <li key={e.id} className={archived ? "archived" : ""} data-entry={e.id}>
              {renaming && renaming.id === e.id ? (
                <form className="rename" onSubmit={async (ev) => { ev.preventDefault();
                  const ok = await run(async () => { await store.rename(me, kind, e.id, renaming.name); if (kind === "course" && Number(renaming.months) !== Number(e.validMonths)) await store.setCourseMonths(me, e.id, Number(renaming.months)); });
                  if (ok) setRenaming(null); }}>
                  <input value={renaming.name} onChange={ev => setRenaming(r => ({ ...r, name: ev.target.value }))} aria-label={`New name for ${e.name}`} autoFocus />
                  {kind === "course" ? <label className="months"><input type="number" min="1" max="120" value={renaming.months} onChange={ev => setRenaming(r => ({ ...r, months: ev.target.value }))} aria-label={`Months valid for ${e.name}`} /> months</label> : null}
                  <button type="submit" className="btn small primary">Save</button><button type="button" className="btn small" onClick={() => setRenaming(null)}>Cancel</button>
                </form>
              ) : (<>
                <span className="en">{String(e.name)}
                  <small className="uses">{kind === "course" ? `valid ${Number(e.validMonths)} month${Number(e.validMonths) === 1 ? "" : "s"} · ` : ""}{archived ? "archived" : uses.length ? `used by ${uses.length}` : "not used"}</small></span>
                {edit ? <span className="acts">
                  {archived ? <button type="button" className="btn small" onClick={() => run(() => store.restore(me, kind, e.id))}>Restore</button> : (<>
                    <button type="button" className="btn small" onClick={() => setRenaming({ id: e.id, name: String(e.name), months: String(e.validMonths ?? "") })}>{kind === "course" ? "Change" : "Rename"}</button>
                    <button type="button" className="btn small" onClick={() => run(() => store.archive(me, kind, e.id))}>Archive</button>
                    <button type="button" className="btn small danger" onClick={() => run(() => store.delete(me, kind, e.id))}>Delete</button>
                  </>)}
                </span> : null}
              </>)}
            </li>
          );
        })}
        {shown.length === 0 ? <li className="none">None yet.</li> : null}
      </ul>
      {refusal ? <div className="form-err" role="alert" data-testid="refusal">{refusal}</div> : null}
      {edit ? (
        <form className="addrow" onSubmit={async (ev) => { ev.preventDefault(); if (await run(() => store.add(me, kind, adding, kind === "course" ? { validMonths: Number(months) } : {}))) setAdding(""); }}>
          <input value={adding} onChange={ev => setAdding(ev.target.value)} placeholder={`Add a ${word}…`} aria-label={`New ${word}`} />
          {kind === "course" ? <label className="months"><input type="number" min="1" max="120" value={months} onChange={ev => setMonths(ev.target.value)} aria-label="Valid for (months)" /> months</label> : null}
          <button type="submit" className="btn small">Add</button>
        </form>
      ) : null}
    </section>
  );
}


const PW_TEXT = { own: "Own password", "one-time": "One-time, not used yet", demo: "DEMO password", none: "No password on this computer" };

// Profession (Management sets it), the doctor's medical code (the doctor types it), Head Doctor (Management names it).
// Danny with the medical staff, 28 Nov: F12.12–F12.14. Management can do nothing else around controlled drugs.
function Profession({ p, me, accounts, register, run }) {
  const head = register ? register.heads().some(h => h.id === p.id) : false;
  const auto = head && p.headDoctor !== true;
  return (
    <div className="prof">
      <select aria-label={`Profession of ${p.name}`} value={String(p.profession ?? "")} onChange={e => run(() => accounts.setProfession(me, p.id, e.target.value))}>
        {p.profession ? null : <option value="">Not set</option>}
        {PROFESSIONS.map(x => <option key={x} value={x}>{x}</option>)}
      </select>
      {p.profession === "Doctor" ? (needsMedicalCode(p) ? <span className="badge b-warning nodot" data-testid="code-missing">medical code not typed yet</span> : <span className="muted small">code {String(p.medicalCode)}</span>) : null}
      {mayApprove(p) ? (
        <label className="check inline small"><input type="checkbox" aria-label={`Head Doctor: ${p.name}`} checked={p.headDoctor === true || auto} disabled={auto} onChange={e => run(() => register.setHead(me, p.id, e.target.checked))} />
          <span>Head Doctor{auto ? " (the only doctor)" : ""}</span></label>
      ) : null}
    </div>
  );
}

function PeopleAccess({ me, accounts, tick, toast, register }) {
  const [code, setCode] = useState(null);            // { name, code }: shown once
  const [refusal, run] = useRun(toast);
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  void tick;

  const people = accounts.people(true).filter(p => showArchived || p.state === "Active");

  return (
    <>
      <section className="panel" data-testid="people-access">
        <div className="panel-head">
          <div><h2>People and access</h2>
            <p className="muted">Levels: <b>View</b> looks · <b>Work</b> counts and moves stock · <b>Manage</b> also changes settings and levels. Controlled-drug rights don't follow levels: they come from the doctors' list (F12).</p></div>
          <button type="button" className="btn primary" onClick={() => setAdding(a => !a)}>Add a person</button>
        </div>
        {adding ? <AddPerson onAdd={(o) => run(async () => { await accounts.addPerson(me, o); setAdding(false); })} onCancel={() => setAdding(false)} /> : null}
        {refusal ? <div className="form-err" role="alert" data-testid="refusal">{refusal}</div> : null}
        {code ? (
          <div className="code-box" data-testid="one-time">
            <div>One-time password for <b>{code.name}</b> on this computer:</div>
            <div className="code" data-testid="one-time-code">{code.code}</div>
            <div className="muted">Shown once. Write it down for {code.name}. They must choose their own password when they first sign in.</div>
            <button type="button" className="btn" onClick={() => setCode(null)}>Done</button>
          </div>
        ) : null}
        <table className="table">
          <thead><tr><th>Name</th><th>Job</th><th>Profession</th><th>Level</th><th>Password on this computer</th><th /></tr></thead>
          <tbody>
            {people.map(p => {
              const archived = p.state !== "Active";
              return (
                <tr key={p.id} data-person={p.id} className={archived ? "archived" : ""}>
                  <td>{String(p.name)}{p.id === me.id ? <span className="you">you</span> : null}</td>
                  <td>{String(p.job ?? "")}</td>
                  <td>{archived ? null : <Profession p={p} me={me} accounts={accounts} register={register} run={run} />}</td>
                  <td>{archived ? <span className="muted">Archived</span> : (
                    <select aria-label={`Level of ${p.name}`} value={String(p.level)} onChange={e => run(() => accounts.setLevel(me, p.id, e.target.value))}>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>)}</td>
                  <td className="muted">{archived ? "" : PW_TEXT[accounts.passwordState(p)]}</td>
                  <td className="actions">
                    {archived ? <button type="button" className="btn small" onClick={() => run(() => accounts.restore(me, p.id))}>Restore</button> : (<>
                      <button type="button" className="btn small" onClick={() => run(async () => setCode({ name: String(p.name), code: await accounts.giveOneTime(me, p.id) }))}>One-time password</button>
                      <button type="button" className="btn small" onClick={() => run(() => accounts.archive(me, p.id))}>Archive</button>
                      {accounts.canDelete(me, p.id) ? <button type="button" className="btn small danger" title="Only for a mistake, within 24 hours of adding" onClick={() => run(() => accounts.deleteMistake(me, p.id))}>Delete (mistake)</button> : null}
                    </>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <label className="check inline"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} aria-label="Show archived people" /><span>Show archived people</span></label>
      </section>
    </>
  );
}

function AddPerson({ onAdd, onCancel }) {
  const [name, setName] = useState(""); const [job, setJob] = useState(""); const [level, setLevel] = useState("Work");
  return (
    <form className="add-person" onSubmit={e => { e.preventDefault(); onAdd({ name, job, level }); }}>
      <label className="field"><span>Name</span><input value={name} onChange={e => setName(e.target.value)} aria-label="New person's name" /></label>
      <label className="field"><span>Job</span><input value={job} onChange={e => setJob(e.target.value)} aria-label="New person's job" /></label>
      <label className="field"><span>Level</span><select value={level} onChange={e => setLevel(e.target.value)} aria-label="New person's level">{LEVELS.map(l => <option key={l}>{l}</option>)}</select></label>
      <div className="row"><button type="submit" className="btn primary">Add</button><button type="button" className="btn" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
