import { useEffect, useMemo, useState } from "react";
import { demoSettings, demoSearchSource, findEntry, MENU } from "@md/core";
import Sidebar from "./components/Sidebar.jsx";
import SearchBox from "./components/SearchBox.jsx";
import Icon from "./components/Icon.jsx";
import Home from "./screens/Home.jsx";
import Placeholder from "./screens/Placeholder.jsx";
import useToday from "./state/useToday.js";

const crumbOf = (id) => {
  if (id === "home") return "Workspace";
  if (id === "settings") return "Admin";
  const g = MENU.find(g => g.entries.some(e => e.id === id));
  return g && g.label ? g.label : "Workspace";
};

export default function App() {
  const settings = demoSettings;               // F5 brings the real country settings
  const source = useMemo(() => demoSearchSource(), []); // F3 brings the store door
  const today = useToday(settings.timeZone);
  const [view, setView] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const go = (id) => { setView(id); setDrawer(false); };
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const entry = findEntry(view);
  const title = view === "home" ? "Home" : entry ? entry.label : "";
  const openResult = (kind, item) => {
    // F7/F8 and F14 bring the real item and person screens; until then a result opens its section.
    go(kind === "person" ? "staff" : "where");
  };
  return (
    <div className={`shell${drawer ? " drawer" : ""}`}>
      <Sidebar view={view} go={go} baseName={settings.baseName} />
      {drawer ? <button type="button" className="scrim" aria-label="Close the menu" onClick={() => setDrawer(false)} /> : null}
      <div className="main">
        <header className="topbar">
          <button type="button" className="hamb" aria-label="Open the menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><Icon name="menu" stroke={2} /></button>
          <div><div className="crumb">{crumbOf(view)}</div><h1>{title}</h1></div>
          <SearchBox source={source} today={today} dateStyle={settings.dateStyle} onOpen={openResult} />
        </header>
        <main className="content" id="content">
          {view === "home" ? <Home go={go} today={today} baseName={settings.baseName} /> : <Placeholder view={view} />}
        </main>
      </div>
      <span className="demo-mark">DEMO DATA</span>
    </div>
  );
}
