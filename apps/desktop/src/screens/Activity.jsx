import { useMemo, useState } from "react";
import { todayIn, formatCalendarDate, formatTimeIn, isCalendarDate } from "@md/core";
import Icon from "../components/Icon.jsx";

// F4 — Activity: one log for all REACH apps, newest first, old → new, read-only.
// The entries come from door.log() (worked out from the change messages). This screen only puts them into words.

const AREAS = [["all", "Everything"], ["Inventory", "Inventory"], ["People", "People"], ["Settings", "Settings"], ["EDP", "EDP"]];
const KIND = { item: "item", line: "stock line", location: "place", person: "person", case: "case", department: "department", category: "category", course: "course", stocktake: "stock take", cdline: "register line", cddecision: "register decision", importwait: "import row", training: "training", settings: "" };
const FIELD = { qty: "quantity", required: "required", expiry: "expiry", lot: "lot", name: "name", job: "job", level: "level", state: "state",
  itemId: "item", locationId: "place", category: "category", unit: "unit", kind: "kind", staffNo: "staff number", itemNo: "item number",
  controlled: "controlled drug", cdRight: "doctor's right", caseNo: "case number", baseName: "base name", country: "country", timeZone: "time zone",
  dateStyle: "date style", dayShift: "day shift", nightShift: "night shift", departmentId: "department", categoryId: "category", validMonths: "valid for (months)",
  profession: "profession", medicalCode: "medical code", headDoctor: "Head Doctor", controlledNote: "reason", status: "status", completedOn: "completed on", expires: "expires", courseId: "course", personId: "person" };
const PAGE = 100;

export default function Activity({ door, tick, timeZone, dateStyle }) {
  const [area, setArea] = useState("all");
  const [rec, setRec] = useState(null);          // { type, id }: the history of one record (follows the ID, F4.2)
  const [shown, setShown] = useState(PAGE);
  const all = useMemo(() => door.log(), [door, tick]);
  const entries = all.filter(e => (area === "all" || e.area === area) && (!rec || (e.recordType === rec.type && e.recordId === rec.id)));
  const w = useMemo(() => words(door, all, dateStyle), [door, all, dateStyle]);
  const when = (at) => `${formatCalendarDate(todayIn(timeZone, at), dateStyle === "short" ? "short" : "long")}, ${formatTimeIn(at, timeZone)}`;

  return (
    <div className="activity">
      <div className="seg" role="group" aria-label="Show">
        {AREAS.map(([k, l]) => <button key={k} type="button" data-area={k} aria-pressed={area === k} onClick={() => { setArea(k); setShown(PAGE); }}>{l}</button>)}
      </div>
      {rec ? (
        <div className="history-bar" data-testid="history">
          <span>History of <b>{w.name(rec.type, rec.id)}</b>, under every name it has had</span>
          <button type="button" className="btn small" onClick={() => setRec(null)}>Show everything</button>
        </div>
      ) : null}
      <section className="panel feed">
        <div className="panel-head"><div><h2>Activity</h2><p className="muted">One log for all REACH apps · newest first · times in base time</p></div></div>
        {entries.length === 0 ? (
          <p className="empty" data-testid="log-empty">{area === "EDP"
            ? "Nothing from EDP yet. EDP's changes appear here once the shared server joins the apps (REACH SD2)."
            : "Nothing here yet."}</p>
        ) : (
          <LogList entries={entries.slice(0, shown)} w={w} when={when} open={(e) => setRec({ type: e.recordType, id: e.recordId })} />
        )}
        {entries.length > shown ? <button type="button" className="btn more" onClick={() => setShown(s => s + PAGE)}>Show {Math.min(PAGE, entries.length - shown)} more</button> : null}
        <p className="lock" data-testid="log-lock"><Icon name="lock" width={13} /> Nobody can edit or delete log entries, Manage level included.</p>
      </section>
    </div>
  );
}

/** The entries in plain words (F4); also used for an item's stock movements (F8.1). */
export function LogList({ entries, w, when, open, testid = "log" }) {
  return (
          <ol className="log" data-testid={testid}>
            {entries.map(e => (
              <li key={e.messageId} className={`entry${e.op === "delete" ? " del" : ""}`} data-op={e.op} data-record={e.recordId}>
                <span className="ic"><Icon name={e.op === "delete" ? "trash" : "clock"} width={15} /></span>
                <div className="tx">
                  <span className={`tagapp a-${String(e.area).toLowerCase()}`}>{String(e.area).toUpperCase()}</span>
                  <span className="what">{w.sentence(e, () => open(e))}</span>
                  {e.op === "delete" && e.was ? <span className="was" data-testid="was">What was there: {Object.entries(e.was).map(([k, v]) => `${w.field(k)} ${w.value(k, v)}`).join(" · ")}</span> : null}
                  {e.op !== "create" && e.changes.length ? (
                    <span className="changes">{e.changes.map(c => (
                      <span key={c.field} className="oldnew" data-field={c.field}>{w.field(c.field)}: {w.value(c.field, c.from)} → {w.value(c.field, c.to)}</span>
                    ))}</span>
                  ) : null}
                  <span className="src">{w.who(e.by)} · {when(e.at)}{e.app && e.app !== "MD" ? ` · from ${e.app}` : ""}</span>
                </div>
              </li>
            ))}
          </ol>
  );
}

// Plain words for an entry. Names are looked up by ID now, so a renamed item shows its current name everywhere (F4.2).
export function words(door, log, dateStyle = "long") {
  // The last name each record had, from the log itself: a record deleted for good still has a name in its history.
  const lastName = new Map();
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    const n = e.changes.find(c => c.field === "name")?.to ?? e.was?.name;
    if (n) lastName.set(e.recordType + "|" + e.recordId, String(n));
  }
  const person = (id) => door.get("person", id);
  const name = (type, id, fallback) => {
    if (type === "settings") return "the base settings";
    if (type === "line") {
      const l = door.get("line", id) || fallback;
      if (!l) return "a stock line";
      return `${door.get("item", l.itemId)?.name ?? "?"} in ${door.get("location", l.locationId)?.name ?? "?"}`;
    }
    const r = door.get(type, id) || fallback;
    if (r && r.name) return String(r.name);
    if (lastName.has(type + "|" + id)) return lastName.get(type + "|" + id);
    return r && r.caseNo ? String(r.caseNo) : `${KIND[type] || type} ${id.slice(0, 6)}`;
  };
  const who = (by) => by === "demo" ? "DEMO data" : by === "setup" ? "Set-up" : by === "system" ? "The program" : person(by)?.name ? String(person(by).name) : lastName.get("person|" + by) ?? String(by);
  const field = (k) => FIELD[k] || k;
  const value = (k, v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "yes" : "no";
    if (k === "itemId") return String(door.get("item", v)?.name ?? v);
    if (k === "locationId") return String(door.get("location", v)?.name ?? v);
    if (k === "departmentId") return String(door.get("department", v)?.name ?? lastName.get("department|" + v) ?? v);
    if ((k === "completedOn" || k === "expires") && isCalendarDate(v)) return formatCalendarDate(v, dateStyle === "short" ? "short" : "long");   // F15: plain dates read as dates
    if (k === "courseId") return String(door.get("course", v)?.name ?? lastName.get("course|" + v) ?? v);
    if (k === "personId") return String(person(v)?.name ?? lastName.get("person|" + v) ?? v);
    if (k === "categoryId") return String(door.get("category", v)?.name ?? lastName.get("category|" + v) ?? v);
    return String(v);
  };
  const sentence = (e, open) => {
    const k0 = KIND[e.recordType] ?? e.recordType;
    const kind = k0 ? k0 + " " : "";
    const link = <button type="button" className="reclink" onClick={open} title="Show the history of this record">{name(e.recordType, e.recordId, e.was)}</button>;
    if (e.recordType === "event") {
      const about = e.data.personId ? name("person", String(e.data.personId)) : "";
      if (e.data.what === "one-time password given") return <>gave {about} a one-time password on this computer</>;
      if (e.data.what === "this computer set up") return <>set up this computer</>;
      if (e.data.what === "restored a backup") return <>restored the backup made {String(e.data.made ?? "")}: {Number(e.data.records)} {Number(e.data.records) === 1 ? "record" : "records"} set back; every earlier entry is still here</>;
      if (e.data.what === "imported a stock list") return <>imported the stock list {String(e.data.file)}: {Number(e.data.lines)} {Number(e.data.lines) === 1 ? "line" : "lines"} loaded, {Number(e.data.waiting)} waiting for the Head Doctor</>;
      return <>{String(e.data.what)}{about ? ` (${about})` : ""}</>;
    }
    // F11.1: a stock take never changes; a message that tried to is kept in the log, and says it was ignored
    if (e.recordType === "stocktake" && e.op !== "create") return <>tried to change stock take {link}: ignored, a stock take never changes</>;
    // F12: the register. Lines and decisions never change; an attempt is kept and says it was ignored.
    if ((e.recordType === "cdline" || e.recordType === "cddecision") && e.op !== "create") return <>tried to change the controlled-drug register: ignored, register lines never change</>;
    if (e.recordType === "importwait") {
      if (e.op === "create") return <>{String(e.data.item)} from {String(e.data.file)} waits for the Head Doctor ({Number(e.data.qty)})</>;
      return <>decided {String(door.get("importwait", e.recordId)?.item ?? "an import row")}: {e.data.decided === "controlled" ? "a controlled drug, into the register" : "not a controlled drug, loaded as ordinary stock"}</>;
    }
    // F15: training records read as sentences about the course and the person
    if (e.recordType === "training") {
      const t = door.get("training", e.recordId) ?? e.was ?? {};
      const course = String(door.get("course", String(t.courseId ?? e.data.courseId))?.name ?? "a course"), whom = who(String(t.personId ?? e.data.personId));
      if (e.op === "create") return <>assigned {course} to {whom}</>;
      if (e.op === "set" && e.data.completedOn) {
        const before = e.changes.find(c => c.field === "status")?.from;
        return <>{before === "required" || before === "in progress" ? "completed" : "renewed"} {course} for {whom}</>;
      }
    }
    if (e.recordType === "cdline") {
      const d = e.data, drug = String(door.get("item", String(d.itemId))?.name ?? "a controlled drug"), w = d.witness ? ` (witness ${who(String(d.witness))})` : "";
      if (d.kind === "opening") return <>opened the register for {drug}: {Number(d.qty)}{w}</>;
      if (d.kind === "in") return <>received {Number(d.qty)} {drug} into the register{w}</>;
      if (d.kind === "moved") return <>moved {Number(d.qty)} {drug}: {String(d.reason)}{w}</>;
      if (d.kind === "correction") return <>corrected the register for {drug}: {Number(d.qty) > 0 ? "+" : ""}{Number(d.qty)}{w}</>;
      if (d.how === "request") return <>asked {who(String(d.askedDoctor))} to approve taking out {Number(d.qty)} {drug}{w}</>;
      if (d.how === "emergency") return <>took out {Number(d.qty)} {drug} as an emergency, waiting for a doctor{w}</>;
      if (d.how === "pin") return <>took out {Number(d.qty)} {drug}, approved in the room by {who(String(d.doctor))}{w}</>;
      return <>took out {Number(d.qty)} {drug} as a doctor{w}</>;
    }
    if (e.recordType === "cddecision") {
      const l = door.get("cdline", String(e.data.cdlineId)), drug = l ? String(door.get("item", String(l.itemId))?.name ?? "") : "";
      const what = l ? `${Number(l.qty)} ${drug} for ${who(String(l.createdBy))}` : "a register line";
      if (e.data.decision === "approve") return <>approved {l?.how === "emergency" ? "afterwards the emergency of " : "taking out "}{what}</>;
      if (e.data.decision === "refuse") return <>refused taking out {what}</>;
      return <>asked about {what}: “{String(e.data.note ?? "")}”</>;
    }
    switch (e.op) {
      case "create": return e.recordType === "stocktake" ? <>froze a stock take: {link} ({Array.isArray(e.data.lines) ? e.data.lines.length : 0} lines)</> : <>added {kind}{link}</>;
      case "set": return <>changed {kind}{link}</>;
      case "delta": {
        const by = Number(e.data.by);
        // F8.2: a move is a take here and an add there; both say where the stock went or came from
        const placeOf = (lineId) => { const l = door.get("line", String(lineId)); return l ? String(door.get("location", l.locationId)?.name ?? "?") : "another place"; };
        if (e.data.moveTo) return <>moved {Math.abs(by)} from {link} to {placeOf(e.data.moveTo)}</>;
        if (e.data.moveFrom) return <>{Math.abs(by)} moved in to {link} from {placeOf(e.data.moveFrom)}</>;
        if (e.data.cdline) return <>{by < 0 ? "took" : "added"} {Math.abs(by)} {by < 0 ? "from" : "to"} {link} (controlled-drug register)</>;
        if (e.data.kind === "restock") return <>restocked {Math.abs(by)} to {link}</>;
        if (e.data.kind === "dispense") return <>dispensed {Math.abs(by)} from {link}</>;
        return <>{by < 0 ? "took" : "added"} {Math.abs(by)} {by < 0 ? "from" : "to"} {link}</>;
      }
      case "count": return e.changes.some(c => c.field === "qty") ? <>counted {link}</> : <>counted {link}: the same as before</>;
      case "archive": return <>archived {kind}{link}</>;
      case "restore": return <>restored {kind}{link}</>;
      case "delete": return <>deleted {kind}{link} for good{e.data.reason === "mistake" ? " (a mistake, within 24 hours)" : ""}</>;
      default: return <>{e.op} {kind}{link}</>;
    }
  };
  return { name, who, field, value, sentence };
}
