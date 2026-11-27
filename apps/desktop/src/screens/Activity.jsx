import { useMemo, useState } from "react";
import { todayIn, formatCalendarDate, formatTimeIn } from "@md/core";
import Icon from "../components/Icon.jsx";

// F4 — Activity: one log for all REACH apps, newest first, old → new, read-only.
// The entries come from door.log() (worked out from the change messages). This screen only puts them into words.

const AREAS = [["all", "Everything"], ["Inventory", "Inventory"], ["People", "People"], ["Settings", "Settings"], ["EDP", "EDP"]];
const KIND = { item: "item", line: "stock line", location: "place", person: "person", case: "case", department: "department", category: "category", course: "course", settings: "" };
const FIELD = { qty: "quantity", required: "required", expiry: "expiry", lot: "lot", name: "name", job: "job", level: "level", state: "state",
  itemId: "item", locationId: "place", category: "category", unit: "unit", kind: "kind", staffNo: "staff number", itemNo: "item number",
  controlled: "controlled drug", cdRight: "doctor's right", caseNo: "case number", baseName: "base name", country: "country", timeZone: "time zone",
  dateStyle: "date style", dayShift: "day shift", nightShift: "night shift", departmentId: "department", categoryId: "category", validMonths: "valid for (months)" };
const PAGE = 100;

export default function Activity({ door, tick, timeZone, dateStyle }) {
  const [area, setArea] = useState("all");
  const [rec, setRec] = useState(null);          // { type, id }: the history of one record (follows the ID, F4.2)
  const [shown, setShown] = useState(PAGE);
  const all = useMemo(() => door.log(), [door, tick]);
  const entries = all.filter(e => (area === "all" || e.area === area) && (!rec || (e.recordType === rec.type && e.recordId === rec.id)));
  const w = useMemo(() => words(door, all), [door, all]);
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
          <ol className="log" data-testid="log">
            {entries.slice(0, shown).map(e => (
              <li key={e.messageId} className={`entry${e.op === "delete" ? " del" : ""}`} data-op={e.op} data-record={e.recordId}>
                <span className="ic"><Icon name={e.op === "delete" ? "trash" : "clock"} width={15} /></span>
                <div className="tx">
                  <span className={`tagapp a-${String(e.area).toLowerCase()}`}>{String(e.area).toUpperCase()}</span>
                  <span className="what">{w.sentence(e, () => setRec({ type: e.recordType, id: e.recordId }))}</span>
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
        )}
        {entries.length > shown ? <button type="button" className="btn more" onClick={() => setShown(s => s + PAGE)}>Show {Math.min(PAGE, entries.length - shown)} more</button> : null}
        <p className="lock" data-testid="log-lock"><Icon name="lock" width={13} /> Nobody can edit or delete log entries, Manage level included.</p>
      </section>
    </div>
  );
}

// Plain words for an entry. Names are looked up by ID now, so a renamed item shows its current name everywhere (F4.2).
function words(door, log) {
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
  const who = (by) => by === "demo" ? "DEMO data" : by === "setup" ? "Set-up" : person(by)?.name ? String(person(by).name) : lastName.get("person|" + by) ?? String(by);
  const field = (k) => FIELD[k] || k;
  const value = (k, v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "yes" : "no";
    if (k === "itemId") return String(door.get("item", v)?.name ?? v);
    if (k === "locationId") return String(door.get("location", v)?.name ?? v);
    if (k === "departmentId") return String(door.get("department", v)?.name ?? lastName.get("department|" + v) ?? v);
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
      return <>{String(e.data.what)}{about ? ` (${about})` : ""}</>;
    }
    switch (e.op) {
      case "create": return <>added {kind}{link}</>;
      case "set": return <>changed {kind}{link}</>;
      case "delta": { const by = Number(e.data.by); return <>{by < 0 ? "took" : "added"} {Math.abs(by)} {by < 0 ? "from" : "to"} {link}</>; }
      case "count": return <>counted {link}</>;
      case "archive": return <>archived {kind}{link}</>;
      case "restore": return <>restored {kind}{link}</>;
      case "delete": return <>deleted {kind}{link} for good{e.data.reason === "mistake" ? " (a mistake, within 24 hours)" : ""}</>;
      default: return <>{e.op} {kind}{link}</>;
    }
  };
  return { name, who, field, value, sentence };
}
