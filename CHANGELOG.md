# CHANGELOG — REACH Medical Suite

## 2026-11-28 — Stage 7: all 29 bugs fixed (Danny's GO, Q27–Q29 = A)
- **Controlled drugs:** archiving, restoring, adding a place, deleting as a mistake and importing can no longer change a controlled drug's stock outside the register (B35); unticking is refused while a take-out waits, and a drug that is no longer controlled can't be approved or corrected (B36); only a current doctor gives the right (B45); 5 wrong PINs pause PIN approval for that doctor for 15 minutes, logged, and the doctor sees a note (B46).
- **Amounts:** “12,0”, “1,000” and other commas or points are refused with “for example 1000” (B32, B33, Q28 = A); above 1,000,000 is refused (B34). **Double clicks** save once, on every save button (B37).
- **People:** a password changes only with the current or one-time password, logged (B43); no all-spaces passwords (B44); set-up only by an active Manage person (B47); two offline computers can no longer leave nobody at Manage level (B48); details of people in an archived department can be changed (B50); deleting a mistaken person removes their training (B52); names tidied, at most 80 letters (B56); settings and restore check the record exists and is the right kind (B53–B55).
- **Backup and two computers:** restore with a server sends and fetches again (B29; Q30 parked); safety copies never overwrite each other (B30); a damaged version number is refused (B49); stock below zero is shown in red until counted (B31, Q27 = A).
- **Excel check:** counts typed as text, full month names and month-year headers are read; a sheet with no count column must be fixed; another lot isn't a duplicate; names compared the loading way; row numbers right after a short empty row (B38–B42). On the real files (counts only): Store 24 rows must be fixed (was 21), bags 53 (was 39). Most of the new ones are a count with a unit in the cell (52 like “2 pkt” in the bags).
- **Screens:** a register line on a phone is a card with every part labelled (B51; a 720 px minimum width was the cause); a bag line with required 0 is OK (B57, Q29 = A).
- Tests: 27 new tests (22 unit, 4 program, plus the Excel block); each fix undone on its own made its test fail (35 of 35). 172 of 172 and 98 of 98 pass.

## 2026-11-28 — Stage 7: hostile pass of release 1
- F15 committed first (c76bd31).
- Three independent testers (data, sync and backup · stock and register · people, settings and screens) and my own pass on the screens found 29 bugs, each made to happen in a test: B29–B57 in BUGS.md. 11 can lose or falsify data, 5 are security, 5 broken, 8 minor. Nothing fixed yet.
- Shown to Danny with a before/after for each and three questions (Q27–Q29): https://claude.ai/artifact/AkyM73Bj5RU7iktEmozZxc. Fixes wait for his GO.

## 2026-11-28 — F15: Training and certificates (release 1 is now fully built)
- F14 committed first (2eca1aa).
- Staff and training: two new counts, **Certificates expired** and **Due in 30 days** (active people only), and a Training column per person: Expired certificate, Due soon / required, All valid or No courses.
- A profile's **Training and certificates** panel lists each course: Valid, Expires in N days (30 or fewer), Expired, Required or In progress, with when it was done, when it expires and how long it's valid.
- Manage level: **Assign course** (only courses the person hasn't got; none for archived people), **Mark complete**, **Renew** (an expired one: the June app could never renew, B20) and **Renew early**. The date it was done is picked, can't be in the future, and the new expiry is shown before saving, worked out month-safe (31 Jan + 1 month = 28 Feb, not 3 March as in June, B26).
- Every change is in Activity as a sentence (“assigned Fire safety to Dina Test”, “renewed ACLS for Anna Example”) with old → new dates, shown as dates (found while testing: they showed as 2026-11-28).
- DEMO data: nine training records around 28 Nov 2026 (Anna's ACLS expired, Dina's BLS due in 20 days, Dina's Oxygen refresher in progress, archived Finn's BLS expired).
- Tests: 8 new unit tests, 6 new program tests; 2 F14 tests changed from “comes with F15” to the real training. 13 rules broken on purpose, 12 failed; the one that survived is a second guard already covered by the first. 145 of 145 and 94 of 94 pass.

## 2026-11-28 — F14: Staff and training (the staff part)
- F13.6 loading committed first (56899c0).
- New screen “Staff and training” (menu › Team). Everyone may look: Staff and Archived counts, people per department, and a list with department, REACH office, level and training. “Show archived” shows archived people faded; the counts never include them.
- A profile per person: details (email, REACH office, staff number, added when and by whom, where the list comes from), Training (comes with F15) and This week on the roster (comes with F16, release 2). Search opens it.
- Manage level adds people (name, job, department, office, email, level), edits details, archives (with a confirm box), restores, and deletes a person added by mistake within 24 hours (logged). Levels, passwords and professions stay in Settings › People and access.
- New on each person: **email** (optional; one already in the list, archived people too, is refused; stored in small letters) and **office** (one of the six REACH offices). The DEMO people got example.org emails and offices.
- Tests: 5 new unit tests, 6 new program tests; the F1 menu test no longer expects Staff to be “coming”. 11 rules broken on purpose, each made its test fail. 137 of 137 and 88 of 88 pass.
- Found while looking at the screenshots: the profile header was centred and the profession badge had no colour: both fixed.

## 2026-11-28 — F13.6: loading the Excel lists (Q26 = A, A, A)
- F13 and the Head Doctor committed first (22a3fd0).
- After the check, a list with no row to fix shows “Prepare loading…”: a preview of exactly what would be loaded, before anything is. Per sheet a place: the bag with the same name, the Store for the stock-take sheet, otherwise a new bag named after the sheet; each can be changed or the sheet skipped. Per row the newest month with a number, shown e.g. “28 pack (SOH FEB)”. Required amounts come in for bags only.
- Loading is one save (all or nothing), Manage level only, refused while any row must be fixed. A line already there (same item, place, lot and expiry) gets the number as a count; otherwise a new line, and new items as needed. Logged as “imported the stock list …”.
- Controlled drugs never come in as ordinary stock: rows of an item that already is one, and rows ticked “controlled drug?” in the preview, wait under Controlled drugs for the Head Doctor. The Head Doctor confirms each as a controlled drug (with a witness, through the register; opening it if new) or, for a ticked row, as not one (then it loads as ordinary stock). Everyone else sees them but can't decide.
- Tests: 6 new unit tests, 1 new program test; 10 rules broken on purpose, each made its test fail. 132 of 132 and 82 of 82 pass. Real files: still refused for loading until the medics fix the must-fix rows (21 in the Store sheet, 39 in the bags).
- Found while testing: the witness box in the waiting list had the browser's plain look (B8) and the Head Doctor badge stretched: both fixed.

## 2026-11-28 — One Head Doctor
- Danny: “No. We just stick to one head doctor.” Changed from several to exactly one: ticking Head Doctor for another doctor takes it from the first, in the same save. Should two computers name two while offline, the one named last counts. Tests changed to match; two rules broken on purpose (naming a second keeps the first; two named both count), each failed. 126 of 126 and 81 of 81 pass.

## 2026-11-28 — Notes for the REACH chat
- Danny: “make sure that the changes are being recorded for the REACH Ecosystem”. New file `docs/reach-notes.md`: what this app changed that touches REACH (profession and medical code on people, Head Doctor and doctors' list as this app's own rights, the controlled flag EDP will need, backup and log shapes), and what the REACH chat may want to decide. This app doesn't edit the REACH folder (R13). Row added to PLAN › Belongs elsewhere.

## 2026-11-28 — Head Doctor built (F12.12–F12.15)
- People and access: a Profession per person (Doctor, Nurse, Other), set by Management. Someone set to Doctor is asked for their own medical code when they sign in; it must be unique; it's logged and shown on the doctors' list. The program takes it on trust.
- Only a doctor with a code can be on the doctors' list. Management ticks Head Doctor for doctors on the list (several allowed); with only one doctor, that doctor is Head Doctor automatically. Without a Head Doctor, Management sees a red note on Home.
- Item page: a “Controlled drug” box. Only a Head Doctor can tick it; a confirm box asks first, needs a witness and opens the register at what the shelves hold. Unticking asks why; the register stays under Controlled drugs, read-only. Everyone else sees the box greyed.
- B28 closed: all six answers on the Head Doctor page arrived.
- Tests: 4 new unit tests, 4 new program tests; 5 older F12 tests now enter Dina as a doctor first. 13 rules broken on purpose; one survived at first (a weak check), the test was made stronger; now each fails when broken. 126 of 126 and 81 of 81 pass.
- Found and fixed while building: the program checked the person being given the right before checking who was giving it; a nurse on the list was told to “type your medical code”.

## 2026-11-28 — Head Doctor: Danny's answers
- Management chooses Head Doctors, nothing more; a doctor is someone entered with a medical code (Danny's own answer); several Head Doctors allowed, a lone doctor is one automatically; without a Head Doctor nobody ticks until Management names one; import suggestions wait for a Head Doctor. Parts 4 and 5 and the medical-code details still to confirm. Nothing built.

## 2026-11-28 — New idea from the medical staff: a Head Doctor
- Danny, after talking to the medical staff: with several doctors there is one Head Doctor; only the Head Doctor ticks or unticks Controlled drug, after a confirm box; Management makes a doctor Head Doctor; a nurse can't be one. Written into PLAN › Additional thoughts. It changes the controlled-drug page (drawn for “any doctor”), which is updated before Danny answers it. Nothing built.
- Redrawn on https://claude.ai/artifact/KHW4Hfihq7nSYKXzSF2HqG (replaces https://claude.ai/artifact/XD9tDFYMWBteb9EnNto29r): the four views and six choices, with the B28 fix. Checked: every person and option changes its picture, no sideways scroll at 375 px, no console errors.

## 2026-11-28 — Q26 answered (A, A, A); new idea: only a doctor marks a controlled drug
- Q26 = A, A, A, typed in chat (the page kept only part 1: bug B28, written down, not yet fixed). Per row the newest month is loaded; each sheet goes to the bag with its name or becomes a new bag, shown in the preview; controlled drugs come in through the register with a doctor and a witness.
- Danny's new idea, written into PLAN › Additional thoughts: only a doctor can turn an item into a controlled drug, with a box. It goes through Workflow B and is shown before it is built; loading the Excel lists (F13.6) waits for it.
- Shown on https://claude.ai/artifact/XD9tDFYMWBteb9EnNto29r: the box for each person, three choices with proposed answers. The page carries the B28 fix: a click can no longer be overwritten by an older saved copy, and it says when an answer is saved. Checked: every option changes its picture, no sideways scroll at 375 px, no console errors.

## 2026-11-28 — F13 built (Excel loading waits for Q26): backup and import
- F12 committed first (b90c3e7).
- Settings › Backup and import (Manage level only): Export backup (the REACH shape: app code MD, data version, when exported, the data; no password or PIN check values); backups on this computer, one a day when the program opens, the last 30 kept (the server's nightly backups come with the server, REACH SD2); Restore from a file or from the list.
- Restore: refused with the reason for a backup with no stock, with no people, from the June app, damaged or from a newer version (B15). Otherwise a table of now vs after, a tick to confirm, a copy of today saved first, then everything is replaced in one step and every screen shows it at once (B2). An older backup is carried forward to this version (B3). The backup's time is shown in base time.
- Check a stock list (Excel): reads .xlsx files without any added library, finds the columns on every sheet whatever they are called, and lists the problems before anything is loaded (B6): impossible dates (1900, month 13), two dates in one cell, the same item twice in one place, lot numbers that look like dates, double spaces, missing units. “NA” counts as no expiry. Rows marked “must fix” are fixed in the medics' spreadsheet; the list can be copied for them. Run on the real files (counts only, nothing stored): Store 21 rows must be fixed, bags 39.
- Loading the lists waits for Q26 on https://claude.ai/artifact/7kAfkVHZnQhMK6PKY28iie: which month is “now”, what happens to each sheet, how controlled drugs come in.
- Tests: 12 new unit tests, 8 program tests; F5.3 now skips the hidden file pickers. 13 rules broken on purpose, each made its test fail. 122 of 122 and 77 of 77 pass.
- Found and fixed while building: dates like 31/13/2027 were accepted; 193 “NA” cells were counted as bad dates; a restore box showed the time in UTC.

## 2026-11-28 — F12 built: controlled-drug register
- Q25 committed first (c6cc96b).
- Controlled drugs (menu): one card per drug with its balance and where it is; the register below with When, Line (Opening / In / Out / Moved / Correction), amount, running balance, by, doctor and how, witness, reason or case. Lines can't be edited or deleted; a doctor adds a correction line naming the original. Every booking also moves the stock line in Store and bags, saved together; if the two ever disagree, the register says so.
- Taking out: a doctor takes it out personally (with a witness). A nurse, or a Manage-level person who isn't a doctor, needs a doctor: “Doctor is here” (the doctor types their own PIN on this screen), “Ask a doctor” (a request; nothing comes off until approved; red count on the doctor's menu; Approve / Ask / Refuse; a refusal stays, crossed out), or “Emergency, no doctor reachable” (reason and witness required; booked at once; red on Home and in the register until a doctor approves or asks about it).
- Witness on every line: never yourself, never the approving doctor; a doctor who witnessed can't approve it.
- Receive (witness, no doctor; joins the same lot or starts a line), Move between the Store and a bag (Q25 = A: a Moved line with a witness, no doctor, balance unchanged), more than the balance refused.
- Who may approve: only a doctor gives the right, never to themselves; ✕ removes it; the last doctor can't be removed; changes are logged and listed for every doctor. With no doctor at all, Management sets the first one, once. Manage level gives no right here.
- PIN: each doctor sets their own (4–8 digits, not a row), kept on this computer only as a check value. DEMO doctor Dr Ben Sample uses 1234 until he sets his own.
- Data from before F12 (a drug with stock but no register): a doctor opens the register at what the shelves hold, with a witness, once.
- DEMO data: Dr Ben Sample has the right; Morphine's register opens at 5. The “comes with F12” notes in F9 and F10 are gone.
- Tests: 14 new unit tests, 12 program tests (one per F12 line, plus old data). 17 rules broken on purpose; one survived at first (Manage changing the list behind the screen), the test was made stronger; now each fails when broken. 110 of 110 and 69 of 69 pass.
- Found and fixed while building: a take-out whose kind wasn't stated was booked as an emergency (now refused, never guessed); an older copy of the program had no way to open the register for stock already on the shelves.

## 2026-11-28 — Q25 answered: A
- Danny typed the answer in chat (the page didn't save it). Moving a controlled drug between the Store and a bag will be a “Moved” line in the register, with a witness and no doctor; the balance doesn't change. F12.1 now lists the line type “moved”; new checklist line F12.11. Until F12 is built, a controlled drug still can't be moved.

## 2026-11-28 — F11 committed; question Q25 before F12
- F11 committed and pushed (4aee299).
- Q25 on https://claude.ai/artifact/STUm8975FUBe7zamEputZ5 (source `docs/stage6/cd-move-question.html`, answer in its `q25` collection): when a controlled drug moves from the Store into a bag, does the register record it, and who confirms it? Proposed A: a “Moved” line with a witness, no doctor, balance unchanged. Found while drawing it: the approved register demo gave each drug only one place. Checked before publishing: each of the four answers changes the register mock (2, 2, 3 and 1 lines), no sideways scroll at 375 px, no console errors.

## 2026-11-28 — F11 built: stock takes
- F10 committed and pushed first (3dbb539).
- Stock takes (menu › Stock takes): Freeze stock take now copies every line in use in the Store and bags with the date (base time), who and a label (proposed: “Stock take, Nov 2026”). It warns if counts are typed but not saved. It can never be changed or deleted: even a change message from another computer is ignored, and Activity shows it was.
- Open one: then vs now for every frozen line (−3, +4, no change); lines archived or deleted since show as removed, still with their names; lines added since are counted but not mixed in.
- Export CSV: one row per line with the stock take's label, frozen on (the base's date), at, by, item, place, lot, expiry, then, now, change. The file name carries the base's date.
- Stored as change messages like everything else, so the server keeps them and a new version can't wipe them (B3).
- Tests: 5 new unit tests, 4 program tests. 7 rules broken on purpose, each made its test fail. 97 of 97 and 57 of 57 pass.
- Found and fixed while building: the CSV wrote a negative number as '-2 (the F7 formula guard caught numbers too; now only text); clicking Stock takes in the menu while one was open didn't go back to the list; an ignored change to a stock take showed in Activity as “changed”, and an ignored delete showed “what was there”.

## 2026-11-28 — F10 built: count a bag
- F9 committed and pushed first (e64b8ea).
- Count a bag (menu › Count a bag): pick a bag or the Store (a bag first), find in the list, type what you find. Expected, counted and the difference show as you type. An empty box means “not counted” and changes nothing, even after typing in it and emptying it (B16). 0 is a real count.
- Typed counts are kept by the program, not the screen: searching, switching place and coming back keep them (B16). Leaving the screen, signing out or closing the program with counts typed asks first: Save counts / Throw away / Keep counting (closing: Keep counting / Close and throw them away). The next person to sign in never sees someone else's typed counts.
- A box that isn't a whole number of 0 or more turns red with the reason, and Save is refused for all of them (nothing saved).
- After saving: “Saved: 2 changed, 1 the same, 3 not counted (left as they were, not set to 0).” Counts are saved together; each is in Activity (“counted … 30 → 28”, or “the same as before”). Two people counting the same line from the same start, who disagree, are flagged (F3.5).
- Controlled drugs are shown in the count but counted in the register (F12): no box to type in.
- Tests: 5 new unit tests, 6 program tests. 11 rules broken on purpose; two survived at first (an emptied box saved as 0; the next person seeing typed counts), so those tests were made stronger; now each fails when broken. 92 of 92 and 53 of 53 pass.
- Found and fixed while building: signing out with typed counts would have left them for the next person (now asks, and always clears); closing the program would have lost them without a word (now asks).

## 2026-11-28 — F9 built: restock and dispense
- F8 committed and pushed first (fa2b7f1).
- + and − on every line in Store and bags, and Restock / Dispense on the item page. One box: a whole number, 1 or more; 0, negatives, decimals and an empty box are refused with a message and nothing changes (B17); taking out more than is there is refused. Every booking is logged as “restocked” or “dispensed”, old → new (B19).
- Controlled drugs: − and + both open a note instead of a box: their stock changes only through the controlled-drug register (Q8: every movement; F12.9: receiving needs a witness), with a button to the register (F12). Closing a gap left in F8: a controlled drug's amount can no longer be changed in Edit, and it can't be moved, until the register exists. Q25 (does a move between places need its own register line?) will be shown before F12.
- Tests: 5 new unit tests, 4 program tests (one per F9 line). 8 rules broken on purpose, each made its test fail. 87 of 87 and 47 of 47 pass.
- Found while testing: my own test counted the table columns wrong (the program was right); on a phone the + and − sat in the middle of a row, now at its right edge.

## 2026-11-28 — Q24 answered: C
- When all of a line is moved away: a line with a required amount or reorder level stays, at 0, so the bag or Store shows it as missing; a line with no amount set is archived, in the same save as the move. The message after the move says when a line was archived.
- Tests: 1 new unit test, the F8.2 program test extended; 3 wrong rules tried (always archive, never archive, archive after a part move): each failed. 82 of 82 and 43 of 43 pass.

## 2026-11-28 — F8 built: item page; question Q24
- F7 committed and pushed first (605fc37).
- Item page (a row in Store and bags, or a soonest-to-expire row on the Overview): name, category, unit, total on hand; Stock by place (Store first) with amount, required / reorder at, lot, stock and expiry; Stock movements (everything logged for this item and its lines, in the Activity log's words); a “Used on EDP cases” panel that waits for F17.
- Move: all or part of a line to another bag or the Store. It joins a line there with the same lot and expiry, or starts a new one without a required amount (the message says which). The take and the add are saved together: all or nothing. The log says “moved 5 from … to …”.
- Edit: amount, required amount / reorder level, lot, expiry. The place is greyed (use Move). Whole numbers only. Only what changed is saved, so the log shows old → new. The expiry is also written out in words under the box (the box itself follows the Mac's date order and can show 12/01/2027 for 1 Dec).
- Add a place, Add item (on Store and bags; a duplicate name is refused, any capitals, archived items too), archive and reactivate lines and items (an item with lines in use can't be archived), delete for good: only Manage, only a mistake within 24 hours, after a confirm, logged. View level sees no change buttons. Every rule is also checked in the inventory store, not only on the screen.
- Q24 on https://claude.ai/artifact/1QgMRcRqYBihnspJahsjqF: when all of a line is moved away, does the emptied line stay at 0 or get archived? Built for now: it stays at 0. Proposed: C (keep it if it has a required amount or reorder level, otherwise archive).
- Tests: 11 new unit tests, 5 program tests (one per F8 line); the F6 test for soonest-to-expire now opens the item. 12 rules broken on purpose; two survived at first, so those tests were made stronger; now each fails when broken. 81 of 81 and 43 of 43 pass.
- Found and fixed while building: after closing a box with an error in it (Escape), the error stayed on the item page; on a phone the line buttons squeezed the place name; the F7.2 test sometimes read the CSV before it was fully written (a test problem, not a program one).

## 2026-11-28 — F7 built: Store and bags
- F6 committed and pushed first (e9fe747).
- Store and bags: filter boxes for place, category, stock level (including “No required amount set”) and expiry (expired, soon, expired or soon, in date); sort by name A–Z / Z–A, stock (worst first), expiry (soonest first), amount (lowest first); Show archived (archived lines marked); Clear filters. The Overview's cards and warnings now open this screen with the matching box already set.
- Export CSV: exactly the rows and order the table shows. The file is named with today's date at the base; expiry dates are written as stored (YYYY-MM-DD), so they can't slip a day (B13). Opens in Excel or Numbers (with × and – intact). A name starting with = + - @ gets a ' in front, so a spreadsheet never runs it as a formula. The computer asks where to save it.
- A row (or Enter on the item name) opens that item. Until F8, the item page is a stand-in that says what F8 brings; Back keeps the filters.
- Category column added to the table (hidden on a phone).
- Tests: 3 new unit tests, 3 program tests (one per F7 line), two F6 tests updated for the new table. 8 rules broken on purpose, each made its test fail. 70 of 70 and 38 of 38 pass.
- Found while testing: one of my own test expectations was wrong (I counted 5 lines in stock and in date; there are 4); the program was right.

## 2026-11-28 — F6 built: Inventory overview
- F5 committed and pushed first (406feb3).
- Overview (menu › Overview, and the Inventory card on Home): item types, units everywhere, out of stock, expired / soon; the attention strip; Bag readiness per place (Store first); Soonest to expire (expired or within 60 days).
- Readiness rules in one place (`packages/core/src/inventory/readiness.ts`): exactly the required amount is OK (B1); a line with no required amount makes its bag “Not set up”, never Ready (B25); the Store uses reorder levels and says Reorder / Stocked (B10); out of stock or expired → Not ready.
- Every card and warning opens Store and bags showing just those lines, with a one-line verdict for a place and a button to show everything. This is a first version of Store and bags; F7 adds filters, sort, CSV and archived lines. A soonest-to-expire row opens its place until the item page (F8) exists.
- DEMO data: a Trauma kit with two lines without required amounts, Bandage, Tourniquet, Gloves (Store, below its reorder level), categories Trauma and PPE. An existing program keeps its data and doesn't get these lines.
- Tests: 8 new unit tests, 4 program tests (one per F6 line); three older tests now count the new DEMO bag and lines. 8 rules broken on purpose, each made its test fail. 67 of 67 and 35 of 35 pass.
- Found and fixed while building: on a phone the required amount showed as a bare “—”; it now says “Required: —”.

## 2026-11-28 — Q23 answered; F5 built: Settings and country settings
- Q23 = C on the page: nurses look at the base's settings and lists; People and access stays with Management. F2.3 and F5.7 reworded, F2 changed to match (Anna now opens Settings, greyed, without People and access).
- Settings: Country and base (base name, country, time zone, date style, day and night shift, Save), Departments, Inventory categories, Courses (with months valid), Bags: add, rename, archive / restore, delete. People and access below, for Manage level.
- “Today” and every expiry now follow the base's time zone from Settings (no longer a fixed DEMO value).
- DEMO data: base settings, 4 departments, 6 categories (“icu” in lower case, used only by an archived item), 5 courses, an archived person Finn Former in Training — as in demo batch 4.
- Store version 2: items saved with a category as text get a category record; nothing is lost.
- Activity: words for the new things; departments, categories, courses and base settings show under Settings; a change of country shows (the country stamp used to be hidden).
- Tests: 7 new unit tests, 7 program tests (one per F5 line), F2.3 test changed for Q23. 8 rules broken on purpose, each made its test fail. 59 of 59 and 31 of 31 pass.
- Found and fixed while building: after saving a shift typed with “-” the form still said there were changes; departments etc. were tagged Inventory in the log; boxes ran out of their panel on a wide screen; the time zone was cut off.

## 2026-11-28 — F4 committed; question Q23 before F5
- F4 committed and pushed (0afd110).
- Q23 on https://claude.ai/artifact/K5QWdU8pktRz7LhKhB77My (source `docs/stage6/settings-question.html`, answer in its `q23` collection): F2.3 and F5.7 disagree on whether a nurse may look at Settings. Proposed C: look at the base's settings and lists, People and access stays Manage-only. Checked before publishing: each answer changes Anna's screen as described, no sideways scroll at 375 px, no console errors.

## 2026-11-28 — F4 built: Activity log
- F2 committed and pushed first (cc59147).
- Activity (menu › Activity): one log for all REACH apps, newest first, filter Everything / Inventory / People / Settings / EDP. Each entry: app tag, what happened in words (“took 2 from Gauze 10×10 cm in Bag 1 (adult)”), old → new per field, who · when (base time, 24-hour), and “from EDP” for other apps.
- Click a name: that record's whole history, under every name it has had. A delete for good shows “What was there”. Nobody can edit or delete an entry (lock note at the bottom; locked behind the screen too).
- How: `packages/store/src/log.ts` builds the log from the change messages with the same step as the records (`fold.step`, split out of `fold`); the door locks every stored message. New icons: trash and lock (from the approved demo).
- Tests: 6 unit tests and 4 program tests (one per F4 line); 6 rules broken on purpose, each made its test fail. 52 of 52 and 24 of 24 pass.
- Found and fixed while building: the log handed out a list a screen could empty (now locked); a new record listed “state: — → Active” as a change (left out); on a phone the filter buttons and long old → new boxes wrapped badly.

## 2026-11-28 — F2 built: sign-in and levels (Q22 = A)
- Q22 answered A on the page: the first Management person sets up a computer; a Manage-level person gives one-time passwords, changed at first sign-in.
- The program now opens on a sign-in screen (name from the list, password, “Stay signed in on this computer”). A new, empty computer opens on “Set up this computer”. After a one-time password: “Choose your own password” (at least 8 characters, typed twice).
- Settings › People and access (Manage level only): levels View / Work / Manage, add a person, one-time password (shown once), archive / restore, delete a mistake within 24 hours. Messages say why something is refused (last Manage-level person, archiving yourself, 24 hours passed).
- Who is signed in shows at the top, with Sign out. Every save carries that person. View level can't change anything.
- Passwords: only a salted check value, only on this computer, never sent. DEMO people: password “demo”, shown on the sign-in screen while DEMO data is there.
- Rules in `packages/core/src/access`, accounts behind the store door in `packages/store/src/accounts.ts`; the door got a local-only area and a “delete” message.
- Tests: 21 new unit tests, 8 program tests (one per F2 line); the F1 and F3 tests now sign in first. 46 of 46 and 20 of 20 pass.
- Found and fixed while building: B27 (two quick level changes could leave nobody at Manage level); Sign out now takes effect at once (it waited for the save first); the signed-in name now also shows on a phone. Found while checking the files: HANDOVER's “What exists / How to run / How to test” had not been updated since before F1 (an F3 edit silently missed it); rewritten.
- New question Q23 (Settings: locked or look-only below Manage), for F5.

## 2026-11-27 — F3 committed; question Q22 before F2
- F3 committed and pushed (b8d8807).
- Before building F2: how a person gets a password on a computer before the server exists, and who makes the first account, isn't decided. It decides whether anyone can sign in as the doctor. Asked as Q22 on https://claude.ai/artifact/BS1taSqMbr8BzgSFfsX7oK (`docs/stage6/signin-question.html`).

## 2026-11-27 — F3 built: the store door (works without internet)
- Built before F2 (sign-in needs to store through the door; Danny: "keep building").
- `packages/store`: the door (every change a message with its own ID, records worked out from the messages, failed save changes nothing and shows red, old data carried into new versions, DEMO data only into an empty store), IndexedDB on the computer (idb 8.0.4), outbox, sync with each message counted once, a stand-in server for tests.
- Program: the sync light (grey "This computer only" — there is no server yet —, green, amber with the number waiting, red), its details with the waiting list, the "opened without internet" banner, the "two counts disagree" banner, a red message when a save fails. Screens now read from the door.
- Tests: 9 new unit tests and 7 program tests, one per F3 line, all passing; F3.6 and F3.7 proven to fail when the June mistakes B22 and B3 are put back.
- Found and fixed while looking: times showed in the computer's own 12-hour style instead of base time (now 16:14); a short dash instead of a minus sign. Found while testing: the program allows one copy at a time, so tests now use their own data folder and run even while Danny has the program open.

## 2026-11-27 — Stage 6 started: workspace and F1 built
- Workspace as approved in Stage 5: `packages/core` (rules: dates, menu, search, DEMO data), `packages/store` (stub until F3), `apps/desktop` (Electron window, React screens in the June look).
- F1 built: the June menu (Home, Inventory, Team, Later, Settings), Home cards with today's date at the base, search across staff and stock with expiry badges, the ☰ drawer below 720 px.
- Tests: 16 unit tests (dates across PNG/Peru time zones, B13 cases, search, menu) and 5 program tests, one per F1 line, all passing; F1.5 proven to fail when the date tick is broken.
- Found while looking at the running program and fixed: the search echo showed typed text in capitals; a second focus ring inside the search box. Found while testing: my F1.2 test read the menu mid-slide (test timing, not a program fault).
- Machine note: npm 11 didn't fetch Electron's program file during install; `node node_modules/electron/install.js` does it.

## 2026-11-27 — Stage 5 signed off
- Danny on the Stage 5 page: look Right, overall GO. `ARCHITECTURE.md` target and the six Stage 5 rows in `DECISIONS.md` are now APPROVED.
- Next: Stage 6, feature by feature from F1; the server location goes to the REACH chat before release 1.

## 2026-11-27 — Stage 5: look and structure proposed
- Page https://claude.ai/artifact/CDkrByh9ypq4YXu4sN7vBj (`docs/stage5/medical-suite-blueprint.html`): the June tokens, type and spacing; 12 building blocks in 7 states; four layers with one store door; folders; data shapes with the REACH stamps; how changes travel and the two-computer rules; Electron for the program; tools pinned to EDP's versions; three outside dependencies (server, shared REACH code, accounts).
- `ARCHITECTURE.md` now starts with the target design (PROPOSED); the June description stays below as reference. `DECISIONS.md`: six PROPOSED rows.
- Checked on the page: 103 of 103 checklist lines and 12 of 12 REACH rules have a place.

## 2026-11-27 — Lined up with REACH Core (Stage 5)
- Danny's answers on the alignment page: all five points yes; Q20 = A (View / Work / Manage); Q21 = A (the program is “REACH Medical Suite”, Inventory = MD1).
- Master Checklist changed to match (now 22 blocks, 103 lines): ALL.4 (moments in UTC, calendar dates plain), ALL.8 (name), new ALL.9 (follow REACH Core), F2 levels and the 24-hour delete rule, log and backup shapes, own people list in the Core shape, new later parts F19 Calendar, F20 Medical Library, F21 SOPs. Page version 3: https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7.
- `CLAUDE.md`: new name, and the REACH section asked for by REACH Q12. `DECISIONS.md`: six rows.
- My slip while editing, caught by the count check and fixed: the shell swallowed a file path in ALL.9 and the F18 status line was dropped; repaired with a script file.

## 2026-11-27 — Stage 5 started: lining up with REACH Core
- Public GitHub Pages site checked: now 404 (the June copy with real stock is gone).
- Read EDP's architecture and the REACH project's Core data rules (agreed 27 Nov). Five differences from Stage 4 found and shown on https://claude.ai/artifact/S65PV6inHY3UG8h87fo3sz (`docs/stage5/reach-core-alignment.html`), with Q20 (levels) and Q21 (name and parts). Nothing changed yet in the feature list or checklist.
- Noted: an `imports/` folder from the REACH chat (medics' checklist, roster style guide, SOP PDFs) sits uncommitted in this repo; left untouched.

## 2026-11-27 — Stage 4 signed off
- Danny in chat: “Yes, sign off Stage 4.” Approved: feature list F1–F18, demo batches 1–4, Master Checklist (99 lines; roster under “later”).
- Decisions made in this stage: Q12 A, Q13 A, Q14 A, Q15 A, Q16 B, Q17 B, Q19 A; Q18 parked with the roster. All in `DECISIONS.md`.
- Next: Stage 5 (look and structure), after Danny's GO.

## 2026-11-27 — Roster moved to “later” in the Master Checklist
- Danny in chat: “Roster I would tackle later.” F16 now sits with F17 and F18 under “Later (own stages)”, status ⚪ later; its decided lines stay. Page version 2.
- The page's answer store was still empty when this was done; Stage 4 waits for Danny's answer on the rest.

## 2026-11-27 — Master Checklist (Stage 4 part 3)
- `CHECKLIST.md` › Master Feature Checklist: rules for every feature (ALL) plus one block per feature F1–F18, 99 testable lines, each with its source (June bug, answer, Danny's words, or demo).
- Coverage checked by script: 18 of 18 features, 26 of 26 June bugs, every answer that shapes the app.
- Review page: https://claude.ai/artifact/Pfif45D4mRjcwXffz4XsT7 (`docs/stage4/master-checklist.html`), generated from `CHECKLIST.md` by `docs/stage4/master-checklist-build/` so the two can't drift apart.

## 2026-11-27 — Batch 4 approved; all four demo batches done
- Danny approved demo batch 4. Q17 = B (everyone archives stock, Managers/Admins delete it for good, people Admin-only); Q19 = A (Managers and Admins change the roster).
- Q18 "Not sure" with the note that the roster follows another set of rules not started yet → parked: F16 stays in release 2 and gets its own stages first.
- Next: Stage 4 part 3, the Master Checklist.

## 2026-11-27 — Demo batch 4 (F14, F15, F16, F5, F4) and questions Q17–Q19
- New page: https://claude.ai/artifact/5zWdHUrVZmwU1oYSvCxXSL (`docs/stage4/demo-batch4-people.html`).
- F14 staff from the shared REACH people list; archived staff never counted (B26). F15 renew expired certificates (B20); 31 Jan + 1 month = end of Feb (B26). F16 duty roster with "What EDP's dispatcher sees" at a chosen time. F5 country settings (base, country, time zone, date style, shift times), date check against the June UTC slip (B13), department in use by archived staff can't be deleted (B21), icu → ICU rename allowed (B24 part), styled boxes (B8). F4 one log for Inventory, People, Settings and EDP, old → new (B19), deletes marked (B18), read-only.
- Questions inside the page, each changing the demo: Q17 who may archive and delete (proposed B), Q18 what a roster entry looks like (proposed A), Q19 who may change the roster (proposed A).
- My own slips found in testing and fixed before publishing: a delete entry showed "null → null"; settings changes were filed under Inventory (now their own SETTINGS tag and filter).

## 2026-11-27 — Batch 3 approved; ✕ to remove a doctor's right
- Danny approved demo batch 3 (F10–F13 and overall Right, all 23 checks seen).
- His F12 note (how to remove someone from the doctors' list) → page version 2: a doctor removes the right with ✕, logged and all doctors told; the last doctor can't be removed. Tested: nurse sees no ✕, doctor does, last-doctor guard holds. Also fixed: the “Dr” title now follows the job, so old register lines keep the doctor's name when a right is removed.

## 2026-11-27 — Demo batch 3 (F10, F11, F12, F13)
- New page: https://claude.ai/artifact/T2kdcaV7wUAMhAW9dUNgrc (`docs/stage4/demo-batch3-records.html`). You can switch who is signed in (nurse, doctor, Admin).
- F10 count: typed counts survive search and location switches; empty = not counted; leaving asks; bad numbers refused (B16). Proposed in the demo: two counts that disagree → the later one is used, both kept, flagged for checking.
- F11 stock takes: freeze, then vs now, CSV export, survive a new version.
- F12 register on Q8 + Q13–Q16: ask a doctor or doctor's PIN in the room; emergency booked red until approved; witness always a second person; Admin can't approve or change who may; corrections instead of edits; only a doctor gives the right, never to themselves. My reading, shown on the page: receiving needs a witness but no doctor (the rule is about taking out).
- F13: nightly server backups, file export, import refuses a backup with no stock or no people (B15), restore with preview, tick and an automatic backup first, screens update at once (B2); the Excel list shows bad dates, doubles and spacing before loading (B6); real stock only via import (B9).

## 2026-11-27 — Q13–Q16 answered (controlled drugs)
- Q13 A: doctor approves in the room (own PIN) or from their own device. Q14 A: emergency allowed, flagged until a doctor approves. Q15 A: doctor and witness both on every line. Q16 B: only doctors give the doctor right, never to themselves; Admins can't. Logged in `PLAN.md` › Q&A and `DECISIONS.md`. These shape the F12 demo in batch 3.

## 2026-11-27 — Batch 2 approved; controlled-drug rule and questions Q13–Q16
- Danny approved demo batch 2 (F9 and overall Right; all 16 checks set off by him).
- His note becomes a rule for F12: only a doctor takes out a controlled drug or approves someone else taking it out; Admin has no right here (`PLAN.md` › Additional thoughts).
- His question (how does the doctor know and approve?) opened Q13–Q16, asked on https://claude.ai/artifact/LDwa4rB2grPCRgQv5aHFC8 (`docs/stage4/controlled-drug-questions.html`, answers in its `cdq` collection). Batch 3 waits for the answers.

## 2026-11-27 — Demo batch 2 (F6, F7, F8, F9)
- New page: https://claude.ai/artifact/6BQkgEH6GWzkNpFnUb1PiT (`docs/stage4/demo-batch2-inventory.html`). The June Overview, By-location list, item page and restock/dispense dialog, in the June look, with made-up stock.
- A "Rules: June" switch works out readiness the June way, for comparison: Bag 1 at exactly its required amounts is Ready (new) vs Short (June, B1); the Trauma kit with no required amounts is "Not set up" (new) vs Ready (June, B25); the Store gets reorder levels (B10).
- New on the item page: Move a line to another bag or the Store (B24); edits and deletes recorded with old → new. Restock/dispense refuses 0, negatives, decimals and empty with a message (B17); controlled drugs point to the register (batch 3).
- My own slip found in testing and fixed before publishing: Edit and CSV wrote dates in world time (UTC), the same mistake as June bug B13. Now local dates only.
- Noted for batch 4: which roles may archive and delete.

## 2026-11-27 — Demo batch 1 (F1, F2, F3)
- **Approved by Danny** (27 Nov, 01:25): F1, F2, F3 and overall Right, no notes. The page recorded which checks he set off himself: 4 of 12 (B12 Settings locked for Staff, B5 phone menu, B7 overnight date, B3 new version keeps data).
- New page: https://claude.ai/artifact/StpM5fCjwefG2B5dpEjXQ1 (`docs/stage4/demo-batch1-foundation.html`). One working demo app in the June look (June colours and layout, light, as in June), made-up people and stock.
- What you can try: the phone menu (B5), plain-text search (B4), the date moving on overnight (B7); sign-in with roles, no "Acting as" (B12), no archiving yourself (B23), last Admin protected (B14); offline changes queued and sent, two computers' changes both kept, opening with no internet, first sign-in on a new computer needs internet once, a failed save shown (B22), a new version keeps the data (B3).
- Each feature has steps, self-ticking checks and a "how to use it in the real app" guide.

## 2026-11-27 — Feature list approved
- Danny on the Stage 4 page: all four parts Right, overall "Yes, that's it", no notes. The F1–F18 list in `PLAN.md` is now fixed.
- Q12 = A: release 1 = F1–F15; release 2 = the roster (F16), together with EDP reading it.
- His first try saved nothing (the page's answer store was empty); the second time all 6 answers arrived.

## 2026-11-27 — Stage 4 started: feature list draft
- New page: https://claude.ai/artifact/AKdfUCwrTn4bZ56tqzQA5F (`docs/stage4/reach-inventory-features.html`). 18 features (F1–F18) placed in the June app's window, with the June source, the bug rules and the demo batch for each. F17 and F18 are "later", so they get no demo now.
- `PLAN.md`: the June features were renamed **J1–J14** (they were F1–F14), so they can't be confused with the new F-numbers. The 26 Nov conformance table below still uses the old names: its June F1 = J1, and so on.
- New question **Q12**: what goes into the first release. Proposed A: F1–F15 in release 1, and the roster F16 in release 2 together with EDP reading it.

## 2026-11-26 — Stage 3 signed off
- Danny answered every part on the Stage 3 page: Right, overall "sounds good" (log in `PLAN.md` › Stage 3 answers).
- Three corrections applied to the page (version 3) and the files: the duty roster lives in this app and EDP reads it (EDP has no roster function); the program starts with no internet; Patients = one Patient File per patient in a Patient Archive (later).

## 2026-11-26 — Conformance table: June Medical Suite → new app (reference: the archived June app)
Danny: "The UI is good. But you are doing the underneath leg work." The June screens are the UI; the rebuild is underneath. The same table is on the Stage 3 page, part "From the June app".

| June | Feature | Status | In the new app |
|---|---|---|---|
| F1 | Shell: side menu, Home cards, global search | **PORTED** | same, and working on small screens (B5) |
| F1 | "Acting as" switcher | **CHANGED** | real sign-in per person (B12, B23) |
| F2 | Personnel: directory, profile, add, edit, archive | **CHANGED** | same screens; people come from the shared REACH list (Q6 = C) |
| F3 | Training and courses, expiry badges | **PORTED** | expired certificates renewable (B20) |
| F4 | Inventory overview | **PORTED** | readiness fixed (B1, B25); Store reorder levels (B10) |
| F5 | Inventory by location: filters, sort, CSV export | **PORTED** | unchanged |
| F6 | Item page | **PORTED** | lines movable (B24); deletes logged (B18) |
| F7 | Restock / Dispense | **PORTED** | wrong amounts refused with a message (B17) |
| F8 | Count stock | **PORTED** | counts kept; empty = not counted (B16) |
| F9 | Stock takes | **PORTED** | stored on the server (B3) |
| F10 | Settings | **PORTED** | plus country settings |
| F11 | Backup export / import | **CHANGED** | server keeps data and backups; file export stays; import (backup or Excel) previews and asks first (B2, B15) |
| F12 | Activity log | **CHANGED** | one REACH-wide log, old → new (B19) |
| F13 | Dispatch hook `applyDispense()` | **CHANGED** | EDP "used on a case" message (EDP F79), later; never below zero silently (B11) |
| F14 | Patient Archive placeholder | **CHANGED** | later part of this app, stricter access: one Patient File per patient (from EDP or by hand), kept in the Patient Archive |
| F14 | Roster placeholder | **CHANGED** | the real duty roster, kept in this app; EDP reads who is on duty (corrected after Stage 3) |
| F14 | Dispatch placeholder | **DROPPED** | → EDP |
| F14 | Calendar, Library placeholders | **DROPPED** | → shared REACH tools, to decide (PLAN.md › Belongs elsewhere) |
| — | Controlled-drug register | **NEW** | Q8 |

## 2026-11-26 — Stage 3 page
- Stage 2 signed off (Danny: "Yes, start Stage 3").
- New page `docs/stage3/reach-inventory-blueprint.html`, published at https://claude.ai/artifact/LcTfsHesU2Jap8q6ajrB6E: the whole new app part by part (devices and server, menu, shared people list, offline day, EDP "used on a case", controlled-drug register, the 26 June bugs as 9 rules, country settings, what is not in this app). Example data only.

## 2026-11-26 — Last open questions answered
- Q6 = C: one medical app for nurses and doctors; people, sign-in and roster shared with EDP.
- Q4 = B, straight to the real program: installed Mac and Windows programs from the same code as EDP, outside the App Store.
- All 11 questions now answered; Stage 2 waits for Danny's confirmation.

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
