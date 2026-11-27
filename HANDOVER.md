# HANDOVER — REACH Medical Suite

## What exists
Nothing of the new app yet. The June "Medical Suite" prototype is archived (iCloud › AI Projects › REACH Inventory › Archive – June 2026 prototype); it is a reference only. Its 26 bugs are in `BUGS.md` as rules for the new app. Real source data: iCloud › AI Projects › REACH Inventory › Source data (real).

## How to run it
Nothing to run yet.

## How to test it
No automated tests yet. The stock-take checks are listed in `AUDIT.md` (2026-11-26).

## Current state
**Stage 5 started 27 Nov.** Lined up with the REACH Core rules (`../reach/CORE-DATA.md`): Danny said yes to all five points, Q20 = A, Q21 = A (page https://claude.ai/artifact/S65PV6inHY3UG8h87fo3sz). The program is now called **REACH Medical Suite** (MD); Inventory is MD1. Look and structure proposed on https://claude.ai/artifact/CDkrByh9ypq4YXu4sN7vBj (answers in its `stage5` collection); `ARCHITECTURE.md` top section is the target (PROPOSED). **Stage 6: F1 and F3 built and tested (27 Nov); F2 next.** Stage 5 signed off 27 Nov (GO). Next: F2, then Stage 6, building F1 → F15 in order, each tested against its checklist lines. Before release 1: the server location must be decided in the REACH chat.
**Stage 4 signed off 27 Nov 2026.** The fixed references for building: `PLAN.md` › Target feature list (F1–F18) and `CHECKLIST.md` › Master Feature Checklist (99 lines). Demo pages: batch 1 https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 · batch 2 https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT · batch 3 https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc · batch 4 https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL · checklist https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7. Next: Stage 5 (UI and architecture) after Danny's GO.
Stage 4 started 27 Nov: feature list draft (F1–F18) on https://claude.ai/artifact/AKdfUCwrTn4bZ56tqzQA5F (source `docs/stage4/reach-inventory-features.html`, answers in its `stage4` collection). Approved 27 Nov (all Right; Q12 = A: release 1 = F1–F15, roster F16 in release 2). Demo batch 1 (F1, F2, F3) built 27 Nov: https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 (source `docs/stage4/demo-batch1-foundation.html`, answers in its `batch1` collection). Approved 27 Nov (all Right). Demo batch 2 (F6–F9) built 27 Nov: https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT (source `docs/stage4/demo-batch2-inventory.html`, answers in its `batch2` collection). Approved 27 Nov. Controlled-drug questions Q13–Q16 on https://claude.ai/artifact/LDwa4rB2grPCRgQv5aHFC8 (source `docs/stage4/controlled-drug-questions.html`, answers in its `cdq` collection): answered 27 Nov (A, A, A, B). Demo batch 3 (F10–F13) built 27 Nov: https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc (source `docs/stage4/demo-batch3-records.html`, answers in its `batch3` collection). Approved 27 Nov (page version 2 adds ✕ to remove a doctor's right). Demo batch 4 (F14, F15, F16, F5, F4) built 27 Nov: https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL (source `docs/stage4/demo-batch4-people.html`; answers and Q17–Q19 in its `batch4` collection). Approved 27 Nov (Q17 B, Q19 A, Q18 parked with the roster). Master Checklist drafted 27 Nov: `CHECKLIST.md` › Master Feature Checklist (99 lines); review page https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7 (answers in its `master` collection). If the checklist changes, rebuild the page: `node docs/stage4/master-checklist-build/build.js .` then republish. Waiting for Danny. Open for batch 4: which roles may archive and delete.
Stage 3 signed off 26 Nov (all parts Right; answers in `PLAN.md` › Stage 3 answers). Page: https://claude.ai/artifact/LcTfsHesU2Jap8q6ajrB6E (source `docs/stage3/reach-inventory-blueprint.html`, version 3 with Danny's corrections). Next: Stage 4.
Stage 2 questions page: https://claude.ai/artifact/QtfUXZpoz93kVKFcGKLzRv (answers in its `answers` collection; read with ArtifactData `list`).

## Known limits
- Public GitHub Pages: checked 27 Nov after Stage 4, now 404 (June copy gone).
- `imports/` (from the REACH chat: medics' checklist, roster style guide, SOP PDFs) is in this folder, uncommitted; ask Danny before committing (repo is public; the SOPs are company documents).
- Old commits on GitHub still contain the June app with the real stock list and staff names (Q1: leave).

## Next steps
1. Stage 6: set up the workspace (npm workspaces, EDP versions, Electron), then F1 window/menu/search, F2 sign-in and levels, F3 store door and offline; each feature built, then its Master Checklist lines tested.
2. In the REACH chat: decide where the shared server runs (SD2 / EDP Q44); release 1 waits for it.

## Machine notes
The Xcode licence must be accepted (`sudo xcodebuild -license`, Danny's password) before plain `git` and `python3` work again on this Mac.
