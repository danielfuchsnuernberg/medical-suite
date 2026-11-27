# CHANGELOG — REACH Medical Suite

## 2026-11-27 — Stage 5 signed off
- Danny on the Stage 5 page: look Right, overall GO. `ARCHITECTURE.md` target and the six Stage 5 rows in `DECISIONS.md` are now APPROVED.
- Next: Stage 6, feature by feature from F1; the server location goes to the REACH chat before release 1.

## 2026-11-27 — Stage 5: look and structure proposed
- Page https://claude.ai/artifact/CDkrByh9ypq4YXu4sN7vBj (`docs/stage5/medical-suite-blueprint.html`): the June tokens, type and spacing; 12 building blocks in 7 states; four layers with one store door; folders; data shapes with the REACH stamps; how changes travel and the two-computer rules; Electron for the program; tools pinned to EDP's versions; three outside dependencies (server, shared REACH code, accounts).
- `ARCHITECTURE.md` now starts with the target design (PROPOSED); the June description stays below as reference. `DECISIONS.md`: six PROPOSED rows.
- Checked on the page: 103 of 103 checklist lines and 12 of 12 REACH rules have a place.

## 2026-11-27 — Lined up with REACH Core (Stage 5)
- Danny's answers on the alignment page: all five points yes; Q20 = A (View / Work / Manage); Q21 = A (the program is “REACH Medical Suite”, Inventory = MD1).
- Master Checklist changed to match (now 22 blocks, 103 lines): ALL.4 (moments in UTC, calendar dates plain), ALL.8 (name), new ALL.9 (follow REACH Core), F2 levels and the 24-hour delete rule, log and backup shapes, own people list in the Core shape, new later parts F19 Calendar, F20 Medical Library, F21 SOPs. Page version 3: https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7.
- `CLAUDE.md`: new name, and the REACH section asked for by REACH Q12. `DECISIONS.md`: six rows.
- My slip while editing, caught by the count check and fixed: the shell swallowed a file path in ALL.9 and the F18 status line was dropped; repaired with a script file.

## 2026-11-27 — Stage 5 started: lining up with REACH Core
- Public GitHub Pages site checked: now 404 (the June copy with real stock is gone).
- Read EDP's architecture and the REACH project's Core data rules (agreed 27 Nov). Five differences from Stage 4 found and shown on https://claude.ai/artifact/S65PV6inHY3UG8h87fo3sz (`docs/stage5/reach-core-alignment.html`), with Q20 (levels) and Q21 (name and parts). Nothing changed yet in the feature list or checklist.
- Noted: an `imports/` folder from the REACH chat (medics' checklist, roster style guide, SOP PDFs) sits uncommitted in this repo; left untouched.

## 2026-11-27 — Stage 4 signed off
- Danny in chat: “Yes, sign off Stage 4.” Approved: feature list F1–F18, demo batches 1–4, Master Checklist (99 lines; roster under “later”).
- Decisions made in this stage: Q12 A, Q13 A, Q14 A, Q15 A, Q16 B, Q17 B, Q19 A; Q18 parked with the roster. All in `DECISIONS.md`.
- Next: Stage 5 (look and structure), after Danny's GO.

## 2026-11-27 — Roster moved to “later” in the Master Checklist
- Danny in chat: “Roster I would tackle later.” F16 now sits with F17 and F18 under “Later (own stages)”, status ⚪ later; its decided lines stay. Page version 2.
- The page's answer store was still empty when this was done; Stage 4 waits for Danny's answer on the rest.

## 2026-11-27 — Master Checklist (Stage 4 part 3)
- `CHECKLIST.md` › Master Feature Checklist: rules for every feature (ALL) plus one block per feature F1–F18, 99 testable lines, each with its source (June bug, answer, Danny's words, or demo).
- Coverage checked by script: 18 of 18 features, 26 of 26 June bugs, every answer that shapes the app.
- Review page: https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7 (`docs/stage4/master-checklist.html`), generated from `CHECKLIST.md` by `docs/stage4/master-checklist-build/` so the two can't drift apart.

## 2026-11-27 — Batch 4 approved; all four demo batches done
- Danny approved demo batch 4. Q17 = B (everyone archives stock, Managers/Admins delete it for good, people Admin-only); Q19 = A (Managers and Admins change the roster).
- Q18 "Not sure" with the note that the roster follows another set of rules not started yet → parked: F16 stays in release 2 and gets its own stages first.
- Next: Stage 4 part 3, the Master Checklist.

## 2026-11-27 — Demo batch 4 (F14, F15, F16, F5, F4) and questions Q17–Q19
- New page: https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL (`docs/stage4/demo-batch4-people.html`).
- F14 staff from the shared REACH people list; archived staff never counted (B26). F15 renew expired certificates (B20); 31 Jan + 1 month = end of Feb (B26). F16 duty roster with "What EDP's dispatcher sees" at a chosen time. F5 country settings (base, country, time zone, date style, shift times), date check against the June UTC slip (B13), department in use by archived staff can't be deleted (B21), icu → ICU rename allowed (B24 part), styled boxes (B8). F4 one log for Inventory, People, Settings and EDP, old → new (B19), deletes marked (B18), read-only.
- Questions inside the page, each changing the demo: Q17 who may archive and delete (proposed B), Q18 what a roster entry looks like (proposed A), Q19 who may change the roster (proposed A).
- My own slips found in testing and fixed before publishing: a delete entry showed "null → null"; settings changes were filed under Inventory (now their own SETTINGS tag and filter).

## 2026-11-27 — Batch 3 approved; ✕ to remove a doctor's right
- Danny approved demo batch 3 (F10–F13 and overall Right, all 23 checks seen).
- His F12 note (how to remove someone from the doctors' list) → page version 2: a doctor removes the right with ✕, logged and all doctors told; the last doctor can't be removed. Tested: nurse sees no ✕, doctor does, last-doctor guard holds. Also fixed: the “Dr” title now follows the job, so old register lines keep the doctor's name when a right is removed.

## 2026-11-27 — Demo batch 3 (F10, F11, F12, F13)
- New page: https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc (`docs/stage4/demo-batch3-records.html`). You can switch who is signed in (nurse, doctor, Admin).
- F10 count: typed counts survive search and location switches; empty = not counted; leaving asks; bad numbers refused (B16). Proposed in the demo: two counts that disagree → the later one is used, both kept, flagged for checking.
- F11 stock takes: freeze, then vs now, CSV export, survive a new version.
- F12 register on Q8 + Q13–Q16: ask a doctor or doctor's PIN in the room; emergency booked red until approved; witness always a second person; Admin can't approve or change who may; corrections instead of edits; only a doctor gives the right, never to themselves. My reading, shown on the page: receiving needs a witness but no doctor (the rule is about taking out).
- F13: nightly server backups, file export, import refuses a backup with no stock or no people (B15), restore with preview, tick and an automatic backup first, screens update at once (B2); the Excel list shows bad dates, doubles and spacing before loading (B6); real stock only via import (B9).

## 2026-11-27 — Q13–Q16 answered (controlled drugs)
- Q13 A: doctor approves in the room (own PIN) or from their own device. Q14 A: emergency allowed, flagged until a doctor approves. Q15 A: doctor and witness both on every line. Q16 B: only doctors give the doctor right, never to themselves; Admins can't. Logged in `PLAN.md` › Q&A and `DECISIONS.md`. These shape the F12 demo in batch 3.

## 2026-11-27 — Batch 2 approved; controlled-drug rule and questions Q13–Q16
- Danny approved demo batch 2 (F9 and overall Right; all 16 checks set off by him).
- His note becomes a rule for F12: only a doctor takes out a controlled drug or approves someone else taking it out; Admin has no right here (`PLAN.md` › Additional thoughts).
- His question (how does the doctor know and approve?) opened Q13–Q16, asked on https://claude.ai/artifact/LDwa4rB2grPCRgQv5aHFC8 (`docs/stage4/controlled-drug-questions.html`, answers in its `cdq` collection). Batch 3 waits for the answers.

## 2026-11-27 — Demo batch 2 (F6, F7, F8, F9)
- New page: https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT (`docs/stage4/demo-batch2-inventory.html`). The June Overview, By-location list, item page and restock/dispense dialog, in the June look, with made-up stock.
- A "Rules: June" switch works out readiness the June way, for comparison: Bag 1 at exactly its required amounts is Ready (new) vs Short (June, B1); the Trauma kit with no required amounts is "Not set up" (new) vs Ready (June, B25); the Store gets reorder levels (B10).
- New on the item page: Move a line to another bag or the Store (B24); edits and deletes recorded with old → new. Restock/dispense refuses 0, negatives, decimals and empty with a message (B17); controlled drugs point to the register (batch 3).
- My own slip found in testing and fixed before publishing: Edit and CSV wrote dates in world time (UTC), the same mistake as June bug B13. Now local dates only.
- Noted for batch 4: which roles may archive and delete.

## 2026-11-27 — Demo batch 1 (F1, F2, F3)
- **Approved by Danny** (27 Nov, 01:25): F1, F2, F3 and overall Right, no notes. The page recorded which checks he set off himself: 4 of 12 (B12 Settings locked for Staff, B5 phone menu, B7 overnight date, B3 new version keeps data).
- New page: https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 (`docs/stage4/demo-batch1-foundation.html`). One working demo app in the June look (June colours and layout, light, as in June), made-up people and stock.
- What you can try: the phone menu (B5), plain-text search (B4), the date moving on overnight (B7); sign-in with roles, no "Acting as" (B12), no archiving yourself (B23), last Admin protected (B14); offline changes queued and sent, two computers' changes both kept, opening with no internet, first sign-in on a new computer needs internet once, a failed save shown (B22), a new version keeps the data (B3).
- Each feature has steps, self-ticking checks and a "how to use it in the real app" guide.

## 2026-11-27 — Feature list approved
- Danny on the Stage 4 page: all four parts Right, overall "Yes, that's it", no notes. The F1–F18 list in `PLAN.md` is now fixed.
- Q12 = A: release 1 = F1–F15; release 2 = the roster (F16), together with EDP reading it.
- His first try saved nothing (the page's answer store was empty); the second time all 6 answers arrived.

## 2026-11-27 — Stage 4 started: feature list draft
- New page: https://claude.ai/artifact/AKdfUCwrTn4bZ56tqzQA5F (`docs/stage4/reach-inventory-features.html`). 18 features (F1–F18) placed in the June app's window, with the June source, the bug rules and the demo batch for each. F17 and F18 are "later", so they get no demo now.
- `PLAN.md`: the June features were renamed **J1–J14** (they were F1–F14), so they can't be confused with the new F-numbers. The 26 Nov conformance table below still uses the old names: its June F1 = J1, and so on.
- New question **Q12**: what goes into the first release. Proposed A: F1–F15 in release 1, and the roster F16 in release 2 together with EDP reading it.

## 2026-11-26 — Stage 3 signed off
- Danny answered every part on the Stage 3 page: Right, overall "sounds good" (log in `PLAN.md` › Stage 3 answers).
- Three corrections applied to the page (version 3) and the files: the duty roster lives in this app and EDP reads it (EDP has no roster function); the program starts with no internet; Patients = one Patient File per patient in a Patient Archive (later).

## 2026-11-26 — Conformance table: June Medical Suite → new app (reference: the archived June app)
Danny: "The UI is good. But you are doing the underneath leg work." The June screens are the UI; the rebuild is underneath. The same table is on the Stage 3 page, part "From the June app".

| June | Feature | Status | In the new app |
|---|---|---|---|
| F1 | Shell: side menu, Home cards, global search | **PORTED** | same, and working on small screens (B5) |
| F1 | "Acting as" switcher | **CHANGED** | real sign-in per person (B12, B23) |
| F2 | Personnel: directory, profile, add, edit, archive | **CHANGED** | same screens; people come from the shared REACH list (Q6 = C) |
| F3 | Training and courses, expiry badges | **PORTED** | expired certificates renewable (B20) |
| F4 | Inventory overview | **PORTED** | readiness fixed (B1, B25); Store reorder levels (B10) |
| F5 | Inventory by location: filters, sort, CSV export | **PORTED** | unchanged |
| F6 | Item page | **PORTED** | lines movable (B24); deletes logged (B18) |
| F7 | Restock / Dispense | **PORTED** | wrong amounts refused with a message (B17) |
| F8 | Count stock | **PORTED** | counts kept; empty = not counted (B16) |
| F9 | Stock takes | **PORTED** | stored on the server (B3) |
| F10 | Settings | **PORTED** | plus country settings |
| F11 | Backup export / import | **CHANGED** | server keeps data and backups; file export stays; import (backup or Excel) previews and asks first (B2, B15) |
| F12 | Activity log | **CHANGED** | one REACH-wide log, old → new (B19) |
| F13 | Dispatch hook `applyDispense()` | **CHANGED** | EDP "used on a case" message (EDP F79), later; never below zero silently (B11) |
| F14 | Patient Archive placeholder | **CHANGED** | later part of this app, stricter access: one Patient File per patient (from EDP or by hand), kept in the Patient Archive |
| F14 | Roster placeholder | **CHANGED** | the real duty roster, kept in this app; EDP reads who is on duty (corrected after Stage 3) |
| F14 | Dispatch placeholder | **DROPPED** | → EDP |
| F14 | Calendar, Library placeholders | **DROPPED** | → shared REACH tools, to decide (PLAN.md › Belongs elsewhere) |
| — | Controlled-drug register | **NEW** | Q8 |

## 2026-11-26 — Stage 3 page
- Stage 2 signed off (Danny: "Yes, start Stage 3").
- New page `docs/stage3/reach-inventory-blueprint.html`, published at https://claude.ai/artifact/LcTfsHesU2Jap8q6ajrB6E: the whole new app part by part (devices and server, menu, shared people list, offline day, EDP "used on a case", controlled-drug register, the 26 June bugs as 9 rules, country settings, what is not in this app). Example data only.

## 2026-11-26 — Last open questions answered
- Q6 = C: one medical app for nurses and doctors; people, sign-in and roster shared with EDP.
- Q4 = B, straight to the real program: installed Mac and Windows programs from the same code as EDP, outside the App Store.
- All 11 questions now answered; Stage 2 waits for Danny's confirmation.

## 2026-11-26 — June prototype archived; new app to be built from scratch
- Danny: nobody uses the June app; build one real app properly, server later, connected to the REACH family.
- Bug hunt: 26 bugs (two independent passes, all reproduced) in `BUGS.md`; all become rules for the new app, no patches.
- Newest real data found: the Downloads bag check list (counts to May 2026) is newer than what the June app contained (March).
- Archived to iCloud › AI Projects › REACH Inventory: 26 files (source data + archive, README). Old folder and Dock app → Trash.
- `index.html` (the June app with real data) removed from the repo. Git history left as is (Q1).
- Danny's answers Q1–Q11 logged in `PLAN.md`.

## 2026-11-26 — Brought into Claude Code
- Found the newest version on the Mac (see `PLAN.md` › "Which version was taken") and cloned the GitHub repo to `~/Documents/GitHub/medical-suite`.
- Added the rule-book files, `CLAUDE.md` and `.gitignore` (keeps out real data, secrets and build output).
- Copied the prototype's design notes from iCloud into `docs/foundation/`.
- Stock-take written down (`ARCHITECTURE.md`, `BUGS.md`, `AUDIT.md`). **The app itself (`index.html`) is unchanged.**
- Not committed yet: waiting for Danny.

## 2026-06-26 — Prototype (before Claude Code)
- "Medical Suite" built in claude.ai chats: shell, Personnel, then Inventory with the real stock list imported from `Stock Take 2026.xlsx` / `Medevac Bag Check List.xlsx`. Uploaded to GitHub by web upload (3 commits).
