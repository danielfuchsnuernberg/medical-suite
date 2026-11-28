import { useState } from "react";
import { can, LEVELS, OFFICES, shownNumbers, staffCounts, initials, formatCalendarDate, todayIn, personTrainingSummary, trainingCounts, expiryFor, completionProblem, validMonthsOf } from "@md/core";
import Icon from "../components/Icon.jsx";
import Dialog from "../components/Dialog.jsx";

// F14 — Staff (June J2, demo batch 4). This app's own people list in the REACH Core shape (hidden ID, name, office,
// stamps), to be merged into the one list Ops Management keeps later (REACH Q37).
// Everyone may look. Manage level adds people, changes their details, archives, restores and deletes a mistake
// (Q17 = B: people only by Manage). Levels, passwords and professions stay in Settings › People and access.
// Every rule is checked again in Accounts and TrainingStore, not only here. The roster (F16) shows where it will come.
// F15 — Training and certificates: each course's status, Assign / Mark complete / Renew / Renew early (Manage level).

const SUM_BADGE = { expired: "b-danger", due: "b-warning", ok: "b-success", none: "b-muted" };
const KIND_BADGE = { required: "b-warning", inprogress: "b-accent", done: "b-success", valid: "b-success", soon: "b-warning", expired: "b-danger" };

export default function Staff({ door, me, accounts, training, tick, toast, timeZone, dateStyle, openId, setOpenId }) {
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(false);
  void tick;
  const manage = can(me.level, "managePeople");
  const departments = door.records("department").filter(d => d.state === "Active").sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const deptName = (id) => String(door.get("department", id)?.name ?? "—");
  const all = accounts.people(true);
  const person = openId ? accounts.person(openId) : null;

  const today = training.today();
  if (person) return <Profile p={person} me={me} accounts={accounts} training={training} today={today} manage={manage} departments={departments} deptName={deptName} back={() => setOpenId(null)} toast={toast} door={door} timeZone={timeZone} dateStyle={dateStyle} />;

  const c = staffCounts(all, door.records("department"));
  const tc = trainingCounts(all, training.records(), today);
  const list = all.filter(p => showArchived || p.state === "Active");
  return (
    <div className="staff">
      <div className="stats" data-testid="staff-stats">
        <div className="stat" data-st="staff"><div className="k"><Icon name="users" width={14} /> Staff</div><div className="v">{c.staff}</div></div>
        <div className="stat" data-st="archived"><div className="k"><Icon name="file" width={14} /> Archived</div><div className="v">{c.archived}</div></div>
        <div className="stat" data-st="expired"><div className="k"><Icon name="clock" width={14} /> Certificates expired</div><div className="v">{tc.expired}</div></div>
        <div className="stat" data-st="due"><div className="k"><Icon name="clock" width={14} /> Due in 30 days</div><div className="v">{tc.due}</div></div>
      </div>
      <p className="muted" data-testid="staff-counts">Counts never include archived staff{showArchived ? " (even with “Show archived” ticked)" : ""}. By department: {c.byDept.map(d => `${d.name} ${d.count}`).join(" · ") || "none"}{c.none ? ` · no department ${c.none}` : ""}</p>
      <section className="panel">
        <div className="panel-head">
          <div><h2>Staff</h2><p className="muted">This app's own people list, kept in the REACH shape so it can join the one REACH list later (Ops Management).</p></div>
          {manage ? <button type="button" className="btn primary" onClick={() => setAdding(true)}>Add person</button> : null}
        </div>
        <table className="table staff-table">
          <thead><tr><th>Person</th><th>Department</th><th>Office</th><th>Level</th><th>Training</th></tr></thead>
          <tbody>
            {list.map(p => {
              const archived = p.state !== "Active";
              return (
                <tr key={p.id} data-person={p.id} className={`click${archived ? " archived" : ""}`} onClick={() => setOpenId(p.id)}>
                  <td><button type="button" className="linkish who-cell" onClick={(e) => { e.stopPropagation(); setOpenId(p.id); }}>
                    <span className="avatar">{initials(p.name)}</span>
                    <span><b>{String(p.name)}</b>{p.id === me.id ? <span className="you">you</span> : null}<br /><span className="muted">{String(p.job ?? "")}</span></span></button></td>
                  <td>{p.departmentId ? deptName(p.departmentId) : <span className="muted">—</span>}</td>
                  <td>{p.office ? String(p.office) : <span className="muted">not set</span>}</td>
                  <td>{archived ? <span className="badge b-danger nodot">Archived</span> : <span className="badge b-accent nodot">{String(p.level)}</span>}</td>
                  <td>{(() => { const t = personTrainingSummary(training.records(p.id), today); return <span className={`badge nodot ${SUM_BADGE[t.kind]}`} data-train={t.kind}>{t.label}</span>; })()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <label className="check inline"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} aria-label="Show archived staff" /><span>Show archived</span></label>
      </section>
      {adding ? <AddPerson accounts={accounts} me={me} departments={departments} onDone={(id) => { setAdding(false); toast("Added. Give them a one-time password in Settings › People and access."); setOpenId(id); }} onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function DetailsFields({ v, set, departments, withName }) {
  return (
    <div className="form">
      {withName ? <label className="field"><span>Name</span><input value={v.name} onChange={set("name")} aria-label="Name" autoFocus /></label> : null}
      <label className="field"><span>Job</span><input value={v.job} onChange={set("job")} aria-label="Job" placeholder="Nurse, Doctor, Base manager…" /></label>
      <div className="form-grid">
        <label className="field"><span>Department</span><select value={v.departmentId} onChange={set("departmentId")} aria-label="Department">
          <option value="">None</option>{departments.map(d => <option key={d.id} value={d.id}>{String(d.name)}</option>)}</select></label>
        <label className="field"><span>Office (REACH)</span><select value={v.office} onChange={set("office")} aria-label="Office">
          {OFFICES.map(o => <option key={o}>{o}</option>)}</select></label>
      </div>
      <label className="field"><span>Email (optional)</span><input type="email" value={v.email} onChange={set("email")} aria-label="Email" placeholder="name@example.org" /></label>
      {withName ? <label className="field"><span>Level in this app</span><select value={v.level} onChange={set("level")} aria-label="Level">{LEVELS.map(l => <option key={l}>{l}</option>)}</select></label> : null}
    </div>
  );
}

function AddPerson({ accounts, me, departments, onDone, onClose }) {
  const [v, setV] = useState({ name: "", job: "", departmentId: "", office: "Medics", email: "", level: "Work" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => { setErr(""); const val = e.target.value; setV(o => ({ ...o, [k]: val })); };
  const save = async () => {
    try { const p = await accounts.addPerson(me, { ...v, departmentId: v.departmentId || null }); onDone(p.id); }
    catch (e) { setErr(String(e.message || e)); }
  };
  return (
    <Dialog title="Add person" onClose={onClose} testid="add-person" footer={<>
      <button type="button" className="btn" onClick={onClose}>Cancel</button>
      <button type="button" className="btn primary" onClick={save}>Add</button></>}>
      <DetailsFields v={v} set={set} departments={departments} withName />
      {err ? <div className="form-err" role="alert" data-testid="refusal">{err}</div> : null}
    </Dialog>
  );
}

function Profile({ p, me, accounts, training, today, manage, departments, deptName, back, toast, door, timeZone, dateStyle }) {
  const archived = p.state !== "Active";
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState(null);    // "archive" | "delete"
  const [err, setErr] = useState("");
  const run = async (fn) => { setErr(""); try { await fn(); return true; } catch (e) { const m = String(e.message || e); if (/^Not saved/.test(m)) toast(m, "danger"); else setErr(m); return false; } };
  const added = p.createdAt ? formatCalendarDate(todayIn(timeZone, Number(p.createdAt)), dateStyle === "short" ? "short" : "long") : null;
  const addedBy = p.createdBy === "demo" ? "DEMO data" : String(door.get("person", p.createdBy)?.name ?? "");
  return (
    <div className="profile" data-testid="profile" data-person={p.id}>
      <button type="button" className="btn small backlink" onClick={back}><Icon name="back" width={14} stroke={2} />All staff</button>
      <section className="panel prof-head">
        <span className="avatar big">{initials(p.name)}</span>
        <div className="grow">
          <h2 data-testid="prof-name">{String(p.name)}{p.id === me.id ? <span className="you">you</span> : null}</h2>
          <div className="muted">{String(p.job || "No job set")} · {p.departmentId ? deptName(p.departmentId) : "no department"}</div>
          <div className="badges"><span className="badge b-accent nodot">{String(p.level)}</span>
            {archived ? <span className="badge b-danger nodot" data-testid="prof-archived">Archived</span> : <span className="badge b-success nodot">Active</span>}
            {p.profession ? <span className="badge b-muted nodot">{String(p.profession)}</span> : null}</div>
        </div>
        {manage ? <div className="actions">
          {archived ? <button type="button" className="btn" onClick={() => run(() => accounts.restore(me, p.id))}>Restore</button> : <>
            <button type="button" className="btn" onClick={() => setEditing(true)}>Edit details</button>
            {p.id !== me.id ? <button type="button" className="btn" onClick={() => setConfirm("archive")}>Archive</button> : null}
            {accounts.canDelete(me, p.id) ? <button type="button" className="btn danger" title="Only for a mistake, within 24 hours of adding" onClick={() => setConfirm("delete")}>Delete for good</button> : null}
          </>}
        </div> : null}
      </section>
      {err ? <div className="form-err" role="alert" data-testid="refusal">{err}</div> : null}
      <div className="prof-grid">
        <section className="panel" data-testid="prof-details">
          <div className="panel-head"><h2>Details</h2></div>
          <dl className="kv">
            <dt>Email</dt><dd data-testid="prof-email">{p.email ? String(p.email) : <span className="muted">none</span>}</dd>
            <dt>Office (REACH)</dt><dd data-testid="prof-office">{p.office ? String(p.office) : <span className="muted">not set</span>}</dd>
            {p.staffNo ? <><dt>Staff number</dt><dd data-testid="prof-staffno">{shownNumbers(door.records("person"), "staffNo").get(p.id)}</dd></> : null}
            {added ? <><dt>Added</dt><dd>{added}{addedBy ? ` by ${addedBy}` : ""}</dd></> : null}
            <dt>Comes from</dt><dd>This app's people list (REACH shape). Ops Management keeps the one REACH list later.</dd>
          </dl>
        </section>
        <TrainingPanel p={p} me={me} training={training} today={today} door={door} dateStyle={dateStyle} toast={toast} />
        <section className="panel" data-testid="prof-duties">
          <div className="panel-head"><h2>This week on the roster</h2></div>
          <p className="muted">Duties come with the roster (F16, release 2).</p>
        </section>
      </div>
      {editing ? <EditDetails p={p} me={me} accounts={accounts} departments={departments} onClose={() => setEditing(false)} /> : null}
      {confirm === "archive" ? (
        <Dialog title={`Archive ${p.name}?`} onClose={() => setConfirm(null)} testid="confirm-archive" footer={<>
          <button type="button" className="btn" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="btn primary" onClick={async () => { await run(() => accounts.archive(me, p.id)); setConfirm(null); }}>Archive</button></>}>
          <p>{String(p.name)} can't sign in any more and leaves the counts. Everything they did stays in the history, and Manage level can restore them.</p>
        </Dialog>) : null}
      {confirm === "delete" ? (
        <Dialog title={`Delete ${p.name} for good?`} onClose={() => setConfirm(null)} testid="confirm-delete" footer={<>
          <button type="button" className="btn" onClick={() => setConfirm(null)}>Cancel</button>
          <button type="button" className="btn danger" onClick={async () => { if (await run(() => accounts.deleteMistake(me, p.id))) { setConfirm(null); back(); } else setConfirm(null); }}>Delete for good</button></>}>
          <p>Only for a person added by mistake in the last 24 hours. It can't be undone; the deletion is logged with what was there.</p>
        </Dialog>) : null}
    </div>
  );
}

function EditDetails({ p, me, accounts, departments, onClose }) {
  const [v, setV] = useState({ job: String(p.job ?? ""), departmentId: String(p.departmentId ?? ""), office: String(p.office ?? "Medics"), email: String(p.email ?? "") });
  const [err, setErr] = useState("");
  const set = (k) => (e) => { setErr(""); const val = e.target.value; setV(o => ({ ...o, [k]: val })); };
  const save = async () => {
    try { await accounts.setDetails(me, p.id, { ...v, departmentId: v.departmentId || null }); onClose(); }
    catch (e) { setErr(String(e.message || e)); }
  };
  return (
    <Dialog title={`Details of ${p.name}`} onClose={onClose} testid="edit-details" footer={<>
      <button type="button" className="btn" onClick={onClose}>Cancel</button>
      <button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <DetailsFields v={v} set={set} departments={departments} />
      {err ? <div className="form-err" role="alert" data-testid="refusal">{err}</div> : null}
    </Dialog>
  );
}

// F15 — one person's courses. Manage level assigns (archived people: none offered, F15.4) and completes or renews.
function TrainingPanel({ p, me, training, today, door, dateStyle, toast }) {
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(null);   // the training record being completed or renewed
  const manage = can(me.level, "manageTraining");
  const archived = p.state !== "Active";
  const offered = training.offered(p.id);
  const fmt = (d) => formatCalendarDate(d, dateStyle === "short" ? "short" : "long");
  const recs = training.records(p.id).map(r => ({ r, c: door.get("course", String(r.courseId)), s: training.status(r) }))
    .sort((a, b) => String(a.c?.name ?? "").localeCompare(String(b.c?.name ?? "")));
  const months = (c) => { const m = validMonthsOf(c); return m === null ? "never expires" : `valid ${m} month${m === 1 ? "" : "s"}`; };
  return (
    <section className="panel" data-testid="prof-training">
      <div className="panel-head"><h2>Training and certificates</h2>
        {manage && !archived && offered.length ? <button type="button" className="btn small" onClick={() => setAssigning(true)}><Icon name="plus" width={13} stroke={2.2} />Assign course</button> : null}</div>
      {archived ? <p className="muted" data-testid="no-courses">Archived: no new courses are offered.</p> : null}
      {recs.length ? <ul className="train-list">{recs.map(({ r, c, s }) => {
        const what = r.status === "done" ? `Completed ${r.completedOn ? fmt(String(r.completedOn)) : "—"}${r.expires ? ` · expires ${fmt(String(r.expires))}` : ""}` : s.label;
        const btn = !manage || archived ? null : s.kind === "expired" ? "Renew" : r.status !== "done" ? "Mark complete" : "Renew early";
        return (
          <li key={r.id} data-training={r.id} data-course={String(r.courseId)}>
            <div className="ti"><b>{String(c?.name ?? "A course")}</b><span className="muted">{what} · {months(c)}</span></div>
            <span className={`badge nodot ${KIND_BADGE[s.kind]}`} data-kind={s.kind}>{s.label}</span>
            {btn ? <button type="button" className="btn small" onClick={() => setCompleting(r)}>{btn}</button> : null}
          </li>);
      })}</ul> : <p className="muted">No courses yet.</p>}
      {assigning ? <AssignCourse p={p} me={me} training={training} offered={offered} onClose={() => setAssigning(false)} /> : null}
      {completing ? <CompleteCourse r={completing} p={p} me={me} training={training} today={today} course={door.get("course", String(completing.courseId))} fmt={fmt}
        onClose={() => setCompleting(null)} onDone={(word) => { setCompleting(null); toast(word); }} /> : null}
    </section>
  );
}

function AssignCourse({ p, me, training, offered, onClose }) {
  const [courseId, setCourseId] = useState(offered[0]?.id ?? "");
  const [err, setErr] = useState("");
  const save = async () => { try { await training.assign(me, p.id, courseId); onClose(); } catch (e) { setErr(String(e.message || e)); } };
  return (
    <Dialog title={`Assign a course to ${p.name}`} onClose={onClose} testid="assign-course" footer={<>
      <button type="button" className="btn" onClick={onClose}>Cancel</button>
      <button type="button" className="btn primary" onClick={save}>Assign</button></>}>
      <label className="field"><span>Course</span><select value={courseId} onChange={e => { setErr(""); setCourseId(e.target.value); }} aria-label="Course">
        {offered.map(c => { const m = validMonthsOf(c); return <option key={c.id} value={c.id}>{String(c.name)} ({m === null ? "never expires" : `${m} month${m === 1 ? "" : "s"}`})</option>; })}</select></label>
      {err ? <div className="form-err" role="alert" data-testid="refusal">{err}</div> : null}
    </Dialog>
  );
}

// F15.2, F15.3, F15.5: the date it was done; the new expiry is shown before saving, worked out month-safe.
function CompleteCourse({ r, p, me, training, today, course, fmt, onClose, onDone }) {
  const expired = training.status(r).kind === "expired";
  const word = expired ? "Renew" : r.status === "done" ? "Renew early" : "Mark complete";
  const [date, setDate] = useState(today);
  const [err, setErr] = useState("");
  const problem = completionProblem(date, today);
  const exp = !problem ? expiryFor(date, course) : null;
  const m = validMonthsOf(course);
  const save = async () => { try { await training.complete(me, r.id, date); onDone(expired ? "Renewed" : "Saved"); } catch (e) { setErr(String(e.message || e)); } };
  return (
    <Dialog title={`${word}: ${course?.name ?? "course"}`} onClose={onClose} testid="complete-course" footer={<>
      <button type="button" className="btn" onClick={onClose}>Cancel</button>
      <button type="button" className="btn primary" onClick={save}>Save</button></>}>
      <p className="muted">{String(p.name)} · {m === null ? "this course never expires" : `valid for ${m} month${m === 1 ? "" : "s"}`}</p>
      <label className="field"><span>Completed on</span><input type="date" value={date} max={today} onChange={e => { setErr(""); setDate(e.target.value); }} aria-label="Completed on" /></label>
      <div className="readout" data-testid="new-expiry">{problem ? problem : exp ? <>New expiry: <b>{fmt(exp)}</b> <span className="muted">(done {fmt(date)})</span></> : <>Done {fmt(date)}; it never expires.</>}</div>
      {err ? <div className="form-err" role="alert" data-testid="refusal">{err}</div> : null}
    </Dialog>
  );
}
