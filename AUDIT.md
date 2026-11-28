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
