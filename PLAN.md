# PLAN — REACH Medical Suite (medical-suite; called REACH Inventory until Q21, 27 Nov 2026)

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
| Q4 | What does "a real app" mean here? | One installable web app (works on iPhone, iPad and Mac, offline), with no App Store at first | **Not sure** at first, with a note: "A real App for Mac and Windows, depending on the user's machine. Needs a server because a doctor uses it on her Mac and makes changes while the nurses use a Windows computer and also make changes." Re-asked 26 Nov (Q4 again); new note: "Does not have to be in the App Store. Just a real app, not a web page. We are turning every other app as well into the same system." **Danny 26 Nov in chat: "B, go straight to the real program."** → one shared code base (same as EDP), shipped as **real installed programs for Mac and Windows** (outside the App Store), with no installable-web-link step first. iPhone, iPad and Android (Q3) follow the same path as EDP (its P5). |
| Q5 | Does everyone see the same stock (shared data / sync)? | Yes: one shared stock, synced through a server, and still working offline | **b** — one shared stock, synced through a server |
| Q6 | Which parts of the Medical Suite belong to this app? | Inventory only. Personnel moves to a shared REACH people list; Patient Archive, Roster, Calendar and Library become later apps or EDP features. | **Not sure** at first (note: "Medical Suite" was meant as the parent app; now everything grows into one REACH system). 26 Nov in chat, after the explanation: users want **one app with everything in it**, and Danny likes **one list of people** shared with EDP. → Proposed **C: one medical app outside (menu: Inventory first, then Staff, Roster, Patients), shared REACH foundation inside (one people list, one sign-in, roster owned by EDP, server)**. *(Corrected in Stage 3, 26 Nov: the duty roster lives in this app; EDP reads who is on duty.)* **Danny 26 Nov: "Yes, take C".** Knock-on: app name may be "REACH Medical" with Inventory as its first section (Q10, with F53). |
| Q7 | What does it share with EDP and the other apps? | Sign-in and people, the item catalogue, bags (and which aircraft carries them), the "used on a case" message, the activity log | **Sign-in and people, item list, bags ↔ aircraft, "used on a case" message, activity log** (common look not picked here; it stays with F53) |
| Q8 | Controlled drugs (13 items): is stricter recording needed? | Yes: a register with witness, balance and reason for every movement | **a** — full register: reason, witness, running balance |
| Q9 | Must it work with no internet? | Yes, fully. Sync when back in coverage. | **a** — fully offline, sync later |
| Q10 | Name and branding: "MAMA MedEvac" or REACH? | Name decided with F53. Until then the name is a setting. | **b** — "REACH Inventory" |
| Q11 | Is the June app used for real counts? | No | Page: **a** (yes). Then in chat, later: "No one uses the app or webpage." **The chat answer counts: nobody uses it.** |
| Q12 | (Stage 4, 27 Nov) What goes into the first release? | **A:** release 1 = F1–F15 (everything the June app had, plus sign-in, offline and the register); release 2 = the roster F16, together with EDP reading it. B: roster in release 1 too. C: inventory first (F1–F13), people in release 2. | **A** (Stage 4 page, 27 Nov 2026): release 1 = F1–F15, release 2 = the roster F16 together with EDP reading it |
| Q13 | (Stage 4, 27 Nov, from Danny's batch 2 note) How does the doctor approve when a nurse takes out a controlled drug? | **A:** both: doctor signs with own PIN on the nurse's screen when in the room, or approves a request on their own phone/Mac when away. B: only in the room. C: only from the doctor's device. | **A** (27 Nov): both — doctor signs with own PIN in the room, or approves a request on own phone/Mac when away |
| Q14 | What if no doctor can be reached and it can't wait? | **A:** allowed as an emergency (reason + witness), booked at once, flagged red "waiting for doctor" until a doctor approves or queries it. B: never without a doctor. | **A** (27 Nov): emergency allowed with reason + witness, booked at once, flagged red until a doctor approves or queries it |
| Q15 | Is the doctor's approval also the witness? | **A:** keep both: doctor approves and a second person who was there witnesses (Q8). B: approval counts as the witness. | **A** (27 Nov): keep both — doctor approves, a second person who was there witnesses |
| Q16 | Who decides who may approve controlled drugs? | **B:** only a doctor can make someone else a doctor (never themselves); the first doctor is set once at setup; Admins can't change it. A: Admin ticks it, all doctors told. | **B** (27 Nov): only a doctor makes someone else a doctor, never themselves; first doctor set once at setup; Admins can't change it |
| Q17 | (Stage 4 batch 4) Who may archive and delete? | **B:** everyone archives stock; deleting stock for good needs a Manager or Admin; people: only Admins archive and delete. A: as June (stock: everyone; people: Admins). C: only Admins, everything. | **B** (27 Nov): everyone archives stock; deleting stock for good needs a Manager or Admin; people: only Admins |
| Q18 | What does one roster entry look like? | **A:** Day / Night / On call / Off, shift times set in Settings. B: on duty / off, whole days. C: start and end times per person. | **Parked** (27 Nov, "Not sure"): “I didn't start the Roster Feature / App yet, since that has to follow a set of other rules.” Decided when F16 gets its own run through the stages, with those rules, before release 2 |
| Q19 | Who may change the roster? | **A:** Managers and Admins. B: everyone, each change logged. C: only Admins. | **A** (27 Nov): Managers and Admins |
| Q20 | (Stage 5, REACH Core R3) How do Staff / Manager / Admin map onto REACH's View / Work / Manage? | **A:** Staff → Work; Manager and Admin → Manage; View for look-only access; levels set by Management (REACH Q11). B: keep Admin as a fourth level (needs a REACH rule change). C: Staff → View, Manager → Work, Admin → Manage. | **A** (27 Nov): Staff → Work, Manager and Admin → Manage; View for look-only; levels set by Management |
| Q21 | (Stage 5, REACH D4) Program name and parts | **A:** “REACH Medical Suite” (code MD), Inventory = MD1; Patient Archive, Roster, Calendar, Medical Library, SOPs as later parts (new F19–F21). B: keep “REACH Inventory”, add the parts. C: keep “REACH Inventory”, no Calendar/Library/SOPs. | **A** (27 Nov): “REACH Medical Suite” (MD), Inventory = MD1; MD2–MD6 later (F18, F16, F19–F21) |
| Q22 | (Stage 6, before F2) Until the server exists, how does a person get a password on a computer, and who makes the first account? | **A:** first start: the first Management person sets up the computer with their own account; after that a Manage-level person gives each person a one-time starting password, changed at first sign-in; forgotten → new one-time password. B: each person sets their own the first time they pick their name. C: no passwords until the server. | **A** (27 Nov, on the page): first Management person sets up the computer; one-time passwords from a Manage-level person, changed at first sign-in |
| Q26 | (found 28 Nov while building F13) How are the medics' Excel stock lists read? Three parts: (1) which month column is “now”; (2) what happens to each sheet (one place each); (3) controlled drugs in the lists. | 1 **A (proposed)**: per row, the last month with a number; B: one month for the file; C: the first count column. 2 **A (proposed)**: match each sheet to a bag by name, a new name becomes a new bag (shown in the preview); B: only matching sheets. 3 **A (proposed)**: tick them in the preview, they load with an opening register line a doctor confirms with a witness; B: leave them out. Page: https://claude.ai/artifact/7kAfkVHZnQhMK6PKY28iie (source `docs/stage6/import-question.html`, answers in its `q26` collection) | **A, A, A** (28 Nov, in chat: “go with your proposed answers”; the page saved only part 1, see B28). Part 3 now meets Danny's new idea below (only a doctor marks a controlled drug): how the import's tick fits is part of that change |
| Q27 | (Stage 7, B31) Two computers offline dispense the same stock; back online it is below zero. What then? | **A:** red flag on the line, Overview and Home until someone counts it; both dispenses stay. B: undo the later dispense. C: show 0, say nothing. | **A** (Danny, 28 Nov, on the Stage 7 page; GO for all 29 fixes the same time) |
| Q28 | (Stage 7, B33) A comma in an amount (“1,000”, “12,0”) | **A:** refuse commas and points, with the example 1000. B: comma = thousands. C: comma = decimal point (today, the bug). | **A** (Danny, 28 Nov, on the Stage 7 page; GO for all 29 fixes the same time) |
| Q29 | (Stage 7, B57) A bag line with required 0 | **A:** required 0 means nothing needed (0 on hand is OK). B: 0 isn't allowed; leave it empty. | **A** (Danny, 28 Nov, on the Stage 7 page; GO for all 29 fixes the same time) |
| Q30 | (Stage 7, found while fixing B29) Once there is a server: should a restore undo everyone's changes since the backup (roll back on every computer), or only bring back what was lost (today's fix: every computer gets the backup's messages and keeps its own)? | proposed later, with SD2 | **answered by Q32 = B (28 Nov):** a restore sets records back with new changes, so with a server every computer rolls back too |
| Q31 | (Stage 8, B63) Management can take a doctor off the doctors' list by changing the profession, even the last one. Who may? | **A:** a doctor removes them first (✕); Management names a first doctor only once ever. B: the Head Doctor confirms. C: leave it. | **A** (Danny, 28 Nov, on the Stage 8 page; GO for all 12 gap fixes) |
| Q32 | (Stage 8, B66) A restore removes the Activity entries made since the backup. What should it do? | A: replace, but log the restore. **B:** set records back with new changes, every entry stays (also answers Q30). | **B** (Danny, 28 Nov, on the Stage 8 page; GO for all 12 gap fixes) |
| Q25 | (found 28 Nov while building F9; to ask as an illustrated page before F12) Moving a controlled drug between the Store and a bag doesn't change its balance. Does it need its own register line (with a witness)? Until answered, a controlled drug can't be moved, edited in amount, restocked or dispensed outside the register. | A (proposed): a “Moved” register line with a witness, no doctor; balance unchanged. B: a “Moved” line without a witness. C: an Out (with a doctor) and an In (with a witness). D: not in the register, only in Activity. Page: https://claude.ai/artifact/STUm8975FUBe7zamEputZ5 (source `docs/stage6/cd-move-question.html`, answer in its `q25` collection). Found while showing it: the approved register demo gave each drug only one place | **A** (28 Nov, typed in chat; the page didn't save): moving a controlled drug between places is a “Moved” register line with a witness, no doctor; the balance doesn't change; F12.1 gains the line type “moved”, and a new line F12.11 |
| Q24 | (found 28 Nov while building F8) When all of a line is moved away, does the emptied line stay (at 0) or get archived? The checklist says nothing; demo batch 2 archived it. Archiving a bag line makes the bag forget what it must carry, so it can show “Ready” with nothing in it (B25 kind). | A: always keep it at 0 (as built for now). B: always archive it (as the demo). **C (proposed):** keep it at 0 if it has a required amount or reorder level; otherwise archive it. Page: https://claude.ai/artifact/1QgMRcRqYBihnspJahsjqF (source `docs/stage6/move-question.html`, answer in its `q24` collection) | **C** (28 Nov, on the page): an emptied line stays at 0 if it has a required amount or reorder level; otherwise it is archived, in the same save; the message says which |
| Q23 | (found 28 Nov while building F2; for F5, not blocking) F2.3 says a Work-level person “can't open Settings”; F5.7 says “only Manage changes settings; everyone else can look”. Which one? | A: locked below Manage (as F2.3, as built). B: everyone looks at all of Settings, read-only. **C (proposed):** everyone looks at the base's settings and lists; People and access stays Manage-only. Changing stays Manage-only in all three. | **C** (28 Nov, on the page): nurses look at the base's settings and lists; People and access stays Manage-only; F2.3 and F5.7 reworded |

## Stage 3 answers (Danny, on the Stage 3 page, 26 Nov 2026)
Page: https://claude.ai/artifact/LcTfsHesU2Jap8q6ajrB6E (collection `stage3`). Read 26 Nov 2026: 11 parts. **Right** on 10; "No internet" had a note but no tick. **Overall: Right, "sounds good."**

| Part | Verdict | Danny's note (verbatim) | What it changes |
|---|---|---|---|
| Big picture | Right | — | — |
| Inside the app | Right | "If you mean a Patient File, which gets stored in Patient archive, than yes. Looks good. Every Patient, from EDP or Manually added, gets his/her own file which can be updated and will be expanded over years. That file gets stored in a Patient archive. Both are not build yet. comes later." | Patients = one **Patient File** per patient (from EDP or added by hand), updated and growing over years, kept in the **Patient Archive**. Both later. |
| From the June app | Right | "The Roster shows which Nurse or doctor works when. This gets important for the EDP because the dispatcher can only assign a nurse or a doctor, who is on duty during that time." | The roster is a real duty roster (who works when), and EDP needs it for dispatch. |
| One list of people | Right | "EDP does not have its own roster. No roster funktion within EDP. Roster only exists in the Medical Suite." | **Correction:** the page said EDP owns the roster. Wrong. The duty roster lives in this app; EDP reads it. (Checked in EDP's code: its Settings has "Pilot roster" / "Medic roster", which are name lists, not duty plans.) |
| No internet | (no tick) | "App also needs to Open without Internet." | Added: the program must **start** with no internet, not only keep working once open. |
| Used on a case | Right | "sounds right to me." | — |
| Controlled drugs | Right | "good." | — |
| June mistakes → rules | Right | "good." | — |
| Country settings | Right | "good." | — |
| Not in this app | Right | — | — |
| Overall | Right | "sounds good." | Stage 3 signed off, with the three changes above applied to the page. |

## Feature list

### What the June app has (from the stock-take, 26 Nov 2026)
Called F1–F14 in the stock-take, the Stage 3 page and the 26 Nov `CHANGELOG.md` entry. **Renamed J1–J14 on 27 Nov 2026** so they can't be confused with the new app's F-numbers below.

| ID | Feature | State |
|---|---|---|
| J1 | Shell: side menu, Home cards, global search, "Acting as" switcher | works on desktop; broken on phone (B5) |
| J2 | Personnel: directory, filters, profile, add/edit, archive, delete | works |
| J3 | Training and courses: assign, mark complete, expiry badges | works |
| J4 | Inventory overview: totals, attention strip, bag readiness, soonest to expire | runs, but readiness is wrong (B1) |
| J5 | Inventory by location: filters, sort, CSV export | works |
| J6 | Item page: stock per location, add/edit/archive/delete item and lines | works |
| J7 | Restock / Dispense (+ / −) | works |
| J8 | Count stock (edit all quantities, then save) | works |
| J9 | Stock takes (frozen dated snapshots, then vs now) | works; a version upload wipes them (B3) |
| J10 | Settings: departments, courses, inventory categories, bags | works; inputs unstyled (B8) |
| J11 | Backup export / import (JSON) | export works; import breaks Inventory until reload (B2) |
| J12 | Activity log | works |
| J13 | Dispatch hook `applyDispense()` | code only: no caller, no UI, no safeguards |
| J14 | Patient Archive, Roster, Calendar, Library, Dispatch | placeholders only |

### Target feature list — APPROVED by Danny, 27 Nov 2026 (Stage 4 part 1)
Page: https://claude.ai/artifact/AKdfUCwrTn4bZ56tqzQA5F (source `docs/stage4/reach-inventory-features.html`; answers in its `stage4` collection). The screens are the June screens. "Rules" are the June bugs the feature must not repeat; each of B1–B26 sits with exactly one feature (checked on the page: 26 of 26). Release column = Q12 answer A. Danny on the page, 27 Nov 01:00–01:08: the features in the window, the full list, "Nothing lost" and the demo order all **Right**, no notes; Q12 = **A**; overall **"Yes, that's it"**.

| ID | Feature | From June | Rules | Demo batch | Release |
|---|---|---|---|---|---|
| **Foundation** | | | | | |
| F1 | Program window, menu and search (also on phone/tablet screens) | J1 | B4, B5, B7 | 1 | 1 |
| F2 | Sign-in and roles (replaces "Acting as"; shared REACH people list) | J1 | B12, B14, B23 | 1 | 1 |
| F3 | Works without internet: opens offline, saves locally, syncs, shows conflicts and failed saves | new (Q9, Stage 3) | B3, B22 | 1 | 1 |
| F4 | Activity log: REACH-wide, old → new, deletes logged | J12 | B18, B19 | 4 | 1 |
| F5 | Settings and country settings (base name, time zone, date style, controlled-drug list) | J10 | B8, B13, B21 | 4 | 1 |
| **Inventory** | | | | | |
| F6 | Inventory overview (readiness right, "not set up", Store reorder levels) | J4 | B1, B10, B25 | 2 | 1 |
| F7 | Store and bags (by location): filters, sort, CSV export | J5 | — | 2 | 1 |
| F8 | Item page; stock lines can move between bags | J6 | B24 | 2 | 1 |
| F9 | Restock and dispense; wrong amounts refused | J7 | B17 | 2 | 1 |
| F10 | Count stock; typed numbers kept, empty = not counted | J8 | B16 | 3 | 1 |
| F11 | Stock takes, kept on the server | J9 | — | 3 | 1 |
| F12 | Controlled-drug register: reason, witness, running balance; correct, never edit | new (Q8) | — | 3 | 1 |
| F13 | Backup, export and import (preview + ask; real stock only by import after the medics' clean-up) | J11 | B2, B6, B9, B15 | 3 | 1 |
| **People** | | | | | |
| F14 | Staff (from the shared REACH people list) | J2 | — | 4 | 1 |
| F15 | Training and certificates (expired ones renewable) | J3 | B20, B26 | 4 | 1 |
| F16 | Duty roster, MD3 (who is on duty when; EDP reads it) | J14 placeholder | — | 4 | later (planned release 2; own stages first) |
| **Later (own stages, no demo now)** | | | | | |
| F17 | "Used on a case" from EDP (EDP F79): counts once, flags overuse | J13 | B11 | — | later |
| F18 | Patient File and Patient Archive, MD2 | J14 placeholder | — | — | later |
| F19 | Calendar, MD4 | J14 placeholder | — | — | later |
| F20 | Medical Library, MD5 (with the medics' checklists) | J14 placeholder | — | — | later |
| F21 | SOPs, MD6 | — | — | — | later |

**Stage 4 signed off by Danny, 27 Nov 2026:** feature list, all four demo batches and the Master Checklist (`CHECKLIST.md`) approved.
**Demo batch 1 (F1–F3): approved by Danny, 27 Nov 2026** (all Right, no notes).
**Demo batch 2 (F6–F9): approved by Danny, 27 Nov 2026** (F9 and overall Right; he set off all 16 checks; overall note on controlled drugs → Additional thoughts, Q13–Q16).
**Demo batch 3 (F10–F13): approved by Danny, 27 Nov 2026** (all four and overall Right; he set off all 23 checks). F12 note: “how do you remove a person from ‘Who may approve controlled drugs’? under doctor maybe a simple ‘X’ out” → added (version 2 of the page): a doctor removes the right with ✕, logged and all doctors told; the last doctor can't be removed. Not commented on, so standing as shown: the later of two disagreeing counts is used (both kept, flagged); receiving a controlled drug needs a witness, no doctor.
**Demo batch 4 (F14, F15, F16, F5, F4): approved by Danny, 27 Nov 2026** (F14, F16, F4 and overall Right; F15 and F5 not ticked separately; 14 of 15 checks seen by him, not the EDP time view). F16 is approved as the idea (who is on duty when, EDP reads it); its details wait for Danny's roster rules (Q18 parked).

Not in this app: Dispatch (→ EDP). Calendar, Medical Library and SOPs became later parts of this program (Q21 = A, REACH D4, 27 Nov). See "Belongs elsewhere".

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
| Patient Archive (patient records and history) | **this app, later** (Q6 = C): one Patient File per patient, from EDP or added by hand, growing over years, kept in the Patient Archive | Suite placeholder; Stage 3 answer, 26 Nov 2026 |
| ~~Roster and shift planning for medical staff~~ | **moved back: this app owns the duty roster** (who works when). EDP has no roster function; it reads who is on duty so the dispatcher only assigns a nurse or doctor on duty | Stage 3 answer, 26 Nov 2026 |
| Dispatcher sees who is on duty (reads this app's roster) | EDP; needs the shared server | Stage 3 answer, 26 Nov 2026 |
| EDP Settings "Pilot roster" / "Medic roster" are name lists | EDP: become the shared REACH people list (Q6 = C). Whether pilots also need a duty roster is EDP's question, not asked here | found in EDP code, 26 Nov 2026 |
| Personnel, training and certifications | shared REACH people / crew records (EDP has crew too) | Suite Personnel module |
| Calendar, Library (documents, course materials) | shared REACH tools; to decide | Suite placeholders |
| **Shared REACH foundation** (one people list, one sign-in, server, activity log) used by EDP and the medical app | REACH family; agree with EDP | Q6, 26 Nov 2026 |
| Pre-flight medical equipment check / checklist builder | its own app (iCloud › 7 Checklist Template - Medics); could later read bag contents from here | found on disk |
| Common REACH look | EDP F53 | brief |
| Profession and medical code on a person (Core People fields?), Head Doctor and doctors' list (this app's own rights), controlled flag on items (EDP F79 needs it), backup shape extras | the REACH chat decides (R13); written up in `docs/reach-notes.md` | Danny, 28 Nov: “make sure the changes are recorded for the REACH Ecosystem” |

## Additional thoughts

**28 Nov 2026 (Workflow B step 6, before answering the controlled-drug tick page), Danny, after talking to the medical staff:**
> If you have multiple doctors, there should be a Head Doctor, who is in charge of the other doctors. That Head doctor should be the only one who should tick and untick a controlled drug, having a little pop-up window confirming that he makes that drug controlled or uncontrolled. Now, by a little tick or something the Management or admin can make any doctor a head doctor. A Nurse can not become head doctor though.

What it means here:
- It replaces “only a doctor ticks Controlled drug” (the idea of earlier today) with “only the Head Doctor ticks or unticks it, after a confirm box”. The page https://claude.ai/artifact/XD9tDFYMWBteb9EnNto29r was drawn for “any doctor”; it is updated before Danny answers it.
- New: Management (Manage level) marks one doctor as Head Doctor. That is a new right for Manage in the controlled-drug area; until now Manage level gave no right there (F12.2, Q16 = B). It is limited to choosing which doctor is Head Doctor: Manage still can't tick drugs, approve, or change who is on the doctors' list.
- “A nurse can't become Head Doctor”: the program today only knows the doctors' list (people who may approve) and a free-text job. A nurse can be on the doctors' list (Q16 lets a doctor give the right to anyone). So the program needs a way to know who is a doctor by profession.
- Open points to show on the page: one Head Doctor or several; with a single doctor, is that doctor Head Doctor automatically; how the program knows who is a nurse; what happens when the Head Doctor is archived, loses the right, or is away (nobody can tick until Management names another?).
- Classified as “anything else” (§5): Workflow B, shown before building, together with the earlier idea.
- Redrawn 28 Nov: https://claude.ai/artifact/KHW4Hfihq7nSYKXzSF2HqG (source `docs/stage6/head-doctor-question.html`, answers in its `headdoc` collection; replaces https://claude.ai/artifact/XD9tDFYMWBteb9EnNto29r). How it looks for Anna, Cara, Dr Ben and Dr Eva (Head Doctor, with the confirm box), and six choices, proposed A each: (1) a Profession on each person (Doctor, Nurse, Other); the Head Doctor is a Doctor on the doctors' list; (2) exactly one Head Doctor, a lone doctor is it automatically; (3) without a Head Doctor nobody ticks, Management sees a red note; (4) the confirm box opens the register with a witness; (5) the Head Doctor unticks with a reason, the register history stays; (6) the importer suggests, those lines wait for the Head Doctor. Waiting for Danny's answers and GO.
- **Danny's answers, 28 Nov (in chat):**
  > Correct. Management chooses which doctor is Head Doctor. They still couldn't tick drugs, approve take-outs, or change who's on the doctors' list.
  > How does the program know someone is a nurse? If you get put into the system as a doctor, you have to type in your medical code, which only doctors will get.
  > One Head Doctor or several? And with only one doctor, is that doctor Head Doctor automatically? Several Head Doctors and with only one doctor, doctor Head Doctor automatically, correct.
  > If the Head Doctor is archived, loses the right, or is away, nobody can tick drugs until Management names another. Is that right? Correct.
  > The Excel import: suggested controlled drugs would wait for the Head Doctor, not just any doctor. Correct.

  So: Management's only new right is choosing Head Doctors (confirmed). Part 1: a doctor is someone entered with a **medical code** (Danny's own answer, not on the page). Part 2: **several** Head Doctors allowed (C); a lone doctor is Head Doctor automatically. Part 3: A. Part 6: A. Parts 4 (the confirm box opens the register with a witness) and 5 (unticking with a reason, history kept) were not answered yet. How the medical code works in detail (who types it, what is checked) is proposed back to Danny before building.
- **28 Nov, Danny:** “Yes, go. and Answers are in. … Program can't check if the code is real ... Yes Understand. There has to be a level of trust.” The page's answers: all A. Part 2 on the page is A (exactly one Head Doctor) but Danny wrote “several” in chat: built for several first, then asked. **28 Nov, Danny: “No. We just stick to one head doctor.”** Changed the same day: exactly one Head Doctor; naming another takes it from the first. Built and tested: F12.12–F12.15.

**28 Nov 2026 (Stage 6, while F13 waits for Q26), Danny:**
> Also Can we make it, that only the Doctor can turn a normal drug into a Controlled drug by ticking a little box or something? Makes sense?

What it means here:
- Today anyone who adds an item (Work level and up) could, in the data, mark it as a controlled drug, and there is no box for it on screen at all. Danny wants that one box to belong to doctors (the doctors' list, F12.6), like everything else about controlled drugs (F2.8, F12.2).
- It touches the item page, the import preview (Q26 part 3 said “tick them in the preview”, but the person importing is Manage level, not necessarily a doctor), and what happens to stock already on the shelves when a drug becomes controlled (it needs an opening register line with a witness) or stops being controlled (its register history stays).
- Classified as “anything else” (§5): it changes rights and data in more than one feature. It runs through Workflow B: written down here, shown visually with the open choices, built only after GO. F13.6 loading waits for it, because its controlled-drug step depends on it.
- Shown 28 Nov (Workflow B step 5): https://claude.ai/artifact/XD9tDFYMWBteb9EnNto29r (source `docs/stage6/cd-tick-question.html`, answers in its `cdtick` collection). The box for Anna / Cara / Dr Ben, and three choices, proposed A each: (1) ticking opens the register at once, with a witness; (2) a doctor can untick with a reason, the register history stays read-only; (3) in the import, the importer marks suspected controlled drugs and those lines wait for a doctor. Waiting for Danny's answers and GO.

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
- **"Build it as an App" + server later:** feeds Q4 (what kind of app) and Q5 (shared stock). Q4 was open here; answered 26 Nov: B, straight to the real Mac/Windows program (see Q&A).

**26 Nov 2026 (Stage 3), Danny:**
> We already have the Inventory Feature in the Medical suite. You know that, right? … I guess all I was saying. The UI is good. But you are doing the underneath leg work.

What it means here:
- **The June screens are the UI reference.** The new app keeps the June Medical Suite's look and screens (side menu, Home, Inventory views, Personnel). The new work is underneath: server, sign-in, offline, register, and the 26 bug rules. Still no restyle (F53).
- Every June feature is listed as kept / changed / not in this app on the Stage 3 page and in `CHANGELOG.md` (conformance table), so no gap has to be discovered by using the app.
- Classified tiny for Stage 3 (a page and file update); it shapes Stage 4 (demos start from the June screens) and Stage 5 (UI = the June UI, fixed).

**27 Nov 2026 (Stage 4, on the demo batch 2 page, overall note), Danny:**
> I have 2 things.
> 1. the Doctor should be the only authorized person either taking our a controlled Drug or authorizing taking out a controlled drug. Admin should not have authority to do so.
>
> Question, If a nurse need to dispense a controlled drug, the window comes up, which is very good, how does the doctor know (the authorized person) or authorize the dispense?

What it means here:
- **New rule for F12 (controlled-drug register):** only a doctor takes out a controlled drug or authorizes someone else taking it out. Being Admin gives no right here. Controlled-drug rights are separate from the Staff / Manager / Admin roles.
- **His question opens design questions Q13–Q16** (how the doctor is told and approves, what happens when no doctor can be reached, doctor vs. witness, who decides who counts as a doctor). Not settled by Claude: asked on an illustrated page before demo batch 3.
- Classified "anything else" (§5): it changes F12, which is demoed in batch 3. Batch 3 waits for the answers.

**27 Nov 2026 (Stage 4, demo batch 4, note on Q18), Danny:**
> I didn't start the Roster Feature / App yet, since that has to follow a set of other rules.

What it means here:
- **F16 (duty roster) stays in the feature list for release 2**, but its details (what one entry looks like, the rules it must follow) are not designed in this Stage 4. Q18 is parked, not answered by Claude.
- When the roster starts, it gets its own run through the stages, beginning with Danny's set of rules. (There is a separate project `~/Documents/GitHub/png-duty-time` for pilot duty and rest; whether the medical roster follows similar rules is for Danny to say then, not assumed here.)
- Q19 (Managers and Admins change the roster) stands as answered.

**27 Nov 2026 (Stage 4, Master Checklist), Danny in chat:**
> Roster I would tackle later.

What it means here: F16 moves to the "later" group with F17 and F18 in the Master Checklist. It keeps what is already decided (who is on duty when, EDP reads it, Q19 = Managers and Admins change it). Everything else waits for its own run through the stages, starting with Danny's roster rules (Q18 parked). Tiny change (§0.9): checklist and page only.

**27 Nov 2026 (Stage 5 start), found by Claude, not a Danny note:**
The REACH project (`../reach`, chat "2.0 REACH") agreed the **REACH Core data rules** (`../reach/CORE-DATA.md`, R1–R13) with Danny's GO on 27 Nov 2026, the same day Stage 4 ran here. They bind every REACH app; by R13 they change only in the REACH chat. Five places differ from what Stage 4 approved here:
1. **Deleting:** Q17 = B (Manager/Admin delete stock for good at any time) vs R4/Q38 (archive; delete only a mistake within 24 h, Manage level, logged).
2. **Roles:** Staff / Manager / Admin vs R3 levels View / Work / Manage → Q20.
3. **People list:** F2.1/F14.1 "the one shared REACH list" vs REACH Q37/Q18 (each app keeps its own list in the Core shape; Ops Management keeper later).
4. **Times:** ALL.4 "never UTC" vs R6 "stored in UTC, shown local" → proposed wording: moments in UTC, calendar dates as plain dates.
5. **Name and parts:** Q10 "REACH Inventory" vs REACH D4 (Medical Suite MD, Inventory MD1, plus MD2–MD6) → Q21.
Also: REACH Q12 asks for a REACH section in this CLAUDE.md (needs Danny's OK). Shown on https://claude.ai/artifact/S65PV6inHY3UG8h87fo3sz. Nothing changed in the feature list or Master Checklist until Danny answers. Classified "anything else" (§5): handled at the start of Stage 5, before the architecture.

**27 Nov 2026 (Stage 5), Danny's answers on the alignment page** (https://claude.ai/artifact/S65PV6inHY3UG8h87fo3sz): all five points **yes**, **Q20 = A**, **Q21 = A**, the REACH line for CLAUDE.md **yes**, overall **yes**. Applied the same day: the Master Checklist (ALL.4, ALL.8, new ALL.9, F2, F4.1, F5.7, F8.4, F12.2, F12.6, F13.2, F13.8, F14.1, F14.4, F15.6, F16.3, new F19–F21), the feature list, `CLAUDE.md` (name and REACH section), `DECISIONS.md`.

**27 Nov 2026 (Stage 6), build order:** Claude found that F2 (sign-in) must store people and "stay signed in" through the store door (REACH R7), which is F3. Proposed: build F3 before F2. Danny: "perfect. keep building." Read as yes to the swap (said so in chat). Same features and checklist lines; only the order of F2 and F3 changes.
