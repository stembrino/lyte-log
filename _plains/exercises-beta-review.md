# Exercises Beta Review

Date: 2026-04-12
Scope: exercise library flow (list, create modal, delete rules, search, i18n, tests)

## Beta status (current)

- Exercise list with pagination is available.
- Create custom exercise flow is available.
- Delete is restricted to custom exercises.
- System exercises are read-only in UI.
- Muscle group selection uses reusable chip selector components.

## After beta stage (missing items)

### 1) Implement UPDATE for custom exercise

Goal:

- Allow editing custom exercises from exercise card action.

Minimum scope:

- Enable edit button only for custom exercises.
- Reuse `CreateExerciseModal` in `edit` mode.
- Add `updateExercise` mutation in `useExerciseMutations`.
- Validate required fields (`name`, `muscleGroup`) with same error pattern.
- Keep duplicate-name protection consistent with create flow.

Acceptance:

- User edits a custom exercise and sees updated values in list after save.
- System exercises remain non-editable.

### 2) Add exercise description and how-to guidance

Goal:

- Add instructional content to exercises for better execution guidance.

Minimum scope:

- New fields for exercises: `description` and `howTo`.
- Show these fields in create/edit modal (optional).
- Show content inside expanded exercise card.
- Localize these fields using `entity_translations`.

Acceptance:

- Custom exercises can save and display `description` and `howTo`.
- System exercises can expose translated instructional text when available.
- Missing translations gracefully fallback to base table values.

## Suggested implementation order (post-beta)

1. Add DB fields/migration for `description` and `howTo`.
2. Add mutation support for update (`updateExercise`) and new optional fields.
3. Add create/edit modal mode for custom exercise update.
4. Add `entity_translations` support for new exercise fields.
5. Add focused tests for create/update mutation and modal validation.
