# ARCHITECTURE — REACH Medical Suite

**Target design: APPROVED by Danny, 27 Nov 2026 (Stage 5 GO).** Shown visually on https://claude.ai/artifact/CDkrByh9ypq4YXu4sN7vBj (source `docs/stage5/medical-suite-blueprint.html`; answers in its `stage5` collection). Follows the REACH Core data rules (`../reach/CORE-DATA.md`, R1–R13). The June prototype as found is described further down, as a reference.

## Layers
```
Screens       apps/desktop      React (.jsx), the June screens; draw only what the rules return; plain text only (B4)
   ↓ ask / ↑ answer
Rules         packages/core     TypeScript, no screen code; one small function per Master Checklist rule, each with a unit test
   ↓ save / read
Store door    packages/store    the only way to stored data (R7): every change is a message with its own ID (R8),
                                writes the records + the log entry (R9), shows a failed save (B22), migrates, never re-seeds (B3)
   ↓
This computer IndexedDB         full copy per computer; opens offline (F3); offline changes wait in the outbox
Shared server later             REACH SD2 / EDP Q44, not decided; added behind the same door
```

## Folders
```
medical-suite/
├── PLAN.md CHECKLIST.md ARCHITECTURE.md DECISIONS.md BUGS.md AUDIT.md CHANGELOG.md HANDOVER.md CLAUDE.md
├── package.json                 npm workspaces (same set-up as EDP)
├── packages/core/src/
│   ├── reachCore/   ids (crypto.randomUUID), stamps, change message, dates (Moment in UTC / CalendarDate), backup shape
│   ├── access/      levels View / Work / Manage (Q20), doctor approval rights (Q16, ✕ removal), 24-hour delete (Q38)
│   ├── inventory/   items (catalogue keeper, R2), locations, lines, restock / dispense / move, readiness (B1, B25, B10), filters, CSV
│   ├── counts/      drafts, save summary, two-count rule (F3.5)
│   ├── stockTakes/  freeze, then vs now
│   ├── register/    balance, take out (PIN / request / emergency), approve, refuse, correction, receive
│   ├── people/      people list in the Core shape, training, month-safe expiry (B26)
│   ├── settings/    country settings (R12), in-use checks (B21), rename rules (B24 part)
│   ├── log/         activity log entries in the REACH shape (R9)
│   └── importExport/ backup in the REACH shape (R10), refuse rules (B15), Excel check (B6)
├── packages/store/src/          door, localDb (IndexedDB via idb), outbox, migrate, sync (server adapter, later)
├── apps/desktop/
│   ├── electron/                main.js (window, menu, single instance), preload.js (no Node access for the screens)
│   └── src/  styles/tokens.css (June tokens), components/ (building blocks), screens/, state/
├── tests/unit/                  Vitest, one file per core module
├── tests/app/                   Playwright driving the Electron program, one test per Master Checklist line
├── docs/                        stage pages
└── data/                        real data on this Mac only, git-ignored (R11)
```

## Data (every record carries the Core stamps, R4)
Stamps: `id` (hidden random) · `createdAt` / `createdBy` · `changedAt` / `changedBy` · `country` · `state` (Active | Archived). Moments in UTC, calendar dates as plain `YYYY-MM-DD` (R6, B13). Records point by ID (R5); stock takes freeze names as on the day.

| Record | Fields |
|---|---|
| Item | itemNo (readable), name, category, unit, controlled |
| Location | name, kind (store / bag) |
| StockLine | itemId, locationId, qty (whole), required (or reorder level, or null), lot, expiry (CalendarDate) |
| Movement | lineId, kind (restock / dispense / move / edit), change or from → to, at, by, messageId |
| Count | lineId, counted, was, at, by; flagged when two counts disagree |
| StockTake | label, at, by, lines [lineId, frozen item and location names, qty]; never changed |
| RegisterLine | itemId, kind (in / out / correction), qty, reason, by, witnessId, doctorId, how (pin / remote / self / after), status (waiting / booked / emergency / refused), corrects |
| ApprovalRight | personId, givenBy, removedBy |
| Person | staffNo, name, job, email, office (REACH six), level (View / Work / Manage), department |
| Course, Training | course: name, validMonths · training: personId, courseId, status, done, expires (CalendarDates) |
| Settings | baseName, country, timeZone, dateStyle, shiftTimes, departments, categories |
| LogEntry | who, recordType, recordId, what, from, to, at, app = "MD"; never deleted |
| Change (message) | messageId, at, by, app, recordType, recordId, op, data; counted once |

## When two computers change the same thing
| Change | Rule |
|---|---|
| Restock, dispense, move | both count (deltas are added) |
| Count | later count used, both kept, flagged (F3.5) |
| Register | append-only lines; balance worked out from the lines |
| Edit of the same field | later edit used; the earlier one stays in the log, old → new |

## The program
Electron (one Chromium engine on Mac and Windows: what is tested is what runs; opens offline). electron-builder makes the Mac and Windows installers. Rejected: Tauri (Safari engine on Mac, Edge engine on Windows, so screens can differ; needs Rust on this Mac); an installable web page (Q4: "a real app, not a web page"; REACH SD8). Mac signing needs an Apple "Developer ID Application" certificate (Danny, Stage 9); Windows shows an "unknown publisher" warning without a paid certificate.

## Dependencies (pinned to EDP's versions where EDP has them; checked 27 Nov 2026)
| Tool | Version | Note |
|---|---|---|
| React / react-dom | 18.3.1 | same as EDP |
| Vite | 5.4.21 | same as EDP |
| @vitejs/plugin-react | 4.7.0 | same as EDP |
| TypeScript | 5.9.3 | same as EDP |
| Vitest | 3.2.4 | same as EDP |
| @playwright/test | 1.65 | same as EDP; drives Electron |
| electron | 45.5.0 | newest on 27 Nov; pinned exactly at install |
| electron-builder | 26.18.0 | installers |
| idb | 8.0.4 | IndexedDB access |

## Depends on (not decided in this project)
1. **Server location** (REACH SD2 / EDP Q44): release 1 can't go to the nurses before it. To raise in the REACH chat.
2. **Shared REACH Core code**: written here in `packages/core/src/reachCore/`, kept separate to move into a shared package later (R13).
3. **Accounts** (REACH SD1 / EDP F61): until the server, sign-in uses this app's people list with a password per person on each computer, behind the same door.

---

# The June prototype, as found (26 Nov 2026) — reference only

This describes the prototype **as it is**. The target architecture is Stage 5 and comes after the Q&A.

### Tech
- **One file:** `index.html`, 1,641 lines and 368,540 bytes. It holds CSS (lines 7–220), HTML (221–258) and vanilla JavaScript (260–1639).
- **No framework, no build step, no dependencies, no server.** It runs in any modern browser.
- **Hosting:** GitHub Pages from the `main` branch of the public repo `danielfuchsnuernberg/medical-suite`.
- **Not a PWA:** no manifest, no service worker (both return 404 on the live site). It only works offline while the tab is already open.
- **Look:** design tokens in `:root` (indigo accent `#4F46E5`, Inter or system font). Mirror of `docs/foundation/tokens.css`. Light mode only.

### Folder layout (today)
```
medical-suite/
├── index.html            the whole app (incl. built-in real data, see B9)
├── docs/foundation/      prototype design notes: data model, tokens.css, style guide, style demo
├── CLAUDE.md + the 8 rule-book files
└── .gitignore            keeps data/, spreadsheets, CSV, backups, secrets and build output out
```

### Data — where it lives
| Where | What | Size / count |
|---|---|---|
| Inside `index.html` (`seed()`, lines 348–384) | the start data: 5 staff, 6 courses, 8 bags, 14 categories, **784 item types, 902 stock lines** | lines 378–379 are 88 KB and 157 KB |
| Browser `localStorage`, key `medsuite.store` | the live data after first open: everything above plus every change | 251,187 characters right after the first load |
| Each browser and device separately | there is **no sync**: Safari, the Dock web app, Chrome and an iPad each hold their own copy | — |
| Backup file (Settings › Export) | `medical-suite-backup-YYYY-MM-DD.json`, the whole store | — |
| CSV export (Inventory › Export CSV) | `inventory-<location>-<date>.csv` | — |
| Source spreadsheets (iCloud, outside Git) | `Stock Take 2026.xlsx`, `Medevac Bag Check List.xlsx` | — |

### Data model (as built)
```
STORE = {
  schemaVersion: 1, dataVersion: 6,
  personnel[]        { id PR-…, title, firstName, lastName, jobRole, department, accessRole Staff|Manager|Admin,
                       dutyStatus, lifecycle Active|Archived, email, phone, startDate, licenseRef, trainingRecords[] }
  courseTypes[]      { id CT-…, name, category, validityMonths, mandatoryFor[] }
  departments[]      string
  itemTypes[]        { id IT-…, name, category, defaultUnit, lifecycle }               ← "what it is"
  stockLines[]       { id SL-…, itemTypeId, location 'Store'|BG-…, quantity, parLevel, ← "how many, where"
                       lotNumber, expiryDate, compartment, lifecycle }
  bags[]             { id BG-…, name, lifecycle }                                       ← the stock locations
  inventoryCategories[] string
  stockSnapshots[]   { id SS-…, takenAt, takenBy, label, lines[ {stockLineId, name, location, quantity, par, expiry} ] }
  activityLog[]      { id, timestamp, actorId, tool, action, targetType, targetId, detail, summary }
  settings {}
}
```
- One **item type** can have several **stock lines** (one per location, or per lot).
- Derived, not stored: stock status (Out / Low / In), expiry status (Expired / Soon ≤ 60 days / OK), bag readiness.

### Key functions
| Function | Line | Does |
|---|---|---|
| `Persist.load/save` | 294 | localStorage read/write |
| `seed()` / boot | 348 / 387 | builds start data; **re-seeds if `dataVersion` differs (B3)** |
| `migrate(d)` | 305 | fills in missing arrays |
| `can(cap)` / `PERMISSIONS` | 320–330 | role gating (Inventory is flat: every role can do everything) |
| `stockStatus`, `lineExpiry`, `bagReadiness` | 437, 450, 1050 | the derived statuses |
| `adjustStock(lineId, delta)` | 1489 | restock and dispense from the UI |
| `applyDispense({stockLineId, qty, actorId})` | 1501 | the planned Dispatch/EDP entry point (no caller yet) |
| `saveCounts`, `openSnapshotForm` | 1078, 1554 | count stock, freeze a stock take |
| `exportData` / `importData` | 479 / 486 | JSON backup |
| `logActivity` | 468 | appends to the activity log |

### Screens
Home · Personnel (directory → profile) · Inventory (Overview | By location → item page; Stock takes → stock take detail) · Activity Log · Settings · placeholders: Patient Archive, Roster, Calendar, Library, Dispatch.
