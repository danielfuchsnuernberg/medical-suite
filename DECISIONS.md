# DECISIONS — REACH Inventory

| Date | Decision | Alternative | Why the alternative was rejected |
|---|---|---|---|
| 2026-11-26 | The project lives in `~/Documents/GitHub/medical-suite`, cloned from the existing GitHub repo | a fresh folder with a new repo | the repo already serves the live page and has the history; a second repo would split them |
| 2026-11-26 | Version taken: `medical-suite.html` of 26 Jun 2026 17:05 (md5 b065284d…) | `medical-suite copy.html` / Downloads `_12`, `_13` | those are byte-identical to each other and older (c2d4b456…); the chosen file is newest and equals what's live |
| 2026-11-26 | Repo name and code keep "medical-suite" and "MAMA MedEvac" for now | rename to "REACH Inventory" now | renaming touches the live URL and the branding, which are Q4/Q10 and F53; no change without GO |
| 2026-11-26 | Prototype design notes copied into `docs/foundation/` (data model, tokens, style guide) | leave them only in iCloud | the files are the written intent behind the code; they contain no real data |
| 2026-11-26 | Real data (spreadsheets, backups, CSV) stays out of Git via `.gitignore` | track it in a private repo | Danny's rule: no real stock or patient data in Git |
| 2026-11-26 | The real data already in `index.html` is **left untouched** until Danny decides (Q1) | strip it right away | "nothing deleted until GO"; stripping without a replacement loader would also empty the live app |
