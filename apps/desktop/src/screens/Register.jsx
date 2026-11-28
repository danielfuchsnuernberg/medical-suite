import { useState } from "react";
import { can, todayIn, formatCalendarDate, formatTimeIn, isDoctorByProfession, mayApprove } from "@md/core";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";

// F12 — Controlled-drug register (Q8, Q13–Q16, Q25). Every rule is checked again in the register store (packages/store/src/registerStore.ts).
// Lines are never edited or deleted; a doctor adds a correction line. The doctors' list, not the level, gives the rights.

const KIND = { opening: "Opening", in: "In", out: "Out", moved: "Moved", correction: "Correction" };
const HOW = { self: "took it out personally", pin: "in the room (PIN)", remote: "from own device", after: "approved afterwards" };

export default function Register({ door, me, reg, tick, timeZone, dateStyle, toast }) {
  const former = reg.formerDrugs();                 // no longer controlled: register kept, read-only (F12.15)
  const drugs = [...reg.drugs(), ...former];
  const [sel, setSel] = useState(null);
  const [dlg, setDlg] = useState(null);           // { kind: "out" | "in" | "move" | "correct" | "ask" | "revoke" | "pin", ... }
  const drug = drugs.find(d => d.id === sel) ?? drugs[0];
  const readOnly = former.some(d => d.id === drug?.id);
  const doctor = reg.isDoctor(me.id) && !readOnly;
  const work = can(me.level, "changeStock") && !readOnly;
  const name = (id) => id ? String(door.get("person", id)?.name ?? id) : "—";
  const when = (at) => `${formatCalendarDate(todayIn(timeZone, at), dateStyle === "short" ? "short" : "long")}, ${formatTimeIn(at, timeZone)}`;
  const place = (lineId) => { const l = door.get("line", String(lineId)); return l ? String(door.get("location", String(l.locationId))?.name ?? "?") : "?"; };
  const waitingAll = reg.waitingAll();
  const mine = drugs.flatMap(d => reg.ledger(d.id)).filter(r => r.line.createdBy === me.id && r.line.how === "request" && r.status === "pending");
  const close = () => setDlg(null);
  const done = (t) => { setDlg(null); toast(t, "success"); };

  const imports = reg.waitingImports();
  const importPanel = imports.length ? <ImportWaits door={door} me={me} reg={reg} waits={imports} name={name} when={when} toast={toast} /> : null;
  if (!drugs.length) return importPanel ? <div className="register" data-testid="register">{importPanel}</div> : <div className="placeholder" data-testid="register"><Icon name="pill" width={42} /><h2>No controlled drugs yet</h2><p>An item marked as a controlled drug gets its register here.</p></div>;
  const rows = reg.ledger(drug.id);
  const bal = reg.balance(drug.id), shelves = reg.onShelves(drug.id);

  return (
    <div className="register" data-testid="register">
      {reg.isDoctor(me.id) && waitingAll.length ? (
        <section className="panel waitpanel" data-testid="waiting">
          <div className="panel-head"><div><h2>Waiting for a doctor ({waitingAll.length})</h2><p className="muted">You're a doctor, so these come to you</p></div></div>
          <ul className="reqs">
            {waitingAll.map(r => {
              const it = door.get("item", r.line.itemId);
              const blocked = r.line.createdBy === me.id || r.line.witness === me.id;
              return (
                <li key={r.line.id} data-req={r.line.id}>
                  <div><b>{name(r.line.createdBy)}</b> {r.status === "emergency" ? <b className="danger">gave as an emergency</b> : "asks to take out"} <b>{r.line.qty} × {String(it?.name)}</b> from {place(r.line.lineId)} · {r.line.reason}</div>
                  <div className="muted small">{when(r.line.createdAt)} · witness {name(r.line.witness)}{r.line.askedDoctor ? ` · sent to ${name(r.line.askedDoctor)}` : ""}{r.status === "emergency" ? " · already booked, waiting for approval afterwards" : ""}
                    {r.queries.length ? ` · asked: “${r.queries.at(-1).note}”` : ""}</div>
                  {blocked ? <div className="muted small">You {r.line.createdBy === me.id ? "made" : "witnessed"} this, so another doctor answers it.</div> : (
                    <div className="acts">
                      <button type="button" className="btn small ok-fill" onClick={() => reg.decide(me, r.line.id, "approve").then(() => toast(r.status === "emergency" ? "Approved afterwards. The red flag is gone." : "Approved. Booked.", "success"), e => toast(e.message, "danger"))}>Approve</button>
                      <button type="button" className="btn small" onClick={() => setDlg({ kind: "ask", row: r })}>Ask {name(r.line.createdBy).split(" ")[0]}</button>
                      {r.line.how === "request" ? <button type="button" className="btn small danger" onClick={() => reg.decide(me, r.line.id, "refuse").then(() => toast("Refused. Nothing comes off the balance."), e => toast(e.message, "danger"))}>Refuse</button> : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      {importPanel}
      {mine.length ? (
        <div className="att att-warning" data-testid="my-requests"><Icon name="clock" width={16} stroke={2} /><span>
          {mine.map(r => <span key={r.line.id} className="myreq">Your request: {r.line.qty} × {String(door.get("item", r.line.itemId)?.name)} is waiting for {name(r.line.askedDoctor)}{r.queries.length ? <> · {name(r.queries.at(-1).createdBy)} asked: “{r.queries.at(-1).note}”</> : null}. </span>)}
        </span></div>
      ) : null}

      <div className="cdcards">
        {drugs.map(d => {
          const w = waitingAll.some(r => r.line.itemId === d.id);
          return (
            <button type="button" key={d.id} className="cdcard" data-drug={d.id} aria-pressed={d.id === drug.id} onClick={() => setSel(d.id)}>
              <span className="cdname">{String(d.name)}</span>
              <span className="bal">{reg.balance(d.id)} <small>{String(d.unit ?? "")} · {reg.placesOf(d.id).map(l => String(door.get("location", String(l.locationId))?.name)).join(", ") || "nowhere"}</small></span>
              {w ? <span className="badge b-danger">waiting for doctor</span> : null}
              {former.some(f => f.id === d.id) ? <span className="badge b-muted nodot">no longer controlled</span> : null}
            </button>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel-head">
          <div><h2>Register: {String(drug.name)}</h2><p className="muted" data-testid="balance">Balance {bal} {String(drug.unit ?? "")}</p></div>
          {work ? (
            <div className="acts">
              <button type="button" className="btn small" onClick={() => setDlg({ kind: "in" })}><Icon name="plus" width={13} stroke={2.4} />Receive</button>
              <button type="button" className="btn small" onClick={() => setDlg({ kind: "move" })}>Move</button>
              <button type="button" className="btn small primary" onClick={() => setDlg({ kind: "out" })}><Icon name="minus" width={13} stroke={2.4} />Take out</button>
            </div>
          ) : null}
        </div>
        {readOnly ? <div className="lockm" data-testid="former"><Icon name="lock" width={13} /> No longer a controlled drug{drug.controlledNote ? `: ${String(drug.controlledNote)}` : ""}. Its register stays here, read-only.</div> : null}
        {rows.length === 0 ? <div className="att att-warning" data-testid="not-opened"><Icon name="alertT" width={16} stroke={2} /><span>This drug has no register yet; the Store and bags hold {shelves}. {doctor ? "Open the register at that number, with a witness." : "A doctor opens it."}</span>
          {doctor ? <button type="button" className="btn small" onClick={() => setDlg({ kind: "open" })}>Open the register at {shelves}</button> : null}</div>
          : !readOnly && bal !== shelves ? <div className="form-err" data-testid="mismatch">The register says {bal}, but the Store and bags hold {shelves}. A doctor adds a correction line to match what is really there.</div> : null}
        <div className="tscroll">
          <table className="table ledger" data-testid="ledger">
            <thead><tr><th>When</th><th>Line</th><th className="n">Qty</th><th className="n">Balance</th><th>By</th><th>Doctor</th><th>Witness</th><th>Reason / case</th>{doctor ? <th></th> : null}</tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.line.id} data-cd={r.line.id} data-status={r.status} className={`st-${r.status} k-${r.line.kind}`}>
                  <td className="nowrap">{when(r.at)}</td>
                  <td>{KIND[r.line.kind]}
                    {r.status === "pending" ? <><br /><span className="badge b-warning nodot">waiting for doctor</span></> : null}
                    {r.status === "emergency" ? <><br /><span className="badge b-danger nodot">emergency · waiting for doctor</span></> : null}
                    {r.status === "queried" ? <><br /><span className="badge b-warning nodot">emergency · asked about</span></> : null}
                    {r.status === "refused" ? <><br /><span className="badge b-muted nodot">refused</span></> : null}</td>
                  <td className="n">{r.line.kind === "correction" ? (r.line.qty > 0 ? "+" : "") + r.line.qty : r.line.qty}</td>
                  <td className="n">{r.balance === null ? "—" : r.balance}</td>
                  <td>{name(r.line.createdBy)}</td>
                  <td>{r.doctor ? <>{name(r.doctor)}<br /><span className="muted small">{r.line.kind === "correction" ? "made the correction" : HOW[r.how] ?? ""}</span></> : r.line.kind === "in" || r.line.kind === "moved" ? <span className="muted">not needed</span> : "—"}</td>
                  <td>{name(r.line.witness)}</td>
                  <td className="reason">{String(r.line.reason ?? "")}{r.line.ref ? <><br /><span className="muted small">corrects the line of {when(door.get("cdline", r.line.ref)?.createdAt)}</span></> : null}
                    {r.queries.length ? <><br /><span className="muted small">{name(r.queries.at(-1).createdBy)} asked: “{r.queries.at(-1).note}”</span></> : null}</td>
                  {doctor ? <td>{r.counts && r.line.kind !== "moved" && r.line.kind !== "correction" ? <button type="button" className="btn small" onClick={() => setDlg({ kind: "correct", row: r })}>Correct</button> : null}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="lock"><Icon name="lock" width={13} /> Lines can't be edited or deleted. A mistake is fixed by a doctor adding a correction line.</p>
      </section>

      <Doctors door={door} me={me} reg={reg} name={name} when={when} setDlg={setDlg} toast={toast} />

      {dlg?.kind === "out" ? <TakeOut door={door} me={me} reg={reg} drug={drug} close={close} done={done} /> : null}
      {dlg?.kind === "in" ? <Receive door={door} me={me} reg={reg} drug={drug} close={close} done={done} /> : null}
      {dlg?.kind === "move" ? <Move door={door} me={me} reg={reg} drug={drug} close={close} done={done} /> : null}
      {dlg?.kind === "correct" ? <Correct door={door} me={me} reg={reg} row={dlg.row} when={when} close={close} done={done} /> : null}
      {dlg?.kind === "ask" ? <Ask me={me} reg={reg} row={dlg.row} name={name} close={close} done={done} /> : null}
      {dlg?.kind === "revoke" ? <Revoke me={me} reg={reg} person={dlg.person} close={close} done={done} /> : null}
      {dlg?.kind === "open" ? <OpenRegister door={door} me={me} reg={reg} drug={drug} close={close} done={done} /> : null}
      {dlg?.kind === "pin" ? <SetPin me={me} reg={reg} close={close} done={done} /> : null}
    </div>
  );
}

// ---- import rows waiting for the Head Doctor (F13.6) ----
function ImportWaits({ door, me, reg, waits, name, when, toast }) {
  const head = reg.isHead(me.id);
  const [open, setOpen] = useState(null);
  const [witness, setWitness] = useState("");
  const [why, setWhy] = useState("");
  const place = (id) => String(door.get("location", String(id))?.name ?? "?");
  const people = door.records("person").filter(p => p.state === "Active" && p.id !== me.id).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const decide = async (w, controlled) => {
    setWhy("");
    try { await reg.confirmImport(me, w.id, controlled, witness); setOpen(null); setWitness(""); toast(controlled ? `${String(w.item)}: in the register now.` : `${String(w.item)} loaded as ordinary stock.`, "success"); }
    catch (e) { setWhy(String(e.message || e)); }
  };
  return (
    <section className="panel waitpanel" data-testid="import-waits">
      <div className="panel-head"><div><h2>From an import: waiting for the Head Doctor ({waits.length})</h2>
        <p className="muted">{head ? "Decide each one: a controlled drug comes in through the register with a witness; otherwise it loads as ordinary stock." : "Only the Head Doctor decides these. Nothing has been loaded for them yet."}</p></div></div>
      <ul className="reqs">
        {waits.map(w => (
          <li key={w.id} data-wait={w.id}>
            <div><b>{String(w.item)}</b> · {Number(w.qty)}{w.unit ? ` ${String(w.unit)}` : ""} into {place(w.locationId)}{w.lot ? ` · lot ${String(w.lot)}` : ""}{w.expiry ? ` · exp ${String(w.expiry)}` : ""}</div>
            <div className="muted small">{String(w.file)} · {String(w.sheet)}, row {String(w.row)} · {w.why === "controlled" ? "already a controlled drug" : `marked as a controlled drug by ${name(w.createdBy)}`} · {when(w.createdAt)}</div>
            {head ? (open === w.id ? (
              <div className="acts">
                <select aria-label={`Witness for ${String(w.item)}`} value={witness} onChange={e => setWitness(e.target.value)}><option value="">Pick who saw it…</option>{people.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select>
                <button type="button" className="btn small primary" onClick={() => decide(w, true)}>Confirm as controlled drug</button>
                <button type="button" className="btn small" onClick={() => { setOpen(null); setWhy(""); }}>Cancel</button>
              </div>
            ) : (
              <div className="acts">
                <button type="button" className="btn small primary" onClick={() => { setOpen(w.id); setWhy(""); }}>Controlled drug…</button>
                {w.why === "controlled" ? null : <button type="button" className="btn small" onClick={() => decide(w, false)}>Not a controlled drug</button>}
              </div>
            )) : null}
            {why && (open === w.id || !open) ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---- the doctors' list (F12.6, F12.7) ----
function Doctors({ door, me, reg, name, when, setDlg, toast }) {
  const docs = reg.doctors();
  const doctor = reg.isDoctor(me.id);
  const first = docs.length === 0;
  const canGrant = first ? can(me.level, "changeLevels") : doctor;
  // only doctors by profession (entered as Doctor, with their medical code) who aren't on the list yet (F12.13)
  const people = door.records("person").filter(p => isDoctorByProfession(p) && !mayApprove(p) && (first || p.id !== me.id)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const [pick, setPick] = useState("");
  const [why, setWhy] = useState("");
  const grant = async () => { setWhy(""); try { await reg.grant(me, pick); toast(`${name(pick)} may now approve controlled drugs. Logged, and every doctor sees it here.`, "success"); setPick(""); } catch (e) { setWhy(e.message); } };
  return (
    <section className="panel" data-testid="doctors">
      <div className="panel-head"><div><h2>Who may approve controlled drugs</h2><p className="muted">Only a doctor gives this right, never to themselves. Levels don't count here.</p></div>
        {doctor ? <button type="button" className="btn small" onClick={() => setDlg({ kind: "pin" })}>{reg.hasPin(me.id) === "own" ? "Change my PIN" : "Set my PIN"}</button> : null}</div>
      {first ? <div className="att att-warning" data-testid="no-doctor"><Icon name="alertT" width={16} stroke={2} /><span>Nobody can approve controlled drugs yet. {canGrant ? "Set the first doctor now: this is done once." : "Management sets the first doctor, once."}</span></div> : null}
      <ul className="entries">
        {docs.map(p => (
          <li key={p.id} data-doctor={p.id}><span className="en"><b>{String(p.name)}</b>{reg.isHead(p.id) ? <span className="badge b-accent nodot" data-testid="head-badge">Head Doctor</span> : null}<small>{String(p.job ?? "")}{p.medicalCode ? ` · code ${String(p.medicalCode)}` : ""}{p.id === me.id ? " · you" : ""}</small></span>
            {doctor ? <button type="button" className="iconbtn danger" aria-label={`Remove ${String(p.name)}'s right to approve`} title="Remove the right" onClick={() => setDlg({ kind: "revoke", person: p })}>✕</button> : null}</li>
        ))}
      </ul>
      {canGrant ? (
        <div className="grantrow">
          <select aria-label="Give the right to" value={pick} onChange={e => setPick(e.target.value)}>
            <option value="">{first ? "Pick the first doctor…" : "Give the right to…"}</option>
            {people.map(p => <option key={p.id} value={p.id}>{String(p.name)} · {String(p.job ?? "")}</option>)}
          </select>
          <button type="button" className="btn small" disabled={!pick} onClick={grant}>{first ? "Set as first doctor" : "Give the right"}</button>
          {!first ? <span className="muted small">You're not in this list: nobody can give the right to themselves.</span> : null}
        </div>
      ) : !first ? <p className="lockm" data-testid="doctors-lock"><Icon name="lock" width={13} /> Only a doctor can change this list.{can(me.level, "changeLevels") ? " Manage level doesn't change that." : ""}</p> : null}
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
      {doctor ? (
        <div className="rightslog" data-testid="rights-log"><b>Changes to this list</b>
          {reg.rightsLog().length ? reg.rightsLog().map(e => <span key={e.messageId}>{when(e.at)} · {name(e.by)} {e.changes.find(c => c.field === "cdRight").to ? "gave" : "removed"} {name(e.recordId)}{e.changes.find(c => c.field === "cdRight").to ? " the right" : "'s right"}</span>) : <span className="muted">None yet.</span>}
        </div>
      ) : null}
    </section>
  );
}

// ---- dialogs ----
function useRun(close) {
  const [why, setWhy] = useState("");
  const run = async (fn, ok) => { setWhy(""); try { const r = await fn(); ok(r); } catch (e) { setWhy(String(e.message || e)); } };
  return [why, run];
}
const Err = ({ why, what = "Nothing was booked." }) => why ? <div className="form-err" role="alert" data-testid="refusal">{why} {what}</div> : null;

function WitnessSelect({ door, me, value, onChange, not }) {
  const people = door.records("person").filter(p => p.state === "Active" && p.id !== me.id && p.id !== not).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return <select aria-label="Witness" value={value} onChange={e => onChange(e.target.value)}><option value="">Pick who saw it…</option>{people.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select>;
}
function PlaceSelect({ door, reg, drug, value, onChange, label = "From where" }) {
  const lines = reg.placesOf(drug.id);
  return <select aria-label={label} value={value} onChange={e => onChange(e.target.value)}>{lines.map(l => <option key={l.id} value={l.id}>{String(door.get("location", String(l.locationId))?.name)} · {Number(l.qty)}{l.lot ? ` · lot ${String(l.lot)}` : ""}</option>)}</select>;
}

function TakeOut({ door, me, reg, drug, close, done }) {
  const doctor = reg.isDoctor(me.id);
  const docs = reg.doctors().filter(p => p.id !== me.id);
  const [mode, setMode] = useState(doctor ? "self" : "pin");
  const [v, setV] = useState({ lineId: reg.placesOf(drug.id)[0]?.id ?? "", qty: "1", witness: "", reason: "", doctor: docs[0]?.id ?? "", pin: "" });
  const set = (k) => (x) => setV(s => ({ ...s, [k]: x?.target ? x.target.value : x }));
  const [why, run] = useRun();
  const go = () => run(() => reg.takeOut(me, { itemId: drug.id, lineId: v.lineId, qty: v.qty, witness: v.witness, reason: v.reason, how: mode, doctor: v.doctor, pin: v.pin }),
    () => done(mode === "request" ? `Sent to ${String(door.get("person", v.doctor)?.name)}. Nothing comes off the balance until it's approved.` : mode === "emergency" ? "Booked as an emergency. Flagged red until a doctor approves." : `Booked. Balance now ${reg.balance(drug.id)}.`));
  const label = doctor ? "Take out" : mode === "request" ? "Send for approval" : mode === "emergency" ? "Book as emergency" : "Take out";
  return (
    <Dialog title={`Take out: ${String(drug.name)}`} onClose={close} testid="take-out" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className={`btn primary${mode === "emergency" ? " danger-fill" : ""}`} onClick={go}>{label}</button></>}>
      <p className="muted">Balance <b>{reg.balance(drug.id)}</b> {String(drug.unit ?? "")}</p>
      <div className="form-grid">
        <label className="field"><span>From where</span><PlaceSelect door={door} reg={reg} drug={drug} value={v.lineId} onChange={set("lineId")} /></label>
        <label className="field"><span>How many</span><input aria-label="How many" inputMode="numeric" value={v.qty} onChange={set("qty")} /></label>
        <label className="field"><span>Witness (was there)</span><WitnessSelect door={door} me={me} value={v.witness} onChange={set("witness")} not={mode === "pin" || mode === "request" ? v.doctor : null} /></label>
        <label className="field"><span>Reason / case</span><input aria-label="Reason / case" placeholder="e.g. pain relief · EDP case number" value={v.reason} onChange={set("reason")} /></label>
      </div>
      {doctor ? <div className="att att-ok"><Icon name="check" width={15} stroke={2} /><span>You're a doctor: you take it out yourself. A witness still signs.</span></div> : (
        <div className="cdmode">
          <span className="k">Doctor's approval</span>
          <div className="seg" role="group" aria-label="Doctor's approval">
            {[["pin", "Doctor is here"], ["request", "Ask a doctor"], ["emergency", "Emergency, no doctor reachable"]].map(([k, l]) => <button type="button" key={k} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
          </div>
          {mode === "pin" ? <div className="form-grid">
            <label className="field"><span>Doctor</span><select aria-label="Doctor" value={v.doctor} onChange={set("doctor")}>{docs.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label>
            <label className="field"><span>Doctor types own PIN</span><input aria-label="Doctor's PIN" type="password" inputMode="numeric" autoComplete="off" value={v.pin} onChange={set("pin")} /></label></div>
          : mode === "request" ? <label className="field"><span>Send the request to</span><select aria-label="Doctor" value={v.doctor} onChange={set("doctor")}>{docs.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select>
            <small className="hint">It shows for the doctor wherever they're signed in. Nothing comes off the balance until it's approved.</small></label>
          : <div className="form-err">Booked straight away and flagged red “waiting for doctor” until a doctor approves or queries it. A reason and a witness are required.</div>}
        </div>
      )}
      <Err why={why} />
    </Dialog>
  );
}

function Receive({ door, me, reg, drug, close, done }) {
  const places = door.records("location").filter(l => l.state === "Active").sort((a, b) => (a.kind === "store" ? 0 : 1) - (b.kind === "store" ? 0 : 1) || String(a.name).localeCompare(String(b.name)));
  const [v, setV] = useState({ locationId: places[0]?.id ?? "", qty: "1", witness: "", reason: "", lot: "", expiry: "" });
  const set = (k) => (x) => setV(s => ({ ...s, [k]: x?.target ? x.target.value : x }));
  const [why, run] = useRun();
  return (
    <Dialog title={`Receive: ${String(drug.name)}`} onClose={close} testid="receive" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={() => run(() => reg.receive(me, { itemId: drug.id, ...v }), () => done(`Received. Balance now ${reg.balance(drug.id)}.`))}>Receive</button></>}>
      <div className="form-grid">
        <label className="field"><span>Into</span><select aria-label="Into" value={v.locationId} onChange={set("locationId")}>{places.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label>
        <label className="field"><span>How many</span><input aria-label="How many" inputMode="numeric" value={v.qty} onChange={set("qty")} /></label>
        <label className="field"><span>Lot</span><input aria-label="Lot" value={v.lot} onChange={set("lot")} /></label>
        <label className="field"><span>Expiry</span><input aria-label="Expiry" type="date" value={v.expiry} onChange={set("expiry")} /></label>
        <label className="field"><span>Witness</span><WitnessSelect door={door} me={me} value={v.witness} onChange={set("witness")} /></label>
        <label className="field"><span>From where</span><input aria-label="From where" placeholder="e.g. delivery, invoice number" value={v.reason} onChange={set("reason")} /></label>
      </div>
      <p className="muted small">Receiving needs a witness, no doctor. It joins the line with the same lot and expiry in that place, or starts a new one.</p>
      <Err why={why} />
    </Dialog>
  );
}

function Move({ door, me, reg, drug, close, done }) {
  const places = door.records("location").filter(l => l.state === "Active");
  const [v, setV] = useState({ lineId: reg.placesOf(drug.id)[0]?.id ?? "", toLocationId: "", qty: "1", witness: "" });
  const set = (k) => (x) => setV(s => ({ ...s, [k]: x?.target ? x.target.value : x }));
  const fromPlace = door.get("line", v.lineId)?.locationId;
  const targets = places.filter(p => p.id !== fromPlace);
  const to = v.toLocationId && targets.some(p => p.id === v.toLocationId) ? v.toLocationId : targets[0]?.id ?? "";
  const [why, run] = useRun();
  return (
    <Dialog title={`Move: ${String(drug.name)}`} onClose={close} testid="cd-move" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={() => run(() => reg.move(me, { itemId: drug.id, ...v, toLocationId: to }), () => done(`Moved. The balance stays ${reg.balance(drug.id)}.`))}>Move</button></>}>
      <div className="form-grid">
        <label className="field"><span>From where</span><PlaceSelect door={door} reg={reg} drug={drug} value={v.lineId} onChange={set("lineId")} /></label>
        <label className="field"><span>Move to</span><select aria-label="Move to" value={to} onChange={set("toLocationId")}>{targets.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label>
        <label className="field"><span>How many</span><input aria-label="How many" inputMode="numeric" value={v.qty} onChange={set("qty")} /></label>
        <label className="field"><span>Witness</span><WitnessSelect door={door} me={me} value={v.witness} onChange={set("witness")} /></label>
      </div>
      <p className="muted small">A move is a register line with a witness, no doctor. The balance doesn't change. (Q25)</p>
      <Err why={why} what="Nothing was moved." />
    </Dialog>
  );
}

function Correct({ door, me, reg, row, when, close, done }) {
  const [v, setV] = useState({ change: "", witness: "", reason: "" });
  const set = (k) => (x) => setV(s => ({ ...s, [k]: x?.target ? x.target.value : x }));
  const [why, run] = useRun();
  return (
    <Dialog title="Correct a line" onClose={close} testid="correct" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={() => run(() => reg.correct(me, { refId: row.line.id, ...v }), () => done("Correction added. The old line is unchanged."))}>Add correction</button></>}>
      <p>{KIND[row.line.kind]} {row.line.qty}, {when(row.at)}. The line stays as it is; your correction is added below it.</p>
      <div className="form-grid">
        <label className="field"><span>Change to the balance</span><input aria-label="Change to the balance" placeholder="e.g. 1 or -1" value={v.change} onChange={set("change")} /><small className="hint">+ adds back, − takes off</small></label>
        <label className="field"><span>Witness</span><WitnessSelect door={door} me={me} value={v.witness} onChange={set("witness")} /></label>
        <label className="field wide"><span>What was wrong</span><input aria-label="What was wrong" placeholder="e.g. 1 ampoule broken, not given" value={v.reason} onChange={set("reason")} /></label>
      </div>
      <Err why={why} what="Nothing was added." />
    </Dialog>
  );
}

function Ask({ me, reg, row, name, close, done }) {
  const [note, setNote] = useState("Please call me about this.");
  const [why, run] = useRun();
  return (
    <Dialog title={`Ask ${name(row.line.createdBy)}`} onClose={close} testid="ask" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={() => run(() => reg.decide(me, row.line.id, "query", note), () => done(row.status === "emergency" ? "Asked. The emergency shows as “asked about”." : "Asked. It stays waiting."))}>Send</button></>}>
      <label className="field"><span>Message</span><input aria-label="Message" value={note} onChange={e => setNote(e.target.value)} /></label>
      <p className="muted small">{row.status === "emergency" ? "The red flag goes; the line shows that you asked." : "The request stays waiting; nothing comes off the balance."}</p>
      <Err why={why} what="" />
    </Dialog>
  );
}

function Revoke({ me, reg, person, close, done }) {
  const [why, run] = useRun();
  const self = person.id === me.id;
  return (
    <Dialog title="Remove the right?" onClose={close} testid="revoke" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary danger-fill" onClick={() => run(() => reg.revoke(me, person.id), () => done(`${String(person.name)} can no longer approve controlled drugs.`))}>Remove</button></>}>
      <p>{self ? "You" : String(person.name)} will no longer be able to approve controlled drugs. Lines already in the register stay as they are.</p>
      <p className="muted small">Logged, and every doctor sees it in this list's changes.</p>
      <Err why={why} what="" />
    </Dialog>
  );
}

function OpenRegister({ door, me, reg, drug, close, done }) {
  const [w, setW] = useState("");
  const [why, run] = useRun();
  return (
    <Dialog title={`Open the register: ${String(drug.name)}`} onClose={close} testid="open-register" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={() => run(() => reg.openRegister(me, drug.id, w), () => done("Register opened."))}>Open at {reg.onShelves(drug.id)}</button></>}>
      <p>The first line will be an opening balance of <b>{reg.onShelves(drug.id)}</b>: what the Store and bags hold now. Count them first, with a witness.</p>
      <label className="field"><span>Witness</span><WitnessSelect door={door} me={me} value={w} onChange={setW} /></label>
      <Err why={why} />
    </Dialog>
  );
}

function SetPin({ me, reg, close, done }) {
  const [v, setV] = useState({ pin: "", repeat: "" });
  const [why, run] = useRun();
  return (
    <Dialog title="My PIN for approving in the room" onClose={close} testid="set-pin" footer={<><button type="button" className="btn" onClick={close}>Cancel</button><button type="button" className="btn primary" onClick={() => run(() => reg.setPin(me, v.pin, v.repeat), () => done("PIN saved on this computer."))}>Save PIN</button></>}>
      <div className="form-grid">
        <label className="field"><span>PIN (4–8 digits)</span><input aria-label="PIN" type="password" inputMode="numeric" autoComplete="new-password" value={v.pin} onChange={e => setV(s => ({ ...s, pin: e.target.value }))} /></label>
        <label className="field"><span>PIN again</span><input aria-label="PIN again" type="password" inputMode="numeric" autoComplete="new-password" value={v.repeat} onChange={e => setV(s => ({ ...s, repeat: e.target.value }))} /></label>
      </div>
      <p className="muted small">Kept on this computer only, like your password, never sent anywhere. You type it on a nurse's screen when you approve in the room.</p>
      <Err why={why} what="" />
    </Dialog>
  );
}
