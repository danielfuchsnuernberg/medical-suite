# ARCHITECTURE — REACH Inventory (as found, 26 Nov 2026)

This describes the prototype **as it is**. The target architecture is Stage 5 and comes after the Q&A.

## Tech
- **One file:** `index.html`, 1,641 lines and 368,540 bytes. It holds CSS (lines 7–220), HTML (221–258) and vanilla JavaScript (260–1639).
- **No framework, no build step, no dependencies, no server.** It runs in any modern browser.
- **Hosting:** GitHub Pages from the `main` branch of the public repo `danielfuchsnuernberg/medical-suite`.
- **Not a PWA:** no manifest, no service worker (both return 404 on the live site). It only works offline while the tab is already open.
- **Look:** design tokens in `:root` (indigo accent `#4F46E5`, Inter or system font). Mirror of `docs/foundation/tokens.css`. Light mode only.

## Folder layout (today)
```
medical-suite/
├── index.html            the whole app (incl. built-in real data, see B9)
├── docs/foundation/      prototype design notes: data model, tokens.css, style guide, style demo
├── CLAUDE.md + the 8 rule-book files
└── .gitignore            keeps data/, spreadsheets, CSV, backups, secrets and build output out
```

## Data — where it lives
| Where | What | Size / count |
|---|---|---|
| Inside `index.html` (`seed()`, lines 348–384) | the start data: 5 staff, 6 courses, 8 bags, 14 categories, **784 item types, 902 stock lines** | lines 378–379 are 88 KB and 157 KB |
| Browser `localStorage`, key `medsuite.store` | the live data after first open: everything above plus every change | 251,187 characters right after the first load |
| Each browser and device separately | there is **no sync**: Safari, the Dock web app, Chrome and an iPad each hold their own copy | — |
| Backup file (Settings › Export) | `medical-suite-backup-YYYY-MM-DD.json`, the whole store | — |
| CSV export (Inventory › Export CSV) | `inventory-<location>-<date>.csv` | — |
| Source spreadsheets (iCloud, outside Git) | `Stock Take 2026.xlsx`, `Medevac Bag Check List.xlsx` | — |

## Data model (as built)
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

## Key functions
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

## Screens
Home · Personnel (directory → profile) · Inventory (Overview | By location → item page; Stock takes → stock take detail) · Activity Log · Settings · placeholders: Patient Archive, Roster, Calendar, Library, Dispatch.
