# Routines Beta Review

Date: 2026-04-11
Scope: routines flow (screens, hooks, modals, list behavior, tests)

## Findings by severity

### 1) High - Null-group model consistency

Status: Fixed.

Evidence:

- features/routines/components/CreateRoutineModal.tsx (submit payload now uses explicit nullable groupId)
- features/routines/hooks/useRoutineMutations.ts (mutation payload now uses explicit nullable groupId)

Risk:

- Residual risk reduced: null and undefined ambiguity removed in submit and mutation flow.

Recommendation:

- Keep contract as groupId: string | null in form + mutation payloads.
- Keep database write condition as "insert link only when groupId is non-null".

### 2) High - Edit flow can drop group links

Status: Accepted product behavior.

Evidence:

- features/routines/RoutinesTabScreen.tsx (edit routine loads one group link)
- features/routines/hooks/useRoutineMutations.ts (update deletes all links, re-inserts only one when present)

Risk:

- Editing a routine may silently remove other group associations.

Recommendation:

- Accepted by product rule: user freedom to reassign or clear group links during edit is intentional.
- Keep as-is unless requirements change to preserve many-to-many links on routine edit.

### 3) Medium - Expanded panel state key can collide by routine id

Status: Expanded state is keyed only by routineId.

Evidence:

- features/routines/RoutinesTabScreen.tsx
- features/routines/components/RoutineGroupDetailCard.tsx

Risk:

- Expand/collapse can mirror unexpectedly across sections sharing routine IDs.

Recommendation:

- Key expansion state by composite identity, e.g. groupId:routineId.

### 4) Medium - Important pagination tests are skipped

Status: Two tests intentionally skipped.

Evidence:

- features/routines/hooks/**tests**/usePaginatedExerciseLibrary.test.tsx (debounce test skipped)
- features/routines/hooks/**tests**/usePaginatedExerciseLibrary.test.tsx (stale-request test skipped)

Risk:

- Regressions in race/debounce behavior can ship unnoticed.

Recommendation:

- Re-enable both tests after stabilizing timing/mocks (fake timers + deterministic flush strategy).

### 5) Low - Hardcoded text in i18n-managed screen

Status: A few labels are hardcoded.

Evidence:

- features/routines/RoutinesTabScreen.tsx (+ GROUP, accessibility label/hint literals)

Risk:

- Mixed-language UX and weaker accessibility localization.

Recommendation:

- Move remaining literals to constants/translations.ts keys.

### 6) Low - Dead style token

Status: Unused style object present.

Evidence:

- features/routines/components/ExercisePickerScreen.tsx (catalogList style not consumed)

Risk:

- Small maintainability clutter.

Recommendation:

- Remove unused style block.

### 7) Low - Potential style compatibility issue

Status: Uses paddingBlock shorthand.

Evidence:

- features/routines/components/RoutineGroupDetailCard.tsx

Risk:

- Cross-platform RN support differences can appear depending on version.

Recommendation:

- Replace with explicit paddingTop/paddingBottom if compatibility issues show up.

## Validation notes

- Static problem check returned no immediate compile/lint errors.
- Test run in this session reported no executed tests; confidence remains mostly manual for now.

## Suggested cleanup order

1. Fix expansion state keying to composite identity.
2. Re-enable skipped pagination tests.
3. Remove hardcoded literals and dead styles.

## Owner checklist

- [x] Finalize routine/group relationship model for current beta (user can reassign or clear groups during edit).
- [x] Apply nullable groupId normalization.
- [x] Accept edit behavior that can replace existing multi-group links.
- [ ] Re-enable skipped tests and confirm deterministic pass.
- [ ] Run final format/lint/tests before next beta cut.
