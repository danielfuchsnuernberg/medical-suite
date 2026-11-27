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
| F16 | Duty roster (who is on duty when; EDP reads it) | J14 placeholder | — | 4 | later (planned release 2; own stages first) |
| **Later (own stages, no demo now)** | | | | | |
| F17 | "Used on a case" from EDP (EDP F79): counts once, flags overuse | J13 | B11 | — | later |
| F18 | Patient File and Patient Archive | J14 placeholder | — | — | later |

**Stage 4 signed off by Danny, 27 Nov 2026:** feature list, all four demo batches and the Master Checklist (`CHECKLIST.md`) approved.
**Demo batch 1 (F1–F3): approved by Danny, 27 Nov 2026** (all Right, no notes).
**Demo batch 2 (F6–F9): approved by Danny, 27 Nov 2026** (F9 and overall Right; he set off all 16 checks; overall note on controlled drugs → Additional thoughts, Q13–Q16).
**Demo batch 3 (F10–F13): approved by Danny, 27 Nov 2026** (all four and overall Right; he set off all 23 checks). F12 note: “how do you remove a person from ‘Who may approve controlled drugs’? under doctor maybe a simple ‘X’ out” → added (version 2 of the page): a doctor removes the right with ✕, logged and all doctors told; the last doctor can't be removed. Not commented on, so standing as shown: the later of two disagreeing counts is used (both kept, flagged); receiving a controlled drug needs a witness, no doctor.
**Demo batch 4 (F14, F15, F16, F5, F4): approved by Danny, 27 Nov 2026** (F14, F16, F4 and overall Right; F15 and F5 not ticked separately; 14 of 15 checks seen by him, not the EDP time view). F16 is approved as the idea (who is on duty when, EDP reads it); its details wait for Danny's roster rules (Q18 parked).

Not in this app: Dispatch (→ EDP), Calendar and Library (→ shared REACH tools, to decide). See "Belongs elsewhere".

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
