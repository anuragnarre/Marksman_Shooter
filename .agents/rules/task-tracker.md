# task-tracker

## MANDATORY: Task Tracker Protocol

The file `D:\App and Hardware Project\App\Marksman\task.md` is the **single source of truth** for all implementation progress on the Marksman platform (Range App + Coach/Shooter App).

---

## Rules — YOU MUST FOLLOW THESE WITHOUT EXCEPTION

### 1. At the START of every session or request:
- **Read `task.md`** before doing any implementation work.
- Identify which category the current task belongs to.
- Check whether it is already marked done (avoid duplicate work).
- If `task.md` doesn't exist yet, create it from the implementation plan at `D:\App and Hardware Project\App\Marksman\implementation_plan for future`.

### 2. While doing work:
- Track which specific items from `task.md` you are implementing.
- Note file paths of everything you create or modify.

### 3. At the END of every response where code was written or tasks were completed:
- **Update `task.md`** — move completed items from `🔲 REMAINING` to `✅ COMPLETED`.
- Add the files changed in the table next to each completed item.
- Update the **Overall Progress** summary table (Done count + percentage).
- Update the **Last Updated** date at the top of the file.
- If new tasks were discovered during implementation (e.g. a bug, a missing DTO, a new edge case), add them to the appropriate remaining section.

### 4. Format rules for updates:
```
| ✅ | Short description of what was done | `path/to/file.ts` |
```
- Never delete completed items — move them to the COMPLETED section with ✅.
- Use ❌ for items that were attempted but blocked/deferred with a note.
- Use ⚠ for items that are partially done.

---

## Why this matters
- This project has **~338 distinct implementation items** across 18 categories.
- The Coach/Shooter App and Range App share cross-platform features (see the cross-account matrix in `task.md`).
- Without tracking, work gets duplicated or important items get skipped.
- The task tracker is also the handoff document between sessions — always keep it current.

---

## Quick reference — task.md location
```
D:\App and Hardware Project\App\Marksman\task.md
```

## Quick reference — implementation plan location
```
D:\App and Hardware Project\App\Marksman\implementation_plan for future
```
