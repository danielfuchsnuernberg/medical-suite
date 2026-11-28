import { HOME_CARDS, formatDayLong } from "@md/core";
import Icon from "../components/Icon.jsx";

export default function Home({ go, today, baseName, emergencies = 0, noHead = false, lockout = null, below = 0 }) {
  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-eyebrow">REACH · Medical Suite</div>
        <h1 className="home-title">Welcome</h1>
        <p className="home-sub"><span data-testid="today">{formatDayLong(today)}</span> · {baseName}</p>
      </div>
      {emergencies ? <button type="button" className="att att-danger home-alert" data-testid="home-emergency" onClick={() => go("cd")}><span><b>{emergencies} controlled-drug {emergencies === 1 ? "emergency" : "emergencies"}</b> waiting for a doctor to approve or ask about. Open the register.</span></button> : null}
      {below ? <button type="button" className="att att-danger home-alert" data-testid="home-below" onClick={() => go("count")}><span><b>{below} stock {below === 1 ? "line is" : "lines are"} below zero.</b> Two computers took the same stock while offline. Count {below === 1 ? "it" : "them"} to set the real number.</span></button> : null}
      {lockout ? <button type="button" className="att att-danger home-alert" data-testid="home-lockout" onClick={() => go("log")}><span><b>Nobody was left at Manage level</b> after two computers met (changes made at the same time, offline). The program gave {lockout} Manage level back. Check the Activity log and fix the levels if needed.</span></button> : null}
      {noHead ? <button type="button" className="att att-danger home-alert" data-testid="home-no-head" onClick={() => go("settings")}><span><b>No Head Doctor.</b> Nobody can mark a drug as controlled until Management names one in Settings › People and access.</span></button> : null}
      <div className="home-grid">
        {HOME_CARDS.map(c => (
          <button type="button" className="appcard" key={c.id} data-card={c.id} onClick={() => go(c.id)}>
            <span className="appcard-ic"><Icon name={c.icon} /></span>
            <span className="appcard-name">{c.label}{c.tag ? <span className="appcard-tag">{c.tag}</span> : null}</span>
            <span className="appcard-desc">{c.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
