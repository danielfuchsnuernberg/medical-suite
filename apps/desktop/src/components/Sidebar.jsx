import { appName } from "../state/appName.js";
import { MENU, MENU_BOTTOM } from "@md/core";
import Icon from "./Icon.jsx";

function Entry({ e, view, go, badge, folded }) {
  return (
    <button type="button" data-view={e.id} aria-current={view === e.id ? "page" : undefined} onClick={() => go(e.id)}
      title={folded ? e.label + (e.tag ? ` (${e.tag})` : "") : undefined} aria-label={folded ? e.label : undefined}>
      <Icon name={e.icon} width={17} /><span className="lbl">{e.label}</span>{e.tag ? <span className="tag">{e.tag}</span> : null}{badge ? <span className="navbadge" data-testid={`badge-${e.id}`} aria-label={`${badge} waiting`}>{badge}</span> : null}
    </button>
  );
}

// B71 (A2, Q38 = A): the menu folds to a strip of icons (names on pointing) with the button at the bottom or ⌘\ / Ctrl+\.
export default function Sidebar({ view, go, baseName, badges = {}, folded = false, onFold }) {
  return (
    <aside className="side" aria-label="Menu">
      <button type="button" className="logo" onClick={() => go("home")} aria-label="Home" title={folded ? appName() : undefined}>
        <span className="mark"><Icon name="plus" stroke={2.4} /></span>
        <span className="name">{appName()}<small>{baseName}</small></span>
      </button>
      {MENU.map((g, i) => (
        <div key={i}>
          {g.label ? <div className="navlabel">{g.label}</div> : null}
          <nav className="nav">{g.entries.map(e => <Entry key={e.id} e={e} view={view} go={go} badge={badges[e.id]} folded={folded} />)}</nav>
        </div>
      ))}
      <div className="bottom"><nav className="nav"><Entry e={MENU_BOTTOM} view={view} go={go} folded={folded} />
        {onFold ? <button type="button" className="foldbtn" data-testid="fold" onClick={onFold} aria-label={folded ? "Unfold the menu" : "Fold the menu"} title={`${folded ? "Unfold" : "Fold"} the menu (${navigator.platform.startsWith("Mac") ? "⌘\\" : "Ctrl+\\"})`}>
          <Icon name={folded ? "unfold" : "fold"} width={17} /><span className="lbl">Fold the menu</span></button> : null}
      </nav></div>
    </aside>
  );
}
