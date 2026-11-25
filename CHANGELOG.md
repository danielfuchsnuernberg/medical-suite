# CHANGELOG — REACH Inventory

## 2026-11-26 — June prototype archived; new app to be built from scratch
- Danny: nobody uses the June app; build one real app properly, server later, connected to the REACH family.
- Bug hunt: 26 bugs (two independent passes, all reproduced) in `BUGS.md`; all become rules for the new app, no patches.
- Newest real data found: the Downloads bag check list (counts to May 2026) is newer than what the June app contained (March).
- Archived to iCloud › AI Projects › REACH Inventory: 26 files (source data + archive, README). Old folder and Dock app → Trash.
- `index.html` (the June app with real data) removed from the repo. Git history left as is (Q1).
- Danny's answers Q1–Q11 logged in `PLAN.md`.

## 2026-11-26 — Brought into Claude Code
- Found the newest version on the Mac (see `PLAN.md` › "Which version was taken") and cloned the GitHub repo to `~/Documents/GitHub/medical-suite`.
- Added the rule-book files, `CLAUDE.md` and `.gitignore` (keeps out real data, secrets and build output).
- Copied the prototype's design notes from iCloud into `docs/foundation/`.
- Stock-take written down (`ARCHITECTURE.md`, `BUGS.md`, `AUDIT.md`). **The app itself (`index.html`) is unchanged.**
- Not committed yet: waiting for Danny.

## 2026-06-26 — Prototype (before Claude Code)
- "Medical Suite" built in claude.ai chats: shell, Personnel, then Inventory with the real stock list imported from `Stock Take 2026.xlsx` / `Medevac Bag Check List.xlsx`. Uploaded to GitHub by web upload (3 commits).
