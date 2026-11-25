# REACH Inventory (repo: medical-suite) — project facts

Danny's rule book (`~/.claude/HOW-I-WORK.md`) applies in full. This file adds this app's facts only.

## What this is
- The stock app for REACH's **medical side**: medication and medical supplies, in the Store and in the MedEvac bags.
- REACH = "Reach the most remote through Aviation". PNG first; Peru and others may follow. **Anything country-specific is a setting, never hard-coded.**
- **The new app gets built from scratch here, properly, in Claude Code** (Danny, 26 Nov 2026): one real app, with a server later, connected to EDP and the other REACH apps. Name: "REACH Inventory" (Q10).
- The June **"Medical Suite"** prototype (one `index.html`, built in claude.ai chats) is **archived** and no longer in this repo. It is a reference only: its 26 bugs in `BUGS.md` are rules the new app must not break. Don't build on it.
- Family: aviation side = EDP (`~/Documents/GitHub/edp`, dispatch Command Center), NM Plotter, etc. Medical side = this app only (plus the separate Checklist Builder in iCloud › AI Projects › 7 Checklist Template - Medics).

## Hard rules for this project
- **No real stock, staff or patient data in Git** (staff names are real too). Real data lives in iCloud (below) or in `data/` (git-ignored). The June `index.html` with the real list was removed from the repo on 26 Nov 2026; older commits still contain it (Q1: Danny chose not to rewrite history).
- **Nothing gets rebuilt, restyled or deleted without Danny's GO.**
- **Look:** medical apps get their own colours. The REACH-wide common look is decided later together with EDP **F53**. Don't restyle now.
- **EDP link** (EDP F79 / Q41: "medication used on a case" → this app takes it off stock) is **not built here yet**. What it needs is written in `PLAN.md` › "EDP link — what it would need". Ideas that belong to EDP or another app go in `PLAN.md` › "Belongs elsewhere", not into this code.
- Commit only when Danny asks; then push (SSH key in `~/.ssh/config`).

## Where things are
- Repo: `danielfuchsnuernberg/medical-suite`, **public**. GitHub Pages is still switched on but has no app to serve.
- **Real source data** (stays out of Git): iCloud › AI Projects › REACH Inventory › `Source data (real)` › `Stock Take 2026.xlsx` (Store) and `Medevac Bag Check List (counts to May 2026).xlsx` (8 bags, newest).
- **Archived June prototype:** iCloud › AI Projects › REACH Inventory › `Archive – June 2026 prototype` (see its README.txt). The Dock app "Medical Suite" was moved to the Trash.
- Design notes from the prototype: `docs/foundation/`. Stock-take, bug list and questions page: `docs/stocktake/` → https://claude.ai/artifact/QtfUXZpoz93kVKFcGKLzRv (answers in its `answers` collection).
- Danny's answers so far: `PLAN.md` › Q&A. Devices: iPhone, iPad, Mac, Windows, Android. Shared stock via a server, fully offline-capable, controlled-drug register.

## This Mac, for this repo
- The Xcode licence is not accepted yet, so `/usr/bin/git` and `python3` refuse to run. Use `DEVELOPER_DIR=/Library/Developer/CommandLineTools git …`, or ask Danny to run `sudo xcodebuild -license`.
- The preview server can't read `~/Documents`. Run the app from a copy in the scratchpad with a small Node server, then open `http://localhost:<port>/`. The browser pane refuses `127.0.0.1`.
- The Dock app's saved data (Safari web-app container) is protected by macOS; it can't be read from the command line.
