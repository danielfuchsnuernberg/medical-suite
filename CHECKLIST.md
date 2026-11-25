# CHECKLIST — REACH Inventory
**Now:** Stage 2 — Q&A · waiting for Danny: Q4 (what kind of app) and Q6 (what this app contains) explained again, then his answers

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
- [ ] Danny's answers logged in `PLAN.md` › Q&A
- [ ] Follow-up questions (if any) asked and answered
**Tests for this stage:**
- [ ] Every row in the Q&A table has an answer
**Status:** 🟡 IN PROGRESS
**Open questions:** Q1–Q10

### STAGE 3 — Explain It Back
**Status:** 🔴 OPEN

### STAGE 4 — Demo Version
**Status:** 🔴 OPEN

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
Comes in Stage 4. Today's features (F1–F14) and their state are listed in `PLAN.md` › Feature list.
