# BUGS — REACH Inventory

Found in the stock-take of 26 Nov 2026. Each one was measured by running a copy of the app (not the live one) unless marked otherwise. **None is fixed yet. Nothing gets fixed before Danny's GO.**

| ID | Symptom | Cause | Files | Measured | Status |
|---|---|---|---|---|---|
| B1 | A bag that holds exactly its required amount shows **"Low / short"**, so no bag can ever be "Ready". Snake Bite Kit: 18 lines, 0 ok, 18 short. | `stockStatus()` uses `quantity <= par` instead of `<` | index.html:440 | 289 of 437 par lines are exactly at par; 7 of 8 bags "Not ready" | open |
| B2 | After **Import backup**, Inventory shows the heading "undefined" and an empty table until the page is reloaded | `importData()` resets `state` without the inventory fields (`iView`, `iLoc` …) | index.html:493 | 0 rows, heading "undefined" | open |
| B3 | Uploading a new version that changes `DATA_VERSION` **silently wipes all saved data** (counts, stock takes, log) and puts the built-in list back | boot replaces the store with `seed()` whenever the version differs | index.html:304, 388 | count set to 4242, then after the version change it was 1000 again; 1 stock take became 0 | open |
| B4 | Text typed into names (item, bag, category, person) is inserted as HTML and **can run code** | no escaping anywhere; everything goes through `innerHTML` | whole file | an item name with an `<img onerror>` ran its code | open |
| B5 | On a phone (width under 900 px) the menu disappears and there is **no way back** to Home or to other screens. The top bar is too wide, and the table cuts off the +/− buttons. | the `@media` rule hides `.side` and offers nothing in its place | index.html:211–218 | at 375 px: top bar 629 px wide; side menu `display:none` | open |
| B6 | Data quality from the spreadsheet import: 3 nonsense expiry dates (1900-01-05 ×2, 1905-07-17), 258 names with double spaces, typos (e.g. "Amoxcilin") | Excel date conversion and copy-paste | index.html:378–379 (built-in data) | counted with a script | open (data, needs Danny) |
| B7 | "Today" is fixed when the page opens, so an app left open overnight shows yesterday's expiry status | `const today=new Date()` at load | index.html:346 | from the code, not tested | open |
| B8 | Text boxes in Settings (new department, category, bag) have no styling | class `.input` is used but never defined | index.html:771, 798, 812 | computed style: 2 px inset border, 0 radius | open |
| B9 | The **public** repo and live page contain the real stock list (784 items, 902 lines, lots and expiries) and 5 real staff names with roles | built-in seed data from the spreadsheets | index.html:361–379 | the repo is public (GitHub API) | open (decision Q1) |
| B10 | Store lines have no reorder level, so the Store can never show "low / reorder", only "out" | no par was imported for the Store | data | 0 of 378 Store lines have a par | open (half-done) |
| B11 | `applyDispense()` (the Dispatch hook) quietly clips stock at 0 and has no guard against the same message arriving twice | prototype stub | index.html:1501–1509 | dispense of 9999 left 0, no warning | open (part of the EDP link) |
| B12 | Permissions: every role (Staff included) may permanently delete items, and anyone can switch "Acting as" to Admin | prototype on purpose: no real sign-in | index.html:320–330 | from the code | open (by design until there is sign-in) |
