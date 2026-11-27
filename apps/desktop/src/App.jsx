import { useCallback, useEffect, useMemo, useState } from "react";
import { demoSettings, findEntry, MENU } from "@md/core";
import Sidebar from "./components/Sidebar.jsx";
import SearchBox from "./components/SearchBox.jsx";
import SyncLight from "./components/SyncLight.jsx";
import Banners from "./components/Banners.jsx";
import Toasts from "./components/Toasts.jsx";
import Icon from "./components/Icon.jsx";
import Home from "./screens/Home.jsx";
import Placeholder from "./screens/Placeholder.jsx";
import useToday from "./state/useToday.js";
import useDoor from "./state/useDoor.js";

const crumbOf = (id) => {
  if (id === "home") return "Workspace";
  if (id === "settings") return "Admin";
  const g = MENU.find(g => g.entries.some(e => e.id === id));
  return g && g.label ? g.label : "Workspace";
};

export default function App() {
  const settings = demoSettings;   // F5 brings the real country settings
  const today = useToday(settings.timeZone);
  const { door, error, tick } = useDoor();
  const [view, setView] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [offlineClosed, setOfflineClosed] = useState(false);
  const toast = useCallback((text, kind) => setToasts(t => [...t, { id: Math.random().toString(36).slice(2), text, kind }]), []);
  const dropToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  const go = (id) => { setView(id); setDrawer(false); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Every screen saves through here: the store door, and a red message if this computer couldn't save (F3.6).
  const save = useCallback(async (p) => {
    try { return await door.apply(p); }
    catch (e) { toast(e.message || "Not saved. Nothing was changed.", "danger"); return null; }
  }, [door, toast]);
  useEffect(() => { if (door && window.__mdTest) window.__mdTest.save = save; }, [door, save]);

  // What the screens read: records from the door, joined by ID (R5).
  const data = useMemo(() => {
    if (!door) return null;
    const items = new Map(door.records("item").map(r => [r.id, r]));
    const locs = new Map(door.records("location").map(r => [r.id, r]));
    const lines = door.records("line").filter(l => l.state === "Active");
    return {
      items, locs,
      source: {
        people: door.records("person").filter(p => p.state === "Active").map(p => ({ id: p.id, name: String(p.name), job: String(p.job) })),
        stock: lines.map(l => { const it = items.get(l.itemId) || {}; const lc = locs.get(l.locationId) || {}; return { id: l.id, item: String(it.name ?? "?"), location: String(lc.name ?? "?"), qty: Number(l.qty), unit: String(it.unit ?? ""), expiry: l.expiry ?? null }; }),
      },
    };
  }, [door, tick]);

  const nameOfLine = (id) => { const l = door && door.get("line", id); if (!l || !data) return "a line"; return `${data.items.get(l.itemId)?.name ?? "?"} in ${data.locs.get(l.locationId)?.name ?? "?"}`; };
  const describe = (c) => {
    if (c.recordType === "line" && c.op === "delta") return `${nameOfLine(c.recordId)}: ${Number(c.data.by) > 0 ? "+" : "−"}${Math.abs(Number(c.data.by))}`;
    if (c.recordType === "line" && c.op === "count") return `${nameOfLine(c.recordId)}: counted ${c.data.qty}`;
    return `${c.recordType}: ${c.op}`;
  };

  if (error) return <div className="opening"><div><div className="mark"><Icon name="plus" stroke={2.4} /></div><b>The program couldn't open its data.</b><br />{error}</div></div>;
  if (!door || !data) return <div className="opening" data-testid="opening"><div><div className="mark"><Icon name="plus" stroke={2.4} /></div>Opening…</div></div>;

  const status = door.status();
  const entry = findEntry(view);
  const title = view === "home" ? "Home" : entry ? entry.label : "";
  const openResult = (kind) => go(kind === "person" ? "staff" : "where"); // F7/F8/F14 bring the real screens
  return (
    <div className={`shell${drawer ? " drawer" : ""}`}>
      <Sidebar view={view} go={go} baseName={settings.baseName} />
      {drawer ? <button type="button" className="scrim" aria-label="Close the menu" onClick={() => setDrawer(false)} /> : null}
      <div className="main">
        <header className="topbar">
          <button type="button" className="hamb" aria-label="Open the menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><Icon name="menu" stroke={2} /></button>
          <div><div className="crumb">{crumbOf(view)}</div><h1>{title}</h1></div>
          <SearchBox source={data.source} today={today} dateStyle={settings.dateStyle} onOpen={openResult} />
          <div className="tb-right"><SyncLight status={status} waiting={door.waiting()} describe={describe} timeZone={settings.timeZone} /></div>
        </header>
        <Banners status={status} flags={door.flags()} nameOf={nameOfLine} timeZone={settings.timeZone} offlineClosed={offlineClosed} onCloseOffline={() => setOfflineClosed(true)} />
        <main className="content" id="content">
          {view === "home" ? <Home go={go} today={today} baseName={settings.baseName} /> : <Placeholder view={view} />}
        </main>
      </div>
      <Toasts items={toasts} drop={dropToast} />
      <span className="demo-mark">DEMO DATA</span>
    </div>
  );
}
