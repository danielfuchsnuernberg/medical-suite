import { useCallback, useEffect, useMemo, useState } from "react";
import { demoSettings, findEntry, MENU, can } from "@md/core";
import Sidebar from "./components/Sidebar.jsx";
import SearchBox from "./components/SearchBox.jsx";
import SyncLight from "./components/SyncLight.jsx";
import Banners from "./components/Banners.jsx";
import Toasts from "./components/Toasts.jsx";
import Icon from "./components/Icon.jsx";
import Home from "./screens/Home.jsx";
import Placeholder from "./screens/Placeholder.jsx";
import Settings from "./screens/Settings.jsx";
import { SignIn, ChooseOwn, SetUp } from "./screens/SignIn.jsx";
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
  const { door, accounts, error, tick } = useDoor();
  // Who is signed in (F2). Read from the store every time, so a level change or archiving takes effect at once.
  const [auth, setAuth] = useState({ id: null, mustChange: false, ready: false });
  useEffect(() => { if (accounts && !auth.ready) setAuth({ id: accounts.stayed(), mustChange: false, ready: true }); }, [accounts, auth.ready]);
  const me = accounts && auth.id ? accounts.person(auth.id) : null;
  const signedIn = !!(me && me.state === "Active" && !auth.mustChange);
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
    if (me && !can(me.level, "changeStock")) { toast("View level can look but not change anything.", "danger"); return null; }
    try { return await door.apply({ by: me ? me.id : "unknown", ...p }); }
    catch (e) { toast(e.message || "Not saved. Nothing was changed.", "danger"); return null; }
  }, [door, toast, me]);
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
  if (!door || !data || !auth.ready) return <div className="opening" data-testid="opening"><div><div className="mark"><Icon name="plus" stroke={2.4} /></div>Opening…</div></div>;

  const demo = door.records("person").some(p => p.demo === true) || door.records("item").some(i => i.demo === true);
  // Signing out takes effect at once; forgetting "stay signed in" is saved after.
  const signOut = () => { setAuth({ id: null, mustChange: false, ready: true }); setView("home"); accounts.stay(null).catch(e => toast(String(e.message || e), "danger")); };
  if (accounts.needsSetUp()) return <SetUp accounts={accounts} baseName={settings.baseName} demo={demo} onDone={(id) => setAuth({ id, mustChange: false, ready: true })} />;
  if (me && me.state === "Active" && auth.mustChange) return <ChooseOwn accounts={accounts} person={me} demo={demo} onDone={() => setAuth(a => ({ ...a, mustChange: false }))} onCancel={signOut} />;
  if (!signedIn) return <SignIn accounts={accounts} demo={demo} baseName={settings.baseName} onSignedIn={async (id, o) => {
    if (o.stay && !o.mustChange) { try { await accounts.stay(id); } catch (e) { toast(String(e.message || e), "danger"); } }
    setAuth({ id, mustChange: o.mustChange, ready: true });
  }} />;

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
          <div className="tb-right"><span className="who" data-testid="who">{String(me.name)} · {String(me.level)}</span><button type="button" className="btn small" onClick={signOut}>Sign out</button><SyncLight status={status} waiting={door.waiting()} describe={describe} timeZone={settings.timeZone} /></div>
        </header>
        <Banners status={status} flags={door.flags()} nameOf={nameOfLine} timeZone={settings.timeZone} offlineClosed={offlineClosed} onCloseOffline={() => setOfflineClosed(true)} />
        <main className="content" id="content">
          {view === "home" ? <Home go={go} today={today} baseName={settings.baseName} />
            : view === "settings" ? <Settings me={me} accounts={accounts} tick={tick} toast={toast} />
            : <Placeholder view={view} />}
        </main>
      </div>
      <Toasts items={toasts} drop={dropToast} />
      {demo ? <span className="demo-mark">DEMO DATA</span> : null}
    </div>
  );
}
