# Notes for the REACH chat (from REACH Medical Suite)

What this app built or decided that touches the REACH ecosystem: the shared People list, offices and levels, the Core rules (`../reach/CORE-DATA.md`) and the other apps (EDP, Ops Management). This app never edits the REACH folder (R13); the REACH chat reads this file and decides. Newest first. Each note says what changed here, why it matters for REACH, and what REACH may want to decide.

---

## 28 Nov 2026 — Stage 8: decisions that touch the REACH Core

- **Q30 answered by Danny (Q32 = B):** a restore never replaces data; it adds ordinary changes that set records back to the backup (records made since are archived, never deleted; legal records like the controlled-drug register are never touched). So with the shared server, a restore rolls back on every computer and every log stays whole. **For REACH to consider** as the R10 rule for every app's restore.
- **Countries (R12):** the country list is a Settings list here (Management adds one: code, name, time zone). **For REACH to align** with EDP F81 (country settings) when the Core country list is decided.
- **Readable numbers (R4):** staff S-NNN and items I-NNNN; when two computers offline pick the same number, the later one is shown with -2. **For REACH to note** the same clash rule for EDP's case numbers (EDP B4/F63).
- **Doctors' list (Q31 = A):** Management can't change the profession of someone on this app's doctors' list. **For REACH to note** when profession becomes a Core People field (Ops Management): changing a listed doctor's profession must go through this app's doctors first.

## 28 Nov 2026 — Stage 7: things the shared server (SD2) will have to decide

- **Q30, what a restore means once there is a server.** Today a restore replaces everything on one computer. With a server, this app now sends the backup's messages and fetches everything again, so all computers agree; but that means a restore can't undo what other computers already have. Whether a restore should roll back on every computer is a server rule. **For REACH to decide with SD2**, for every app's restore (R10).
- **The “last Manage-level person” across computers.** Two computers offline can each pass the check and together leave nobody at Manage level. This app now repairs it automatically after syncing (the latest change is undone and logged). **For REACH to note:** EDP and Ops Management have the same risk with their admins; the server could refuse it instead.
- **Wrong-PIN pauses are per computer** until there is a server; the pause is logged and synced.

## 28 Nov 2026 — Training records (F15)

- Each certificate is a record `training` { personId, courseId, status (required / in progress / done), completedOn, expires }, pointing to the person and the course by hidden ID (R5). Dates are plain calendar dates (R6). Courses (with “valid for N months”) are this app's own Settings list.
- **For REACH to note:** pilots and engineers have certificates too (medicals, type ratings). If Ops Management later keeps people, it may want one shared shape for certificates. This app's shape is offered as a starting point; nothing in EDP is affected now.

## 28 Nov 2026 — Staff list: email and office on each person (F14)

**What changed in this app** (built and tested, not committed yet at the time of writing): each person now carries **email** (optional, unique across the whole list including archived people, stored in small letters) and **office** (one of the six REACH offices from Q10, set by Management; new people start as Medics). The staff screen shows the list, counts that never include archived people, and a profile.

**Why it matters for REACH:**
1. **People Core shape (R2, Q37).** For the later merge, the same person must be recognisable in every app's list. Email is the obvious match key. **For REACH to decide:** is `email` a Core People field (same name, small letters, unique), and is it the key Ops Management uses to merge the lists? Proposed by this app: yes.
2. **Office (R3).** Stored as `office` with the exact six words of Q10 (Management, Dispatch, Pilots, Medics, Engineering, Ground Crew). **For REACH to confirm** the field name and words, so EDP stores it the same way.
3. **Departments** (Clinical, Management, …) stay this app's own setting, not a Core list.

## 28 Nov 2026 — Doctors, medical codes and Head Doctors (Danny with the medical staff)

**What changed in this app** (built and tested, not committed yet at the time of writing; checklist F12.12–F12.15):
- Every person has a **profession**: Doctor, Nurse or Other. Management (Manage level) sets it.
- Someone entered as a Doctor types their own **medical code** (their registration number) when they sign in. It must be unique; it is logged. The program can't check it with the Medical Board: "there has to be a level of trust" (Danny).
- Only a doctor with a medical code can be on this app's **doctors' list** (may approve controlled drugs, F12) or be a **Head Doctor**.
- **Head Doctor**: Management names exactly one (Danny: “we just stick to one head doctor”); naming another takes it from the first. With only one doctor, that doctor is Head Doctor automatically. Only the Head Doctor marks an item as a **controlled drug**, after a confirm box.
- Management gets exactly one right around controlled drugs: naming the Head Doctor. It still can't approve, take out, tick drugs, or change the doctors' list.

**Why it matters for REACH:**
1. **People Core shape (R2, Q37).** Each app keeps its own people list "in the Core shape, same fields", so the lists can be merged by Ops Management later. This app now stores two new fields on a person: `profession` (Doctor / Nurse / Other) and `medicalCode` (free text, unique). EDP has medics and crew too; a roster (MD3) and training (F15) will use the profession. **For REACH to decide:** are `profession` and `medicalCode` Core People fields (same name and values in every app), or this app's own? Proposed by this app: Core fields, because "who is a doctor" is a fact about the person, not about one app.
2. **App rights stay in the app.** `cdRight` (on the doctors' list) and `headDoctor` are this app's own rights, stored on the person record today. When Ops Management becomes the People keeper, these should stay with the Medical Suite (like each app's View/Work/Manage level), not move into the shared person. **For REACH to note** in the merge plan.
3. **Offices and levels (ACCESS.md, R3).** In the Medical Suite, controlled-drug rights don't follow levels or offices: they come from the doctors' list. Management (office) at Manage level names the Head Doctor and nothing more. **For REACH to note** in ACCESS.md for MD1.
4. **Medical item catalogue (R2: keeper Medical Suite).** Items carry a `controlled` flag, set only by a Head Doctor. EDP F79 ("medication used on a case", not built) will need to read it, because a controlled drug taken out for a case must go through this app's register (witness, doctor's approval, running balance). Recorded in this app's PLAN › "EDP link — what it would need".

## 28 Nov 2026 — Loading the medics' Excel lists (F13.6)

- The medical item catalogue (R2: keeper Medical Suite) gets its first real items from the medics' spreadsheets through this import, never built in (R11). Item names are tidied (double spaces) but otherwise kept as the medics wrote them; near-duplicates (“Asprin” / “Aspirin”) are not merged automatically. **For REACH to note:** EDP F79 will point to these item IDs (R5), so names can be corrected later without breaking links.
- Bags named after the sheets can appear as new places in this app (Store and bags). They are this app's own places, not EDP's Places list (R2: keeper EDP, airstrips and towns). **For REACH to note** that “place” means two different things in the two apps.

## 28 Nov 2026 — Shapes this app follows (for the record)

- **R9 change log:** every change is one message (who, record, op, data, when, app code MD, device); the activity log is worked out from the messages. Matches R9.
- **R10 backup file:** `{ app: "MD", kind: "backup", dataVersion, exportedAt, exportedBy, data: { messages } }`. Beyond R10 it adds `kind` and `exportedBy`. **For REACH to decide** whether those two belong in the R10 shape for every app.
- **What is never in a backup or sent anywhere:** password and PIN check values, "stay signed in". They belong to one computer until one REACH account exists (SD1).
- **Never deleted** (R4, Q38), extended in this app: stock takes and the controlled-drug register (lines and doctors' decisions). They can't even be changed afterwards.
- **Backups until the server exists (SD2):** one a day on each computer, the last 30 kept. The server's nightly backups wait for SD2.
