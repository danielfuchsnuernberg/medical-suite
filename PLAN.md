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

## Newest data — checked 26 Nov 2026 (Danny: "the most up-to-date version is the one we imported an Excel sheet into")
- **App:** there is only one final app version (26 Jun 17:05). It has both spreadsheets built in: the Store from `Stock Take 2026.xlsx`, the 8 bags from `Medevac Bag Check List.xlsx`. No later app file exists on this Mac (searched by content with Spotlight, plus iCloud, Downloads, Desktop and GitHub). A version that only exists in a claude.ai chat can't be seen from here.
- **But the bag numbers in the app are the March count.** MAMA's Bag: 112 of 127 lines equal March, 98 equal May. P2-ICU: 106 of 108 equal March, 60 equal May.
- **Newest real data:** `~/Downloads/Medevac Bag Check List.xlsx`, last saved in Excel on 26 Jun 2026 15:19 PNG (downloaded 13 Aug). It adds the **April and May** counts for all 8 bags (e.g. MAMA's Bag: 122 lines counted in Apr and May). The iCloud copy stops at Mar/Apr.
- **Store:** `Stock Take 2026.xlsx` exists in one version only.
- **For the new app:** stock is loaded from the newest spreadsheets (bags: the Downloads copy; Store: Stock Take 2026), not from the June app's built-in list. Which month counts as "now" is a question for the data import (Stage 2).

## Q&A

Asked on the illustrated questions page (26 Nov 2026). Answers read back from the page on 26 Nov 2026.

| # | Question | Proposed default | Answer |
|---|---|---|---|
| Q1 | The live app is public and contains the real stock list and 5 real staff names. What do we do? | Take the real data out of the app and load it from a backup file kept outside Git. Make the repo private, or purge its history (needs Danny's OK, since it means a force-push). | **Leave it (c).** Then on 26 Nov in chat: archive everything, so the June app file came off GitHub (the page no longer shows it). History stays untouched: no force-push. |
| Q2 | Who uses it? | Medics and nurses at the base (several people), plus Danny as admin | **b** — a few medics and nurses at the base, Danny as admin |
| Q3 | On which devices? | iPad at the base and iPhone in the field, Mac for admin | **All five:** iPhone, iPad, Mac, Windows PC, Android phone |
| Q4 | What does "a real app" mean here? | One installable web app (works on iPhone, iPad and Mac, offline), with no App Store at first | **Not sure**, with a note: "A real App for Mac and Windows, depending on the user's machine. Needs a server because a doctor uses it on her Mac and makes changes while the nurses use a Windows computer and also make changes." → to explain again (follow-up) |
| Q5 | Does everyone see the same stock (shared data / sync)? | Yes: one shared stock, synced through a server, and still working offline | **b** — one shared stock, synced through a server |
| Q6 | Which parts of the Medical Suite belong to this app? | Inventory only. Personnel moves to a shared REACH people list; Patient Archive, Roster, Calendar and Library become later apps or EDP features. | **Not sure**, with a note: originally "Medical Suite" was meant as the parent app housing Inventory, Roster, Patient Archive etc.; now unsure, since everything grows into one closed REACH system with many more apps. → to explain again (follow-up) |
| Q7 | What does it share with EDP and the other apps? | Sign-in and people, the item catalogue, bags (and which aircraft carries them), the "used on a case" message, the activity log | **Sign-in and people, item list, bags ↔ aircraft, "used on a case" message, activity log** (common look not picked here; it stays with F53) |
| Q8 | Controlled drugs (13 items): is stricter recording needed? | Yes: a register with witness, balance and reason for every movement | **a** — full register: reason, witness, running balance |
| Q9 | Must it work with no internet? | Yes, fully. Sync when back in coverage. | **a** — fully offline, sync later |
| Q10 | Name and branding: "MAMA MedEvac" or REACH? | Name decided with F53. Until then the name is a setting. | **b** — "REACH Inventory" |
| Q11 | Is the June app used for real counts? | No | Page: **a** (yes). Then in chat, later: "No one uses the app or webpage." **The chat answer counts: nobody uses it.** |

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

**26 Nov 2026 (Stage 1, during the bug hunt), Danny:**
> The app was built before I came up with the bigger, better master prompt. This app will be part of a bigger App Family which connects to the EDP and other apps. Inventory and staff is real. I want to turn this into a real App which probably needs a server later just like a few other apps in that family.

What it means here:
- **Real data confirmed:** the 5 staff and the 784-item stock list in the public `index.html` are real. B9 / Q1 becomes the most urgent item.
- **Rebuild, not patch:** the June prototype is a reference, not the base to keep patching. Its bugs are written down so the new app doesn't repeat them. Only bugs that endanger real data now are worth patching in the prototype.
- **Server later, family-wide:** design the data layer so a shared server can be added without a rewrite (same IDs, change history, offline queue), in step with the other family apps. Feeds into Q5 (shared stock), Q7 (what's shared with EDP) and Q9 (offline).
- Classified as "anything else" (§5): it changes the scope of the whole project and runs through the normal stages, no build before GO.

**26 Nov 2026 (Workflow B step 6), Danny:**
> No one uses the app or webpage. I simply want to build it good this time and proper. Server, connected to the rest of the apps later. Build it as an App. In fact you can delete the rest of the files related to that, or archive them somewhere. I just don't want to get confused. One app, real App, I was learning back then when I worked on it. For example I did the entire app in Chats and downloaded every artifact you've made for me. Now I understand better. I only work with Claude Code, and this time do it right.

What it means here:
- **Q11 answered: nobody uses the June app.** No patches to the June app. All 26 bugs become rules for the new app.
- **One app, one place:** every old copy (Downloads, iCloud, Dock app, the repo's `index.html`) goes into one archive folder, so only the new app is left in sight. Nothing is deleted for good; the plan is listed in `CHECKLIST.md` and waits for Danny's OK.
- **"Build it as an App" + server later:** feeds Q4 (what kind of app) and Q5 (shared stock). Q4 stays open: "App" can mean the App Store or an installable app, and that choice is Danny's.
