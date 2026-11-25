# PLAN — REACH Inventory (medical-suite)

## Original brief (verbatim, 26 Nov 2026)

> This is my Inventory program: the stock app for REACH's medical side (medication and medical supplies). It is partly built, outside Claude Code until now. I'm bringing it in to turn it into a real app.
>
> Context:
> - REACH ("Reach the most remote through Aviation") is a future aviation organisation, built to a professional, commercial standard. Papua New Guinea first; other countries such as Peru may follow, so anything country-specific is a setting, not built into the code.
> - This app belongs to a family of REACH apps. Aviation side: EDP (the dispatch Command Center, in ~/Documents/GitHub/edp), NM Plotter and others. Medical side: this Inventory is the only one built so far.
> - EDP will later send "medication used on a case" to this app, which takes it off stock (EDP feature F79, open question Q41: where that data comes from). Don't build that connection now; just write down what it would need.
> - Look: medical apps get their own colours and their own look. Something common still pulls every REACH app together. That is decided later, together with EDP's F53. Don't restyle anything now.
>
> What I want in this chat, in this order:
> 1. Set up the project: create the standard project files from my rule book (PLAN, CHECKLIST with the Now line, ARCHITECTURE, DECISIONS, BUGS, AUDIT, CHANGELOG, HANDOVER) and a short CLAUDE.md with this app's facts. Make the folder a Git repo if it isn't one, with a .gitignore that keeps out real data, secrets and build output. Set the chat title as usual.
> 2. Stock-take only, no rebuilding: read every file and run the app if possible. Then write down what exists, what works, what's broken or half-done, what tech it uses, and where its data lives. Record what you measured.
> 3. Show me the stock-take visually: a map of the app's screens and data, with what works in green, half-done in amber and missing in red.
> 4. Ask me your questions (illustrated, as always), including: who uses it, on which devices, what "a real app" means for it (iPhone, iPad, desktop, web), and what it must share with EDP and the other apps.
>
> Rules for this chat:
> - Nothing gets rebuilt, restyled or deleted until I've seen the stock-take and said GO.
> - No real stock or patient data goes into Git.
> - Commit only when I ask, then push.
> - Write down every idea that belongs to EDP or another app instead of building it here.
>
> Search my computer for the latest Version of the Inventory Program. Set it up with folders or whatever you need to do.

## Which version was taken (26 Nov 2026)

The newest version is `medical-suite.html` from 26 Jun 2026, 17:05 (368,540 bytes, md5 `b065284d…`). The identical file exists in four places:
- iCloud › AI Projects › Medical Suite › Inventory › `medical-suite.html`
- Downloads › `medical-suite_14.html` and `medical-suite_15.html` (`_1` … `_13` are older steps of the same day)
- GitHub `danielfuchsnuernberg/medical-suite` › `index.html` (3 commits, all 26 Jun, web uploads), which serves the live page
- the Dock app "Medical Suite" in `~/Applications` is a Safari web app that opens that live page

Not the Inventory: `~/Documents/GitHub/the-suite` (that is "Pilot Tools", BK117) and iCloud › `7 Checklist Template - Medics` (a separate checklist builder, see "Belongs elsewhere").

The project now lives at `~/Documents/GitHub/medical-suite`, cloned from GitHub.

## Q&A

Asked on the illustrated questions page (26 Nov 2026). Answers get logged here once Danny has given them.

| # | Question | Proposed default | Answer |
|---|---|---|---|
| Q1 | The live app is public and contains the real stock list and 5 real staff names. What do we do? | Take the real data out of the app and load it from a backup file kept outside Git. Make the repo private, or purge its history (needs Danny's OK, since it means a force-push). | open |
| Q2 | Who uses it? | Medics and nurses at the base (several people), plus Danny as admin | open |
| Q3 | On which devices? | iPad at the base and iPhone in the field, Mac for admin | open |
| Q4 | What does "a real app" mean here? | One installable web app (works on iPhone, iPad and Mac, offline), with no App Store at first | open |
| Q5 | Does everyone see the same stock (shared data / sync)? | Yes: one shared stock, synced through a server, and still working offline | open |
| Q6 | Which parts of the Medical Suite belong to this app? | Inventory only. Personnel moves to a shared REACH people list; Patient Archive, Roster, Calendar and Library become later apps or EDP features. | open |
| Q7 | What does it share with EDP and the other apps? | Sign-in and people, the item catalogue, bags (and which aircraft carries them), the "used on a case" message, the activity log | open |
| Q8 | Controlled drugs (13 items): is stricter recording needed? | Yes: a register with witness, balance and reason for every movement | open |
| Q9 | Must it work with no internet? | Yes, fully. Sync when back in coverage. | open |
| Q10 | Name and branding: "MAMA MedEvac" or REACH? | Name decided with F53. Until then the name is a setting. | open |

## Feature list

### What exists today (from the stock-take, 26 Nov 2026)

| ID | Feature | State |
|---|---|---|
| F1 | Shell: side menu, Home cards, global search, "Acting as" switcher | works on desktop; broken on phone (B5) |
| F2 | Personnel: directory, filters, profile, add/edit, archive, delete | works |
| F3 | Training and courses: assign, mark complete, expiry badges | works |
| F4 | Inventory overview: totals, attention strip, bag readiness, soonest to expire | runs, but readiness is wrong (B1) |
| F5 | Inventory by location: filters, sort, CSV export | works |
| F6 | Item page: stock per location, add/edit/archive/delete item and lines | works |
| F7 | Restock / Dispense (+ / −) | works |
| F8 | Count stock (edit all quantities, then save) | works |
| F9 | Stock takes (frozen dated snapshots, then vs now) | works; a version upload wipes them (B3) |
| F10 | Settings: departments, courses, inventory categories, bags | works; inputs unstyled (B8) |
| F11 | Backup export / import (JSON) | export works; import breaks Inventory until reload (B2) |
| F12 | Activity log | works |
| F13 | Dispatch hook `applyDispense()` | code only: no caller, no UI, no safeguards |
| F14 | Patient Archive, Roster, Calendar, Library, Dispatch | placeholders only |

### Target feature list
Comes after the Q&A (Stage 2) and the explain-back (Stage 3).

## EDP link — what it would need (EDP F79 / Q41, not built)

When EDP records "medication used on case X", this app has to take it off stock. For that to work safely:

1. **Same item list on both sides.** Both apps must use the same item ID (today `IT-1001` …). The catalogue should be owned in one place, by this app.
2. **Where it came from.** Which bag or location (`BG-1` … or Store), and ideally which line or lot, so the right bag drops and controlled drugs stay traceable.
3. **The message.** Case ID (EDP), item ID, quantity and unit, lot number, who gave it, when, and on which aircraft or bag.
4. **No double counting.** Each message carries its own unique ID, so a message that arrives twice only subtracts once.
5. **Corrections.** A way to undo or adjust ("wrong drug recorded"), shown in both apps.
6. **Offline.** Both apps may be offline in PNG. Messages queue up and are sent when coverage returns.
7. **Transport.** A shared server or database both apps talk to. Today neither app has one; this ties to Q5 and Q7.
8. **Never below zero, silently.** Today `applyDispense()` clips at 0 without a warning. It must flag "used more than we thought we had" instead.
9. **Controlled drugs.** If Q8 = yes, the message must also carry a witness and land in the register.

The existing hook `applyDispense({stockLineId, qty, actorId})` covers only points 2 (partly) and 3 (partly).

## Belongs elsewhere (written down, not built here)

| Idea | Belongs to | Source |
|---|---|---|
| Dispatch / MedEvac callouts (the "Dispatch APP" card in the Suite) | EDP | the Suite's nav and data model |
| "Used in MedEvacs" panel on an item, filled from callouts | EDP F79 sends; this app shows | item page placeholder |
| Patient Archive (patient records and history) | separate medical app or EDP cases; to decide | Suite placeholder |
| Roster and shift planning for medical staff | EDP or a shared REACH crew tool; to decide | Suite placeholder |
| Personnel, training and certifications | shared REACH people / crew records (EDP has crew too) | Suite Personnel module |
| Calendar, Library (documents, course materials) | shared REACH tools; to decide | Suite placeholders |
| Pre-flight medical equipment check / checklist builder | its own app (iCloud › 7 Checklist Template - Medics); could later read bag contents from here | found on disk |
| Common REACH look | EDP F53 | brief |

## Additional thoughts
_None yet._
