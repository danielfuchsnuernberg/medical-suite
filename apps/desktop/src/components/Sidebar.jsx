import { MENU, MENU_BOTTOM } from "@md/core";
import Icon from "./Icon.jsx";

function Entry({ e, view, go, badge }) {
  return (
    <button type="button" data-view={e.id} aria-current={view === e.id ? "page" : undefined} onClick={() => go(e.id)}>
      <Icon name={e.icon} width={17} />{e.label}{e.tag ? <span className="tag">{e.tag}</span> : null}{badge ? <span className="navbadge" data-testid={`badge-${e.id}`} aria-label={`${badge} waiting`}>{badge}</span> : null}
    </button>
  );
}

export default function Sidebar({ view, go, baseName, badges = {} }) {
  return (
    <aside className="side" aria-label="Menu">
      <button type="button" className="logo" onClick={() => go("home")} aria-label="Home">
        <span className="mark"><Icon name="plus" stroke={2.4} /></span>
        <span className="name">REACH Medical Suite<small>{baseName}</small></span>
      </button>
      {MENU.map((g, i) => (
        <div key={i}>
          {g.label ? <div className="navlabel">{g.label}</div> : null}
          <nav className="nav">{g.entries.map(e => <Entry key={e.id} e={e} view={view} go={go} badge={badges[e.id]} />)}</nav>
        </div>
      ))}
      <div className="bottom"><nav className="nav"><Entry e={MENU_BOTTOM} view={view} go={go} /></nav></div>
    </aside>
  );
}
