# Data Patches Strategy (Post-Beta)

Date: 2026-04-12
Status: Proposed
Scope: SQLite data seed, backfill, and one-time data fixes

## Summary

The proposed approach is valid and recommended for LyteLog post-beta.

Using a `__data_patches` table to track applied data patches is a strong pattern for:

- deterministic boot behavior
- avoiding repeated heavy seed/backfill work
- replacing AsyncStorage-based data-version coordination
- safer production migrations of data behavior

## Why this is a good fit for LyteLog

Current app characteristics:

- local SQLite via Expo + Drizzle
- initial seed plus conditional re-index/backfill logic
- growing domain data (exercises, routines, translations)

Main benefits:

1. Better startup performance

- patch is executed only once
- no repeated large insert checks per app open

2. Correctness and atomicity

- version state lives in the same DB as data
- avoids DB vs AsyncStorage desync scenarios

3. Clear change history

- each data change is isolated by patch id
- easier audits and rollback strategy design

4. Safer post-beta evolution

- add new seed/fix logic with new patch file instead of mutating legacy seed path

## Proposed model

## 1) Patch tracking table

Suggested schema:

- table: `__data_patches`
- columns:
  - `id` (PK)
  - `applied_at`

Example ids:

- `v1_initial_seed`
- `v2_exercise_search_reindex`
- `v3_exercise_translation_backfill`

## 2) Patch manager

Suggested structure:

- `db/patches/v1_initial_seed.ts`
- `db/patches/v2_exercise_search_reindex.ts`
- `db/patchManager.ts`

Manager behavior:

- ensure patch table exists
- iterate ordered patch list
- run patch only if id not present
- record id on success

## 3) Execution point

Run patch manager after schema migrations and before app ready state.

## Important implementation notes for LyteLog

1. Keep schema migrations and data patches separate

- schema migrations: structural DB changes
- data patches: seed/backfill/fix logic

2. Use transaction per patch

- each patch should be atomic
- either fully applied or not marked as applied

3. Do not overuse one giant patch

- keep patches small and domain-focused
- example: one patch for search index, another for translation backfill

4. Dev-only data patches

- allowed, but must be explicitly gated
- never mix production critical patch ids with dev-only ids

5. Preserve fallback behavior

- UI/runtime should still handle missing translation rows gracefully

## Risks and mitigations

Risk: patch ordering bugs

- Mitigation: explicit ordered list + id naming convention (`v1_`, `v2_`)

Risk: partial patch failure

- Mitigation: wrap in transaction and only mark applied at end

Risk: duplicated business logic between seed and patches

- Mitigation: move reusable builders to shared helpers

## Post-beta adoption plan (incremental)

1. Add `__data_patches` table via migration.
2. Add patch manager and run it during app boot (after migrations).
3. Move current one-time reindex/backfill logic into versioned patches.
4. Keep existing seed path temporarily as fallback for safety.
5. After one stable release, simplify legacy seed checks.

## Decision

Recommended: YES.

This architecture is valid for LyteLog and should be adopted post-beta to improve startup performance, reliability, and maintainability.
