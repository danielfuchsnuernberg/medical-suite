# HANDOVER — REACH Inventory

## What exists
A one-file web prototype, "Medical Suite" (MAMA MedEvac). It has working Inventory (store and 8 MedEvac bags, counts, stock takes, CSV) and Personnel. The other five modules are placeholders. Details: `ARCHITECTURE.md`. What's wrong: `BUGS.md`.

## How to run it
- Live: https://danielfuchsnuernberg.github.io/medical-suite/ (or the "Medical Suite" app in the Dock).
- Locally: open `index.html` in a browser. To test without touching your own data, use a different browser profile; data is per browser.
- For Claude: copy `index.html` to the scratchpad, serve it with a small Node server, and open `http://localhost:<port>/` in the browser pane (see `CLAUDE.md`).

## How to test it
No automated tests yet. The stock-take checks are listed in `AUDIT.md` (2026-11-26).

## Current state
Stage 1 (brief captured, stock-take done) → waiting for Danny: confirm the brief, then answer Q1–Q10 on the questions page.
Stock-take map + questions page: https://claude.ai/artifact/QtfUXZpoz93kVKFcGKLzRv (source `docs/stocktake/inventory-stocktake.html`; answers are saved in its database collection `answers`, one document per question, so Claude reads them back with ArtifactData `list`).

## Known limits
- Data lives only in each browser; no sync, no sign-in, no offline install.
- The real stock list and staff names are inside the public page (B9 / Q1).
- Phone layout unusable (B5).

## Next steps
1. Danny answers Q1–Q10 → logged in `PLAN.md` › Q&A.
2. Stage 3: explain the target app back visually.
3. Stage 4: target feature list and demos.

## Machine notes
The Xcode licence must be accepted (`sudo xcodebuild -license`, Danny's password) before plain `git` and `python3` work again on this Mac.
