# HANDOVER — REACH Medical Suite

## What exists
**Release 1 of REACH Medical Suite (REACH code MD; Inventory is MD1) is built, tested and audited (28 Nov 2026).** It is an installed desktop program (Electron, React, TypeScript) for REACH's medical side: medication and medical supplies in the Store and the MedEvac bags, the controlled-drug register, staff and training. All 15 release-1 features (F1–F15) are in `CHECKLIST.md` › Master Feature Checklist, each line ticked with the test that proves it.

- **F1–F5 foundation:** window, menu and search; sign-in and levels (View / Work / Manage); works without internet (store door); Activity log; Settings (country, base, lists, program name).
- **F6–F13 stock:** overview, Store and bags, item page, restock / dispense / move, counting, stock takes, the controlled-drug register (doctors, witness, PIN, Head Doctor), backup, restore and the Excel check and loading.
- **F14–F15 people:** staff list and profiles, training and certificates.
- **Not in release 1 (planned):** the roster F16 (release 2, after Danny's roster rules), EDP's "used on a case" F17, Patient Archive F18, Calendar, Medical Library and SOPs F19–F21.

It runs with DEMO data (invented people and stock, marked DEMO). The June prototype is archived (iCloud › AI Projects › REACH Inventory › Archive – June 2026 prototype), a reference only. Real source data: iCloud › AI Projects › REACH Inventory › Source data (real) — never in Git.

## How to run it
- **From source (this Mac):** in Terminal, in this folder: `npm start` (builds, then opens the program). First time: `npm_config_cache=<a scratch folder> npm install` (this Mac's `~/.npm` has root-owned files); if Electron doesn't start, `node node_modules/electron/install.js`.
- **Installers:** `npm run dist:mac -w apps/desktop` → `apps/desktop/release/REACH Medical Suite-0.1.0-arm64.dmg` (Apple chip) and `…-0.1.0.dmg` (Intel); `npm run dist:win -w apps/desktop` → `REACH Medical Suite Setup 0.1.0.exe`. Unsigned and with Electron's default icon (see Known limits).
- **Signing in:** any DEMO person with the password **demo**. Cara Demo and Dr Ben Sample are Manage level (Settings › People and access); Anna Example and Dina Test are Work level; Finn Former is archived. Dr Ben is the DEMO doctor and Head Doctor: PIN **1234** until he sets his own, medical code DEMO-MD-0001.
- **A new, empty computer:** the first Management person sets it up (name, office, own password); everyone else gets a one-time password from Settings › People and access.

## How to test it
- **Unit tests:** `npx vitest run` → 181 tests (rules and stores).
- **Program tests, in the real program:** `npm run test:app` → 105 tests (every Master Checklist line, the Stage 7 and 8 bugs, and the installed Mac app when one is built). They run in test mode (MD_TEST=1: a stand-in server and a second "computer") with their own data folder (MD_USER_DATA), so they run even while the program is open. Never set test mode by hand.
- **Real Excel files:** Settings › Backup and import › Check a stock list. The check lists every problem; loading is refused while a row must be fixed.
- How the tests were proven able to fail (each rule broken on purpose): `CHECKLIST.md` › Stage 6–8 and `AUDIT.md`.

## Current state
**Stages 1–9 signed off, 28 Nov 2026** (Danny: nothing missing from the brief). Latest commits: Stage 7 fixes db312d3, Stage 8 audit and fixes 72a9c13. Every decision is in `DECISIONS.md`, every answer of Danny's in `PLAN.md` › Q&A (Q1–Q32), every bug in `BUGS.md` (none open from the new app), every change in `CHANGELOG.md`. Question pages and demos are linked from `PLAN.md` and `CHECKLIST.md`. What touches the REACH ecosystem is written up for the REACH chat in `docs/reach-notes.md`.

## Known limits
- **No shared server yet (REACH SD2).** Each computer has its own copy and its own passwords and PINs; nothing syncs between computers in real use (the sync light stays grey). Sync, EDP entries in Activity, requests reaching a doctor's own computer and backups off this computer are built and tested with a stand-in server, and get tested again when REACH decides the server. Release 1 can't go to the nurses before that.
- **Installers:** not signed. Macs warn "unidentified developer" until Danny makes a Developer ID certificate; Windows warns "unknown publisher" without a paid certificate. The Windows installer has not been run yet. Both use Electron's default icon until REACH has one.
- **Two computers offline:** stock dispensed on both can go below zero; it is shown in red until counted (Q27). If both leave nobody at Manage level, the program gives Manage back automatically and says so on Home (B48).
- **PINs and passwords:** 5 wrong PINs pause PIN approval for that doctor for 15 minutes on that computer (B46). There is no lock-out after wrong passwords; anyone with the computer can read its data folder anyway.
- **A restore** sets records back with new changes (Q32 = B): nothing is deleted, every log entry stays; register lines and stock takes made after the backup stay (they can never be removed), so the register may then differ from the shelves until a doctor corrects it.
- **The real Excel lists** load only once the medics fix the must-fix rows: 24 in the Store file, 53 in the bags file. Most of the new ones since Stage 7 are counts written with a unit, like "2 pkt" (52 in the bags); the check doesn't guess (Danny may prefer reading "2 pkt" as 2: to ask).
- **Store versions:** messages from a computer still running an older version are not reshaped; until the server exists, update every computer together.
- **Activity:** people from other apps show by their ID until the people lists are joined (REACH R2).
- **Your own older copy** (used before F5–F15): it keeps its data; base settings, departments, courses, professions and the doctors' list have to be set in Settings once; new DEMO lines appear only in a new, empty program. The expiry box follows the Mac's date order (the date is written out under it).
- **Git history** still contains the June app with the real stock list and staff names (Q1: Danny chose to leave it). `imports/` (company SOPs from the REACH chat) and installers are git-ignored.

## Next steps
1. **Danny:** make a "Developer ID Application" certificate (Apple Developer portal › Certificates, Identifiers & Profiles); try `REACH Medical Suite Setup 0.1.0.exe` once on a Windows computer.
2. **REACH chat:** decide where the shared server runs (SD2 / EDP Q44), and read `docs/reach-notes.md` (Core People fields, countries, readable numbers, restore rule). Release 1 goes to the nurses after the server.
3. **Medics:** fix the must-fix rows in the two Excel files; then Manage level loads them (Settings › Backup and import) and the Head Doctor confirms the controlled drugs.
4. **Later parts**, each through its own stages: the roster F16 (release 2), EDP's "used on a case" F17 (needs EDP F79 and the server), Patient Archive, Calendar, Library, SOPs.

## Machine notes
- The Xcode licence must be accepted (`sudo xcodebuild -license`, Danny's password) before plain `git` and `python3` work on this Mac; until then use `DEVELOPER_DIR=/Library/Developer/CommandLineTools git …`.
- The Claude app's preview server can't read `~/Documents`: serve a copy from the scratchpad.
- Commit only when Danny asks; then push (SSH key in `~/.ssh/config`). Never commit `imports/`, `data/`, spreadsheets or backups.
