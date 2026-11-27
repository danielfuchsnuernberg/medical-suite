import { useCallback, useEffect, useMemo, useState } from "react";
import { findEntry, MENU, can } from "@md/core";
import Sidebar from "./components/Sidebar.jsx";
import SearchBox from "./components/SearchBox.jsx";
import SyncLight from "./components/SyncLight.jsx";
import Banners from "./components/Banners.jsx";
import Toasts from "./components/Toasts.jsx";
import Icon from "./components/Icon.jsx";
import Home from "./screens/Home.jsx";
import Placeholder from "./screens/Placeholder.jsx";
import Settings from "./screens/Settings.jsx";
import Activity from "./screens/Activity.jsx";
import Overview from "./screens/Overview.jsx";
import StockList from "./screens/StockList.jsx";
import ItemStub from "./screens/ItemStub.jsx";
import { SignIn, ChooseOwn, SetUp } from "./screens/SignIn.jsx";
import useToday from "./state/useToday.js";
import useDoor from "./state/useDoor.js";

const crumbOf = (id) => {
  if (id === "home") return "Workspace";
  if (id === "item") return "Inventory";
  if (id === "settings") return "Admin";
  const g = MENU.find(g => g.entries.some(e => e.id === id));
  return g && g.label ? g.label : "Workspace";
};

export default function App() {
  const { door, accounts, settings: settingsStore, error, tick } = useDoor();
  // The base's settings (F5), from the store. Until they are set: the computer's own time zone, and it says so.
  const base = door ? door.get("settings", "base") : null;
  const settings = {
    baseName: base?.baseName ? String(base.baseName) : "Base not named yet",
    timeZone: base?.timeZone ? String(base.timeZone) : Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateStyle: base?.dateStyle === "short" ? "short" : "long",
    set: !!base,
  };
  const today = useToday(settings.timeZone);
  // Who is signed in (F2). Read from the store every time, so a level change or archiving takes effect at once.
  const [auth, setAuth] = useState({ id: null, mustChange: false, ready: false });
  useEffect(() => { if (accounts && !auth.ready) setAuth({ id: accounts.stayed(), mustChange: false, ready: true }); }, [accounts, auth.ready]);
  const me = accounts && auth.id ? accounts.person(auth.id) : null;
  const signedIn = !!(me && me.state === "Active" && !auth.mustChange);
  const [view, setView] = useState("home");
  const [filter, setFilter] = useState(null);     // the Store and bags filters (F7); the Overview opens it with one set (F6.1)
  const [itemId, setItemId] = useState(null);     // the item a row opened (F7.3; the page itself is F8)
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [offlineClosed, setOfflineClosed] = useState(false);
  const toast = useCallback((text, kind) => setToasts(t => [...t, { id: Math.random().toString(36).slice(2), text, kind }]), []);
  const dropToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  const go = (id, f = null) => { setView(id); setFilter(f); setDrawer(false); };

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
    // Places in the order of the June Overview: the Store first, then the bags by name. Archived places are left out.
    const locations = door.records("location").filter(l => l.state === "Active").sort((a, b) => (a.kind === "store" ? 0 : 1) - (b.kind === "store" ? 0 : 1) || String(a.name).localeCompare(String(b.name)));
    return {
      items, locs,
      inv: {
        lines: lines.filter(l => locs.get(l.locationId)?.state === "Active"),
        // archived lines, and lines in an archived place: shown only with "Show archived" (F7.1)
        archivedLines: door.records("line").filter(l => l.state !== "Active" || locs.get(l.locationId)?.state !== "Active"),
        items, locs, locations,
        categories: door.records("category").filter(c => c.state === "Active").sort((a, b) => String(a.name).localeCompare(String(b.name))),
        categoryName: (id) => String(door.get("category", id)?.name ?? ""),
      },
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
  const title = view === "home" ? "Home" : view === "item" ? String(door.get("item", itemId)?.name ?? "Item") : entry ? entry.label : "";
  const openResult = (kind) => go(kind === "person" ? "staff" : "where"); // F7/F8/F14 bring the real screens
  return (
    <div className={`shell${drawer ? " drawer" : ""}`}>
      <Sidebar view={view === "item" ? "where" : view} go={go} baseName={settings.baseName} />
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
            : view === "overview" ? <Overview inv={data.inv} today={today} dateStyle={settings.dateStyle} open={(f) => go("where", f)} />
            : view === "where" ? <StockList inv={data.inv} today={today} dateStyle={settings.dateStyle} filter={filter} setFilter={setFilter} openItem={(id) => { setItemId(id); setView("item"); }} />
            : view === "item" ? <ItemStub item={door.get("item", itemId)} back={() => setView("where")} />
            : view === "log" ? <Activity door={door} tick={tick} timeZone={settings.timeZone} dateStyle={settings.dateStyle} />
            : view === "settings" ? <Settings me={me} accounts={accounts} store={settingsStore} door={door} tick={tick} toast={toast} />
            : <Placeholder view={view} />}
        </main>
      </div>
      <Toasts items={toasts} drop={dropToast} />
      {demo ? <span className="demo-mark">DEMO DATA</span> : null}
    </div>
  );
}
