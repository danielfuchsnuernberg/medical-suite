// The program's menu: the June Medical Suite menu (F1.1), with each entry's feature and state.
// "built" opens a screen; "later" shows when it comes. The screens read this; they don't keep their own copy.

export type MenuState = "built" | "coming" | "later";
export interface MenuEntry { id: string; label: string; icon: string; feature: string; state: MenuState; note?: string; tag?: string }
export interface MenuGroup { label: string | null; entries: MenuEntry[] }

export const MENU: MenuGroup[] = [
  { label: null, entries: [{ id: "home", label: "Home", icon: "home", feature: "F1", state: "built" }] },
  { label: "Inventory", entries: [
    { id: "overview", label: "Overview", icon: "overview", feature: "F6", state: "built" },
    { id: "where", label: "Store and bags", icon: "bag", feature: "F7", state: "built" },
    { id: "items", label: "Item list", icon: "list", feature: "F22", state: "built" },
    { id: "count", label: "Count a bag", icon: "count", feature: "F10", state: "built" },
    { id: "takes", label: "Stock takes", icon: "takes", feature: "F11", state: "built" },
    { id: "cd", label: "Controlled drugs", icon: "pill", feature: "F12", state: "built" },
    { id: "log", label: "Activity", icon: "history", feature: "F4", state: "built" },
  ] },
  { label: "Team", entries: [
    { id: "staff", label: "Staff and training", icon: "users", feature: "F14", state: "built" },
    { id: "roster", label: "Roster", icon: "roster", feature: "F16", state: "later", tag: "Later" },
  ] },
  { label: "Later", entries: [
    { id: "patients", label: "Patient Archive", icon: "folder", feature: "F18", state: "later", tag: "Later" },
  ] },
];

export const MENU_BOTTOM: MenuEntry = { id: "settings", label: "Settings", icon: "settings", feature: "F5", state: "coming" };

export const HOME_CARDS: { id: string; label: string; text: string; icon: string; tag?: string }[] = [
  { id: "overview", label: "Inventory", text: "Stock in the Store and every bag", icon: "bag" },
  { id: "cd", label: "Controlled drugs", text: "Register with doctor, witness and balance", icon: "pill" },
  { id: "staff", label: "Staff and training", text: "People, courses, certificates", icon: "users" },
  { id: "log", label: "Activity", text: "Who changed what, old → new", icon: "history" },
  { id: "roster", label: "Roster", text: "Who is on duty when", icon: "roster", tag: "Later" },
  { id: "patients", label: "Patient Archive", text: "One file per patient", icon: "folder", tag: "Later" },
];

export function findEntry(id: string): MenuEntry | undefined {
  if (id === MENU_BOTTOM.id) return MENU_BOTTOM;
  for (const g of MENU) for (const e of g.entries) if (e.id === id) return e;
  return undefined;
}
