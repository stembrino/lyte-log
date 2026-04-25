# Exercise History - Where, When & How To Show

## Goal

Show exercise performance history without charts, keeping exact numbers visible and easy to compare.

---

## Three Possible Surfaces

### Surface A - Prepare Workout ("last time")

**Where:** `PrepareWorkoutScreen` -> `PrepareWorkoutExercisesForm`  
**When:** While preparing a workout from a selected routine  
**What to show:** A subtle line under each exercise name:

```
BENCH PRESS
sets: [3]   reps: [8]
last time: 60kg x 8 x 3 sets - 6 days ago
```

**Pros:**

- Maximum context right before training starts
- No extra navigation
- Natural question answered: "what did I do last time?"

**Cons:**

- Requires extra data loading per exercise, or one batched query for all routine exercise IDs
- Only helps when the workout has routine exercises loaded

**Complexity:** Low - one new query `getLastWorkoutSetsByExercises(exerciseIds[])` returning the last completed set summary per exercise. No schema change.

---

### Surface B - Performance Tab (history as a list)

**Where:** `app/(tabs)/performance.tsx` - dedicated screen  
**When:** User opens the Performance tab and selects an exercise  
**What to show:** Reverse chronological list of sessions where the exercise appears:

```
Apr 24, 2026
  Set 1  60kg x 8   done
  Set 2  60kg x 8   done
  Set 3  57.5kg x 6 done

Apr 18, 2026
  Set 1  57.5kg x 8  done
  Set 2  57.5kg x 8  done
  Set 3  57.5kg x 8  done
```

Optional: session totals (volume = sum of weight x reps).

**Pros:**

- Full, readable history
- Exact numbers stay visible, so 1.5kg differences are obvious
- Naturally pageable

**Cons:**

- Requires exercise selection before showing data
- Adds one extra screen to discover

**Complexity:** Medium - new query `getExerciseHistory(exerciseId, filters)`, exercise picker (can reuse current picker), and session list components.

---

### Surface C - Delta in Logbook card

**Where:** `LogbookWorkoutCard` - each exercise row  
**When:** While reviewing past sessions in Logbook  
**What to show:** Compare with the previous session for that exercise:

```
BENCH PRESS    60kg x 8 x 3   +2.5kg vs previous
SQUAT          80kg x 5 x 4   same
```

**Pros:**

- Zero extra navigation in an existing review flow
- Immediate feedback in the right context

**Cons:**

- Heavier for Logbook queries (needs previous-session lookup per exercise)
- Can add visual noise for users who do not want comparison there
- Comparison logic gets complex when set structures differ

**Complexity:** Relatively high - requires previous-session lookup and robust set-diff logic.

---

## Recommended Priority

| Phase | Surface | Reason |
| ---- | ---- | ---- |
| 1 | **Workout In Progress (lazy, on-demand)** | Highest daily value with optional UX and low visual noise |
| 2 | **A - Last time in Prepare Workout** | Great pre-workout context with moderate implementation effort |
| 3 | **B - Performance tab list** | Full history for deep review |
| 4 | **C - Logbook delta** | Useful but heavier and easier to clutter |

---

## Data Requirements By Surface

### Workout In Progress first (lazy, on-demand)

New query: `getLastCompletedExerciseSnapshot(exerciseId: string, beforeWorkoutDate?: string)`

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

Implementation details:
- Trigger query only when user taps the `Last` action on an exercise row.
- Cache results in memory by `exerciseId` during the active session.
- If no prior data exists, cache an explicit empty result to avoid repeated fetches.
- Optionally preload next 1-2 nearby exercise IDs after first successful fetch.

UX interaction flow (Workout In Progress):
1. User sees each exercise row with a tiny optional action (`Last`) near row actions.
2. User taps `Last`.
3. Row expands inline (or opens a small bottom sheet) with exact previous-session data.
4. User can close the panel and continue logging without leaving the screen.

Where to place the action:
- Best default: right side of each exercise row header, next to existing small controls.
- Avoid placing it inside each set row (too noisy and repetitive).
- Keep tap target at least 36x36 for accessibility.

What to show inside the lazy panel:
- Relative date: `Last session: 6 days ago`
- Best set: `Best: 60kg x 8`
- Compact set list from that session
- Optional small note: `Volume: 1,440 kg`

Best practices:
- Keep this fully optional and collapsed by default.
- Never block set logging while this data is loading.
- Show row-level loading state only (`Loading last session...`).
- If query fails, show a small inline retry action (`Try again`).
- Do not auto-open on screen load to avoid UI disruption.
- Keep terminology consistent in en-US: `Last session`, `Best set`, `Volume`.

### Surface A

New query: `getLastSetsByExercises(exerciseIds: string[]): Map<exerciseId, SetSummary>`

```ts
type SetSummary = {
  workoutDate: string; // for "N days ago"
  totalSets: number;
  maxWeight: number; // highest weight used
  representativeReps: number; // reps from the set with highest weight
};
```

- Query via JOIN: `workout_sets` -> `workouts` where `workouts.status = 'completed'`
- Order by `workouts.date DESC` and keep latest per exercise
- Group by `exerciseId`

### Surface B

New query: `getExerciseHistory(exerciseId: string, page: number): ExerciseHistorySession[]`

```ts
type ExerciseHistorySession = {
  workoutId: string;
  workoutDate: string;
  gymName: string | null;
  sets: {
    setOrder: number;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
  totalVolume: number; // sum of weight x reps for completed sets
};
```

### Surface C

Extend `LogbookWorkoutItem` with comparison data or load comparison on demand.  
Implementation decision: do this after Workout In Progress and Prepare Workout.

---

## UX Notes

- No charts - 1.5kg differences are often lost visually. Exact values should stay explicit.
- Prefer relative date copy (`6 days ago`) instead of only absolute date.
- Volume (`kg x reps`) can be a secondary metric.
- If no prior history exists for an exercise, show a neutral empty state (`No previous session`).

---

## Estimated Files To Create/Update

### Phase 1 - Workout In Progress (lazy, on-demand)

- `features/workouts/dao/queries/workoutSetQueries.ts` - add `getLastCompletedExerciseSnapshot`
- `features/workouts/hooks/useExerciseLastSession.ts` - row-level lazy loading + cache
- `features/workouts/InProgressWorkoutScreen.tsx` - wire action and expanded panel state
- `features/workouts/components/in-progress/*` - add compact `LastSessionPanel` UI component

### Phase 2 - Surface A (Prepare Workout)

- `features/workouts/dao/queries/workoutSetQueries.ts` - add `getLastSetsByExercises`
- `features/workouts/hooks/useLastExerciseSets.ts` - hook for prepare screen
- `features/workouts/PrepareWorkoutScreen.tsx` - pass summary data to form
- `features/workouts/components/prepare/PrepareWorkoutExercisesForm.tsx` - render `last time` row

### Phase 3 - Surface B (Performance tab)

- `features/workouts/dao/queries/workoutSetQueries.ts` - add `getExerciseHistory`
- `features/workouts/hooks/useExerciseHistory.ts`
- `app/(tabs)/performance.tsx` - main screen with picker + list
- `features/workouts/components/performance/ExerciseHistoryList.tsx`
- `features/workouts/components/performance/ExerciseHistorySession.tsx`
