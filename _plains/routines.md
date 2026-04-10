# Routines Plan (Step-by-Step)

## Goal

Start routines with a system-defined routine catalog, beginning with 1 routine focused on upper-body pull using mostly machines.

## Step 1 Scope (Now)

- Add support for system routines (like system exercises).
- Create the first routine example: `Pull Upper (Machine Focus)`.
- Ensure search works for both locales:
  - `en-US`
  - `pt-BR`
- Add tags to improve future filtering/querying.

## Proposed Data Model

### 1) routines table

Recommended columns:

- `id` (text, primary key)
- `name` (text, not null) -> fallback display name
- `estimated_duration_min` (integer, nullable) -> estimated routine duration in minutes
- `is_system` (boolean, not null, default false)
- `i18n_key` (text, nullable for custom routines)
- `search_en` (text, nullable)
- `search_pt` (text, nullable)
- `created_at` (text, not null)

Notes:

- `search_en` and `search_pt` store normalized tokens for fast search.
- `estimated_duration_min` is easier to query/sort than a `Time` string.
- Keep a denormalized search column strategy (`search_en`, `search_pt`) even when tags are normalized.

### 2) routine_tags table

Recommended columns:

- `id` (text, primary key)
- `slug` (text, unique, not null) -> examples: `machine`, `upper`, `pull`
- `i18n_key` (text, not null) -> examples: `routines.tags.machine`
- `search_en` (text, nullable)
- `search_pt` (text, nullable)

### 3) routine_tag_links table (many-to-many)

Recommended columns:

- `routine_id` (text, not null, FK -> routines.id, onDelete cascade)
- `tag_id` (text, not null, FK -> routine_tags.id, onDelete cascade)

Recommended constraint:

- Unique composite key on (`routine_id`, `tag_id`) to avoid duplicate links.

### 4) routine_exercises table

Recommended columns:

- `id` (text, primary key)
- `routine_id` (text, not null, FK -> routines.id, onDelete cascade)
- `exercise_id` (text, not null, FK -> exercises.id)
- `exercise_order` (integer, not null)
- `sets_target` (integer, nullable)
- `reps_target` (text, nullable) -> examples: `8-12`, `10-15`

## System Routine Constant Strategy

Create a constants file similar to exercises:

- Suggested file: `constants/routines.ts`
- Export `DEFAULT_ROUTINES` and `DEFAULT_ROUTINE_EXERCISES`.

Why this works now:

- Matches current project style (system constants + DB seed).
- Lets us ship routines quickly.
- Keeps IDs stable for FK usage.

## First Routine Example

### Routine

- `id`: `rt-01`
- `name`: `Pull Upper (Machine Focus)`
- `estimated_duration_min`: `50`
- `is_system`: `true`
- `i18n_key`: `pullUpperMachine`
- `search_en`: `pull upper machine back biceps lat pulldown seated cable row face pull`
- `search_pt`: `pull superior maquina costas biceps puxada frontal remada sentada face pull`

Tag links for this routine:

- `machine`
- `upper`
- `pull`
- `back`
- `biceps`

### Exercises inside this routine (existing system exercises)

1. `ex-08` Lat Pulldown
2. `ex-09` Seated Cable Row
3. `ex-19` Face Pull
4. `ex-21` Hammer Curl (fallback if no machine biceps option yet)

Suggested targets:

- Lat Pulldown: 4 x 8-12
- Seated Cable Row: 4 x 8-12
- Face Pull: 3 x 12-15
- Hammer Curl: 3 x 10-12

## i18n Plan

Add keys in translations:

- `routines.library.pullUpperMachine`
- Optional tag labels later under `routines.tags.*`

Examples:

- en-US: `Pull Upper (Machine Focus)`
- pt-BR: `Pull Superior (Foco em Maquinas)`

## Search Plan

For Phase 1:

- Search against `name`, `search_en`, `search_pt`, and tag slugs from `routine_tags`.
- Normalize query (lowercase, trim, remove accents if needed) before matching.
- Keep the API returning tags per routine so UI chips are easy to render.

## Step-by-Step Delivery

1. Create routine schema (`routines` + `routine_exercises`).
2. Add constants for default routine data.
3. Seed system routine on first launch/migration.
4. Add translation keys for routine name.
5. Build basic create routine flow in routines tab.
6. Add search input using `search_en`, `search_pt`, and joined tags.

## Acceptance Criteria for Step 1

- App has at least 1 seeded system routine (`Pull Upper (Machine Focus)`).
- Routine includes ordered exercises.
- Routine is searchable in en-US and pt-BR terms.
- Routine can be found by tags like `machine`, `upper`, and `pull`.
- Available tags can be listed in UI (for quick filters/chips).
- Structure is ready for future query/filter expansion.

## Open Decisions (Before Coding)

- Keep fallback `name` always required, even for i18n system routines?
- Do we want a strict `type` field now (`pull`, `push`, `legs`, etc.) or derive from tags?

## Recommendation (Community Practice)

- Normalize tags now if you want to list all tags, count usage, and filter reliably.
- Use many-to-many (`routine_tags` + `routine_tag_links`), not 1:1.
- Keep denormalized `search_en` / `search_pt` on routines for fast text search.
- Store routine duration as integer minutes (`estimated_duration_min`) instead of a `Time` text field.

## UI Component Division (Create Routine)

- `features/routines/components/types.ts`
  - Shared `SelectedRoutineExercise` type used by modal and screen components.
- `features/routines/components/BasicInfoScreen.tsx`
  - Screen 1 UI only: name, estimated duration, and tags.
  - Receives values + callbacks via props.
- `features/routines/components/ExercisePickerScreen.tsx`
  - Screen 2 UI only: exercise search, selected exercises, sets/reps, and catalog list.
  - Receives list data + callbacks via props.
- `features/routines/components/CreateRoutineModal.tsx`
  - Orchestrator: modal shell, step control, form state, handlers, submission mapping.
  - Keeps hook usage (`usePaginatedExerciseLibrary`) and business flow in one place.

Why this split:

- Reduces file size and cognitive load in the modal.
- Keeps presentational UI components focused and easy to test.
- Avoids Context API complexity for now while preserving clear ownership of state.
