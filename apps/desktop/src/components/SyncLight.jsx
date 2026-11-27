import { useEffect, useRef, useState } from "react";

import { formatTimeIn } from "@md/core";
const TIME = (t, tz) => (t ? formatTimeIn(t, tz) : "never");

// The light top right (F3.3): grey = this computer only (no server yet), green = up to date,
// amber = offline with the number waiting, red = a save failed. A click shows the details.
export default function SyncLight({ status, waiting, describe, timeZone }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  let cls = "sl-none", text = "This computer only";
  if (status.error) { cls = "sl-err"; text = "Not saved"; }
  else if (status.server === "online") { cls = status.waiting ? "sl-busy" : "sl-ok"; text = status.waiting ? "Sending…" : "Up to date"; }
  else if (status.server === "offline") { cls = "sl-off"; text = status.waiting ? `Offline · ${status.waiting} waiting` : "Offline"; }
  return (
    <div className="sync-wrap" ref={box}>
      <button type="button" className={`sync ${cls}`} data-testid="sync" data-state={cls} aria-label={`Sync: ${text}`} aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <i aria-hidden="true" /><span className="sync-text">{text}</span>
      </button>
      {open ? (
        <div className="pop" role="dialog" aria-label="Sync details" data-testid="sync-pop">
          <div className="line"><span>Shared server</span><b>{status.server === "none" ? "not set up yet" : status.server === "online" ? "connected" : "no internet"}</b></div>
          <div className="line"><span>Last sync</span><b>{TIME(status.lastSyncAt, timeZone)}</b></div>
          <div className="line"><span>Changes waiting</span><b>{status.waiting}</b></div>
          {status.error ? <div className="pop-err">{status.error}</div> : null}
          {status.server === "none" ? <p className="pop-note">Everything is saved on this computer. When the shared server exists (a REACH decision), waiting changes are sent by themselves.</p> : null}
          {status.server !== "none" && waiting.length ? <ul className="pop-list">{waiting.slice(-8).reverse().map(c => <li key={c.messageId}>{describe(c)}</li>)}</ul> : null}
        </div>
      ) : null}
    </div>
  );
}
