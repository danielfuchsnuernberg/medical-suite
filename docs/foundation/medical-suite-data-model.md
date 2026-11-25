# Medical Suite — Data Model & Architecture Spec

**Version 1.0 · the shared contract every tool builds against**

This document defines *what the things are* before we build the screens that show them.
Pair it with `tokens.css` (how it looks) and the style guide (the visual reference).
Both this file and the tokens should live in Project knowledge as the single source of truth.

---

## 1. The whole system in one line

> A **single shared store** holds the data. **Personnel** is the spine — every tool refers to people by ID.
> When someone *does* something, the tool emits an **event**; the **Activity Log** records it, and other tools
> react to it (e.g. a dispense in Dispatch lowers stock in Inventory).

Everything below is detail underneath that sentence.

---

## 2. Shared entities (the spine)

Each entity is **owned** by one tool (the only place it's created/edited) and **referenced** by others.

| Entity | Owned by | Referenced by | Purpose |
|---|---|---|---|
| **Personnel** | Suite core | every tool | the master staff list |
| **Patient** | Patient Archive | Dispatch, Activity | the master patient list |
| **InventoryItem** | Inventory | Dispatch, Activity | stock items + levels |
| **Shift** | Roster | Calendar, Personnel | a staff member working a time block |
| **CalendarEvent** | Calendar | (may derive from Shifts / training due dates) | anything time-based |
| **CourseType** | Library / Suite core | Personnel, Calendar | catalog of trainings & certifications |
| **TrainingRecord** | Personnel | Calendar, Roster (alerts) | one person's status on one course |
| **ActivityLogEntry** | shared service | every tool | who did what, when, where |

> **Rule:** a tool never reaches into another tool's data directly. It reads the shared store and emits events.
> This is what lets Dispatch stay a standalone app while still moving Inventory's numbers.

---

## 3. The Personnel record (our first build target)

| Field | Type | Notes |
|---|---|---|
| `id` | string | auto-generated, e.g. `PR-1042`. Never reused. |
| `firstName`, `lastName` | string | display name = "Dr. {first} {last}" when title applies |
| `title` | string | optional honorific (Dr., etc.) |
| `jobRole` | enum | Physician, Nurse, Charge Nurse, Pharmacist, Technician … (extensible) — **descriptive** |
| `department` | enum | Emergency, ICU, Pharmacy, Cardiology, Radiology, General Ward … |
| `accessRole` | enum | **Staff · Manager · Admin** — controls software permissions (see §4) |
| `dutyStatus` | enum | On duty · Off duty · On leave — operational, changes daily |
| `lifecycle` | enum | **Active · Archived** — see §6. Distinct from dutyStatus. |
| `email`, `phone` | string | sensitive — restricted by access role |
| `startDate` | date | |
| `licenseRef` | string | optional credential / registration number |
| `trainingRecords` | TrainingRecord[] | see §5 |
| `createdAt`, `updatedAt`, `createdBy` | meta | audit trail |

> **The key distinction:** `jobRole` (what they do) and `accessRole` (what they're allowed to do in the software)
> are **separate fields on separate axes**. A Charge Nurse might have Manager access — but the two are set
> independently and never assumed from each other.

> **Two different "statuses":** `dutyStatus` (on/off/leave, changes every shift) vs `lifecycle` (Active/Archived,
> changes rarely). Keeping them apart avoids the classic mess of "is this person gone, or just off today?"

---

## 4. Access roles & permissions

Three levels to start. Permissions are stored as **data** (a matrix), not hard-coded, so a 4th role later is a config change.

| Capability | Staff | Manager | Admin |
|---|:--:|:--:|:--:|
| Log in; see the directory (basic fields) | ✓ | ✓ | ✓ |
| See **own** full profile, activity, shifts, training | ✓ | ✓ | ✓ |
| See **others'** sensitive fields (contact, leave reason) | — | ✓ | ✓ |
| Add a person | — | ✓ | ✓ |
| Edit a person's details | — | ✓ | ✓ |
| Manage training records (assign required, mark complete) | own view | ✓ | ✓ |
| **Archive** a person | — | — | ✓ |
| **Hard-delete** a person (mistakes only) | — | — | ✓ |
| **Assign / change a person's access role** | — | — | ✓ |
| System settings | — | — | ✓ |

Two mechanisms enforce this in the UI:
- **Feature gating** — a Staff user simply doesn't see the "Add personnel" button or Settings.
- **Field visibility** — everyone sees name / role / department / duty status; contact details and leave reasons are
  restricted, *except on your own record*.

Default posture: **least privilege** — show only what the role needs.

> **Login note:** real authentication needs a server, which static hosting (GitHub Pages) doesn't have. For the
> prototype we use an **"acting as" user-switcher** to design and test the gated screens. Real auth (passwords / SSO)
> arrives at the backend stage. We will not present mock login as if it were secure.

---

## 5. Training & certifications

Modeled in two parts so a course is defined once and referenced everywhere — same principle as the tokens.

### CourseType (the catalog — defined once)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | e.g. "Basic Life Support (BLS)" |
| `category` | enum | Clinical · Safety · Compliance |
| `validityMonths` | number | how long a completion stays valid (drives expiry). `null` = never expires |
| `mandatoryFor` | jobRole[] | which roles must hold this |
| `materialsRef` | string | optional link into the Library |

### TrainingRecord (one person × one course)

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `staffId` | string | → Personnel |
| `courseTypeId` | string | → CourseType |
| `status` | enum | Required · In progress · Completed · **Expired** |
| `completedDate` | date | nullable |
| `expiryDate` | date | usually `completedDate + validityMonths`; nullable |
| `dueDate` | date | for *required* but not-yet-done items |
| `certificateRef` | string | optional |

> `Expired` is derived automatically: if `expiryDate < today`, the record reads as expired regardless of stored status.

### Why this matters beyond the profile

Because trainings **expire** and some are **due by a date**, this connects outward:
- **Dashboard / alerts** — "3 staff have BLS expiring this month."
- **Calendar** — expiry and due dates appear as reminders.
- **Roster** (optional, strict mode) — warn before scheduling someone whose mandatory cert has lapsed.

Training is a live signal, not a static note.

---

## 6. Lifecycle — archive, don't delete

In a logging system, hard-deleting a person breaks every historical entry that references them.

- **Active → Archived** (reversible): drops out of active lists, can't be assigned new shifts or training; **all
  historical log entries stay intact and readable.** This is what "delete" means by default.
- **Hard delete** (Admin only): reserved for records created *in error*. Ideally only allowed when the person has no
  historical references.

---

## 7. Activity Log & event model

Every meaningful action becomes one entry. The log is both a feature (the "Recent Activity" feed) and the wiring
that connects tools.

### ActivityLogEntry

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `timestamp` | datetime | |
| `actorId` | string | → Personnel (the logged-in user) |
| `tool` | enum | Personnel · Inventory · Dispatch · Roster · Calendar · Patient Archive · Library |
| `action` | string | e.g. `added_personnel`, `dispensed`, `restocked`, `completed_training` |
| `targetType` | string | e.g. `InventoryItem`, `Personnel`, `Patient` |
| `targetId` | string | what was acted on |
| `detail` | object | structured payload, e.g. `{ item: "Morphine 10mg", qty: 2 }` |
| `summary` | string | human-readable line for the feed |

### How it flows

1. A tool calls a shared `logActivity(entry)` service after an action succeeds.
2. The log stores it.
3. Subscribers react — e.g. Inventory listens for `dispensed` events and decrements the item's stock.

For v1 (Personnel only) the events are personnel events — `added_personnel`, `edited_personnel`,
`archived_personnel`, `completed_training`. We define the full contract now so Inventory and Dispatch slot in with
zero rework later.

---

## 8. What we build first (v1 scope)

The Suite shell + Personnel Management, on top of `tokens.css`:

- **Shell** — window frame, left nav (all tools listed, Dispatch tagged as a separate app), top bar, the "acting as"
  user-switcher for testing roles.
- **Personnel directory** — searchable/filterable table (by role, department, duty status).
- **Add / edit person** — form writing to the shared store; new people appear everywhere.
- **Person profile** — detail view pulling in that person's activity, (placeholder) shifts, and **training records**.
- **Training section** — view/assign required courses, mark complete, show expiry with status colors.
- **Archive** — soft-delete with history preserved; hard-delete gated to Admin.
- **Activity feed** — recent personnel events, using the shared log model.
- **Role gating** — buttons and fields appear/hide based on the active user's access role.

Out of scope for v1 (defined here, built later): real authentication, the other five tools, Dispatch integration.
