# REACH Inventory (repo: medical-suite) — project facts

Danny's rule book (`~/.claude/HOW-I-WORK.md`) applies in full. This file adds this app's facts only.

## What this is
- The stock app for REACH's **medical side**: medication and medical supplies, in the Store and in the MedEvac bags.
- REACH = "Reach the most remote through Aviation". PNG first; Peru and others may follow. **Anything country-specific is a setting, never hard-coded.**
- Today the code is the **"Medical Suite"** prototype (branded "MAMA MedEvac"): one `index.html`, vanilla JS, no build step. Inventory and Personnel work; Patient Archive, Roster, Calendar, Library and Dispatch are empty placeholders.
- Family: aviation side = EDP (`~/Documents/GitHub/edp`, dispatch Command Center), NM Plotter, etc. Medical side = this app only (plus the separate Checklist Builder in iCloud › AI Projects › 7 Checklist Template - Medics).

## Hard rules for this project
- **No real stock or patient data in Git.** Real data lives in `data/` (git-ignored) or outside the repo. Note: `index.html` currently still has the real stock list (784 items / 902 lines) and 5 real staff names baked in, from before this rule. That is open question Q1. Don't spread it further.
- **Nothing gets rebuilt, restyled or deleted without Danny's GO.**
- **Look:** medical apps get their own colours. The REACH-wide common look is decided later together with EDP **F53**. Don't restyle now.
- **EDP link** (EDP F79 / Q41: "medication used on a case" → this app takes it off stock) is **not built here yet**. What it needs is written in `PLAN.md` › "EDP link — what it would need". Ideas that belong to EDP or another app go in `PLAN.md` › "Belongs elsewhere", not into this code.
- Commit only when Danny asks; then push (SSH key in `~/.ssh/config`).

## Where things are
- Live app: https://danielfuchsnuernberg.github.io/medical-suite/ (GitHub Pages from `main`, **public repo**). Danny has it in the Dock as "Medical Suite" (Safari web app).
- Data at runtime: the browser's `localStorage`, key `medsuite.store`, separate per browser and device. There is no server and no sync.
- Original source material (real data, **stays out of Git**): iCloud › AI Projects › Medical Suite › Inventory › `Stock Take 2026.xlsx`, `Medevac Bag Check List.xlsx`.
- Design notes from the prototype: `docs/foundation/` (data model, tokens, style guide).

## This Mac, for this repo
- The Xcode licence is not accepted yet, so `/usr/bin/git` and `python3` refuse to run. Use `DEVELOPER_DIR=/Library/Developer/CommandLineTools git …`, or ask Danny to run `sudo xcodebuild -license`.
- The preview server can't read `~/Documents`. Run the app from a copy in the scratchpad with a small Node server, then open `http://localhost:<port>/`. The browser pane refuses `127.0.0.1`.
