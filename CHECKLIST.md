# CHECKLIST — REACH Inventory
**Now:** Stage 5 — UI / Architecture · waiting for Danny: GO to start Stage 5 (look and structure of the real program); switch off GitHub Pages again when GitHub works (Settings › Pages)

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
- [ ] Live page checked after GitHub Pages rebuilds
  - 27 Nov 2026, checked after push 6417723: https://danielfuchsnuernberg.github.io/medical-suite/ still answers 200 with the June app (last-modified 25 Nov 15:26, contains the stock list). Pages isn't rebuilding: a file pushed today returns 404. **Only fix: Danny unpublishes the site** (GitHub › medical-suite › Settings › Pages › Unpublish site, or Source: None).
- History rewrite: **not done** (Q1 = leave)
**Status:** 🟡 IN PROGRESS (last check pending)

### STEP 6 — Bug hunt (Workflow B) — closed 26 Nov 2026
Danny: nobody uses the June app, so no patches. All 26 bugs are rules for the new app (`BUGS.md`).

### STEP 6 — Bug hunt: wait for approval (Workflow B, 26 Nov 2026)
**Goal:** Danny decides which prototype bugs get patched now; the rest become rebuild rules.
**Checklist:**
- [x] Steps 1–3: all bugs read, reproduced, written into `BUGS.md` (B1–B26 + data list)
- [x] Step 4: fix order planned (`BUGS.md` › Fix order)
- [x] Step 5: before/after shown (page, tab 2)
- [ ] Step 6: Danny's GO, and Q11 answered (is the June app in real use?)
**Status:** 🟡 IN PROGRESS
**Open questions:** Q1, Q11 (decide the patch set); Q2–Q10 (decide the rebuild)

### STAGE 1 — Plan Mode
**Goal:** the brief is captured verbatim and the existing app is fully stock-taken.
**Checklist:**
- [x] Newest version found on the Mac and the project set up in `~/Documents/GitHub/medical-suite` (git repo, cloned)
- [x] `.gitignore` keeps out real data, secrets and build output
- [x] Rule-book files + `CLAUDE.md` created
- [x] Brief written verbatim into `PLAN.md`
- [x] Stock-take: every line read, app run, measurements recorded (`ARCHITECTURE.md`, `BUGS.md`, `AUDIT.md`)
- [x] Stock-take shown visually (map: green / amber / red)
- [ ] Danny confirms nothing is missing from the brief
**Tests for this stage:**
- [x] Live page, repo and iCloud file have the same md5 (b065284d…)
- [x] App opens with 0 console errors; every Inventory action tried once on a copy
- [x] Ignored paths checked with `git check-ignore`
**Status:** 🟡 IN PROGRESS
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
**Status:** 🔴 OPEN

### STAGE 6 — Execution
**Status:** 🔴 OPEN

### STAGE 7 — Testing
**Status:** 🔴 OPEN

### STAGE 8 — Audit
**Status:** 🔴 OPEN

### STAGE 9 — Handover
**Status:** 🔴 OPEN

## Master Feature Checklist
**Approved by Danny, 27 Nov 2026 (Stage 4 signed off).** This is the hard reference for Stages 6–8. A feature is done only when every line in its block is ✅, each proven by a test that can fail. In brackets after each line is where it comes from: a June bug (B…), an answer (Q…), Danny's own words, or the approved demo.
Status per block: 🔴 not built · 🟡 building · 🟢 built and tested. Feature list: `PLAN.md` › Target feature list.

### ALL — rules for every feature
- [ ] ALL.1 No real stock, staff or patient data in the code or in Git. Real data only comes in through import (F13). (CLAUDE.md, B9)
- [ ] ALL.2 Everything country-specific is a setting (F5), never written into the code. (brief, Stage 3)
- [ ] ALL.3 The June screens and look stay; no restyle before EDP F53. (Danny, Stage 3: "The UI is good")
- [ ] ALL.4 Dates are local dates of the base. No date is ever written or read in world time (UTC). (B13)
- [ ] ALL.5 Every change is logged with who, when and old → new (F4). (B18, B19)
- [ ] ALL.6 Everything typed is shown as plain text, everywhere. (B4)
- [ ] ALL.7 Works on Mac and Windows as an installed program, phone and tablet sizes included. (Q3, Q4)
- [ ] ALL.8 The program is called “REACH Inventory”; the name is a setting until the common REACH look (EDP F53). (Q10)
**Status:** 🔴 not built

### F1 — Program window, menu and search · release 1 · June J1 · demo batch 1
- [ ] F1.1 Menu as in the June app: Home; Inventory (Overview, Store and bags, Item list, Count a bag, Stock takes, Controlled drugs, Activity); Team (Staff and training, Roster); Later (Patients); Settings at the bottom. Home has a card per section. (demo 1)
- [ ] F1.2 Below 720 px wide the menu sits behind ☰; it opens, closes, and every screen can be reached. No sideways scroll at 375 px. (B5)
- [ ] F1.3 Text with quotes, `<b>` or script tags shows as plain text in search, names and notes; no button breaks. (B4)
- [ ] F1.4 Search at the top finds staff and stock from any screen; a result opens it. (demo 1)
- [ ] F1.5 "Today" moves on while the program stays open: expiry badges change after midnight without reopening. (B7)
**Status:** 🔴 not built

### F2 — Sign-in and roles · release 1 · June J1 "Acting as" · demo batch 1
- [ ] F2.1 Everyone signs in with their own REACH account, the same as in EDP. There is no "Acting as". (B12, Q6)
- [ ] F2.2 Roles Staff, Manager, Admin come with the account; only an Admin changes roles. (demo 1)
- [ ] F2.3 A Staff member can't open Settings or change any role. (B12)
- [ ] F2.4 The last Admin can't be demoted or archived; the message says why. (B14)
- [ ] F2.5 Nobody can archive themselves. (B23)
- [ ] F2.6 "Stay signed in on this computer" lets the program open offline; a first sign-in on a new computer needs internet once, and says so. (Stage 3, demo 1)
- [ ] F2.7 Archive and delete rights: everyone archives stock; deleting stock for good needs a Manager or Admin; archiving and deleting people is Admin-only. (Q17 = B)
- [ ] F2.8 Controlled-drug rights don't follow these roles: see F12. (Danny, batch 2 note)
**Status:** 🔴 not built

### F3 — Works without internet · release 1 · new · demo batch 1
- [ ] F3.1 The program opens with no internet, showing the data of the last sync and the time of that sync. (Danny, Stage 3: "App also needs to Open without Internet")
- [ ] F3.2 Changes made offline are kept on the computer and sent on their own when the internet is back. (Q5, Q9)
- [ ] F3.3 Sync light: green up to date, amber offline with the number of changes waiting, red not saved; a click lists what's waiting. (demo 1)
- [ ] F3.4 Two computers changing the same stock line: both movements count, and it's shown. (demo 1)
- [ ] F3.5 Two counts of the same line that disagree: the later count is used, both are kept, and it's flagged for checking. (demo 3, approved without comment)
- [ ] F3.6 A save that fails is shown in red, and nothing pretends to be saved. (B22)
- [ ] F3.7 A new version carries all data over: nothing is ever replaced by built-in data. (B3)
**Status:** 🔴 not built

### F4 — Activity log · release 1 · June J12 · demo batch 4
- [ ] F4.1 One log for all REACH apps (Inventory, People, Settings, EDP), newest first, filter by app. (Q7, demo 4)
- [ ] F4.2 Every change shows old → new; renaming an item keeps its history (history follows the ID, not the name). (B19)
- [ ] F4.3 Every delete for good is logged with who, when and what was there. (B18)
- [ ] F4.4 Nobody can edit or delete a log entry, Admins included. (demo 4)
**Status:** 🔴 not built

### F5 — Settings and country settings · release 1 · June J10 · demo batch 4
- [ ] F5.1 Country settings: base name, country, time zone, date style, shift times. (brief, Stage 3)
- [ ] F5.2 "Today" and every expiry follow the base's time zone. Test PNG (UTC+10) after 10:00 and Peru (UTC−5) after 19:00: no item shows "Expired" a day early. (B13)
- [ ] F5.3 Every box in Settings looks like every other box in the app. (B8)
- [ ] F5.4 A department or category in use, even only by archived records, can't be deleted; the message says who uses it. (B21)
- [ ] F5.5 Renaming only the capitals is allowed (icu → ICU); a real duplicate is refused. (B24 part)
- [ ] F5.6 Departments, inventory categories, courses and bags are managed here. (June J10)
- [ ] F5.7 Only Admins change settings; everyone else can look. (demo 4)
**Status:** 🔴 not built

### F6 — Inventory overview · release 1 · June J4 · demo batch 2
- [ ] F6.1 The June Overview: totals, attention strip, bag readiness, soonest to expire. Every card and warning opens the matching list. (June J4)
- [ ] F6.2 A line holding exactly its required amount counts as OK; a bag is Ready only when every line is at or above it and in date. (B1)
- [ ] F6.3 A line with no required amount makes its bag "Not set up", never Ready. (B25)
- [ ] F6.4 Store lines have reorder levels; below it shows "Below reorder level", and the Store card warns. (B10)
**Status:** 🔴 not built

### F7 — Store and bags · release 1 · June J5 · demo batch 2
- [ ] F7.1 Filters: location, category, stock level (including "no required amount"), expiry; sort; show archived; clear filters. (June J5)
- [ ] F7.2 Export CSV holds exactly what the table shows, with local dates. (June J5, B13)
- [ ] F7.3 A row opens its item page. (June J5)
**Status:** 🔴 not built

### F8 — Item page · release 1 · June J6 · demo batch 2
- [ ] F8.1 Stock per location with lot, expiry and status, and the item's movements. (June J6)
- [ ] F8.2 Move all or part of a line to another bag or the Store. It joins a matching line (same lot and expiry), or starts a new one without a required amount. Logged. (B24)
- [ ] F8.3 Edit a line: the location can't be edited there (use Move); every change is logged old → new; amounts are whole numbers. (demo 2)
- [ ] F8.4 Add a location; add an item (a duplicate name is refused); archive and reactivate; delete for good only from archived, after a confirm, logged. Rights per F2.7. (demo 2, Q17)
- [ ] F8.5 A "Used on EDP cases" panel waits for F17. (demo 2)
**Status:** 🔴 not built

### F9 — Restock and dispense · release 1 · June J7 · demo batch 2
- [ ] F9.1 + and − ask for a whole number, 1 or more. 0, negatives, decimals and an empty box are refused with a message, and nothing changes. (B17)
- [ ] F9.2 Taking out more than is there is refused. (June J7)
- [ ] F9.3 Every booked movement is logged old → new. (B19)
- [ ] F9.4 For a controlled drug, − leads to the register (F12); there's no plain dispense. (demo 2, Q8)
**Status:** 🔴 not built

### F10 — Count stock · release 1 · June J8 · demo batch 3
- [ ] F10.1 Pick a bag or the Store and type what you find; an empty box means "not counted" and leaves the line as it was. (B16)
- [ ] F10.2 Typed counts survive searching and switching location; leaving with unsaved counts asks Save / Throw away / Keep counting. (B16)
- [ ] F10.3 A count that isn't a whole number of 0 or more shows red and blocks saving. (demo 3)
- [ ] F10.4 After saving: how many changed, the same, not counted; each change logged old → new. (demo 3)
**Status:** 🔴 not built

### F11 — Stock takes · release 1 · June J9 · demo batch 3
- [ ] F11.1 Freeze a stock take: every line, date, who, label; it can't be changed afterwards. (June J9)
- [ ] F11.2 Then vs now for every line; lines removed since are shown as removed. (June J9)
- [ ] F11.3 Export a stock take as a spreadsheet file, with local dates. (demo 3)
- [ ] F11.4 Stock takes are kept on the server and survive every new version. (B3)
**Status:** 🔴 not built

### F12 — Controlled-drug register · release 1 · new · demo batch 3
- [ ] F12.1 Each controlled drug has a running balance. Every line has: when, in / out / correction, amount, balance, who, which doctor and how they approved, witness, reason or case. (Q8)
- [ ] F12.2 Only a doctor takes a controlled drug out or approves it being taken out. Being Admin gives no right. (Danny, batch 2 note)
- [ ] F12.3 A nurse takes one out with a doctor's approval, either in the room (the doctor types their own PIN on the nurse's screen) or by request to the doctor's own phone or Mac (Approve / Ask / Refuse, red badge until answered). Nothing comes off the balance until it's approved; a refused request stays visible, crossed out. (Q13 = A)
- [ ] F12.4 Emergency, no doctor reachable: reason and witness required; booked at once; red "waiting for doctor" on Home and in the register until a doctor approves or queries it. (Q14 = A)
- [ ] F12.5 Every line has a witness: a second person who was there. Never yourself, and never the approving doctor. (Q15 = A, Q8)
- [ ] F12.6 Only a doctor gives another person the right to approve, never themselves; the first doctor is set once at setup with Danny; Admins can't change the list. (Q16 = B)
- [ ] F12.7 A doctor removes someone's right with ✕; it's logged and every doctor is told; the last doctor can't be removed. (Danny, batch 3 note)
- [ ] F12.8 Lines are never edited or deleted. A doctor adds a correction line that names the original, with a witness and a reason; the balance can't go below 0. (Q8, demo 3)
- [ ] F12.9 Receiving needs a witness, no doctor. (demo 3, approved without comment)
- [ ] F12.10 Taking out more than the balance is refused. (demo 3)
**Status:** 🔴 not built

### F13 — Backup, export and import · release 1 · June J11 · demo batch 3
- [ ] F13.1 The server keeps the data and makes a backup every night; the last 30 are kept. (Q5, demo 3)
- [ ] F13.2 Export a backup file to your own computer. (June J11)
- [ ] F13.3 An import with no stock, or with no people, is refused with the reason; nothing changes. (B15)
- [ ] F13.4 A restore shows what changes (now vs after), needs a tick to confirm, and saves a backup of today first. (B15)
- [ ] F13.5 After a restore every screen shows the restored data at once, with no reload. (B2)
- [ ] F13.6 Importing the Excel lists shows problems first: impossible dates (e.g. 1900), the same item twice in one place, double spaces, missing units, lot fields that look like dates. Blocking rows must be fixed in the spreadsheet; the list can be copied for the medics. (B6)
- [ ] F13.7 The real stock and staff lists come only from Danny's files through import; never built in, never in Git. (B9)
- [ ] F13.8 Only Admins import or restore. (demo 3)
**Status:** 🔴 not built

### F14 — Staff · release 1 · June J2 · demo batch 4
- [ ] F14.1 People come from the one REACH people list, shared with EDP; "Add person" adds there; an email already in the list is refused. (Q6 = C)
- [ ] F14.2 The directory shows department, role and training status; "Show archived" shows archived people faded. (June J2)
- [ ] F14.3 Counts never include archived people, even when they're shown. (B26)
- [ ] F14.4 Archive keeps the history and can be undone; delete for good only from archived, logged. Admin-only. (Q17 = B, B18)
- [ ] F14.5 A profile shows training, details and this week's duties. (demo 4)
**Status:** 🔴 not built

### F15 — Training and certificates · release 1 · June J3 · demo batch 4
- [ ] F15.1 Each course shows Valid, Expires in N days (30 or fewer), Expired, Required or In progress. (June J3)
- [ ] F15.2 An expired certificate can be renewed, and a valid one renewed early. (B20)
- [ ] F15.3 Expiry is worked out month-safe: 31 Jan + 1 month = end of February. (B26)
- [ ] F15.4 Archived people are offered no courses. (B26)
- [ ] F15.5 A completion date can't be in the future; every change logged old → new. (demo 4)
- [ ] F15.6 Managers and Admins assign and complete courses. (June J3)
**Status:** 🔴 not built

### F16 — Duty roster · later (planned for release 2) · June J14 placeholder · demo batch 4 (idea only)
- [ ] F16.1 Shows which nurse or doctor is on duty when. (Danny, Stage 3)
- [ ] F16.2 EDP reads it, so the dispatcher only assigns someone on duty at that time; EDP can't change it. (Danny, Stage 3)
- [ ] F16.3 Managers and Admins change it; every change is logged. (Q19 = A)
- [ ] F16.4 What one entry looks like, and the rules it must follow, come from Danny's roster rules in F16's own stages before release 2. (Q18 parked)
**Status:** ⚪ later. Danny, 27 Nov: “Roster I would tackle later.” Gets its own stages, starting from his roster rules.

### F17 — "Used on a case" from EDP · later · June J13 · no demo
- [ ] F17.1 Its own run through the stages when EDP (F79) and the server are ready. The needs are already written down in `PLAN.md` › EDP link: same item IDs, location and lot, a unique ID per message (counted once), corrections, an offline queue, controlled drugs with witness and register.
- [ ] F17.2 Never below zero without a word: overuse is flagged. (B11)
**Status:** ⚪ later

### F18 — Patient File and Patient Archive · later · June J14 placeholder · no demo
- [ ] F18.1 Its own run through the stages: one file per patient (from EDP or added by hand), growing over the years, kept in the Patient Archive, with stricter access. (Danny, Stage 3)
**Status:** ⚪ later
