# CHECKLIST — REACH Medical Suite
**Now:** Workflow B · A1–A6 built, tested, committed (28 Nov) · A9 restock rights next (round 2: GO given; answers 3 and 4 did not arrive on the page) on https://claude.ai/artifact/SMKox2VzjdMtXexbohYv4q; the A8 plan review (https://claude.ai/artifact/Cy5EPGd4HDZ8uCQa7kGb5Z); commit when he asks; his B60 steps; the server (REACH SD2)

### STEP 6 — Requests A1–A8: wait for approval (Workflow B, 28 Nov 2026)
**Goal:** Danny answers the questions on A1–A7, reviews the A8 plan, and says GO before anything is built.
**Checklist:**
- [x] Steps 1–2: all eight requests read and checked against the code (Icon.jsx, Sidebar.jsx, App.jsx, menu.ts, styles, Staff.jsx, the importer run on the two real files: counts only, nothing copied into the project)
- [x] Step 3: written down as B70–B77 in `BUGS.md`
- [x] Step 4: order planned (`BUGS.md` › B70–B77, “Order planned”)
- [x] Step 5: shown: questions page (9 questions, live pictures, proposed answers, GO button; tested: every answer redraws its picture, 0 errors) and the A8 plan page (6 sections, three hand-over lists)
- [x] Step 6: Danny's answers and GO ✅ 28 Nov: all nine A, GO (Q33–Q41). New the same day: A9 restock rights (B78) and real people in the trial (Q42): round 2 shown, waiting
**Tests for this stage:**
- [x] Both pages open with 0 console errors; every question has a picture for every answer
- [x] Danny's answers read back from the page (`requests` collection, version 37) and logged in `PLAN.md` › Q&A
**Status:** 🟡 IN PROGRESS
**Open questions:** none for A1–A7 (answered 28 Nov); A8 review open
**Status:** 🟢 GO given (28 Nov 2026)

### STEP 7–10 — Requests A1–A6: build, test, audit, files (Workflow B, 28 Nov 2026)
**Goal:** build what Danny approved (Q35–Q41 = A), each with a test that fails without it.
**Checklist:**
- [x] B70 (A1) icons: one Lucide family (ISC, notice kept in the built program), a gear for Settings, 12 different menu icons. ✅ requests.spec › B70 + unit test (menu icons distinct)
- [x] B72 (A3) the look: teal #0E7490, plain-case labels, 14 px body, no bar beside the menu entry, “Later” tags; every drop-down shaped like the text boxes, its open list drawn by the program (click, arrows, Space, Enter, letters, Escape). ✅ requests.spec › B72
- [x] B71 (A2) sidebar: drag 180–320 px, double-click 220, fold to 56 px icons (names on pointing), ⌘\ / Ctrl+\, remembered on this computer. ✅ requests.spec › B71
- [x] B73 (A4) Back: to where you came from, named, filters and scroll kept, ⌘[ / Alt+←; the menu starts afresh; typed counts ask first. ✅ requests.spec › B73 ×2
- [x] B75 (A6) Head Doctor mark on the profile (with who named them and when) and in the staff list. ✅ requests.spec › B75
- [x] B74 (A5) Item list: F22 above. ✅
- [x] Full test pass (unit + program) recorded ✅ 28 Nov: 188 of 188 unit, 113 of 113 program
- [x] Each fix undone on its own makes its test fail ✅ 10 of 10
- [x] Audit: diff touches only the planned files (AUDIT.md) ✅ (plus 6 screenshots the tests redraw)
- [x] Files: BUGS, CHANGELOG, DECISIONS, HANDOVER, reach-notes (F53) ✅
**Not in this step:** A7 real-data trial (waits for round 2: Q42, and A9 comes first), A9 restock rights (waits for round-2 answers and GO), A8 (Danny's review).
**Status:** 🟢 DONE (28 Nov 2026), committed on Danny's word

### ARCHIVE — clear away the June prototype (26 Nov 2026)
**Goal:** only the new app is left in sight; nothing is lost.
**Plan (dry run printed, waiting for Danny's OK):**
- New iCloud folder `AI Projects › REACH Inventory` replaces `AI Projects › Medical Suite`:
  - `Source data (real)` ← Stock Take 2026.xlsx (iCloud; the only version) and **Medevac Bag Check List.xlsx from Downloads** (the newest: counts through May 2026)
  - `Archive – June 2026 prototype` ← medical-suite.html, medical-suite copy.html, Foundation (3 files), the older Medevac Bag Check List.xlsx from iCloud (counts through Mar/Apr), and from Downloads: 16 medical-suite*.html, medical-suite-backup-2026-06-25.json, inventory-store-2026-06-26.csv
- Trash (recoverable): an empty sub-folder, the Dock app `~/Applications/Medical Suite.app`
- GitHub: remove `index.html` (identical to the archived medical-suite.html, md5 b065284d…). The public page stops showing real data.
- Separate yes/no: rewrite GitHub's history so the old copies disappear there too (force-push).
**Tests:** file counts before = after; md5 of each moved file unchanged; live page no longer shows the stock list.
- [x] Danny's OK in chat (26 Nov 2026): "yes, archive everything we don't need anymore"
- [x] 26 files moved, 0 failures; 26 of 26 fingerprints identical before and after
- [x] README.txt written in iCloud › AI Projects › REACH Inventory
- [x] Old "Medical Suite" folder (only .DS_Store and an empty sub-folder left) and the Dock app → Trash
- [x] `index.html` removed from the repo, pushed
- [x] Live page checked after GitHub Pages rebuilds ✅ 28 Nov 2026: https://danielfuchsnuernberg.github.io/medical-suite/ answers 404 (the June app and its stock list are gone from the live site)
  - 27 Nov 2026, checked after push 6417723: https://danielfuchsnuernberg.github.io/medical-suite/ still answers 200 with the June app (last-modified 25 Nov 15:26, contains the stock list). Pages isn't rebuilding: a file pushed today returns 404. **Only fix: Danny unpublishes the site** (GitHub › medical-suite › Settings › Pages › Unpublish site, or Source: None).
- History rewrite: **not done** (Q1 = leave)
**Status:** 🟢 DONE (28 Nov 2026)

### STEP 6 — Bug hunt (Workflow B) — closed 26 Nov 2026
Danny: nobody uses the June app, so no patches. All 26 bugs are rules for the new app (`BUGS.md`).

### STEP 6 — Bug hunt: wait for approval (Workflow B, 26 Nov 2026)
**Goal:** Danny decides which prototype bugs get patched now; the rest become rebuild rules.
**Checklist:**
- [x] Steps 1–3: all bugs read, reproduced, written into `BUGS.md` (B1–B26 + data list)
- [x] Step 4: fix order planned (`BUGS.md` › Fix order)
- [x] Step 5: before/after shown (page, tab 2)
- [x] Step 6: Danny's GO, and Q11 answered (is the June app in real use?) ✅ 26 Nov: “No one uses the app or webpage” (Q11): no patches; all 26 bugs became rules for the new app
**Status:** 🟢 CLOSED (26 Nov 2026; ticked 28 Nov)
**Open questions:** none (Q1 = leave history, Q11 = not in use, Q2–Q10 answered in Stage 2)

### STAGE 1 — Plan Mode
**Goal:** the brief is captured verbatim and the existing app is fully stock-taken.
**Checklist:**
- [x] Newest version found on the Mac and the project set up in `~/Documents/GitHub/medical-suite` (git repo, cloned)
- [x] `.gitignore` keeps out real data, secrets and build output
- [x] Rule-book files + `CLAUDE.md` created
- [x] Brief written verbatim into `PLAN.md`
- [x] Stock-take: every line read, app run, measurements recorded (`ARCHITECTURE.md`, `BUGS.md`, `AUDIT.md`)
- [x] Stock-take shown visually (map: green / amber / red)
- [x] Danny confirms nothing is missing from the brief ✅ 28 Nov 2026: “Nothing missing”
**Tests for this stage:**
- [x] Live page, repo and iCloud file have the same md5 (b065284d…)
- [x] App opens with 0 console errors; every Inventory action tried once on a copy
- [x] Ignored paths checked with `git check-ignore`
**Status:** 🟢 SIGNED OFF (28 Nov 2026)
**Open questions:** none for this stage (Q1–Q10 belong to Stage 2)

### STAGE 2 — Q&A
**Goal:** zero open questions.
**Checklist:**
- [x] Q1–Q10 asked on the illustrated questions page
- [x] Danny's answers logged in `PLAN.md` › Q&A (Q1–Q11)
- [x] Follow-up questions asked and answered: Q6 → C (26 Nov), Q4 → B, straight to the real Mac/Windows program (26 Nov)
- [x] Danny confirms there are no open questions left (26 Nov: "Yes, start Stage 3")
**Tests for this stage:**
- [x] Every row in the Q&A table has an answer (11 of 11, checked 26 Nov)
**Status:** 🟢 SIGNED OFF (26 Nov 2026)
**Open questions:** none

### STAGE 3 — Explain It Back
**Goal:** Danny sees the whole new app as one picture and says "yes, that's it".
**Checklist:**
- [x] One page shows: who uses it on which device; the screens (menu sections); what is shared with EDP and how; the server and offline sync; the controlled-drug register; how the June bugs become rules
- [x] Every answer Q1–Q11 is visible on the page, and nothing on it goes beyond them (anything new = a question, back to Stage 2)
- [x] No real staff or stock data on the page (all examples marked)
- [x] Every June feature (F1–F14) shown as kept / changed / not in this app, on the page and in `CHANGELOG.md` (Danny, 26 Nov: "The UI is good. But you are doing the underneath leg work.")
- [x] Danny says "yes, that's it" (page, 26 Nov: all parts Right, overall "sounds good"; 3 corrections applied, page version 3)
**Tests for this stage:**
- [x] Each of Q1–Q11 traced to a spot on the page (table at the bottom of the page, part “Your answer”)
- [x] Page checked at desktop (1024 px) and phone width (375 px): no sideways scroll, 0 console errors; 9 rules cover all 26 bug IDs exactly once (counted in the page); June table 18 rows = 9 kept, 7 changed, 2 not in this app, same as `CHANGELOG.md`; all 12 menu items show their June line
- [x] grep: no staff names or real item counts on the page (0 hits)
**Page:** https://claude.ai/artifact/LcTfsHesU2Jap8q6ajrB6E (source `docs/stage3/reach-inventory-blueprint.html`; answers in its `stage3` collection: 11 read 26 Nov, logged in `PLAN.md`)
**Status:** 🟢 SIGNED OFF (26 Nov 2026)
**Open questions:** none

### STAGE 4 — Demo Version
**Goal:** every feature has an ID, a clickable demo on the June screens and a "how to use it"; the Master Checklist is approved.
**Checklist:**
- [x] Part 1: feature list drafted (F1–F18) and shown on a page (27 Nov 2026)
- [x] Danny approves the feature list, and answers Q12 (27 Nov: every part Right, overall "Yes, that's it"; Q12 = A)
- [x] Part 2: demo batch 1 — F1, F2, F3 (foundation), built 27 Nov: https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 (source `docs/stage4/demo-batch1-foundation.html`, answers in its `batch1` collection). Self-test: every step played through in the browser, all 12 checks ticked (F1 3/3, F2 3/3, F3 6/6); 1280 px and 375 px, no sideways scroll, 0 console errors; no real names (checked against the June staff list)
- [x] Demo batch 2 — F6, F7, F8, F9, built 27 Nov: https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT (source `docs/stage4/demo-batch2-inventory.html`, answers in its `batch2` collection). Self-test: all 14 checks set off in the browser (F6 3, F7 3, F8 4, F9 4); found and fixed my own UTC date slip in Edit and CSV (the B13 kind); 1280 px and 375 px, no sideways scroll, 0 console errors; no real names
- [x] Q13–Q16 answered 27 Nov (A, A, A, B: all as proposed)
- [x] Demo batch 3 — F10, F11, F12, F13, built 27 Nov: https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc (source `docs/stage4/demo-batch3-records.html`, answers in its `batch3` collection). Self-test: all 23 checks set off in the browser (F10 4, F11 4, F12 9, F13 6); one wording slip fixed (correction line said “took it out personally”); 1280 px and 375 px, no sideways scroll, 0 console errors; no real names; no UTC dates
- [x] Demo batch 4 — F14, F15, F16, F5, F4, built 27 Nov: https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL (source `docs/stage4/demo-batch4-people.html`, answers and Q17–Q19 in its `batch4` collection). Self-test: all 15 checks set off (F14 4, F15 2, F16 2, F5 4, F4 3); Q17–Q19 options change the demo; fixed my own slips (log showed “null → null”, settings changes filed under Inventory); 1280 px and 375 px, no sideways scroll, 0 console errors; no real names
- [x] Q17–Q19 answered 27 Nov: Q17 B, Q19 A; Q18 parked until the roster gets its own stages (Danny: it follows another set of rules)
- [x] Each batch approved by Danny (all four, 27 Nov) — batch 4: ✅ 27 Nov (F14, F16, F4, overall Right; 14 of 15 checks seen; F16 approved as the idea, details later) · batch 1: ✅ 27 Nov (F1, F2, F3 and overall Right, no notes; the page recorded 4 of 12 checks seen by him: B12, B5, B7, B3) · batch 3: ✅ 27 Nov (all Right; all 23 checks seen; ✕ to remove a doctor's right added on his note, page version 2) · batch 2: ✅ 27 Nov (F9 and overall Right; F6–F8 strips not ticked separately; he set off all 16 checks; note on controlled drugs → Q13–Q16)
- [x] Part 3: Master Checklist in this file, one block per feature; every B1–B26 is a test (27 Nov: 19 blocks incl. ALL, 99 lines; page https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7, built from this file by `docs/stage4/master-checklist-build/build.js`, answers in its `master` collection)
- [x] Danny approves the Master Checklist (27 Nov, in chat: “Yes, sign off Stage 4”; roster moved to later on his note “Roster I would tackle later.”)
**Tests for this stage:**
- [x] Page counts: 14 of 14 June features have a home; 26 of 26 bugs sit with exactly one feature; 18 rows in the table (checked 27 Nov in the browser)
- [x] Page checked at 1100 px and 375 px: no sideways scroll, 0 console errors; no real stock or staff data (grep 0 hits)
- [x] Every demo opens with 0 console errors and uses made-up data only (batches 1–4 and the Q13–Q16 page: checked in the browser at desktop and 375 px; each page grepped against the June staff names: 0 hits)
- [x] Every Master Checklist block traces to a feature ID, and every bug ID appears in it (script count 27 Nov: 18 of 18 features, 26 of 26 bugs, Q3–Q10 and Q13–Q19 all referenced, 99 line IDs, no duplicates; page shows the same counts; 1200 px and 375 px, 0 console errors)
**Page (part 1):** https://claude.ai/artifact/AKdfUCwrTn4bZ56tqzQA5F (source `docs/stage4/reach-inventory-features.html`; answers in its `stage4` collection)
**Status:** 🟢 SIGNED OFF (27 Nov 2026)
**Open questions:** none (Q18 parked with F16, later)

### STAGE 5 — UI / Architecture
**Goal:** the look (June UI as a component list with states) and the structure (folders, modules, data model, store door, server and desktop path) are shown, written into ARCHITECTURE.md and DECISIONS.md, and approved.
**Checklist:**
- [x] Read EDP's architecture and the REACH project's agreed Core rules (27 Nov)
- [x] Line up with REACH Core: deleting, levels (Q20), people list, times, name and parts (Q21), REACH line in CLAUDE.md (27 Nov: all yes, Q20 A, Q21 A) — page https://claude.ai/artifact/S65PV6inHY3UG8h87fo3sz
- [x] Feature list, Master Checklist and CLAUDE.md updated to the answers (27 Nov)
- [x] UI: tokens, type, spacing, layout, component list, empty / loading / error states — shown visually (https://claude.ai/artifact/CDkrByh9ypq4YXu4sN7vBj, 12 building blocks × 7 states)
- [x] Architecture: folders, modules, data model (Core shape), store door, offline queue, change log, dependencies with versions; real alternatives named — shown visually (same page)
- [x] ARCHITECTURE.md and DECISIONS.md written (marked PROPOSED until GO)
- [x] Danny approves UI and architecture (GO) — 27 Nov 2026, on the page: look Right, overall GO; other parts not ticked separately
**Tests for this stage:**
- [x] Every Master Checklist line maps to a module in the architecture (page count: 103 of 103)
- [x] Every REACH Core rule R1–R12 maps to a place in the architecture (12 of 12)
**Status:** 🟢 SIGNED OFF (27 Nov 2026)
**Open questions:** the doctor-only controlled-drug tick (Danny's new idea, 28 Nov; Workflow B, shown before building); Q26 answered: A, A, A; server location goes to the REACH chat (SD2 / EDP Q44)

### STAGE 6 — Execution
**Goal:** build F1 → F15 in the order of the Master Checklist; each feature is built, then every one of its lines is proven by a test that can fail, then Danny tries it.
**Checklist:**
- [x] Workspace set up as approved in Stage 5: npm workspaces, `packages/core` (TypeScript), `packages/store` (stub until F3), `apps/desktop` (React 18.3.1, Vite 5.4.21, Electron 45.5.0), Vitest 3.2.4, Playwright 1.65.1 (27 Nov)
- [x] F1 window, menu and search: built, 5 of 5 lines tested in the real program (27 Nov)
- [x] F3 works without internet (the store door): built, 7 of 7 lines tested in the real program; built before F2 (Danny, 27 Nov) — the server parts are proven against a stand-in server until REACH decides the real one
- [x] F2 sign-in and levels: built, 8 of 8 lines tested in the real program (28 Nov); Q22 = A. The parts that need the server (one REACH account shared with EDP; “first sign-in needs internet”) wait for REACH SD2
- [x] F4 activity log: built, 4 of 4 lines tested in the real program (28 Nov); EDP's part proven with the stand-in server until EDP is joined (SD2)
- [x] F5 settings: built, 7 of 7 lines tested in the real program (28 Nov); Q23 = C
- [x] F6 overview: built, 4 of 4 lines tested in the real program (28 Nov); the cards open a first version of Store and bags (F7 adds its filters, sort and CSV)
- [x] F7 Store and bags: built, 3 of 3 lines tested in the real program (28 Nov); a row opens a stand-in item page until F8 fills it in
- [x] F8 item page: built, 5 of 5 lines tested in the real program (28 Nov); Q24 = C applied
- [x] F9 restock and dispense: built, 4 of 4 lines tested in the real program (28 Nov); controlled drugs: + and − both lead to the register (Q8, F12.9), and their amount can't be edited or moved outside it (gap left in F8, closed)
- [x] (F12, before building) Q25: does moving a controlled drug between places need its own register line? ✅ 28 Nov: A (a “Moved” line with a witness, no doctor)
- [x] F10 count a bag: built, 4 of 4 lines tested in the real program (28 Nov); controlled drugs are shown but counted in the register (F12)
- [x] F11 stock takes: built, 4 of 4 lines tested in the real program (28 Nov); the server part proven with the stand-in server until REACH SD2
- [x] F12 controlled-drug register: built, 11 of 11 lines tested in the real program (28 Nov); a request reaches the doctor on any synced computer (stand-in server until REACH SD2)
- [x] F13 backup and import: built, 8 of 8 lines tested in the real program (28 Nov); loading the Excel lists done (Q26 = A, A, A); nightly backups on this computer until the server (SD2)
- [x] F14 staff (28 Nov) · [x] F15 training (28 Nov)
**Tests for this stage:**
- [x] Unit tests: `npx vitest run` → 181 of 181 pass (28 Nov, after the Stage 8 fixes)
- [x] Program tests: `npx playwright test` → 105 of 105 pass (F1 5, F2 8, F3 7, F4 4, F5 7, F6 4, F7 3, F8 5, F9 4, F10 6, F11 4, F12 16, F13 9, F14 6, F15 6, Stage 7 4, Stage 8 6, installed Mac app 1) (28 Nov)
- [x] Each program test can fail: F1.5 (date tick broken), F3.6 (a failed save pretended to work: the June B22), F3.7 (a new version threw old data away: the June B3), unit F3.4/F3.5 (movements overwritten instead of added); F2: 7 rules broken one at a time (last Manage person, archive yourself, wrong password accepted, stay signed in ignored, Settings unlocked, 24-hour delete rule, one-time password by Work level) and the new same-moment test (B27); F4: 6 rules broken one at a time (newest first, filter by app, one record's history, old → new, what was there, locked entries); F5: 8 rules broken one at a time (archived users count, case-only rename, base time zone, styled boxes, Manage only behind and on the screen, bag with stock, country proposes time zone); F6: 8 rules broken one at a time (exactly-required counted low (B1), no amount counted OK (B25), bag ignoring missing amounts, expired line still Ready, Store never saying reorder (B10), warnings opening every line, Overview not following changes, Store line without reorder level as in June); F7: 8 rules broken one at a time (category filter ignored, archived always shown, sort ignored, Clear filters leaving expiry, CSV of all lines instead of what is shown, file date from the computer in UTC (B13), row click doing nothing, spreadsheet-formula guard removed); F8: 12 rules broken one at a time (join ignoring the lot, join ignoring the expiry (unit test), new line copying the required amount, place editable in Edit, fractions accepted, duplicate item name accepted, delete after 24 hours, delete without confirm, View level seeing change buttons, movements of every item, a move saved piece by piece (unit test), an error left on the page after closing a box; Q24: always archive, never archive, archive after a part move). Two survived at first (lot, piece by piece): the tests were made stronger, then both failed; F9: 8 rules broken one at a time (0 accepted, decimals accepted, more out than is there, not logged as restock or dispense, plain dispense of a controlled drug in the store and on the screen, controlled amount editable, controlled drug movable); F10: 11 rules broken one at a time (empty saved as 0 (B16), switching place wipes counts, searching wipes counts, leaving without asking, the next person sees typed counts, a bad count saved anyway, bad box not red, result hides “not counted”, a same count reported as changed, closing the program without asking, asking with nothing typed). Two survived at first (empty saved as 0, next person): the tests were made stronger, then both failed; F11: 7 rules broken one at a time (a stock take changeable, an archived line shown as present, names not copied, file name and file dates from the computer's clock (B13), the menu not going back to the list, an ignored delete showing “what was there”); F12: 17 rules broken one at a time (Manage counting as a doctor, PIN not checked, a request coming off before approval, a refusal counting, an emergency not flagged, no red note on Home, own witness, the approving doctor as witness, Manage changing the list (survived at first: only the button was hidden; the test now tries it behind the screen), Manage seeing the give-right box, the last doctor removable, register lines changeable, a correction below 0, receiving needing a doctor, more than the balance, a move changing the balance, a missing kind guessed as an emergency); F13: 13 rules broken one at a time (more than 30 kept, no backup at opening, no data version, a backup without stock accepted, without people accepted, Restore without the tick, no copy before a restore, screens not told after a restore (B2), double spaces, lots like dates, items twice and 1900 dates not flagged, Work level restoring); Head Doctor: 13 rules broken one at a time (no medical-code step, someone else's code, Work level setting a profession, a nurse on the doctors' list, no automatic lone Head Doctor, naming a second Head Doctor keeping the first, two named both counting, no red note, Work level naming Head Doctors, Management ticking drugs, ticking without a witness, ticking without opening the register (survived at first: the test only checked words both lines share; now it checks the Opening line), unticking without a reason, the box not greyed); F13.6 loading: 10 rules broken one at a time (the oldest month loaded, the stock take not sent to the Store, a known controlled drug not waiting, a ticked row not waiting, loading offered with rows to fix (screen and store), an existing line doubled, confirmed without a witness, anyone deciding a waiting row, Work level loading); F14: 11 rules broken one at a time (archived people's emails free, emails case-sensitive, counts including archived (rules and screen), Work level changing details, archived people editable, any office accepted, archived always shown, Delete offered for old people, the menu keeping a profile open, Work level seeing Archive) — each failed; F15: 13 rules broken one at a time — 12 failed (the June month overflow, 30 days not due, expired a day late, future dates, archived people offered courses or counted (rules and screen), the store assigning to archived people, Work level managing training, the expiry not worked out again, Renew for archived people, the log saying “renewed” for a first completion); 1 survived and is harmless: the screen's own “not archived” check on Assign, because the list of courses offered to an archived person is already empty (proven by the unit mutation above), so the button still can't show when broken, then restored
**Status:** 🟢 built (28 Nov 2026): F1–F15 built, every line tested, each feature committed; Danny tries features as they land (asked after each).
**Open questions:** none

### STAGE 7 — Testing
**Goal:** try to break release 1 as a hostile engineer; every bug into `BUGS.md` and fixed through Workflow B (shown to Danny, his GO, then built); then a full test pass.
**Checklist:**
- [x] 1. Every acceptance line of F1–F15 tested in the real program (the 94 program tests, one or more per line, each shown able to fail) — re-run after the fixes ✅ 28 Nov: 98 of 98 (94 + 4 Stage 7). Changed to match the fixes, never weakened: 7 expected messages (new wording), the duplicate rows in F13.6 (same lot now), and F13.4/F13.5 run as “this computer only” (no server yet; Q30)
- [x] 2. Hostile pass (28 Nov): three independent testers, one per area (data, sync and backup · stock and register · people, settings and screens), each bug reproduced before it is reported; then my own pass on the screens (phone width, double clicks) ✅ 28 Nov: 9 + 11 + 11 reported by the testers, 2 by me; merged into 29 (some share a cause)
- [x] 3. Every reported bug checked again by me and written into `BUGS.md` (B29 onward), with symptom, cause, files and severity ✅ 28 Nov: the serious ones re-run by me (marked re-run), the rest read in the code; B29–B57
- [x] 4. Fix order and a before/after for each bug shown to Danny; his GO — shown 28 Nov: https://claude.ai/artifact/AkyM73Bj5RU7iktEmozZxc (Q27 below-zero stock, Q28 commas in amounts, Q29 required 0; then GO) ✅ 28 Nov: Q27 = A, Q28 = A, Q29 = A, GO for all 29
- [x] 5. Fixes built (Workflow B), each with a test that failed before the fix ✅ 28 Nov: 22 unit tests + 4 program tests for B29–B57 (`packages/store/test/stage7.test.ts`, the B38–B42 block in `packages/core/test/importExport.test.ts`, `tests/app/stage7.spec.mjs`); each fix undone on its own: its test failed (35 of 35)
- [x] 6. Full pass after the fixes: all unit and program tests ✅ 28 Nov: 172 of 172 unit, 98 of 98 program
**Tests for this stage:**
- [x] `BUGS.md` has no open item from the new app ✅ 28 Nov (B27–B57 closed)
- [x] The full pass after the fixes is recorded here, with counts ✅ 172 + 98, 28 Nov
**Status:** 🟢 SIGNED OFF (28 Nov 2026): every item and stage test ✅
**Open questions:** Q30 (parked until the server, SD2)

### STAGE 8 — Audit
**Goal:** confirm every Master Checklist line of release 1 (ALL, F1–F15) against the code and its test, not against memory; check the diff and the decisions log; write the result into `AUDIT.md`.
**Checklist:**
- [x] 1. Every line F1.1–F15.6 has at least one test with its ID that passes (script, not by eye) ✅ 28 Nov: 89 of 89
- [x] 2. Every line read against the code by two independent auditors (ALL and F1–F7 · F8–F15), each line with file:line, or a gap ✅ 28 Nov: 98 lines, 71 met, 26 partly (12 wait for the server, 1 placeholder), 1 not met; my re-runs confirmed the serious ones
- [x] 3. The nine ALL rules checked myself (real data, country settings, look, dates, log, plain text, Mac/Windows/phone, name, Core rules) ✅ 28 Nov: gaps in ALL.1, .2, .5, .7, .8, .9
- [x] 4. No unplanned files: every file in the repo is in the folder layout of `ARCHITECTURE.md`, or listed ✅ 28 Nov: top level as planned; inside `packages/core` grouped differently, ARCHITECTURE.md to update in Stage 9
- [x] 5. Every decision made while building is in `DECISIONS.md` ✅ 28 Nov: Q27, Q28 added
- [x] 6. Every gap found is in `BUGS.md` (or a question), not fixed without GO ✅ B58–B69 (Q31, Q32)
**Tests for this stage:**
- [x] `AUDIT.md` has the dated result with counts ✅ 28 Nov
**Status:** 🟢 SIGNED OFF (28 Nov 2026): audit done, its 12 gaps fixed after Danny's GO (Q31 = A, Q32 = B); 181 unit + 105 program tests pass; two steps of B60 are Danny's (signing, a Windows try)
**Open questions:** none

### STAGE 9 — Handover
**Goal:** a stranger, or next-session-me, can pick this up from the files alone.
**Checklist:**
- [x] `ARCHITECTURE.md`: “As built” section (folders, records, how to build, run and test) next to the approved target ✅ 28 Nov
- [x] `HANDOVER.md` rewritten: what exists, how to run (source and installers), how to test, current state, known limits, next steps ✅ 28 Nov
- [x] `CHANGELOG.md`: dated entry ✅ 28 Nov
- [x] `CHECKLIST.md` statuses final; the old archive and bug-hunt blocks closed (live page 404, Q11) ✅ 28 Nov
- [x] Every project file present and current (PLAN, CHECKLIST, ARCHITECTURE, DECISIONS, BUGS, AUDIT, CHANGELOG, HANDOVER) ✅ 28 Nov
- [x] Stage 1's last item: Danny confirms nothing is missing from the brief ✅ 28 Nov: “Nothing missing”
**Tests for this stage:**
- [x] The handover followed as a stranger would, in a fresh copy of the repo: install, unit tests, program tests ✅ 28 Nov (see AUDIT.md)
**Status:** 🟢 SIGNED OFF (28 Nov 2026)
**Open questions:** none

## Master Feature Checklist
**Approved by Danny, 27 Nov 2026 (Stage 4 signed off).** Changed the same day to line up with the REACH Core rules, on Danny's answers (Stage 5 alignment page: five points yes, Q20 = A, Q21 = A). This is the hard reference for Stages 6–8. A feature is done only when every line in its block is ✅, each proven by a test that can fail. In brackets after each line is where it comes from: a June bug (B…), an answer (Q…), Danny's own words, or the approved demo.
Status per block: 🔴 not built · 🟡 building · 🟢 built and tested. Feature list: `PLAN.md` › Target feature list.

### ALL — rules for every feature
- [x] ALL.1 No real stock, staff or patient data in the code or in Git. Real data only comes in through import (F13). (CLAUDE.md, B9) ✅ 28 Nov (Stage 8): tracked files hold DEMO data only; 574 real item names checked: 0 in Git (B58 fixed); `imports/` git-ignored; history keeps the June list (Q1)
- [x] ALL.2 Everything country-specific is a setting (F5), never written into the code. (brief, Stage 3) ✅ 28 Nov: no country in the code; the stamp and the country list come from Settings (B59)
- [x] ALL.3 The June screens and look stay; no restyle before EDP F53. (Danny, Stage 3: "The UI is good") ✅ 28 Nov: June tokens and screens (audit)
- [x] ALL.4 A **moment** (when something happened) is stored in UTC and shown in the base's local time; a **calendar date** (expiry, course done) is stored as a plain date with no time, so it can never slip a day. (R6, B13, alignment 27 Nov) ✅ 28 Nov: moments in UTC shown in base time, plain calendar dates (audit; dates tests)
- [x] ALL.5 Every change is logged with who, when and old → new (F4). (B18, B19) ✅ 28 Nov: every change is a message, logged old → new; a restore no longer cuts the log (B66)
- [x] ALL.6 Everything typed is shown as plain text, everywhere. (B4) ✅ 28 Nov: React text only; the one innerHTML is fixed icon paths (audit)
- [~] ALL.7 Works on Mac and Windows as an installed program, phone and tablet sizes included. (Q3, Q4) 🟡 28 Nov: Mac installer built and tested (B60); Windows installer built, not yet tried on Windows; phone and tablet sizes tested; signing waits for Danny's certificate
- [x] ALL.8 The program is called “REACH Medical Suite” (REACH code MD); Inventory is its first part (MD1). The name is a setting until the common REACH look (EDP F53). (Q21 = A, REACH D4) ✅ 28 Nov: the name is a setting (B61)
- [x] ALL.9 Follows the REACH Core data rules (`../reach/CORE-DATA.md`): one store door, hidden random IDs plus readable numbers, the same stamps on every record (created / changed by and when, country), Active or Archived, changes sent as messages with their own ID. (REACH R4, R7, R8) ✅ 28 Nov: one store door, random IDs plus readable numbers (B62), stamps with the base's country (B59), Active/Archived, messages (audit)
**Status:** 🟢 8 of 9 met (28 Nov 2026, Stage 8); ALL.7 waits for Danny's two steps (signing, a Windows try)

### F1 — Program window, menu and search · release 1 · June J1 · demo batch 1
- [x] F1.1 Menu as in the June app: Home; Inventory (Overview, Store and bags, Item list, Count a bag, Stock takes, Controlled drugs, Activity); Team (Staff and training, Roster); Later (Patients); Settings at the bottom. Home has a card per section. (demo 1) ✅ 27 Nov: tests/app/f1-shell.spec.mjs › F1.1
- [x] F1.2 Below 720 px wide the menu sits behind ☰; it opens, closes, and every screen can be reached. No sideways scroll at 375 px. (B5) ✅ 27 Nov: › F1.2 (375 px window, drawer, every screen, no sideways scroll)
- [x] F1.3 Text with quotes, `<b>` or script tags shows as plain text in search, names and notes; no button breaks. (B4) ✅ 27 Nov: › F1.3 (img, b, script, quotes: nothing runs)
- [x] F1.4 Search at the top finds staff and stock from any screen; a result opens it. (demo 1) ✅ 27 Nov: › F1.4
- [x] F1.5 "Today" moves on while the program stays open: expiry badges change after midnight without reopening. (B7) ✅ 27 Nov: › F1.5 (clock moved past midnight; failed when the tick was broken)
**Status:** 🟢 built and tested (27 Nov 2026). Uses DEMO data until F3 brings the store door; search results open their section until F7/F8/F14 bring the item and person screens.

### F2 — Sign-in and roles · release 1 · June J1 "Acting as" · demo batch 1
- [x] F2.1 Everyone signs in with their own REACH account: one account per person, the same as in EDP. There is no "Acting as". (B12, Q6, REACH R3) ✅ 28 Nov: tests/app/f2-signin.spec.mjs › F2.1 (wrong password refused, no “Acting as”, saves carry the person) and › F2.1 (Q22 = A) (new computer set up by Management, one-time password, own password, never sent anywhere). One REACH account shared with EDP: comes with the server (SD2)
- [x] F2.2 Inside this app a person has one of three levels: View, Work or Manage. Nurses work at Work level; doctors in charge and base managers at Manage. Levels are set by Management. (Q20 = A, REACH R3, Q11) ✅ 28 Nov: › F2.2 (three levels, set by Cara, takes effect at once; View can't change stock)
- [x] F2.3 A Work-level person can't change Settings or anyone's level, and doesn't see People and access. (B12; reworded by Q23 = C, 28 Nov) ✅ 28 Nov: › F2.3 (Anna sees “Only Manage level changes settings. You can look.”, no People and access, no level boxes; checked again behind the screen; no one-time passwords from Work level)
- [x] F2.4 The last Manage-level person can't be lowered or archived; the message says why. (B14) ✅ 28 Nov: › F2.4 (Cara can't lower herself as the last one; message says why) + unit test for two changes at the same moment (B27)
- [x] F2.5 Nobody can archive themselves. (B23) ✅ 28 Nov: › F2.5 (Cara can't archive herself; Dina archived, off the sign-in list, restored)
- [x] F2.6 "Stay signed in on this computer" lets the program open offline; a first sign-in on a new computer needs internet once, and says so. (Stage 3, demo 1) ✅ 28 Nov: › F2.6 (ticked: reopens offline signed in; not ticked or signed out: sign-in screen). “A first sign-in on a new computer needs internet”: until the server, a new computer is set up by Management instead (Q22 = A); the internet part comes with SD2
- [x] F2.7 Archive stock: Work and Manage. Archive people: Manage. Delete for good: only a mistake, within 24 hours of creating it, by Manage level, logged; after that, archive only. Patient files and the change log are never deleted. (Q17, REACH R4 / Q38, alignment 27 Nov) ✅ 28 Nov: › F2.7 (a mistake deleted within 24 h by Manage, both messages kept in the log; Anna, added weeks ago, can't be deleted; Work can't archive people) + unit tests (archive stock: Work and Manage; patient files and log never deleted). Stock archiving on screen comes with F7/F8
- [x] F2.8 Controlled-drug rights don't follow these roles: see F12. (Danny, batch 2 note) ✅ 28 Nov: unit test (Manage level gives no controlled-drug right; the doctors' list does, at any level); the list itself comes with F12
**Status:** 🟢 built and tested (28 Nov 2026). Until the server exists (REACH SD2): a password per person on each computer (Q22 = A). F2.1's shared REACH account and F2.6's “needs internet once” get tested again with the server.

### F3 — Works without internet · release 1 · new · demo batch 1
- [x] F3.1 The program opens with no internet, showing the data of the last sync and the time of that sync. (Danny, Stage 3: "App also needs to Open without Internet") ✅ 27 Nov: tests/app/f3-offline.spec.mjs › F3.1 (closed, reopened with no internet: banner with last sync time, saved change still there)
- [x] F3.2 Changes made offline are kept on the computer and sent on their own when the internet is back. (Q5, Q9) ✅ 27 Nov: › F3.2 (2 changes offline → “Offline · 2 waiting” → online → both on the stand-in server)
- [x] F3.3 Sync light: green up to date, amber offline with the number of changes waiting, red not saved; a click lists what's waiting. (demo 1) ✅ 27 Nov: › F3.3 (grey with no server, green, amber with count and list, red)
- [x] F3.4 Two computers changing the same stock line: both movements count, and it's shown. (demo 1) ✅ 27 Nov: › F3.4 (Mac −1, PC +2 → 13 on both) + unit test
- [x] F3.5 Two counts of the same line that disagree: the later count is used, both are kept, and it's flagged for checking. (demo 3, approved without comment) ✅ 27 Nov: › F3.5 (11 and 9 → 9 used, both kept, banner) + unit test
- [x] F3.6 A save that fails is shown in red, and nothing pretends to be saved. (B22) ✅ 27 Nov: › F3.6 (red light, red message, unchanged after reopening; failed when the rule was broken)
- [x] F3.7 A new version carries all data over: nothing is ever replaced by built-in data. (B3) ✅ 27 Nov: › F3.7 (older data without version and app code: kept, migrated, nothing re-added; failed when old data was thrown away)
**Status:** 🟢 built and tested (27 Nov 2026). The parts that need the shared server (F3.2, F3.4, F3.5) are proven against a stand-in server in test mode; they get tested again when REACH decides the real server (SD2).

### F4 — Activity log · release 1 · June J12 · demo batch 4
- [x] F4.1 One log for all REACH apps (Inventory, People, Settings, EDP), newest first, filter by app; every entry in the REACH shape: who, which record, what changed, when, from which app. (Q7, REACH R9, demo 4) ✅ 28 Nov: tests/app/f4-log.spec.mjs › F4.1 (an EDP change through the stand-in server, a People change, an Inventory change: newest first, each with who · when in base time · app tag; filter Inventory / EDP / Settings) + unit tests
- [x] F4.2 Every change shows old → new; renaming an item keeps its history (history follows the ID, not the name). (B19) ✅ 28 Nov: › F4.2 (rename shows name: old → new; the earlier movement shows the new name; the item's history keeps its DEMO creation) + unit test
- [x] F4.3 Every delete for good is logged with who, when and what was there. (B18) ✅ 28 Nov: › F4.3 (Typo Persn deleted by Cara: “What was there: name … job … level … state”, and its creation stays) + unit test
- [x] F4.4 Nobody can edit or delete a log entry, Admins included. (demo 4) ✅ 28 Nov: › F4.4 (no edit or delete control in the log; stored messages and entries can't be changed, even from behind the screen; a changed copy with the same message ID from outside is ignored, unit test)
**Status:** 🟢 built and tested (28 Nov 2026). EDP's entries are proven with the stand-in server; they get tested again when EDP is joined through the real server (SD2).

### F5 — Settings and country settings · release 1 · June J10 · demo batch 4
- [x] F5.1 Country settings: base name, country, time zone, date style, shift times. (brief, Stage 3) ✅ 28 Nov: tests/app/f5-settings.spec.mjs › F5.1 (Cara changes base name, country → time zone proposed, date style, shifts; sidebar follows; a bad shift time is refused; the log shows country: PG → PE) + unit tests
- [x] F5.2 "Today" and every expiry follow the base's time zone. Test PNG (UTC+10) after 10:00 and Peru (UTC−5) after 19:00: no item shows "Expired" a day early. (B13) ✅ 28 Nov: › F5.2 (computer on UTC, 28 Nov 00:30 UTC: PNG base shows Saturday 28 Nov and “Expires today”; Peru base shows Friday 27 Nov and “Expires tomorrow”; never “Expired”)
- [x] F5.3 Every box in Settings looks like every other box in the app. (B8) ✅ 28 Nov: › F5.3 (every box in Settings has the same border, corners and type as the boxes elsewhere; not the browser's default box)
- [x] F5.4 A department or category in use, even only by archived records, can't be deleted; the message says who uses it. (B21) ✅ 28 Nov: › F5.4 (Training: “still used by Finn Former (archived)”; icu: used by an archived item; archive instead, Finn keeps it; an unused new entry can be deleted) + unit tests
- [x] F5.5 Renaming only the capitals is allowed (icu → ICU); a real duplicate is refused. (B24 part) ✅ 28 Nov: › F5.5 (icu → ICU accepted; ICU → fluids refused ““Fluids” is already there.”; “clinical” refused) + unit test
- [x] F5.6 Departments, inventory categories, courses and bags are managed here. (June J10) ✅ 28 Nov: › F5.6 (departments listed; category, course with months, bag added; course months changed; a bag with stock can't be archived; the Store isn't a bag) + unit test
- [x] F5.7 Only Manage level changes settings; everyone else can look at the base's settings and lists. (Q20, demo 4; Q23 = C) ✅ 28 Nov: › F5.7 (Anna: everything visible and greyed, no change buttons, no People and access; three changes tried behind the screen all refused)
**Status:** 🟢 built and tested (28 Nov 2026).

### F6 — Inventory overview · release 1 · June J4 · demo batch 2
- [x] F6.1 The June Overview: totals, attention strip, bag readiness, soonest to expire. Every card and warning opens the matching list. (June J4) ✅ 28 Nov: › F6.1 (8 item types, 89 units, 1 out, 1 expired / 1 soon; 4 cards, Store first; each of 6 cards and warnings opens exactly the lines it counts; a readiness card opens its place; numbers follow a change at once) + unit test
- [x] F6.2 A line holding exactly its required amount counts as OK; a bag is Ready only when every line is at or above it and in date. (B1) ✅ 28 Nov: › F6.2 (Bag 1 with Saline 4 of 4: Ready; one taken: Short; put back: Ready; Gauze out of date: Not ready) + unit test
- [x] F6.3 A line with no required amount makes its bag "Not set up", never Ready. (B25) ✅ 28 Nov: › F6.3 (Trauma kit: Not set up with the reason; one amount given: still Not set up; both: Ready) + unit test
- [x] F6.4 Store lines have reorder levels; below it shows "Below reorder level", and the Store card warns. (B10) ✅ 28 Nov: › F6.4 (Gloves 6, reorder at 10: “Below reorder level”; Store card “1 below reorder level”, then Reorder, then Stocked) + unit test
**Status:** 🟢 built and tested (28 Nov 2026).

### F7 — Store and bags · release 1 · June J5 · demo batch 2
- [x] F7.1 Filters: location, category, stock level (including "no required amount"), expiry; sort; show archived; clear filters. (June J5) ✅ 28 Nov: › F7.1 (each filter alone and two together; Clear filters; 4 sorts; an archived line only with Show archived, marked Archived) + unit tests
- [x] F7.2 Export CSV holds exactly what the table shows, with local dates. (June J5, B13) ✅ 28 Nov: › F7.2 (computer on UTC, still 27 Nov there: file named 28 Nov, Glucose gel expiry 2026-11-28; same rows and order as the table; follows filters everywhere) + unit tests (quotes, formulas never run, Excel mark)
- [x] F7.3 A row opens its item page. (June J5) ✅ 28 Nov: › F7.3 (click anywhere on the row, or Enter on the name: that item opens; Back keeps the filters). The page is a stand-in until F8
**Status:** 🟢 built and tested (28 Nov 2026).

### F8 — Item page · release 1 · June J6 · demo batch 2
- [x] F8.1 Stock per location with lot, expiry and status, and the item's movements. (June J6) ✅ 28 Nov: › F8.1 (Gauze: Store first, then Bag 1, each with amount, required / reorder at, lot, stock and expiry; movements show this item's changes old → new and nothing of other items)
- [x] F8.2 Move all or part of a line to another bag or the Store. It joins a matching line (same lot and expiry), or starts a new one without a required amount. Logged. (B24) ✅ 28 Nov: › F8.2 (13 of 12 refused; 5 to Bag 2: a new line without a required amount, lot and expiry carried; the rest joins it; same expiry but another lot: a new line; the log says from where to where) + unit tests (saved all or none; lot and expiry both must match). Q24 = C: a line with an amount emptied by a move stays at 0 (Bag 1 shows Out of stock); one without is archived, and the message says so
- [x] F8.3 Edit a line: the location can't be edited there (use Move); every change is logged old → new; amounts are whole numbers. (demo 2) ✅ 28 Nov: › F8.3 (place greyed with “use Move”; 2.7, −5, empty and “ten” refused, nothing saved; four changes logged old → new; the expiry also written out in words, and stored as the plain date) + unit tests
- [x] F8.4 Add a location; add an item (a duplicate name is refused); archive and reactivate; delete for good only a mistake within 24 hours, after a confirm, logged. Rights per F2.7. (demo 2, Q17, REACH Q38) ✅ 28 Nov: › F8.4 (duplicate “gauze 10×10 CM” refused; new item and a second place added; line archived and reactivated; an item in use can't be archived; delete asks first, Cancel keeps it, then logged; old DEMO lines offer no delete; Anna archives but can't delete, also behind the screen; View level sees no change buttons) + unit tests
- [x] F8.5 A "Used on EDP cases" panel waits for F17. (demo 2) ✅ 28 Nov: › F8.5
**Status:** 🟢 built and tested (28 Nov 2026); Q24 = C applied.

### F9 — Restock and dispense · release 1 · June J7 · demo batch 2
- [x] F9.1 + and − ask for a whole number, 1 or more. 0, negatives, decimals and an empty box are refused with a message, and nothing changes. (B17) ✅ 28 Nov: › F9.1 (0, -5, 2.7 and empty refused for both, nothing saved; 3 added, 2 taken by Enter) + unit test
- [x] F9.2 Taking out more than is there is refused. (June J7) ✅ 28 Nov: › F9.2 (5 of 4 refused; all 4 allowed: Out of stock) + unit test
- [x] F9.3 Every booked movement is logged old → new. (B19) ✅ 28 Nov: › F9.3 (“dispensed 2 … 12 → 10”, “restocked 6 … 30 → 36”, with who; also on the item page, which has the same + and −) + unit test
- [x] F9.4 For a controlled drug, − leads to the register (F12); there's no plain dispense. (demo 2, Q8) ✅ 28 Nov: › F9.4 (− and + on Morphine show the register note, no box to type in; “Open the register” goes to Controlled drugs; dispense, amount edit and move refused behind the screen too) + unit test
**Status:** 🟢 built and tested (28 Nov 2026).

### F10 — Count stock · release 1 · June J8 · demo batch 3
- [x] F10.1 Pick a bag or the Store and type what you find; an empty box means "not counted" and leaves the line as it was. (B16) ✅ 28 Nov: › F10.1 (a box typed then emptied stays not counted: Saline still 4; 0 is a real count; Morphine shown, counted in the register) + unit test
- [x] F10.2 Typed counts survive searching and switching location; leaving with unsaved counts asks Save / Throw away / Keep counting. (B16) ✅ 28 Nov: › F10.2 (search with no match, switch place and back: numbers kept; leaving: Keep counting / Save / Throw away each do what they say; signing out asks too; the next person never sees someone else's counts, even when the first is archived mid-count; closing the program asks, and doesn't when nothing is typed)
- [x] F10.3 A count that isn't a whole number of 0 or more shows red and blocks saving. (demo 3) ✅ 28 Nov: › F10.3 (-1, 2.5, “four”: red with the reason; Save refused, the good count not saved either) + unit test
- [x] F10.4 After saving: how many changed, the same, not counted; each change logged old → new. (demo 3) ✅ 28 Nov: › F10.4 (“Saved: 2 changed, 1 the same.”; 30 → 28 and 6 → 9 in Activity; the same count logged as “the same as before”) + unit tests (two counts from the same start that disagree are flagged, F3.5)
**Status:** 🟢 built and tested (28 Nov 2026).

### F11 — Stock takes · release 1 · June J9 · demo batch 3
- [x] F11.1 Freeze a stock take: every line, date, who, label; it can't be changed afterwards. (June J9) ✅ 28 Nov: › F11.1 (label needed; “Frozen 28 Nov 2026, 06:00 · by Anna Example” on a computer still at 27 Nov; 10 lines; no change buttons; a change and a delete sent behind the screen are ignored, and Activity says so) + unit tests (another computer's change message ignored too; never deleted)
- [x] F11.2 Then vs now for every line; lines removed since are shown as removed. (June J9) ✅ 28 Nov: › F11.2 (12 → 9 “-3”, 6 → 10 “+4”, “no change”; archived since and deleted since shown as removed, still named; lines added since counted, not mixed in) + unit test
- [x] F11.3 Export a stock take as a spreadsheet file, with local dates. (demo 3) ✅ 28 Nov: › F11.3 (computer on UTC, 27 Nov there: file named 2026-11-28, frozen on 2026-11-28 06:00, expiry as stored, then / now / change per line) + unit test
- [x] F11.4 Stock takes are kept on the server and survive every new version. (B3) ✅ 28 Nov: › F11.4 (on the stand-in server and on the other computer after syncing; still there after the program opens the same data again) + unit test. The real server waits for REACH SD2
**Status:** 🟢 built and tested (28 Nov 2026).

### F12 — Controlled-drug register · release 1 · new · demo batch 3
- [x] F12.1 Each controlled drug has a running balance. Every line has: when, in / out / moved / correction, amount, balance, who, which doctor and how they approved, witness, reason or case. (Q8) ✅ 28 Nov: › F12.1 (opening 5; a doctor takes out 2: When, Out, 2, 3, by, doctor and how, witness, reason; the Store line went with it; Activity in words) + unit test
- [x] F12.2 Only a doctor takes a controlled drug out or approves it being taken out. Manage level gives no right here. (Danny, batch 2 note) ✅ 28 Nov: › F12.2 (Cara, Manage: needs a doctor like any nurse, can't change the list; refused behind the screen too) + unit test
- [x] F12.3 A nurse takes one out with a doctor's approval, either in the room (the doctor types their own PIN on the nurse's screen) or by request to the doctor's own phone or Mac (Approve / Ask / Refuse, red badge until answered). Nothing comes off the balance until it's approved; a refused request stays visible, crossed out. (Q13 = A) ✅ 28 Nov: › F12.3 (wrong PIN refused, DEMO PIN 1234 works; a request: nothing off, “your request is waiting”, red 1 on Dr Ben's menu, Ask keeps it waiting, Approve books it; a refusal stays crossed out, never counts) + unit tests (approving later with too little left is refused)
- [x] F12.4 Emergency, no doctor reachable: reason and witness required; booked at once; red "waiting for doctor" on Home and in the register until a doctor approves or queries it. (Q14 = A) ✅ 28 Nov: › F12.4 (no reason refused; booked at once; red on Home and in the register; no Refuse for an emergency; approved afterwards: the red goes) + unit test (a query also ends the red, shown as “asked about”)
- [x] F12.5 Every line has a witness: a second person who was there. Never yourself, and never the approving doctor. (Q15 = A, Q8) ✅ 28 Nov: › F12.5 (no witness refused; you and the chosen doctor aren't offered; both refused behind the screen) + unit test (a doctor who witnessed can't approve)
- [x] F12.6 Only a doctor gives another person the right to approve, never themselves; the first doctor is set once at setup with Danny; Manage level can't change the list. (Q16 = B) ✅ 28 Nov: › F12.6 (Dr Ben gives Dina the right, himself not offered; shown in the list's changes; Cara can't, also behind the screen; with no doctor, Management sets the first one once) + unit test
- [x] F12.7 A doctor removes someone's right with ✕; it's logged and every doctor is told; the last doctor can't be removed. (Danny, batch 3 note) ✅ 28 Nov: › F12.7 (the last doctor can't be removed; ✕ removes Dina, logged “doctor's right: yes → no”, shown to doctors) + unit test
- [x] F12.8 Lines are never edited or deleted. A doctor adds a correction line that names the original, with a witness and a reason; the balance can't go below 0. (Q8, demo 3) ✅ 28 Nov: › F12.8 (no edit or delete buttons; a correction of −4 refused below 0; +1 added naming the original, which stays; a change message behind the screen is ignored and Activity says so) + unit test
- [x] F12.9 Receiving needs a witness, no doctor. (demo 3, approved without comment) ✅ 28 Nov: › F12.9 (Anna, a nurse, receives 3 with a witness, no doctor; joins lot M-3) + unit test
- [x] F12.10 Taking out more than the balance is refused. (demo 3) ✅ 28 Nov: › F12.10 (6 of 5 refused) + unit test
- [x] F12.11 Moving a controlled drug between the Store and a bag is a “Moved” register line: amount, from, to, who, witness (never yourself), no doctor; the balance doesn't change; the item page shows where it is. (Q25 = A) ✅ 28 Nov: › F12.11 (no witness refused; Moved 2, balance stays 5, Store → Bag 1, no doctor; the item page shows both places) + unit test
- [x] F12.12 Each person has a profession (Doctor, Nurse, Other), set by Management. Someone entered as a Doctor types their own medical code at sign-in; until then they don't count as a doctor. Codes are unique; every entry is logged. There has to be a level of trust: the program can't check a code with the Medical Board. (Danny with the medical staff, 28 Nov) ✅ 28 Nov: › F12.12 (Cara sets Dina to Doctor: “medical code not typed yet”; Dina's sign-in asks for it before the program opens; Dr Ben's code refused; hers saved and logged “medical code: — → …”; Work level refused behind the screen) + unit test
- [x] F12.13 Only a doctor with a medical code can be on the doctors' list; without it nobody approves. ✅ 28 Nov: › F12.13 (nurses and a doctor without code aren't offered; refused behind the screen) + unit test (back to Nurse: no longer approves)
- [x] F12.14 Management names the Head Doctor: exactly one (Danny, 28 Nov); a lone doctor is Head Doctor automatically; Management can do nothing else here. Without a Head Doctor nobody ticks, and Management sees a red note on Home. ✅ 28 Nov: › F12.14 (Dr Ben, the only doctor: Head Doctor automatically; a second doctor: red note on Home; Cara names Dina, then Ben: it moves to Ben, only one Head Doctor badge in the register; Cara's box on an item stays greyed; Work level refused behind the screen) + unit test (archived Head Doctor: the remaining lone doctor takes over)
- [x] F12.15 Only a Head Doctor ticks or unticks “Controlled drug”, after a confirm box. Ticking asks for a witness and opens the register at what the shelves hold, in the same save; unticking asks why; the register history stays, read-only. Everyone else sees the box greyed. ✅ 28 Nov: › F12.15 (Anna greyed; Dr Ben: confirm shows 28 on the shelves, no witness refused, then Opening 28; dispense now goes to the register; unticked with a reason: register read-only, no buttons; a Manage non-doctor refused behind the screen) + unit test (ticked again: a correction sets the register to the shelves)
**Status:** 🟢 built and tested (28 Nov 2026).

### F13 — Backup, export and import · release 1 · June J11 · demo batch 3
- [x] F13.1 The server keeps the data and makes a backup every night; the last 30 are kept. (Q5, demo 3) ✅ 28 Nov: › F13.1 (a backup when the program opens, once a day; 40 more days: 30 kept; the folder refuses any other name) + unit test. On this computer until the server keeps them (REACH SD2)
- [x] F13.2 Export a backup file to your own computer, in the REACH backup shape: app code MD, data version, when exported, the data. (June J11, REACH R10) ✅ 28 Nov: › F13.2 (keys app, kind, dataVersion, exportedAt, exportedBy, data; every message; no password or PIN check values) + unit test
- [x] F13.3 An import with no stock, or with no people, is refused with the reason; nothing changes. (B15) ✅ 28 Nov: › F13.3 (no stock, no people, a June backup: each refused with the reason, no Restore button, nothing changed) + unit test (damaged, newer version)
- [x] F13.4 A restore shows what changes (now vs after), needs a tick to confirm, and saves a backup of today first. (B15) ✅ 28 Nov: › F13.4 (now vs after per kind, changed rows in bold; Restore disabled until the tick; a copy of today saved first, with what was there; it can be restored from the list) + unit test
- [x] F13.5 After a restore every screen shows the restored data at once, with no reload. (B2) ✅ 28 Nov: › F13.5 (Overview, Store and bags and Activity show the restored data at once; no “undefined”) + unit tests (a failed restore changes nothing; the next start sees it)
- [x] F13.6 Importing the Excel lists shows problems first: impossible dates (e.g. 1900), the same item twice in one place, double spaces, missing units, lot fields that look like dates. Blocking rows must be fixed in the spreadsheet; the list can be copied for the medics. (B6) ✅ 28 Nov: check › F13.6 (1900 date, double spaces, no unit, lot like a date, the same item twice, two dates in one cell; a clean sheet lists nothing; nothing loaded; the list copied; not an Excel file refused) + unit tests; run on the real files (counts only): Store 21 rows must be fixed, bags 39. Loading (Q26 = A, A, A, Head Doctor part 6 = A) › F13.6 loading (a list with a must-fix row can't be loaded; the stock-take sheet goes to the Store, an unknown sheet to a new bag; newest month shown and loaded, e.g. 28 (SOH FEB); the existing Store line counted, not doubled; Morphine and a ticked Ketamine wait for the Head Doctor, not loaded; Cara sees them but can't decide; Dr Ben confirms each with a witness: register balance and shelves agree; logged) + unit tests (one save; Manage only; “not a controlled drug” loads as ordinary)
- [x] F13.7 The real stock and staff lists come only from Danny's files through import; never built in, never in Git. (B9) ✅ 28 Nov: › F13.7 (a new empty program has no stock and no people; Git holds no spreadsheets, backups or CSV; .gitignore covers them) + unit test (every built-in record is DEMO)
- [x] F13.8 Only Manage level imports or restores. (Q20, demo 3) ✅ 28 Nov: › F13.8 (Anna doesn't see Backup and import; export, check and restore refused behind the screen) + unit test
**Status:** 🟢 built and tested (28 Nov 2026).

### F14 — Staff · release 1 · June J2 · demo batch 4
- [x] F14.1 This app keeps its own people list in the REACH Core shape (hidden ID, name, office, stamps), so it can be merged later; Ops Management becomes the keeper of the one list. An email already in the list is refused. (Q6 = C, REACH Q37, Q18, alignment 27 Nov) ✅ 28 Nov: › F14.1 (Cara adds Eva Trial with department, office Medics and email “Eva@Example.org”: saved as eva@example.org, hidden ID, “Added 28 Nov 2026 by Cara Demo”; the same email again and archived Finn's refused; “eva-two” refused; Dina can't take Anna's email; a new one saved and logged) + unit tests (hidden ID and stamps; any office outside the six refused; an unknown department refused; no email twice is fine; Manage only; archived people can't be changed)
- [x] F14.2 The directory shows department, role and training status; "Show archived" shows archived people faded. (June J2) ✅ 28 Nov: › F14.2 (Anna sees 4 people with department, office, level; Finn hidden until “Show archived”, then faded with an Archived badge; Work level has no Add person). Training status: the column says “comes with F15” until training is built
- [x] F14.3 Counts never include archived people, even when they're shown. (B26) ✅ 28 Nov: › F14.3 (Staff 4, Archived 1, “Clinical 3 · Management 1”, no Training: only archived Finn is in it; the same with “Show archived” ticked) + unit test (archiving Dina: 3, Clinical 2)
- [x] F14.4 Archive (Manage level) keeps the history and can be undone; delete for good only a mistake within 24 hours, logged. (Q17, REACH Q38, B18) ✅ 28 Nov: › F14.4 (Dina from the DEMO data: no Delete; Cara archives her after a confirm box: gone from the list and the counts, still there under Show archived, restored; a person added by mistake deleted for good, gone everywhere, logged “(a mistake, within 24 hours)”; Work level refused behind the screen) + unit test (after 24 hours: refused, “archive it instead”; the email is free again after a mistake is deleted)
- [x] F14.5 A profile shows training, details and this week's duties. (demo 4) ✅ 28 Nov: › F14.5 (search “Dina” opens her profile: details, email, office; Training says it comes with F15; “This week on the roster” says it comes with the roster, F16, release 2; the menu goes back to the list)
**Status:** 🟢 built and tested (28 Nov 2026). Training comes from F15 (built the same day); duties show where the roster (F16, release 2) brings them.

### F15 — Training and certificates · release 1 · June J3 · demo batch 4
- [x] F15.1 Each course shows Valid, Expires in N days (30 or fewer), Expired, Required or In progress. (June J3) ✅ 28 Nov: › F15.1 (Anna's BLS Valid, ACLS Expired with “Completed 18 Nov 2024 · expires 18 Nov 2026 · valid 24 months”, Fire safety Required; Dina's BLS “Expires in 20 days”, Oxygen refresher In progress; the list: Expired certificate / Due soon / All valid; stats 1 expired, 1 due) + unit test (30 days is due, 31 is Valid; Expires today; a course that never expires: Done)
- [x] F15.2 An expired certificate can be renewed, and a valid one renewed early. (B20) ✅ 28 Nov: › F15.2 (Anna's expired ACLS: Renew, new expiry 28 Nov 2028 shown before saving, then Valid; her BLS renewed early from 20 Nov: 20 Nov 2027; expired count 0; logged “renewed … ” with old → new dates) + unit test
- [x] F15.3 Expiry is worked out month-safe: 31 Jan + 1 month = end of February. (B26) ✅ 28 Nov: › F15.3 (Dina's Oxygen refresher, 1 month, done 31 Jan 2026: expires 28 Feb 2026) + unit tests (leap year 29 Feb, 31 Mar → 30 Apr, over the year end)
- [x] F15.4 Archived people are offered no courses. (B26) ✅ 28 Nov: › F15.4 (archived Finn: “Archived: no new courses are offered.”, no Assign, no Renew; refused behind the screen) + unit test (a person archived after assigning: their courses can't be changed)
- [x] F15.5 A completion date can't be in the future; every change logged old → new. (demo 4) ✅ 28 Nov: › F15.5 (29 Nov refused on screen and on Save; 28 Nov saved; the log: “completed Fire safety for Anna Example”, status required → done, expires — → 28 Nov 2027) + unit test (the store refuses a future date; nothing changed)
- [x] F15.6 Manage level assigns and completes courses. (June J3, Q20) ✅ 28 Nov: › F15.6 (Cara assigns Fire safety to Dina: only the courses she hasn't got are offered; Required; logged “assigned Fire safety to Dina Test”; Anna sees no buttons; Work level refused behind the screen for assign and complete)
**Status:** 🟢 built and tested (28 Nov 2026).

### F16 — Duty roster (MD3) · later (planned for release 2) · June J14 placeholder · demo batch 4 (idea only)
- [ ] F16.1 Shows which nurse or doctor is on duty when. (Danny, Stage 3)
- [ ] F16.2 EDP reads it, so the dispatcher only assigns someone on duty at that time; EDP can't change it. (Danny, Stage 3)
- [ ] F16.3 Manage level changes it; every change is logged. (Q19 = A, Q20)
- [ ] F16.4 What one entry looks like, and the rules it must follow, come from Danny's roster rules in F16's own stages before release 2. (Q18 parked)
**Status:** ⚪ later. Danny, 27 Nov: “Roster I would tackle later.” Gets its own stages, starting from his roster rules.

### F17 — "Used on a case" from EDP · later · June J13 · no demo
- [ ] F17.1 Its own run through the stages when EDP (F79) and the server are ready. The needs are already written down in `PLAN.md` › EDP link: same item IDs, location and lot, a unique ID per message (counted once), corrections, an offline queue, controlled drugs with witness and register.
- [ ] F17.2 Never below zero without a word: overuse is flagged. (B11)
**Status:** ⚪ later

### F18 — Patient File and Patient Archive (MD2) · later · June J14 placeholder · no demo
- [ ] F18.1 Its own run through the stages: one file per patient (from EDP or added by hand), growing over the years, kept in the Patient Archive, with stricter access. (Danny, Stage 3)
**Status:** ⚪ later

### F19 — Calendar (MD4) · later · no demo
- [ ] F19.1 Its own run through the stages, as a part of the Medical Suite. (Q21 = A, REACH D4)
**Status:** ⚪ later

### F20 — Medical Library (MD5) · later · no demo
- [ ] F20.1 Its own run through the stages: documents and course material, with the medics' checklists. (Q21 = A, REACH D4, Q22, Q24)
**Status:** ⚪ later

### F21 — SOPs (MD6) · later · no demo
- [ ] F21.1 Its own run through the stages: the medical side's standard operating procedures. (Q21 = A, REACH D4, Q24)
**Status:** ⚪ later

### F22 — Item list · B74 (A5, Q41 = A) · added 28 Nov 2026 (it never had a block: the audit counted the placeholder as fine)
- [x] F22.1 One row per item (the catalogue): item number, name, category, unit, controlled mark, total on hand over the Store and every bag, in how many places, the next expiry, and the stock over all places (In stock / Short somewhere / Out of stock / No amount set / Below zero). ✅ 28 Nov: tests/app/requests.spec.mjs › B74 (every DEMO item's total checked against its lines) + unit tests (itemList.test.ts)
- [x] F22.2 Search by name or item number, a category filter, archived items only with “Show archived”, Clear filters. ✅ › B74 + unit tests
- [x] F22.3 A row opens the item page; Back returns to the Item list with the search kept; the menu marks Item list while its item is open. ✅ › B74
- [x] F22.4 Add item here (Work level and up; View level sees no button); Export CSV of exactly the rows shown. ✅ › B74, B74 View level + unit test (CSV, formulas never run)
- [x] F22.5 The Overview's “Item types” card opens it, with the same count. ✅ › B74, stage8 › B68 (changed)
**Status:** 🟢 built and tested (28 Nov 2026)
