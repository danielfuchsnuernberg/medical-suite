# BUGS — REACH Inventory (June prototype)

Bug hunt of 26 Nov 2026: my own pass and an independent code review that did not see my list, merged. Each bug was reproduced in a **test copy** of the app (never the live app or Danny's Dock app), unless the "Measured" column says otherwise. **Nothing is fixed. Nothing gets fixed before Danny's GO.**

**Route** says where each bug gets fixed, because the June app becomes a reference and the real app is rebuilt (see `PLAN.md` › Additional thoughts, 26 Nov):
- **Patch now**: endangers real data today; small fix in the June app (only if it's in real use, Q11).
- **Rebuild**: the new app must not repeat it. It's in the rebuild's acceptance criteria, not patched here.
- **Data**: the stock list itself needs cleaning; medics or Danny decide the right values.
- **Decision**: needs Danny's answer first.

| ID | What you'd see | Cause | Where | Measured | Severity | Route |
|---|---|---|---|---|---|---|
| B1 | A bag holding exactly its required amount shows "Low · below par", so no bag can ever be "Ready" | `quantity <= par` instead of `<` | index.html:440 | 289 of 437 par lines are exactly at par (286 not counting 3 with par 0); Snake Bite Kit 0 of 18 ok | wrong medical info | Rebuild |
| B2 | After Import backup, Inventory shows "undefined" and an empty table until reload | import resets `state` without the inventory fields | :493 | 0 rows, heading "undefined" | broken | Rebuild |
| B3 | A new app version that changes `DATA_VERSION` silently replaces all data with the built-in list | boot re-seeds instead of migrating | :304, :388 | count 4242 back to 1000; stock take gone | **data loss** | Rebuild |
| B4 | Typed text runs as code, even in the search box. A quote in a name breaks its buttons. | nothing is escaped; everything goes through `innerHTML` | whole file, e.g. :553 | search box ran a test script; category `Kid"s kit` → button sees `Kid` | security | Rebuild |
| B5 | Phone: no menu, no way back, top bar and table cut off | `@media` hides the side menu with nothing in its place | :211–218 | top bar 629 px on a 375 px screen | broken | Rebuild |
| B6 | Stock-list data problems (details below the table) | spreadsheet import | :378–379 | counted with a script | wrong medical info | Data |
| B7 | "Today" freezes when the page opens; left open overnight, statuses are a day old | `today` set once at load | :346 | from the code | minor | Rebuild |
| B8 | Settings text boxes are unstyled | class `.input` never defined | :771, :798, :812 | 2 px inset border | cosmetic | Rebuild |
| B9 | **Real** stock list (784 items, 902 lines) and **real** staff names are on a public page and in a public repo | built-in seed data | :361–379 | repo public; Danny confirmed both are real | **privacy** | Decision (Q1) |
| B10 | The Store has no reorder levels, so it never shows "low" | none imported | data | 0 of 378 Store lines | half-done | Data + Rebuild |
| B11 | EDP hook `applyDispense()` clips at 0 without warning; the same message twice subtracts twice | stub | :1501–1509 | 9999 → 0, no warning | half-done | Rebuild (EDP link) |
| B12 | Anyone can switch to Admin; every role may permanently delete | no real sign-in | :320–330 | from the code | by design for now | Rebuild |
| B13 | **Dates are off by a day.** Peru: an item expiring 26 Nov shows Expired on the evening of the 25th. PNG: it flips at 10:00 on the expiry day; dates recorded before 10:00 get yesterday's date. | dates read as UTC midnight and written with `toISOString()` (UTC) | :347, :405, :453, :964, :1008, :1424, :1555 | tested in both time zones | wrong medical info | Rebuild |
| B14 | **Archiving or demoting the only Admin locks Settings, Import and access roles for good** | nothing protects the last Admin | :950, :965, :1019, :390 | 0 Admins left; acting list offers only Manager / Staff | broken (only fix: wipe the data) | Rebuild |
| B15 | **Import replaces everything with no "are you sure?"**. An older backup (no inventory) wipes all stock; a backup with no people locks the app. | import only checks for a `personnel` list | :486–497 | 784 items → 0; no user left, every button gone | **data loss** | Rebuild |
| B16 | **Count stock loses typed counts** on any search, filter, sort or menu click, with no warning. A box left empty saves as **0** (line becomes "Out of stock"). | every change re-draws inputs from saved values; `parseInt('')‖0` | :523, :1250–1259, :1082 | typed 777 → back to 1; empty → 0 | **data loss** | Rebuild |
| B17 | Restock and Dispense change bad input silently: −5, 0 or empty becomes 1, and 2.7 becomes 2 | `Math.max(1, parseInt(…)‖0)` | :1481, :1082 | 0.5 restocked 1; 2.7 counted as 2 | minor | Rebuild |
| B18 | Permanent deletes (item, stock line, person) leave **no trace** in the activity log | no `logActivity` call | :1528, :1549, :1035 | log length unchanged | audit gap | Rebuild |
| B19 | Changing a quantity through "Edit" logs no old → new number. Renaming an item drops part of its movement history. | log has no from/to; history matched by name | :1456–1457, :1277 | log detail had no quantities | audit gap | Rebuild |
| B20 | An expired certificate can never be renewed: no "Mark complete", and "Assign course" leaves it out | button only for Required / In progress; assign skips held courses | :728, :983–984 | expired Fire Safety: 0 buttons, not offered | broken | Rebuild |
| B21 | Deleting a department or category that only archived records use silently re-files them ("Emergency", "Medication") the next time they're edited | "in use" check counts Active only; form falls back to first option | :884, :1601, :948, :1400 | department became "Emergency" | data corruption | Rebuild |
| B22 | When browser storage is full, saves fail **silently**: changes look saved and are gone after reload | `catch(e){}` swallows the error | :297 | calculated: one stock take ≈ 135 KB, so about 30 stock takes reach Safari's ~5 MB (not reproducible in the test browser) | data loss (latent) | Rebuild |
| B23 | Archiving or deleting yourself leaves the "Acting as" menu wrong; you keep rights as an archived user | `renderShell()` not called; no self-guard | :1021, :1026 | from the code and the B14 test | minor | Rebuild |
| B24 | A stock line can't be moved between bags (location locked in Edit), yet bag delete says "move its items first". Renaming "icu" to "ICU" is refused as a duplicate. | no move action; duplicate check includes itself | :1441, :1630, :877, :1594 | rename refused | minor | Rebuild |
| B25 | Bag lines with no required amount show "At par", so Trauma Kit shows "Ready" with nothing defined | no par treated as fine | :447 | Trauma Kit: 8 lines, none with par, "Ready" | misleading | Rebuild + Data |
| B26 | Small ones: training expiry via `setMonth` overflows (31 Jan + 1 month = 3 Mar); "Assign course" offered to archived staff; department count includes archived when "Show archived" is ticked | — | :1008, :721, :631 | 3 Mar 2027 | minor | Rebuild |

## B6 — stock-list data problems (for the medics, not code)
- **Nonsense expiry dates:** SL-2113 Stomach Tube Size 14 (1905-07-17), SL-2477 and SL-2817 Needle Size 20g (1900-01-05). They head "Soonest to expire".
- **Dates in the lot field:** SL-2491 Dextrose 50% lot "4429-01-01", SL-2528 Betadine lot "2027-06-01" with no expiry, SL-2549 and SL-2728 trauma bandages. These may be expiry or manufacture dates in the wrong column.
- **Same item twice in one place (9):** Adrenaline 1:1000 in MAMA's Bag (0 of par 1 **and** 2 of par 2, so the bag reads "not ready" while holding 2); Benzyl Penicillin and Hydrocortisone in MAMA's Bag (an extra 0 line each); NPA twice in Oxygen Airway (Old) and twice in Oxygen (New); Oxygen tubing in Oxygen (New); Urine Bag 2000 ml in MAMA's Bag and P2-ICU; Laryngeal Tube Size 1 in the Store.
- **Near-duplicate or ambiguous names:** "Atropin 06mg/ml" vs "Atropin 0.6mg/ml" (ambiguous dose), "Asprin 100 mg" vs "Asprin  100mg", "Bandaid" vs "Band Aid", two spellings of non-sterile gauze.
- **Spelling:** Amoxcilin, Hydrocortision, Dextros, Asprin, Oitment and others. 258 names contain double spaces, so search misses them.
- **Units:** 32 different spellings ("Tube" / "tube", "ampoul" …); 609 of 784 items have no unit at all.
- **Categories:** 146 items sit in "Other", one of them named "Diagnostic".
- **Controlled drugs:** 16 lines, only 5 with a lot number.
- **Expired:** 201 lines are past their expiry today; 187 of those still hold stock.

## Fix order (Workflow B step 4) — proposed, waiting for GO

**Patch now** (in the June app) is only worth it if the June app is used for real counts (Q11). Root causes first:

1. **B15 safe import** (confirm dialog, refuse broken or empty backups). Root: once the real data leaves the page (step 2), Import is how the stock gets loaded, so it must be safe first.
2. **B9 real data out of the public page** (Q1): the page starts empty, stock and staff come from a private backup file. History purge only with Danny's explicit OK (force-push).
3. **B3 no more re-seeding**: with the built-in data gone, the "version changed → reload built-in list" path is removed; data is migrated instead.
4. **B22 save failures shown**: red warning "couldn't save, export a backup now".
5. **B16 count protection**: an empty box means "not counted", and leaving with unsaved counts asks first.
6. **B14 last-Admin guard**.
7. **B1 at-par = ready** (one character; changes what "ready" means on screen, so it comes last and is shown to Danny before/after).

If Q11 = "nobody uses it for real": only 1 and 2, so the real data comes off the public page.

**Rebuild**: every Rebuild bug becomes an acceptance criterion in the new app's Master Checklist (Stage 4).
**Data**: the B6 list goes to the medics for a clean-up before the stock is loaded into the new app.

**Update 26 Nov 2026:** Danny answered Q11: nobody uses the June app. **No patches to the June app.** Every bug above is a rule for the new app; B9 is handled by archiving the old app and taking it off GitHub (see `CHECKLIST.md`).

## Found while building the new app

| ID | What you'd see | Cause | Files | Status |
|---|---|---|---|---|
| B28 | (28 Nov, question pages Q25 and Q26) Danny clicks an answer and it doesn't stay: Q25 saved nothing, Q26 saved part 1 only | suspected: the page reloads the saved answers after every click; an older copy arriving late overwrites the newer click, so it looks as if the click did nothing (not yet reproduced) | `docs/stage6/cd-move-question.html`, `docs/stage6/import-question.html` (and the pages before them, same code) | **closed 28 Nov**: proven on the Head Doctor page (https://claude.ai/artifact/KHW4Hfihq7nSYKXzSF2HqG): all six of Danny's clicks arrived (version 11 of its answers). The fix was written into the next page (28 Nov, https://claude.ai/artifact/XD9tDFYMWBteb9EnNto29r): every save sends all answers; a copy coming back from the server never overwrites a newer click; the page says “✓ Saved for Claude · n of 3 answered”. Checked in the browser without the server (all clicks stay); proven only once Danny's clicks arrive in its collection. Older pages unchanged. Danny answered Q25 and Q26 in chat |
| B27 | (28 Nov, F2) Lowering Dr Ben and then Cara to Work quickly, one after the other, left **nobody** at Manage level, so nobody could change settings or levels any more | each change was checked before the one before it had finished saving, and against the person as the screen last saw them | `packages/store/src/accounts.ts` | **closed 28 Nov**: changes to people and access now run one after the other, each checked against the stored result of the one before and against the person's current level. Unit tests fail without the fix and pass with it. Not fixed for two computers changing levels at the same time **offline**: that needs the server (noted in HANDOVER) |
