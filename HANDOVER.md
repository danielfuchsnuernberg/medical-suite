# HANDOVER — REACH Inventory

## What exists
Nothing of the new app yet. The June "Medical Suite" prototype is archived (iCloud › AI Projects › REACH Inventory › Archive – June 2026 prototype); it is a reference only. Its 26 bugs are in `BUGS.md` as rules for the new app. Real source data: iCloud › AI Projects › REACH Inventory › Source data (real).

## How to run it
Nothing to run yet.

## How to test it
No automated tests yet. The stock-take checks are listed in `AUDIT.md` (2026-11-26).

## Current state
**Stage 4 signed off 27 Nov 2026.** The fixed references for building: `PLAN.md` › Target feature list (F1–F18) and `CHECKLIST.md` › Master Feature Checklist (99 lines). Demo pages: batch 1 https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 · batch 2 https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT · batch 3 https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc · batch 4 https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL · checklist https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7. Next: Stage 5 (UI and architecture) after Danny's GO.
Stage 4 started 27 Nov: feature list draft (F1–F18) on https://claude.ai/artifact/AKdfUCwrTn4bZ56tqzQA5F (source `docs/stage4/reach-inventory-features.html`, answers in its `stage4` collection). Approved 27 Nov (all Right; Q12 = A: release 1 = F1–F15, roster F16 in release 2). Demo batch 1 (F1, F2, F3) built 27 Nov: https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 (source `docs/stage4/demo-batch1-foundation.html`, answers in its `batch1` collection). Approved 27 Nov (all Right). Demo batch 2 (F6–F9) built 27 Nov: https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT (source `docs/stage4/demo-batch2-inventory.html`, answers in its `batch2` collection). Approved 27 Nov. Controlled-drug questions Q13–Q16 on https://claude.ai/artifact/LDwa4rB2grPCRgQv5aHFC8 (source `docs/stage4/controlled-drug-questions.html`, answers in its `cdq` collection): answered 27 Nov (A, A, A, B). Demo batch 3 (F10–F13) built 27 Nov: https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc (source `docs/stage4/demo-batch3-records.html`, answers in its `batch3` collection). Approved 27 Nov (page version 2 adds ✕ to remove a doctor's right). Demo batch 4 (F14, F15, F16, F5, F4) built 27 Nov: https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL (source `docs/stage4/demo-batch4-people.html`; answers and Q17–Q19 in its `batch4` collection). Approved 27 Nov (Q17 B, Q19 A, Q18 parked with the roster). Master Checklist drafted 27 Nov: `CHECKLIST.md` › Master Feature Checklist (99 lines); review page https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7 (answers in its `master` collection). If the checklist changes, rebuild the page: `node docs/stage4/master-checklist-build/build.js .` then republish. Waiting for Danny. Open for batch 4: which roles may archive and delete.
Stage 3 signed off 26 Nov (all parts Right; answers in `PLAN.md` › Stage 3 answers). Page: https://claude.ai/artifact/LcTfsHesU2Jap8q6ajrB6E (source `docs/stage3/reach-inventory-blueprint.html`, version 3 with Danny's corrections). Next: Stage 4.
Stage 2 questions page: https://claude.ai/artifact/QtfUXZpoz93kVKFcGKLzRv (answers in its `answers` collection; read with ArtifactData `list`).

## Known limits
- Old commits on GitHub still contain the June app with the real stock list and staff names (Q1: leave).

## Next steps
1. Stage 5: UI (the June look, made into a component list with states) and architecture (shared code base with EDP, server, offline store, data model with IDs and change history), recorded in `ARCHITECTURE.md` and `DECISIONS.md`, shown visually, then Danny's GO.

## Machine notes
The Xcode licence must be accepted (`sudo xcodebuild -license`, Danny's password) before plain `git` and `python3` work again on this Mac.
