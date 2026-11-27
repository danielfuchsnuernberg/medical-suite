import { useEffect, useState } from "react";
import { Door, IdbBackend, MemoryBackend, FakeServer, Accounts, SettingsStore, InventoryStore } from "@md/store";
import { demoSeedChanges } from "@md/core";

// Opens the store door once. In everyday use there is no server yet (REACH SD2), so the door works on
// this computer only. In a program test (window.md.test) a stand-in server and a second "computer" are added,
// and test controls are put on window.__mdTest. Nothing else in the screens knows the difference.
let opening = null;
async function openDoor() {
  const test = !!(window.md && window.md.test);
  const backend = new IdbBackend();
  if (!test) { const door = await Door.open({ backend, seed: demoSeedChanges, device: "this-computer" }); return { door, accounts: new Accounts(door), settings: new SettingsStore(door), inventory: new InventoryStore(door) }; }
  const seed = window.md.testEmpty ? null : demoSeedChanges;          // a computer with no data and no people (Q22 first start)
  const server = new FakeServer();
  if (seed) server.receive(seed());
  const here = server.connect();
  const there = server.connect();
  if (window.md.testOffline) here.setOnline(false);   // start with no internet (F3.1)
  const door = await Door.open({ backend, transport: here, seed, device: "test-mac" });
  const other = await Door.open({ backend: new MemoryBackend(), transport: there, device: "test-pc" });
  await door.sync(); await other.sync();
  const accounts = new Accounts(door);
  const settings = new SettingsStore(door);
  const inventory = new InventoryStore(door);
  window.__mdTest = {
    door, other, server, accounts, settings, inventory,
    setOnline(v) { here.setOnline(v); return door.sync(); },
    failNextWrite(n = 1) { backend.failNext = n; },
    async otherApplies(p) { await other.apply(p); await other.sync(); },
  };
  return { door, accounts, settings, inventory };
}

export default function useDoor() {
  const [state, setState] = useState({ door: null, accounts: null, settings: null, inventory: null, error: null, tick: 0 });
  useEffect(() => {
    let off = () => {}, timer;
    opening = opening || openDoor();
    opening.then(({ door, accounts, settings, inventory }) => {
      setState(s => ({ ...s, door, accounts, settings, inventory }));
      off = door.subscribe(() => setState(s => ({ ...s, tick: s.tick + 1 })));
      const sync = () => door.sync();
      timer = setInterval(sync, 15000);
      window.addEventListener("online", sync);
      window.addEventListener("offline", sync);
    }).catch(e => setState(s => ({ ...s, error: String(e && e.message || e) })));
    return () => { off(); clearInterval(timer); };
  }, []);
  return state;
}
