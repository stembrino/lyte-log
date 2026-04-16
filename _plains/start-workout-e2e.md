# Start Workout E2E Flow

This document describes the current end-to-end flow for `Start Workout`, including the implemented decision points, fallback behavior, and user paths.

## Scope

This flow starts from the `Workouts` tab and covers:

- Active workout detection
- Start workout entry
- Start with an existing routine
- Start without a routine
- Prepare workout decisions
- In-progress workout decisions
- Finish or cancel workout
- Post-workout quick actions panel

It reflects the current implemented app behavior.

## Mermaid Flow

```mermaid
flowchart TD
    A[User opens Workouts tab] --> B{Active workout exists?}

    B -->|Yes| C[Auto-redirect to In Progress Workout]
    B -->|No| D[Show Start Workout CTA]

    C --> E{User action in active workout}
    E -->|Minimize| F[Return to Workouts tab with skip redirect flag]
    E -->|Continue workout| G[Stay in In Progress Workout]
    E -->|Finish| H[Mark workout completed]
    E -->|Cancel| I[Mark workout canceled]

    F --> J[Workouts tab visible without forced redirect]
    D --> K[Open Select Routine modal]

    K --> L{How does user want to start?}
    L -->|Select existing routine| M[Go to Prepare Workout with routineId]
    L -->|Start without routine| N[Go to Prepare Workout without routineId]
    L -->|Close modal| O[Back to Workouts tab]

    M --> P[Load routine exercises into editable list]
    N --> Q[Open Prepare Workout with empty exercise list]

    P --> R{Prepare decisions}
    Q --> R

    R -->|Select gym| S[Optional gym selection]
    R -->|Add exercise| T[Open Add Exercise modal]
    R -->|Reorder exercises| U[Long press any row and drag]
    R -->|Remove exercise| V[Remove from prepare list]
    R -->|Cancel| W[Back to previous screen]
    R -->|Start workout| X[Submit selected exercises]

    T --> T1{Exercise picker actions}
    T1 -->|Filter/search| T2[Find exercise]
    T1 -->|Add exercise| T3[Append to prepare list and show snackbar]
    T1 -->|Create exercise| T4[Create new exercise and return to picker]
    T1 -->|Close| R

    X --> Y{Another active workout already exists at mutation time?}
    Y -->|Yes| Z[Reuse existing active workout and navigate to it]
    Y -->|No| AA[Create new in-progress workout]

    Z --> G
    AA --> G

    G --> AB{In-progress decisions}
    AB -->|Add exercise| AC[Open Add Exercise modal and append to workout]
    AB -->|Remove exercise| AD[Confirm remove and delete from workout]
    AB -->|Add set| AE[Append set to exercise]
    AB -->|Edit reps/weight| AF[Persist set values]
    AB -->|Toggle completed| AG[Update set completion]
    AB -->|Minimize| F
    AB -->|Finish| H
    AB -->|Cancel| I

    H --> AH[Open post-workout quick actions panel]
    AH --> AI{Workout started without routine?}
    AI -->|Yes| AJ[Show Save as Routine button]
    AI -->|No| AK[Hide Save as Routine button]

    AJ --> AL{User taps Save as Routine?}
    AL -->|Yes| AM[Expand inline name input pre-filled with default name]
    AL -->|No| AO

    AM --> AM1{User action on name input}
    AM1 -->|Confirm name| AM2[Persist routine and show success feedback]
    AM1 -->|Cancel| AO

    AM2 --> AO
    AK --> AO

    AO{User action on panel}
    AO -->|Copy/Share as text| AP[Open native share sheet with workout summary]
    AO -->|Close panel| AQ[Dismiss panel and return to Workouts tab]

    AP --> AQ
    AQ --> J
    I --> J
```

## Decision Rules

### 1. Workouts tab entry

- When the user opens the `Workouts` tab, the app checks for an active workout.
- If an active workout exists and there is no skip flag, the app immediately redirects to `In Progress Workout`.
- If the user minimized the workout earlier, the app sets a skip flag so the tab can be shown without redirecting again.

### 2. Start Workout modal

- If there is no active workout, the user can open the `Start Workout` modal.
- The modal currently supports:
  - selecting an existing routine
  - starting without a routine
  - closing the modal without changes

### 3. Starting with a routine

- The user selects a routine.
- The app navigates to `Prepare Workout` with `routineId`.
- Routine exercises are loaded into an editable list.

### 4. Starting without a routine

- The user chooses `Start without routine`.
- The app navigates to `Prepare Workout` without `routineId`.
- The exercise list starts empty.

### 5. Prepare Workout behavior

- Gym is optional.
- The user can:
  - add exercises
  - reorder exercises
  - remove exercises
  - cancel preparation
  - start workout
- The add-exercise picker supports:
  - search
  - single muscle-group filter
  - image preview
  - create exercise
  - inline feedback via snackbar after add

### 6. Starting the workout from Prepare

- On submit, the app builds the exercise payload from the editable list.
- If another active workout exists at mutation time, the mutation reuses that workout instead of creating a second active session.
- Otherwise, a new in-progress workout is created.

### 7. In Progress Workout behavior

- The user can:
  - add exercises during the workout
  - remove exercises during the workout
  - add sets
  - edit reps and weight
  - toggle set completion
  - minimize the workout
  - finish the workout
  - cancel the workout

### 8. Removing exercises

- In `Prepare Workout`, removing an exercise updates the local editable list and normalizes order.
- In `In Progress Workout`, removing an exercise:
  - asks for confirmation
  - deletes the workout exercise from the database
  - removes related sets through cascade delete
  - normalizes remaining `exerciseOrder`

### 9. Finish vs Cancel

- `Finish Workout` marks the workout as completed and calculates duration.
- `Cancel Workout` marks the workout as canceled.
- Both paths return the user to the Workouts area.

### 10. Post-workout quick actions panel

- After `Finish Workout`, the keyboard is dismissed and a bottom sheet Modal opens.
- The panel provides quick actions tied to the completed workout.
- If the workout was started without a routine:
  - show `Save as Routine` button
  - tapping it expands an inline name input pre-filled with a default name (e.g. `Treino 15/04/2026`)
  - the input has a clear (×) icon inside it
  - the user can confirm with `SALVAR` or go back with `VOLTAR`
  - on confirm, the routine is persisted with exercises, sets, and average reps as targets
  - success or error feedback is shown via Alert
- Always provides `Copy/Share workout as text`:
  - builds a readable text version (gym, exercises, sets, reps, weight)
  - opens the native share sheet
- `FECHAR` dismisses the panel and returns the user to the Workouts area.
- The panel uses a transparent `Modal` with `KeyboardAvoidingView` so it rises correctly with the keyboard.

## Current UX Intent

The current flow is optimized for fast workout start:

- no routine is required
- exercises can be added before or during the workout
- the user is not blocked by missing structure up front
- accidental additions/removals are recoverable through inline controls and confirmations

## Notes

- The current flow does not require routine creation before starting a workout.
- A post-workout quick actions panel is shown after finishing a workout (bottom sheet via transparent Modal).
- This document describes the current implemented behavior.

## Pending / Future Extensions

- Time adjustment action in the post-workout panel (not yet implemented).
