# Entity Translations Seed Guide

## Why this exists

This project no longer uses `i18n_key` columns for entity data.

- i18n files are now for static UI text only (buttons, headings, helper text).
- Dynamic entity labels (exercise names, routine names, group names, etc.) are stored in `entity_translations`.

This document explains the new seed flow, especially how localized labels are injected.

## New source of truth

### Static UI copy

- File: `constants/translations.ts`
- Scope: static interface text only

### Dynamic entity copy

- DB table: `entity_translations`
- Seed source: `db/seed-data/entityTranslations.ts`
- This file generates `DEFAULT_ENTITY_TRANSLATIONS` from seed constants

### Strict boundary rule

- Never generate DB translation rows from `constants/translations.ts`.
- `constants/translations.ts` is static UI only.
- DB translation rows must be sourced from `constants/seed/*` only.

## Table shape used for localized entity text

`entity_translations` rows have:

- `entity_type`: which domain object this row belongs to
  - supported in current seed flow: `exercise`, `muscle_group`, `routine`, `routine_group`, `routine_tag`
- `entity_id`: id of the row in its base table
- `field`: translatable field name
  - currently used: `name`, `detail`, `description`
- `locale`: `pt-BR` or `en-US`
- `value`: localized text
- `created_at`, `updated_at`: timestamps

Primary key:

- (`entity_type`, `entity_id`, `field`, `locale`)

## How labels are injected during seed

Main file: `db/seed.ts`

Seed order relevant to labels:

1. Insert base entities into their own tables
   - exercises, muscle_groups, routines, routine_groups, routine_tags
2. Insert generated translations:
   - `db.insert(entityTranslations).values(DEFAULT_ENTITY_TRANSLATIONS)`
3. Run a backfill pass for local databases that may already contain rows
   - creates missing translation rows using existing entity values
   - uses `onConflictDoNothing` to avoid overwriting existing translation rows

Important:

- The translation insert is independent from i18n dictionaries.
- `DEFAULT_ENTITY_TRANSLATIONS` is generated from seed constants, not from `translations.ts`.

## Where translation rows come from

`db/seed-data/entityTranslations.ts` builds rows from:

- `DEFAULT_EXERCISES` (`labelPt`, `labelEn`)
- `DEFAULT_MUSCLE_GROUPS` (`labelPt`, `labelEn`)
- `DEFAULT_ROUTINES` (`labelPt`, `labelEn`, plus detail/description)
- `DEFAULT_ROUTINE_GROUPS` (`labelPt`, `labelEn`, plus detail/description)
- `DEFAULT_ROUTINE_TAGS` (`labelPt`, `labelEn`)

So if you want to change a seeded label, edit the seed constants first. Then the generated translation rows update automatically.

## How to add a new translatable seeded entity

Example checklist:

1. Add entity row in its seed file (`constants/seed/...`).
2. Include locale label fields in that seed object (`labelPt`, `labelEn` or equivalent).
3. Ensure `db/seed-data/entityTranslations.ts` maps that entity to `makeRows(...)`.
4. Ensure base table insert in `db/seed.ts` includes that entity.
5. Ensure read path (hook/screen) uses `entity_translations` for locale values.

## How runtime reads work

For routines/groups and exercise library:

- Hooks query base tables first.
- Hooks query `entity_translations` for current locale.
- Hooks map localized values by (`entity_type`, `entity_id`, `field`).
- If a translation is missing, fallback is base column value.

This fallback keeps app behavior stable even if a translation row is missing.

## Migration behavior for old local DBs

`db/migrate.ts` includes legacy rebuild logic.

If an old table still has `i18n_key`, migration can rebuild that table without the legacy column and copy data across. This prevents old `NOT NULL`/`UNIQUE` constraints from blocking new seed logic.

## Search index note

`search_pt` and `search_en` still exist for query performance.

- They are indexes/tokens for search behavior.
- They are not user-facing labels.
- User-facing labels should come from `entity_translations`.

## Quick troubleshooting

If a label is wrong:

1. Check seed constants (`labelPt` / `labelEn`) for that entity.
2. Check generated rows in `db/seed-data/entityTranslations.ts`.
3. Confirm seed inserted rows into `entity_translations`.
4. Confirm the relevant hook reads `entity_translations` for that `entity_type` + `field`.

If a label is missing in one locale:

1. Verify the row exists in `entity_translations` for that locale.
2. Verify the hook query filters by correct locale and field.
3. Verify fallback value exists in base table.

## After beta (exercise roadmap note)

Planned exercise enhancements after beta:

- Add custom exercise update flow.
- Add translatable exercise instructional fields:
  - `description`
  - `howTo`

When implemented, include these fields in:

- exercise base table schema/migrations
- `entity_translations` read/write mapping
- seed generation for system exercise content
