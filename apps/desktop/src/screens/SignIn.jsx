import { useState } from "react";
import { MIN_PASSWORD } from "@md/core";
import Icon from "../components/Icon.jsx";

// F2 — before the program opens: first start (set up), sign in, and "choose your own password" after a one-time one.
// Until the server exists, passwords live on this computer only (Q22 = A). There is no "Acting as" (B12).

function Frame({ title, sub, children, demo, testid }) {
  return (
    <div className="signin" data-testid={testid}>
      <div className="signin-card">
        <div className="signin-head">
          <span className="mark"><Icon name="plus" stroke={2.4} /></span>
          <div><div className="signin-app">REACH Medical Suite</div><h1>{title}</h1></div>
        </div>
        {sub ? <p className="signin-sub">{sub}</p> : null}
        {children}
      </div>
      {demo ? <span className="demo-mark">DEMO DATA</span> : null}
    </div>
  );
}

const Problem = ({ text }) => text ? <div className="form-err" role="alert" data-testid="signin-error">{text}</div> : null;

export function SignIn({ accounts, demo, baseName, onSignedIn }) {
  const people = accounts.people();
  const [who, setWho] = useState("");
  const [pw, setPw] = useState("");
  const [stay, setStay] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!who) { setErr("Pick your name from the list."); return; }
    setBusy(true); setErr("");
    try {
      const r = await accounts.signIn(who, pw);
      if (!r.ok) { setErr(r.why); setPw(""); return; }
      onSignedIn(who, { stay, mustChange: r.mustChange });
    } catch (e2) { setErr(String(e2.message || e2)); }
    finally { setBusy(false); }
  };
  return (
    <Frame title="Sign in" sub={baseName} demo={demo} testid="signin">
      <form className="form" onSubmit={submit}>
        <label className="field"><span>Your name</span>
          <select value={who} onChange={e => { setWho(e.target.value); setErr(""); }} aria-label="Your name">
            <option value="">Pick your name…</option>
            {people.map(p => <option key={p.id} value={p.id}>{String(p.name)}{p.job ? ` · ${String(p.job)}` : ""}</option>)}
          </select>
        </label>
        <label className="field"><span>Password</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} aria-label="Password" autoComplete="current-password" />
        </label>
        <label className="check"><input type="checkbox" checked={stay} onChange={e => setStay(e.target.checked)} aria-label="Stay signed in on this computer" />
          <span>Stay signed in on this computer<small>Only on your own computer. The program then also opens without internet.</small></span>
        </label>
        <Problem text={err} />
        <button type="submit" className="btn primary" disabled={busy}>Sign in</button>
        <p className="form-note">No password on this computer yet, or forgotten it? A Manage-level person gives you a one-time password in Settings › People and access.</p>
        {demo ? <p className="form-note demo-note" data-testid="demo-password">DEMO: every DEMO person's password is <b>demo</b>.</p> : null}
      </form>
    </Frame>
  );
}

export function ChooseOwn({ accounts, person, demo, onDone, onCancel }) {
  const [pw, setPw] = useState(""); const [again, setAgain] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await accounts.setOwnPassword(person.id, pw, again); onDone(); }
    catch (e2) { setErr(String(e2.message || e2)); }
    finally { setBusy(false); }
  };
  return (
    <Frame title="Choose your own password" sub={`${person.name}: you signed in with a one-time password. Choose your own now; the one-time password then stops working.`} demo={demo} testid="choose-own">
      <form className="form" onSubmit={submit}>
        <label className="field"><span>New password (at least {MIN_PASSWORD} characters)</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} aria-label="New password" autoComplete="new-password" /></label>
        <label className="field"><span>The same again</span>
          <input type="password" value={again} onChange={e => setAgain(e.target.value)} aria-label="New password again" autoComplete="new-password" /></label>
        <Problem text={err} />
        <div className="row"><button type="submit" className="btn primary" disabled={busy}>Save and open</button>
          <button type="button" className="btn" onClick={onCancel}>Cancel</button></div>
      </form>
    </Frame>
  );
}

export function SetUp({ accounts, baseName, demo, onDone }) {
  const managers = accounts.people().filter(p => p.level === "Manage");
  const [who, setWho] = useState(managers.length ? "" : "new");
  const [name, setName] = useState(""); const [job, setJob] = useState("");
  const [pw, setPw] = useState(""); const [again, setAgain] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      if (!who) throw new Error("Pick your name from the list.");
      const p = await accounts.setUp(who === "new" ? { name, job } : { personId: who }, pw, again);
      onDone(p.id);
    } catch (e2) { setErr(String(e2.message || e2)); }
    finally { setBusy(false); }
  };
  return (
    <Frame title="Set up this computer" sub={`Nobody can sign in on this computer yet. The first person from Management sets it up with their own account. After that, you give everyone else a one-time password in Settings › People and access.`} demo={demo} testid="setup">
      <form className="form" onSubmit={submit}>
        {managers.length ? (
          <label className="field"><span>You (Manage level)</span>
            <select value={who} onChange={e => setWho(e.target.value)} aria-label="You">
              <option value="">Pick your name…</option>
              {managers.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}
            </select></label>
        ) : (<>
          <label className="field"><span>Your name</span><input value={name} onChange={e => setName(e.target.value)} aria-label="Your name" autoComplete="name" /></label>
          <label className="field"><span>Your job</span><input value={job} onChange={e => setJob(e.target.value)} aria-label="Your job" placeholder="e.g. Base manager" /></label>
          <p className="form-note">You get Manage level.</p>
        </>)}
        <label className="field"><span>Your password (at least {MIN_PASSWORD} characters)</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} aria-label="New password" autoComplete="new-password" /></label>
        <label className="field"><span>The same again</span>
          <input type="password" value={again} onChange={e => setAgain(e.target.value)} aria-label="New password again" autoComplete="new-password" /></label>
        <Problem text={err} />
        <button type="submit" className="btn primary" disabled={busy}>Set up and sign in</button>
        <p className="form-note">{baseName}</p>
      </form>
    </Frame>
  );
}
