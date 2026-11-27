import { useState } from "react";
import { can, LEVELS } from "@md/core";
import Icon from "../components/Icon.jsx";

// Settings. F2 brings "People and access"; country settings and lists come with F5.
// Work and View level can't open it (F2.3). Every rule is checked again in Accounts, not only here.

const PW_TEXT = { own: "Own password", "one-time": "One-time, not used yet", demo: "DEMO password", none: "No password on this computer" };

export default function Settings({ me, accounts, tick, toast }) {
  const [code, setCode] = useState(null);            // { name, code }: shown once
  const [refusal, setRefusal] = useState("");
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  void tick;

  if (!can(me.level, "openSettings")) {
    return (
      <div className="placeholder" data-testid="settings-locked">
        <Icon name="settings" width={42} />
        <h2>Settings are for Manage level</h2>
        <p>You are signed in at {me.level} level. Settings and levels are changed by Management.</p>
      </div>
    );
  }

  const run = async (fn) => {
    setRefusal("");
    try { await fn(); }
    catch (e) { const msg = String(e.message || e); if (/^Not saved/.test(msg)) toast(msg, "danger"); else setRefusal(msg); }
  };
  const people = accounts.people(true).filter(p => showArchived || p.state === "Active");

  return (
    <div className="settings">
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
          <thead><tr><th>Name</th><th>Job</th><th>Level</th><th>Password on this computer</th><th /></tr></thead>
          <tbody>
            {people.map(p => {
              const archived = p.state !== "Active";
              return (
                <tr key={p.id} data-person={p.id} className={archived ? "archived" : ""}>
                  <td>{String(p.name)}{p.id === me.id ? <span className="you">you</span> : null}</td>
                  <td>{String(p.job ?? "")}</td>
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
      <section className="panel muted-panel">
        <h2>Country settings and lists</h2>
        <p className="muted">Base name, time zone, departments, categories and bags come with F5.</p>
      </section>
    </div>
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
