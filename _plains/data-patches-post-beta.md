# Data Patches Strategy (Post-Beta)

Date: 2026-04-12
Status: Implemented (baseline)
Scope: SQLite data seed, backfill, and one-time data fixes

## Summary

LyteLog now uses a data patch manager with persistent patch tracking in SQLite.

Current behavior:

1. App boot runs schema migrations first.
2. Then it runs ordered data patches.
3. Each patch executes only once.
4. Applied patch ids are recorded in \_\_data_patches.
5. Patch execution is transactional per patch.

This gives deterministic startup behavior and avoids repeating heavy data work on every launch.

## Current Architecture

Execution path:

1. [components/providers/DatabaseProvider.tsx](components/providers/DatabaseProvider.tsx)
2. [db/migrate.ts](db/migrate.ts)
3. [db/patchManager.ts](db/patchManager.ts)
4. [db/patches/v001_initial_seed.ts](db/patches/v001_initial_seed.ts)

Tracking table:

1. \_\_data_patches
2. columns: id (PK), applied_at

Data source ownership:

1. Startup data now lives under db-owned modules in [db/patches/data](db/patches/data)
2. Startup seed no longer imports constants/seed
3. constants/seed folder was removed

## Patch Naming Convention

Use monotonic, zero-padded ids:

1. v001_initial_seed
2. v002_exercises_batch_001
3. v003_routines_batch_001

Rules:

1. Never modify behavior of a released patch id.
2. Add a new patch for every incremental data change.
3. Keep ids ordered and unique.

## Current Baseline Patch

v001 currently:

1. Executes seed flow through patch manager.
2. Seeds baseline entities.
3. Routine groups are disabled in patch options (includeRoutineGroups: false).

## Notes

1. Schema migrations and data patches remain separate concerns.
2. UI fallback constants are separate from DB startup data.
3. AsyncStorage search-index version logic still exists in seed baseline and can be moved to dedicated patches later.

## Next Incremental Steps (Optional)

1. Add v002 for exercise batch additions.
2. Add v003 for routines batch additions.
3. Add dedicated patch for search index reindex/backfill and retire AsyncStorage key usage.
4. Add minimal tests around patch ordering and idempotency.
