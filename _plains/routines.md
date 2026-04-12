# Routines Schema (Current)

## Purpose

This file reflects the current routines domain implemented in `db/schema.ts` and related seed flow.

It replaces the old proposal that referenced legacy `i18n_key` columns.

## Current Tables

### routines

- `id` text PK
- `name` text not null (fallback value)
- `detail` text nullable
- `description` text nullable
- `is_system` boolean not null default false
- `is_favorite` boolean not null default false
- `search_pt` text nullable
- `search_en` text nullable
- `created_at` text not null

### routine_groups

- `id` text PK
- `name` text not null (fallback value)
- `detail` text nullable
- `description` text nullable
- `is_system` boolean not null default false
- `is_favorite` boolean not null default false
- `search_pt` text nullable
- `search_en` text nullable
- `created_at` text not null

### routine_group_routines

- `routine_group_id` text not null FK -> `routine_groups.id` (cascade delete)
- `routine_id` text not null FK -> `routines.id` (cascade delete)
- `position` integer not null
- `label` text nullable
- PK: (`routine_group_id`, `routine_id`)

### routine_tags

- `id` text PK
- `slug` text unique not null
- `search_pt` text nullable
- `search_en` text nullable

### routine_tag_links

- `routine_id` text not null FK -> `routines.id` (cascade delete)
- `tag_id` text not null FK -> `routine_tags.id` (cascade delete)
- PK: (`routine_id`, `tag_id`)

### routine_exercises

- `id` text PK
- `routine_id` text not null FK -> `routines.id` (cascade delete)
- `exercise_id` text not null FK -> `exercises.id`
- `exercise_order` integer not null
- `sets_target` integer nullable
- `reps_target` text nullable

## Localization Model

Routine labels are not stored in `i18n_key` columns.

User-facing localized values come from `entity_translations`:

- `entity_type = routine` for routine fields
- `entity_type = routine_group` for group fields
- `entity_type = routine_tag` for tag labels

Typical translated fields:

- `name`
- `detail`
- `description`

Fallback behavior:

- if translation is missing, UI falls back to base table value (`name`, `detail`, `description`).

## Search Strategy

- Keep `search_pt` and `search_en` in base tables for fast normalized search.
- Keep localization read path separate (`entity_translations`) from search index columns.

## Relationship Summary

- `routine_groups` 1:N `routine_group_routines`
- `routines` 1:N `routine_group_routines`
- `routines` 1:N `routine_exercises`
- `routines` N:M `routine_tags` through `routine_tag_links`

## Notes For New Changes

When adding translatable routine fields:

1. Add field to base schema/migration if needed.
2. Add read/write mapping in translation hooks/services.
3. Add seed rows in `db/seed-data/entityTranslations.ts` for system content.
4. Keep fallback-to-base behavior in UI queries.
