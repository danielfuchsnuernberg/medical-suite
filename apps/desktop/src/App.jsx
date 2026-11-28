import { useCallback, useEffect, useMemo, useState } from "react";
import { findEntry, MENU, can, needsMedicalCode, programName } from "@md/core";
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
import ItemPage from "./screens/ItemPage.jsx";
import Count from "./screens/Count.jsx";
import StockTakes from "./screens/StockTakes.jsx";
import Staff from "./screens/Staff.jsx";
import { installSaveGuard } from "./state/saveGuard.js";
import { setAppName } from "./state/appName.js";
import Register from "./screens/Register.jsx";
import Dialog from "./components/Dialog.jsx";
import { SignIn, ChooseOwn, SetUp, MedicalCode } from "./screens/SignIn.jsx";
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
  const { door, accounts, settings: settingsStore, inventory, register, training, backups, error, tick } = useDoor();
  // The base's settings (F5), from the store. Until they are set: the computer's own time zone, and it says so.
  const base = door ? door.get("settings", "base") : null;
  setAppName(programName(base));   // B61: the name from Settings, before any screen draws
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
  const [personId, setPersonId] = useState(null); // the profile open on Staff (F14.5); the menu goes back to the list
  const [itemId, setItemId] = useState(null);     // the item a row opened (F7.3; the page itself is F8)
  // F10: typed counts are kept here, not on the count screen, so searching and switching place never wipe them (B16)
  const [count, setCount] = useState({ locationId: null, q: "", drafts: {} });
  const [countResult, setCountResult] = useState(null);
  const [leaving, setLeaving] = useState(null);   // where to go once unsaved counts are saved or thrown away
  // whoever signs in next never sees, or saves, someone else's typed counts
  useEffect(() => { setCount({ locationId: null, q: "", drafts: {} }); setCountResult(null); setLeaving(null); }, [auth.id]);
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [offlineClosed, setOfflineClosed] = useState(false);
  const toast = useCallback((text, kind) => setToasts(t => [...t, { id: Math.random().toString(36).slice(2), text, kind }]), []);
  const dropToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  const typedCounts = Object.values(count.drafts).filter(v => String(v).trim() !== "").length;
  // closing the program window with typed counts asks too (electron/main.cjs shows the question)
  useEffect(() => {
    if (!typedCounts) return;
    const ask = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", ask);
    return () => window.removeEventListener("beforeunload", ask);
  }, [typedCounts]);
  const [nav, setNav] = useState(0);              // every menu click starts the screen afresh (e.g. Stock takes goes back to the list)
  const goNow = (id, f = null) => { setNav(n => n + 1); setView(id); setPersonId(null); setFilter(f); setDrawer(false); if (id !== "count") setCountResult(null); };
  // F10.2: leaving with unsaved counts asks Save / Throw away / Keep counting
  const go = (id, f = null) => { if (view === "count" && id !== "count" && typedCounts) { setDrawer(false); setLeaving({ id, f }); return; } goNow(id, f); };

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
  useEffect(() => { if (door) installSaveGuard(door); }, [door]);   // B37: one click saves once
  useEffect(() => { if (accounts) accounts.repairLockout().catch(() => {}); }, [accounts, tick]);   // B48: never nobody at Manage level

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

  const saveCounts = async () => {
    try {
      const ids = Object.keys(count.drafts).filter(id => String(count.drafts[id]).trim() !== "");
      const places = new Set(ids.map(id => door.get("line", id)?.locationId));
      const notCounted = data.inv.lines.filter(l => places.has(l.locationId) && !ids.includes(l.id) && door.get("item", l.itemId)?.controlled !== true).length;
      const r = await inventory.saveCounts(me, count.drafts);
      setCount(c => ({ ...c, drafts: {} }));
      setCountResult(`Saved: ${r.changed} changed, ${r.same} the same${notCounted ? `, ${notCounted} not counted (left as they were, not set to 0)` : ""}.`);
      return true;
    } catch (e) { toast(String(e.message || e), "danger"); return false; }
  };

  if (error) return <div className="opening"><div><div className="mark"><Icon name="plus" stroke={2.4} /></div><b>The program couldn't open its data.</b><br />{error}</div></div>;
  if (!door || !data || !auth.ready) return <div className="opening" data-testid="opening"><div><div className="mark"><Icon name="plus" stroke={2.4} /></div>Opening…</div></div>;

  const demo = door.records("person").some(p => p.demo === true) || door.records("item").some(i => i.demo === true);
  // Signing out takes effect at once; forgetting "stay signed in" is saved after.
  // Typed counts belong to the person who typed them: signing out asks first (like leaving) and always clears them.
  const signOutNow = () => { setCount({ locationId: null, q: "", drafts: {} }); setCountResult(null); setAuth({ id: null, mustChange: false, ready: true }); setView("home"); accounts.stay(null).catch(e => toast(String(e.message || e), "danger")); };
  const signOut = () => { if (typedCounts) { setLeaving({ id: "signout" }); return; } signOutNow(); };
  const after = (t) => { if (t.id === "signout") signOutNow(); else goNow(t.id, t.f); };
  if (accounts.needsSetUp()) return <SetUp accounts={accounts} baseName={settings.baseName} demo={demo} onDone={(id) => setAuth({ id, mustChange: false, ready: true })} />;
  if (me && me.state === "Active" && auth.mustChange) return <ChooseOwn accounts={accounts} person={me} proof={auth.proof} demo={demo} onDone={() => setAuth(a => ({ ...a, mustChange: false, proof: "" }))} onCancel={signOut} />;
  if (signedIn && needsMedicalCode(me)) return <MedicalCode accounts={accounts} person={me} demo={demo} onDone={() => {}} onCancel={signOut} />;
  if (!signedIn) return <SignIn accounts={accounts} demo={demo} baseName={settings.baseName} onSignedIn={async (id, o) => {
    if (o.stay && !o.mustChange) { try { await accounts.stay(id); } catch (e) { toast(String(e.message || e), "danger"); } }
    setAuth({ id, mustChange: o.mustChange, proof: o.proof, ready: true });
  }} />;

  const status = door.status();
  // F12.3 / F12.4: what waits for a doctor. Doctors see the count on the menu; everyone sees an unapproved emergency on Home.
  const waitingCd = register.waitingAll();
  const cdBadge = register.isDoctor(me.id) ? waitingCd.length : 0;
  const emergencies = waitingCd.filter(r => r.status === "emergency");
  // F12.14: Management is told when there is no Head Doctor (nobody can mark a controlled drug until it names one)
  const noHead = can(me.level, "changeLevels") && register.heads().length === 0;
  // B48: Management is told (for a week) when the program had to give someone Manage level back
  const lockEv = can(me.level, "changeLevels") ? door.records("event").filter(e => e.what === "nobody was left at Manage level" && door.now() - Number(e.createdAt) < 7 * 864e5).sort((a, b) => Number(b.createdAt) - Number(a.createdAt))[0] : null;
  const lockout = lockEv ? String(door.get("person", String(lockEv.personId))?.name ?? "someone") : null;
  const entry = findEntry(view);
  const title = view === "home" ? "Home" : view === "item" ? String(door.get("item", itemId)?.name ?? "Item") : entry ? entry.label : "";
  const openResult = (kind, hit) => {
    if (kind === "person") { go("staff"); setPersonId(hit?.id ?? null); return; }
    const l = hit ? door.get("line", hit.id) : null;   // B67: a stock result opens its item page
    go("where"); if (l) { setItemId(String(l.itemId)); setView("item"); }
  };
  return (
    <div className={`shell${drawer ? " drawer" : ""}`}>
      <Sidebar view={view === "item" ? "where" : view} badges={{ cd: cdBadge }} go={go} baseName={settings.baseName} />
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
          {view === "home" ? <Home go={go} today={today} baseName={settings.baseName} emergencies={emergencies.length} noHead={noHead} lockout={lockout} below={data.inv.lines.filter(l => Number(l.qty) < 0).length} />
            : view === "overview" ? <Overview inv={data.inv} today={today} dateStyle={settings.dateStyle} open={(f) => go("where", f)} openItem={(id) => { setItemId(id); setView("item"); }} />
            : view === "where" ? <StockList inv={data.inv} today={today} dateStyle={settings.dateStyle} filter={filter} setFilter={setFilter} openItem={(id) => { setItemId(id); setView("item"); }} me={me} store={inventory} toast={toast} openRegister={() => go("cd")} />
            : view === "item" ? <ItemPage itemId={itemId} me={me} door={door} inv={data.inv} store={inventory} tick={tick} today={today} timeZone={settings.timeZone} dateStyle={settings.dateStyle} back={() => setView("where")} toast={toast} openRegister={() => go("cd")} register={register} />
            : view === "count" ? <Count inv={data.inv} me={me} state={count} setState={(f) => { setCount(f); setCountResult(null); }} save={saveCounts} result={countResult} />
            : view === "takes" ? <StockTakes key={nav} door={door} me={me} store={inventory} tick={tick} timeZone={settings.timeZone} dateStyle={settings.dateStyle} toast={toast} typedCounts={typedCounts} />
            : view === "cd" ? <Register door={door} me={me} reg={register} tick={tick} timeZone={settings.timeZone} dateStyle={settings.dateStyle} toast={toast} />
            : view === "staff" ? <Staff door={door} me={me} accounts={accounts} training={training} tick={tick} toast={toast} timeZone={settings.timeZone} dateStyle={settings.dateStyle} openId={personId} setOpenId={setPersonId} />
            : view === "log" ? <Activity door={door} tick={tick} timeZone={settings.timeZone} dateStyle={settings.dateStyle} />
            : view === "settings" ? <Settings me={me} accounts={accounts} store={settingsStore} door={door} tick={tick} toast={toast} backups={backups} register={register} inventory={inventory} />
            : <Placeholder view={view} />}
        </main>
      </div>
      {leaving ? (
        <Dialog title="Counts not saved yet" onClose={() => setLeaving(null)} testid="leave-count" footer={<>
          <button type="button" className="btn" onClick={() => setLeaving(null)}>Keep counting</button>
          <button type="button" className="btn danger" onClick={() => { setCount(c => ({ ...c, drafts: {} })); const t = leaving; setLeaving(null); after(t); }}>Throw away</button>
          <button type="button" className="btn primary" onClick={async () => { const t = leaving; if (await saveCounts()) { setLeaving(null); after(t); } else setLeaving(null); }}>Save counts</button></>}>
          <p>You typed {typedCounts} {typedCounts === 1 ? "count" : "counts"} that {typedCounts === 1 ? "isn't" : "aren't"} saved yet.</p>
        </Dialog>
      ) : null}
      <Toasts items={toasts} drop={dropToast} />
      {demo ? <span className="demo-mark">DEMO DATA</span> : null}
    </div>
  );
}
