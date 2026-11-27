// Messages across the top of the screen: opened without internet (F3.1), two counts that disagree (F3.5).
import { formatTimeIn } from "@md/core";
export default function Banners({ status, flags, nameOf, onCloseOffline, offlineClosed, timeZone }) {
  const out = [];
  if (status.openedOffline && !offlineClosed) {
    const t = status.lastSyncAt ? formatTimeIn(status.lastSyncAt, timeZone) : null;
    out.push(<div className="banner b-off" key="off" data-testid="banner-offline"><span>Opened without internet. {t ? `Showing the data from the last sync at ${t}.` : "Showing the data saved on this computer."} Changes are kept here and sent when the internet is back.</span><button type="button" aria-label="Close" onClick={onCloseOffline}>×</button></div>);
  }
  for (const f of flags) {
    out.push(<div className="banner b-flag" key={f.recordId} data-testid="banner-flag"><span>Two counts of {nameOf(f.recordId)} disagree: {f.counts.map(c => c.qty).join(" and ")}. The later count ({f.used}) is used; both are kept. Please check it.</span></div>);
  }
  return out.length ? <div className="banners">{out}</div> : null;
}
