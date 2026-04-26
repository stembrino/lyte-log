# Logbook Routine Filter Plan

## Overview

Add a **routine filter** to the logbook tab, allowing users to filter completed workouts by the associated routine (similar to the existing gym filter).

## Status

✅ **IMPLEMENTED** — Gym + routine filtering is live in logbook with combined (AND) behavior.

---

## Current Implementation Map

### 1) UI layer (chip selection)

- File: `features/logbook/LogbookTabScreen.tsx`
- Two chip rows are rendered:
  - Gym filter row (`selectedGymFilter`)
  - Routine filter row (`selectedRoutineFilter`)
- Both filters default to `all`.
- Routine chips are sorted by `workoutsCount` descending.
- When gym changes, routine filter is reset to `all` to avoid stale/invalid routine selection in the new gym context.

### 2) Hook layer (state + pagination)

- File: `features/logbook/hooks/usePaginatedLogbook.ts`
- State held by hook:
  - `selectedGymFilter`
  - `selectedRoutineFilter`
- Mapping helpers convert chip value to query args:
  - `all -> undefined`
  - `none -> null`
  - `id -> id`
- `fetchPage()` passes both resolved values to data queries:
  - `gymId`
  - `routineId`
- `reload()` resets pagination and reloads page 0 when either filter changes.
- `useFocusEffect()` triggers `reload()` when returning to Logbook so renamed routines and other updates appear without app restart.

#### Default gym sync behavior

- File: `features/logbook/hooks/useApplyDefaultGymFilter.ts`
- On mount and on focus, default gym is checked via `getDefaultGymId()`.
- Auto-apply happens only when the current gym filter is still auto-managed:
  - current is `all`, or
  - current equals the last auto-applied gym id.
- If user manually changed gym filter, auto-sync does not overwrite that choice.
- If default gym changes and is auto-applied, routine filter is reset to `all`.

### 3) Query layer (combined filter in SQL)

- File: `features/logbook/dao/queries/logbookQueries.ts`
- `buildCompletedWorkoutFilter(gymId?, routineId?)` applies the combined predicate.
- The list and count endpoints both use the same combined filter:
  - `getLogbookWorkoutsPage(...)`
  - `getLogbookWorkoutsCount(...)`
- This means filtering is done in DB, not in-memory.

### 4) Accumulation logic (where AND happens)

- The accumulation happens in `buildCompletedWorkoutFilter(...)`.
- Gym and routine constraints are composed with `and(...)`.
- Result behavior:
  - Gym only selected -> workouts from that gym
  - Routine only selected -> workouts from that routine
  - Gym + routine selected -> workouts matching both

### 5) Group sources for chips

- Gym chips: `getLogbookGymGroups()`
- Routine chips: `getLogbookRoutineGroups({ locale, gymId })`
- Routine names are translation-aware via translation map lookup.

### 6) Counter semantics

- Gym counters are global completed-workout totals by gym.
- Routine counters are scoped by the selected gym (`gymId`) so they update when gym filter changes.
- This avoids showing routine counts from unrelated gyms.
