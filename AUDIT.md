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
