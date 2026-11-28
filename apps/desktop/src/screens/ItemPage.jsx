import { useMemo, useState } from "react";
import { can, shownNumbers, stockStatus, todayIn, formatCalendarDate, formatTimeIn, isCalendarDate } from "@md/core";
import Icon from "../components/Icon.jsx";
import ExpiryBadge from "../components/ExpiryBadge.jsx";
import Dialog from "../components/Dialog.jsx";
import AdjustDialog from "../components/AdjustDialog.jsx";
import { LogList, words } from "./Activity.jsx";

// F8 — Item page (June J6): stock per place with lot, expiry and status; the item's movements; move, edit, add a place,
// archive / reactivate, delete a mistake. Every rule is checked again in the inventory store, not only here.
// Restock and dispense (F9) and the EDP panel (F17) come later.

const STOCK_WORDS = {
  out: () => ["b-danger", "Out of stock"],
  low: (store) => ["b-warning", store ? "Below reorder level" : "Below required"],
  none: (store) => ["b-muted nodot", store ? "No reorder level" : "No required amount"],
  ok: (store) => ["b-success", store ? "In stock" : "At or above required"],
};

export default function ItemPage({ itemId, me, door, inv, store, tick, today, timeZone, dateStyle, back, toast, openRegister, register }) {
  const item = door.get("item", itemId);
  const [dlg, setDlg] = useState(null);          // { kind: "move" | "edit" | "add" | "delete", lineId?, type? }
  const [why, setWhy] = useState("");
  const work = can(me.level, "changeStock");
  const all = useMemo(() => door.log(), [door, tick]);
  const w = useMemo(() => words(door, all), [door, all]);
  if (!item) return <div className="placeholder" data-testid="item-page"><h2>This item isn't there any more.</h2><button type="button" className="btn" onClick={back}>Back to Store and bags</button></div>;

  const place = (id) => door.get("location", id);
  const placeName = (id) => String(place(id)?.name ?? "?");
  const lines = door.records("line").filter(l => l.itemId === itemId)
    .sort((a, b) => (a.state === "Active" ? 0 : 1) - (b.state === "Active" ? 0 : 1) || (place(a.locationId)?.kind === "store" ? 0 : 1) - (place(b.locationId)?.kind === "store" ? 0 : 1) || placeName(a.locationId).localeCompare(placeName(b.locationId)));
  const active = lines.filter(l => l.state === "Active");
  const total = active.reduce((s, l) => s + Number(l.qty), 0);
  const places = inv.locations;                                 // places in use, Store first
  const cat = item.categoryId ? String(door.get("category", item.categoryId)?.name ?? "") : "";
  // The item's movements: everything logged for the item and for every line it ever had (by the line's first message).
  const lineIds = new Set(all.filter(e => e.recordType === "line" && e.op === "create" && e.data.itemId === itemId).map(e => e.recordId));
  const moves = all.filter(e => (e.recordType === "item" && e.recordId === itemId) || (e.recordType === "line" && lineIds.has(e.recordId)));
  const when = (at) => `${formatCalendarDate(todayIn(timeZone, at), dateStyle === "short" ? "short" : "long")}, ${formatTimeIn(at, timeZone)}`;

  const run = async (fn, ok) => {
    setWhy("");
    try { const r = await fn(); setDlg(null); if (ok) toast(typeof ok === "function" ? ok(r) : ok, "success"); return true; }
    catch (e) { setWhy(String(e.message || e)); return false; }
  };
  const open = (d) => { setWhy(""); setDlg(d); };
  const itemDel = store.deleteProblem(me, "item", itemId) === null;

  return (
    <div className="itempage" data-testid="item-page" data-item={itemId}>
      <button type="button" className="btn small backlink" onClick={back}><Icon name="back" width={14} stroke={2} />Back to Store and bags</button>
      <div className="prof-head">
        <span className="appcard-ic"><Icon name="box" /></span>
        <div className="prof-main">
          <h2>{String(item.name)}</h2>
          <div className="muted">{cat || "No category"}{item.unit ? ` · counted in ${String(item.unit)}` : ""}</div>
          <div className="badges">
            <span className="badge b-accent nodot" data-testid="total">{total} on hand · {active.length} {active.length === 1 ? "line" : "lines"}</span>
            {item.itemNo ? <span className="badge b-muted nodot" data-testid="item-no">{shownNumbers(door.records("item"), "itemNo").get(item.id)}</span> : null}
            {item.controlled ? <span className="badge b-warning nodot">Controlled drug</span> : null}
            {item.controlled !== true && item.controlledNote ? <span className="badge b-muted nodot">no longer controlled: {String(item.controlledNote)}</span> : null}
            {item.state !== "Active" ? <span className="badge b-muted nodot">Archived</span> : null}
          </div>
        </div>
        {work ? (
          <div className="acts">
            {item.state === "Active" && item.controlled !== true ? <button type="button" className="btn" onClick={() => open({ kind: "add" })}><Icon name="plus" width={14} stroke={2.2} />Add a place</button> : null}
            {item.state === "Active"
              ? <button type="button" className="btn" onClick={() => run(() => store.archive(me, "item", itemId), "Item archived. It can be restored.")}>Archive item</button>
              : <button type="button" className="btn" onClick={() => run(() => store.restore(me, "item", itemId), "Item restored.")}>Restore item</button>}
            {itemDel ? <button type="button" className="btn danger" onClick={() => open({ kind: "delete", type: "item", id: itemId })}>Delete (mistake)</button> : null}
          </div>
        ) : null}
      </div>
      {register && item.state === "Active" ? <ControlledBox item={item} me={me} register={register} onClick={() => open({ kind: "cd" })} /> : null}
      {why && !dlg ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}

      <div className="prof-grid">
        <section className="panel">
          <div className="panel-head"><div><h2>Stock by place</h2><p className="muted">{total} on hand</p></div></div>
          {lines.length === 0 ? <p className="empty">No stock anywhere yet.</p> : (
            <ul className="plines" data-testid="lines">
              {lines.map(l => {
                const isStore = place(l.locationId)?.kind === "store";
                const [cls, word] = Number(l.qty) < 0 ? ["b-danger", "Below zero: count it"] : STOCK_WORDS[stockStatus(l, { store: isStore })](isStore);   // Q27 = A
                const arch = l.state !== "Active";
                const del = store.deleteProblem(me, "line", l.id) === null;
                return (
                  <li key={l.id} data-line={l.id} className={arch ? "archived" : ""}>
                    <div className="pl-main">
                      <div className="t">{placeName(l.locationId)}{arch ? " · archived" : ""}</div>
                      <div className="d"><b>{Number(l.qty)}</b>{item.unit ? ` ${String(item.unit)}` : ""}
                        {l.required !== null && l.required !== undefined ? ` · ${isStore ? "reorder at" : "required"} ${Number(l.required)}` : ""}
                        {l.lot ? ` · lot ${String(l.lot)}` : ""}</div>
                      <div className="badges"><span className={`badge ${cls}`} data-stock={Number(l.qty) < 0 ? "below" : stockStatus(l, { store: isStore })}>{word}</span><ExpiryBadge expiry={l.expiry} today={today} dateStyle={dateStyle} /></div>
                      {Number(l.qty) < 0 ? <div className="form-err" data-testid="below-zero">Below zero: two computers took the same stock. Count {placeName(l.locationId)}.</div> : null}
                    </div>
                    {work ? (
                      <div className="pl-acts">
                        {arch ? <button type="button" className="btn small" onClick={() => run(() => store.restore(me, "line", l.id), "Line reactivated.")}>Reactivate</button> : <>
                          <button type="button" className="btn small" aria-label={`Restock ${placeName(l.locationId)}`} title="Restock (+)" onClick={() => open({ kind: "restock", lineId: l.id })}><Icon name="plus" width={13} stroke={2.4} />Restock</button>
                          <button type="button" className="btn small" aria-label={`Dispense ${placeName(l.locationId)}`} title="Dispense (−)" onClick={() => open({ kind: "dispense", lineId: l.id })}><Icon name="minus" width={13} stroke={2.4} />Dispense</button>
                          <button type="button" className="btn small" onClick={() => open({ kind: "move", lineId: l.id })}>Move</button>
                          <button type="button" className="btn small" onClick={() => open({ kind: "edit", lineId: l.id })}>Edit</button>
                          {item.controlled === true && Number(l.qty) !== 0 ? null : <button type="button" className="btn small" onClick={() => run(() => store.archive(me, "line", l.id), "Line archived. It can be reactivated.")}>Archive</button>}
                        </>}
                        {del ? <button type="button" className="btn small danger" onClick={() => open({ kind: "delete", type: "line", id: l.id })}>Delete (mistake)</button> : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <div className="prof-side">
          <section className="panel feed">
            <div className="panel-head"><div><h2>Stock movements</h2><p className="muted">Everything logged for this item, newest first</p></div></div>
            {moves.length ? <LogList entries={moves.slice(0, 50)} w={w} when={when} open={() => {}} testid="moves" /> : <p className="empty">No movements yet.</p>}
          </section>
          <section className="panel" data-testid="edp-panel">
            <div className="panel-head"><div><h2>Used on EDP cases</h2></div></div>
            <p className="empty">Comes with F17, once EDP and the shared server are joined: stock used on an EDP case shows here.</p>
          </section>
        </div>
      </div>

      {dlg?.kind === "restock" || dlg?.kind === "dispense" ? <AdjustDialog line={door.get("line", dlg.lineId)} item={item} placeName={placeName} kind={dlg.kind} store={store} me={me}
        close={() => setDlg(null)} done={(t) => { setDlg(null); toast(t, "success"); }} openRegister={openRegister} /> : null}
      {dlg?.kind === "move" ? <MoveDialog line={door.get("line", dlg.lineId)} item={item} places={places} placeName={placeName} why={why} close={() => { setDlg(null); setWhy(""); }}
        go={(to, qty) => run(() => store.move(me, dlg.lineId, to, qty), (r) => `Moved ${qty} to ${placeName(to)}${r.joined ? " (added to the line already there)" : ` (a new line; set its ${place(to)?.kind === "store" ? "reorder level" : "required amount"} with Edit)`}${r.archived ? ". The emptied line had no amount set, so it was archived." : ""}`)} /> : null}
      {dlg?.kind === "edit" ? <LineDialog dateStyle={dateStyle} title={`Edit: ${placeName(door.get("line", dlg.lineId)?.locationId)}`} line={door.get("line", dlg.lineId)} placeName={placeName} why={why} close={() => { setDlg(null); setWhy(""); }}
        go={(v) => run(() => store.editLine(me, dlg.lineId, v), (changed) => changed ? "Saved." : "Nothing changed.")} /> : null}
      {dlg?.kind === "add" ? <LineDialog dateStyle={dateStyle} title="Add a place" free={places.filter(p => !active.some(l => l.locationId === p.id))} placeName={placeName} why={why} close={() => { setDlg(null); setWhy(""); }}
        go={(v) => run(() => store.addLine(me, itemId, v.locationId, v), "Place added.")} /> : null}
      {dlg?.kind === "cd" ? <ControlledConfirm door={door} me={me} item={item} register={register} close={() => { setDlg(null); setWhy(""); }}
        done={(t) => { setDlg(null); toast(t, "success"); }} /> : null}
      {dlg?.kind === "delete" ? (
        <Dialog title="Delete for good?" onClose={() => { setDlg(null); setWhy(""); }} testid="confirm" footer={<>
          <button type="button" className="btn" onClick={() => { setDlg(null); setWhy(""); }}>Cancel</button>
          <button type="button" className="btn primary danger-fill" onClick={() => run(() => store.deleteMistake(me, dlg.type, dlg.id), "Deleted. The activity log keeps a record.").then((ok) => { if (ok && dlg.type === "item") back(); })}>Delete for good</button></>}>
          <p>{dlg.type === "item" ? <><b>{String(item.name)}</b> will be deleted</> : <>{String(item.name)} in <b>{placeName(door.get("line", dlg.id)?.locationId)}</b> ({Number(door.get("line", dlg.id)?.qty)} on hand) will be deleted</>} and can't be brought back.</p>
          <p className="muted">Only for a mistake, within 24 hours of adding it. The activity log keeps who, when and what was there.</p>
          {why ? <div className="form-err" role="alert" data-testid="refusal">{why}</div> : null}
        </Dialog>
      ) : null}
    </div>
  );
}

// F12.15: only a Head Doctor ticks or unticks "Controlled drug", after a confirm box. Everyone else sees it greyed.
function ControlledBox({ item, me, register, onClick }) {
  const head = register.isHead(me.id);
  const on = item.controlled === true;
  return (
    <div className={`cdtick${head ? " head" : ""}`} data-testid="cd-box">
      <label className="check inline"><input type="checkbox" aria-label="Controlled drug" checked={on} disabled={!head} onChange={(e) => { e.preventDefault(); onClick(); }} /><span>Controlled drug</span></label>
      {head ? <span className="muted small">You're a Head Doctor: a confirm box asks first.</span>
        : <span className="badge b-muted nodot">only a Head Doctor changes this{register.heads().length ? "" : " (there is none: Management names one)"}</span>}
    </div>
  );
}

function ControlledConfirm({ door, me, item, register, close, done }) {
  const on = item.controlled !== true;          // what the tick will do
  const [witness, setWitness] = useState("");
  const [reason, setReason] = useState("");
  const [why, setWhy] = useState("");
  const shelves = register.onShelves(item.id);
  const people = door.records("person").filter(p => p.state === "Active" && p.id !== me.id).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  const go = async () => {
    setWhy("");
    try { await register.setControlled(me, item.id, on, { witness, reason }); done(on ? `${String(item.name)} is now a controlled drug. Its register opened at ${shelves}.` : `${String(item.name)} is no longer a controlled drug. Its register history stays.`); }
    catch (e) { setWhy(String(e.message || e)); }
  };
  return (
    <Dialog title={on ? `Make ${String(item.name)} a controlled drug?` : `${String(item.name)}: no longer a controlled drug?`} onClose={close} testid="cd-confirm" footer={<>
      <button type="button" className="btn" onClick={close}>Cancel</button>
      <button type="button" className="btn primary" onClick={go}>{on ? "Yes, make it controlled" : "Yes, no longer controlled"}</button></>}>
      {on ? <>
        <p>From now on its stock changes only through the controlled-drug register, with a witness. The register opens at what the Store and bags hold now: <b data-testid="cd-shelves">{shelves}</b>{item.unit ? ` ${String(item.unit)}` : ""}.</p>
        <label className="field"><span>Witness (was there)</span><select aria-label="Witness" value={witness} onChange={e => setWitness(e.target.value)}><option value="">Pick who saw it…</option>{people.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label>
      </> : <>
        <p>Its stock moves like any item again. The register history stays, read-only, under Controlled drugs.</p>
        <label className="field"><span>Why</span><input aria-label="Why" placeholder="e.g. ticked by mistake" value={reason} onChange={e => setReason(e.target.value)} /></label>
      </>}
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why} Nothing was changed.</div> : null}
    </Dialog>
  );
}

function MoveDialog({ line, item, places, placeName, why, close, go }) {
  const targets = places.filter(p => p.id !== line.locationId);
  const [to, setTo] = useState(targets[0]?.id ?? "");
  const [qty, setQty] = useState(String(line.qty));
  return (
    <Dialog title={`Move: ${String(item.name)}`} onClose={close} testid="move" footer={<>
      <button type="button" className="btn" onClick={close}>Cancel</button>
      <button type="button" className="btn primary" onClick={() => go(to, qty)} disabled={!to}>Move</button></>}>
      <p className="muted">From <b>{placeName(line.locationId)}</b> · {Number(line.qty)} on hand{line.lot ? ` · lot ${String(line.lot)}` : ""}</p>
      <div className="form-grid">
        <label className="field"><span>Move to</span><select aria-label="Move to" value={to} onChange={e => setTo(e.target.value)}>{targets.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label>
        <label className="field"><span>How many</span><input aria-label="How many" inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} onKeyDown={e => { if (e.key === "Enter") go(to, qty); }} /><small className="hint">All {Number(line.qty)}, or part of them</small></label>
      </div>
      <p className="muted small">It joins a line in that place with the same lot and expiry, or starts a new one there.</p>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why} Nothing was moved.</div> : null}
    </Dialog>
  );
}

function LineDialog({ title, line, free, placeName, why, close, go, dateStyle }) {
  const [v, setV] = useState({
    locationId: line ? line.locationId : (free[0]?.id ?? ""),
    qty: line ? String(line.qty) : "0",
    required: line && line.required !== null && line.required !== undefined ? String(line.required) : "",
    lot: line ? String(line.lot ?? "") : "",
    expiry: line && line.expiry ? String(line.expiry) : "",
  });
  const set = (k) => (e) => setV(x => ({ ...x, [k]: e.target.value }));
  const none = !line && free.length === 0;
  return (
    <Dialog title={title} onClose={close} testid="line" footer={<>
      <button type="button" className="btn" onClick={close}>Cancel</button>
      <button type="button" className="btn primary" onClick={() => go(v)} disabled={none}>{line ? "Save changes" : "Add place"}</button></>}>
      {none ? <p>This item is already in every place.</p> : (
        <div className="form-grid">
          {line
            ? <label className="field"><span>Place</span><input aria-label="Place" value={placeName(line.locationId)} disabled /><small className="hint">To change the place, use Move.</small></label>
            : <label className="field"><span>Place</span><select aria-label="Place" value={v.locationId} onChange={set("locationId")}>{free.map(p => <option key={p.id} value={p.id}>{String(p.name)}</option>)}</select></label>}
          <label className="field"><span>On hand</span><input aria-label="On hand" inputMode="numeric" value={v.qty} onChange={set("qty")} /></label>
          <label className="field"><span>Required amount / reorder level</span><input aria-label="Required amount / reorder level" inputMode="numeric" value={v.required} onChange={set("required")} placeholder="empty = not set" /></label>
          <label className="field"><span>Lot</span><input aria-label="Lot" value={v.lot} onChange={set("lot")} /></label>
          <label className="field wide"><span>Expiry</span><input aria-label="Expiry" type="date" value={v.expiry} onChange={set("expiry")} />
            {/* The box follows the Mac's own date order (it may show 12/01/2027 for 1 Dec); the line below says it plainly (B13 kind). */}
            <small className="hint" data-testid="expiry-reads">{v.expiry ? (isCalendarDate(v.expiry) ? `Expires ${formatCalendarDate(v.expiry, "long")}` : "Not a date") : "Empty = no expiry"}</small></label>
        </div>
      )}
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why} Nothing was saved.</div> : null}
    </Dialog>
  );
}
