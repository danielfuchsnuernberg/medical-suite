# AUDIT — REACH Inventory

## 2026-11-26 — Stock-take (no build)

**What was checked:** all 1,641 lines of `index.html` read; app run from a scratch copy in the built-in browser at desktop and phone width (375 px); every Inventory action used once on that copy; built-in data measured with a Node script.

**Result:**
- Runs with **0 console errors** on desktop.
- Measured: 784 item types, 902 stock lines (Store 378; bags: 127 / 143 / 34 / 40 / 8 / 46 / 108 / 18), 10,766 units in total. As of 26 Nov 2026: 208 lines out of stock, 201 expired and 21 expiring within 60 days.
- Working actions: dispense (1000 → 998), restock (→ 1001), stock take frozen (902 lines), CSV export button, persistence after reload.
- 12 bugs written into `BUGS.md` (B1–B12); 4 of them confirmed by reproducing them (B1, B2, B3, B4) and 2 by measuring (B5, B8).
- Live page = repo `index.html` = iCloud file: same md5 `b065284d73c5f392cbb3195fee655e42`.

**Files changed in this session:** new only: `.gitignore`, `CLAUDE.md`, `PLAN.md`, `CHECKLIST.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `BUGS.md`, `AUDIT.md`, `CHANGELOG.md`, `HANDOVER.md`, `docs/foundation/*` (4 files). `index.html` **not touched**.

## 2026-11-26 — Archive of the June prototype

- Danny's OK in chat. Dry run printed before any move.
- 26 files moved into iCloud › AI Projects › REACH Inventory (2 source spreadsheets + 24 archive files). **0 failures; md5 of all 26 identical before and after.**
- To Trash (recoverable): the emptied "Medical Suite" iCloud folder (only .DS_Store files and an empty sub-folder), and `~/Applications/Medical Suite.app`.
- Repo: `index.html` removed (identical to the archived final app, md5 b065284d…). History not rewritten (Q1).
- No real staff names in any tracked file (checked with grep before commit).

## 2026-11-28 — Stage 7 fixes (Workflow B step 9)

- **Diff:** 41 tracked files changed (360 lines added, 88 removed), plus 6 new: `apps/desktop/src/state/saveGuard.js`, `packages/store/test/stage7.test.ts`, `tests/app/stage7.spec.mjs`, `docs/stage7/bugs-and-fixes.html`, `docs/stage7/b51-register-phone.png`, and `imports/` (not ours to commit, untouched). Every changed source file is named in a B29–B57 row of `BUGS.md`, except `apps/desktop/src/screens/Activity.jsx` (“The program” as the name of automatic changes, B48) and `Home.jsx` (the B31/B48 notes), both part of the shown fixes.
- **Tests changed to match the fixes, not weakened:** 7 expected messages (the new amount and PIN wording), 2 password calls (the proof is now needed), the F13.6 duplicate rows (same lot now), the old F13 Excel unit test (another lot is no duplicate), F13.4/F13.5 run without a server (Q30).
- **Each fix proven:** undone one at a time, its test failed: 35 of 35 (B53 and B56 only after the undo step was corrected; B56 has two guards, each enough alone).
- **Full pass:** 172 of 172 unit, 98 of 98 program, 28 Nov.
- **Real data:** the Excel check run on the real files printed counts only (no names, no values, nothing stored).
- Result: ✅ only the intended files changed; the fixes match the page Danny gave GO on, except one consequence found while testing and parked as Q30.

## 2026-11-28 — Stage 8: release 1 (ALL, F1–F15) against the code

- **How:** every Master Checklist line read against the code, not the ticks: two independent auditors (ALL and F1–F7 · F8–F15), each line with file:line, and my own checks of the nine ALL rules; a script matched every line to the tests that name it.
- **Tests per line:** 89 feature lines (F1.1–F15.x), every one named by at least one test; 270 tests in all; 172 unit + 98 program pass (Stage 7, 28 Nov).
- **Lines:** 98 in all. **71 met, 26 partly, 1 not met.** Of the 27: 12 wait for the shared server as planned (F2.1, F2.6, F3.1–F3.5, F4.1, F11.4, F13.1, F12.3 ×2), 1 is a placeholder by plan (F14.5), **12 are gaps: B58–B69** in BUGS.md (2 need Danny's answer: Q31, Q32).
- **Real data (ALL.1):** 574 real item names (16+ letters) from the medics' files compared with every tracked file (counts only printed): 3 found, all in BUGS.md › B6 → B58. History still holds the June list (Danny's Q1 choice).
- **Country (ALL.2):** every new record is stamped "PG" whatever the base's country → B59.
- **Installer (ALL.7):** none; electron-builder chosen in Stage 5 but never set up → B60.
- **Files:** everything tracked sits in the planned top-level places. Inside `packages/core` the code is grouped differently from the plan in ARCHITECTURE.md (register and stock takes in `inventory/`, staff and training in `access/`, unit tests in `packages/*/test`), and its “Folder layout (today)” still describes the June single file → ARCHITECTURE.md is brought up to date in Stage 9.
- **Decisions:** Q27 and Q28 were missing from DECISIONS.md → added the same day.
- Result: ⚠️ audit done; release 1 is **not** ready until B58–B69 are fixed (Workflow B, after Danny's GO).

## 2026-11-28 — Stage 8 gap fixes (Workflow B step 9)

- **Diff:** 35 tracked files changed plus 6 new (`apps/desktop/src/state/appName.js`, `packages/core/src/reachCore/numbers.ts`, `packages/store/test/stage8.test.ts`, `tests/app/stage8.spec.mjs`, `tests/app/b60-packaged.spec.mjs`, `docs/stage8/`). Every changed source file is named in a B58–B69 row, plus `Activity.jsx` (the restore's sentence) and `package-lock.json` (electron-builder 26.18.0, chosen in Stage 5). `imports/` untouched and now ignored; installers in `apps/desktop/release/`, ignored.
- **Removed:** the store door's old “replace everything” restore (no longer used: Q32 = B); its one test now goes through the real restore.
- **Tests changed to match the fixes, never weakened:** F12.13 and B45 (Q31), F13.4 and B29 (Q32: restore sets back), F13.5 (the entry stays), F4.3 (office and staff number on new people).
- **Each fix proven:** 17 of 17 undo checks failed their test; 4 of them only after the test was made stronger (B59 both save paths, B61 a name not contained in the old one, B63 the old-right case, B66 no ignored changes).
- **Installed program:** the packaged Mac app (Apple chip) opened, signed in and showed every main screen, 0 page errors. Intel Mac and Windows builds made, not run here.
- **Real data:** 0 of 574 real item names in tracked files after B58.
- **Full pass:** 181 of 181 unit, 105 of 105 program, 28 Nov.
- Result: ✅ release 1 matches the Master Checklist except ALL.7's two steps that are Danny's (signing, a Windows try).

## 2026-11-28 — Stage 9: the handover followed as a stranger would

- A fresh copy of the repo (`git clone` of 72a9c13) into a scratch folder: no `data/`, no `imports/`, no real data.
- Followed `HANDOVER.md` › How to run it / How to test it, word for word: `npm install` (cache in a scratch folder) → Electron missing, so the documented `node node_modules/electron/install.js` → present.
- `npx vitest run`: **181 of 181** pass. `npm run test:app`: **104 passed, 1 skipped** (the installed-app test skips itself when no installer was built: as designed).
- Result: ✅ the files alone are enough to install, run and test the program.
