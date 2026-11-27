import { useState } from "react";
import Dialog from "./Dialog.jsx";

// F9 — Restock (+) and dispense (−) (June J7). One box for both, from Store and bags and from the item page.
// The rules (whole number, 1 or more; never more out than is there; controlled drugs only through the register)
// are checked in the inventory store; this box shows its answer and changes nothing on a refusal (B17).
export default function AdjustDialog({ line, item, placeName, kind, store, me, close, done, openRegister }) {
  const out = kind === "dispense";
  const [v, setV] = useState("1");
  const [why, setWhy] = useState("");
  const verb = out ? "Dispense" : "Restock";
  const unit = item.unit ? ` ${String(item.unit)}` : "";

  if (item.controlled) {
    return (
      <Dialog title={`${verb}: ${String(item.name)}`} onClose={close} testid="adjust" footer={<>
        <button type="button" className="btn" onClick={close}>Close</button>
        <button type="button" className="btn primary" onClick={openRegister}>Open the register</button></>}>
        <p data-testid="cd-note">This is a <b>controlled drug</b>. {out ? "Taking it out" : "Receiving it"} goes through the controlled-drug register, with {out ? "a doctor's approval, " : ""}a witness and the running balance. There is no plain {out ? "dispense" : "restock"}.</p>
        <p className="muted">The register comes with F12.</p>
      </Dialog>
    );
  }

  const go = async () => {
    setWhy("");
    try { const now = await store.adjust(me, line.id, kind, v); done(`${out ? "Dispensed" : "Restocked"} ${v.trim()} · ${String(item.name)} now ${now}`); }
    catch (e) { setWhy(String(e.message || e)); }
  };
  return (
    <Dialog title={`${verb}: ${String(item.name)}`} onClose={close} testid="adjust" footer={<>
      <button type="button" className="btn" onClick={close}>Cancel</button>
      <button type="button" className="btn primary" onClick={go}>{verb}</button></>}>
      <p className="muted">{placeName(line.locationId)} · currently <b>{Number(line.qty)}</b>{unit}</p>
      <label className="field"><span>{out ? "How many to take out" : "How many to add"}</span>
        <input aria-label={out ? "How many to take out" : "How many to add"} inputMode="numeric" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter") go(); }} />
        <small className="hint">Whole numbers, 1 or more{out ? `, at most ${Number(line.qty)}` : ""}.</small></label>
      {why ? <div className="form-err" role="alert" data-testid="refusal">{why} Nothing was changed.</div> : null}
    </Dialog>
  );
}
