# Exercise History - Where, When, and How To Show

## Product Decision

- Do not add a new Performance tab.
- Keep comparison/history inside existing flows only:
  - Workout In Progress (primary)
  - Prepare Workout (secondary)
  - Logbook (review flow)

## Goal

Show exact historical numbers without charts, with optional interactions that never block workout logging.

---

## Active Surfaces

### Surface 1 - Workout In Progress (lazy, on-demand)

**Where:** `InProgressExerciseCard` header row inside `InProgressWorkoutScreen`  
**When:** During an active workout, per exercise, only if user asks for it  
**Why first:** Highest daily value with minimal UI noise

### Surface 2 - Prepare Workout (last time hint)

**Where:** `PrepareWorkoutScreen` -> `PrepareWorkoutExercisesForm`  
**When:** Before starting workout  
**Why second:** Strong planning signal before the session starts

### Surface 3 - Logbook (comparison summary)

**Where:** `LogbookWorkoutCard`  
**When:** After workout, review flow  
**Why third:** Useful, but comparison logic is heavier and easier to clutter

---

## Workout In Progress - Detailed UI Spec

### Exact placement in the existing card

Current header structure in each exercise card is:

`[avatar] [order] [exercise name] [trash]`

Recommended new structure:

`[avatar] [order] [exercise name] [LAST] [trash]`

Notes:

- `LAST` is a small text button (or clock icon + text) in the header, not inside set rows.
- Keep button touch area >= 36x36.
- Keep `trash` as the rightmost destructive action.

### User click flow

1. User sees the exercise card with sets as usual.
2. User taps `LAST` for that exercise.
3. Only that exercise row enters loading state.
4. A compact panel appears between header and sets.
5. User can close the panel or keep it open while editing sets.

### Panel position and behavior

Panel location:

- Inline, directly below exercise header, above set list divider.

Why inline over modal/sheet:

- Keeps context with current exercise.
- Avoids navigation/modal friction.
- Makes quick check fast during set entry.

### Panel content (minimal, exact, useful)

Header line:

- `Last session: 6 days ago`

Key summary line:

- `Best set: 60kg x 8`

Optional list (collapsed by default):

- `Set 1: 60kg x 8`
- `Set 2: 60kg x 8`
- `Set 3: 57.5kg x 6`

Optional secondary metric:

- `Volume: 1,440 kg`

### States for the same UI slot

- Collapsed (default): no extra content shown.
- Loading: `Loading last session...`
- Loaded: summary + optional set list.
- Empty: `No previous session for this exercise.`
- Error: `Could not load history.` + `Try again` action.

### Interaction best practices

- Fully optional, closed by default.
- Never block set inputs while loading history.
- Keep loading and errors row-scoped only.
- Cache by `exerciseId` for the active workout session.
- Cache empty state too, to avoid repeated unnecessary fetches.
- Do not auto-open panel for all exercises on screen load.

---

## Data Contract For Workout In Progress

New query:

- `getLastCompletedExerciseSnapshot(exerciseId: string, beforeWorkoutDate?: string)`

```ts
type LastCompletedExerciseSnapshot = {
  exerciseId: string;
  workoutId: string;
  workoutDate: string;
  gymName: string | null;
  sets: {
    setOrder: number;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
  bestSet: {
    weight: number;
    reps: number;
  } | null;
  totalVolume: number;
};
```

Query rules:

- Use completed workouts only.
- Exclude current workout from comparison.
- Order by workout date desc and pick latest session for that exercise.

---

## Logbook Direction (No New Tab)

Use logbook for review, not for primary in-session interaction.

Potential logbook additions later:

- Per exercise compact delta: `+2.5kg vs previous`
- Optional toggle in card actions: `Show comparison`

Keep this phase after Workout In Progress to avoid overloading current card layout.

---

## Updated Priority

| Phase | Surface             | Scope                                     |
| ----- | ------------------- | ----------------------------------------- |
| 1     | Workout In Progress | Lazy `LAST` action + inline panel + cache |
| 2     | Prepare Workout     | Inline last-time hint per exercise        |
| 3     | Logbook             | Compact comparison summary                |

---

## Estimated Files To Create/Update

### Phase 1 - Workout In Progress

- `features/workouts/dao/queries/workoutSetQueries.ts` - add `getLastCompletedExerciseSnapshot`
- `features/workouts/hooks/useExerciseLastSession.ts` - lazy row fetch + in-memory cache
- `features/workouts/components/in-progress/InProgressExerciseCard.tsx` - add `LAST` action and panel slot
- `features/workouts/InProgressWorkoutScreen.tsx` - wire callbacks, state, and retry handler

### Phase 2 - Prepare Workout

- `features/workouts/dao/queries/workoutSetQueries.ts` - add `getLastSetsByExercises`
- `features/workouts/hooks/useLastExerciseSets.ts` - batch hook for prepare screen
- `features/workouts/PrepareWorkoutScreen.tsx` - pass history summary to form
- `features/workouts/components/prepare/PrepareWorkoutExercisesForm.tsx` - render last-time line

### Phase 3 - Logbook

- `features/logbook/dao/queries/logbookQueries.ts` - add previous-session comparison data
- `features/logbook/components/LogbookWorkoutCard.tsx` - add optional comparison line
