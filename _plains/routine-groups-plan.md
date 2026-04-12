# Routine Groups Refactor Plan

## Goal

Right now, the app treats a routine as the main organizational unit and still highlights where routines come from with the idea of LyteLog routines.

That works for initial seeding and curation, but it does not fully match what users need most:

- organize training blocks
- group related routines
- navigate by context (Push Pull Legs, Leg Focus, Week A/B, and so on)
- edit and reuse ready structures without caring about origin

The proposal is to add one level above routines: a routine group.

## Naming Recommendation

### Database and code

- routine_groups
- routine_group_routines

Why:

- clear and direct
- describes the entity role precisely
- fits the current model well
- avoids ambiguous names like plans, which may conflict later with cycles, periodization, or scheduling

### UI label

At the product level, we can test friendlier labels later:

- Collections
- Groups
- Blocks
- Programs

Initial recommendation: keep routine group in the technical model and decide the final UI label after the flow is in place.

## Conceptual Change

### Before

- a routine exists by itself
- the screen mixes user organization with seeded catalog logic
- isSystem leaks an internal concern into user experience

### After

- routine becomes the reusable training unit
- routine group becomes the organization unit
- the UI shows groups with routines inside each group
- origin (system or user) can still exist internally, but is no longer the center of the experience

Examples:

- Group: Push Pull Legs
  - Routine: Push
  - Routine: Pull
  - Routine: Legs
- Group: Leg Focus
  - Routine: Quads
  - Routine: Hamstrings
  - Routine: Glutes

## Technical Impact

Effort level: medium.

This is not a small refactor, but it is also not a full structural rewrite.

Why:

- the current schema is already organized
- routine is already a separate entity
- seeding, hooks, and routines screen are reasonably clear
- most impact is model and flow changes, not infrastructure

## Realistic Estimate

### Viable version 1

Scope:

- create routine_groups
- link routines to groups
- convert current seed into groups plus routines
- list groups in UI
- open one group and see its routines

Effort: 1 to 2 focused days.

### Complete version 2

Scope:

- create group in app
- edit group
- add, remove, and reorder routines inside a group
- duplicate a seeded group into a custom one
- adjust filters, favorites, and localization

Effort: 2 to 4 focused days.

If UX direction changes during implementation, this can grow due to product decisions, not technical complexity.

## Recommended Data Modeling

### 1) Keep routines as is

Routine remains the base training entity.

Current columns that still make sense:

- id
- name
- detail
- description
- is_system
- is_favorite
- search_pt
- search_en
- created_at

Note:

- routine should not be forced to belong to only one group if we want real flexibility.

### 2) New table: routine_groups

```ts
routine_groups {
  id: text primary key
  name: text not null
  detail: text nullable
  description: text nullable
  is_system: boolean not null default false
  is_favorite: boolean not null default false
  search_pt: text nullable
  search_en: text nullable
  created_at: text not null
}
```

Role:

- represent the organizational block users see first
- support both seeded and custom groups

### 3) Link table: routine_group_routines

```ts
routine_group_routines {
  routine_group_id: text not null references routine_groups(id) on delete cascade
  routine_id: text not null references routines(id) on delete cascade
  position: integer not null
  label: text nullable
  primary key (routine_group_id, routine_id)
}
```

Role:

- allow one routine to appear in multiple groups
- preserve order inside each group
- leave room for future metadata like dayLabel, slot, week, or phase

### Why not put groupId directly in routines

Because that limits the model too early.

Real example:

- a leg routine can appear in Push Pull Legs
- and also in Leg Focus

With only one group_id inside routines, that flexibility is gone.

## Relationships

- routine_groups 1:N routine_group_routines
- routines 1:N routine_group_routines
- routines 1:N routine_exercises

Summary:

- group organizes
- routine defines training
- routine_exercises defines routine composition

## Seeded Structure Example

### Group 1

- Push Pull Legs

Routines:

1. Push Upper
2. Pull Upper
3. Leg Day

### Group 2

- Leg Focus

Routines:

1. Quads
2. Hamstrings
3. Glutes

This enables routine reuse without data duplication.

## UX Direction

### Main routines screen

Instead of sections like LyteLog routines, show:

- routine groups
- favorites
- recently used

Each group card can show:

- name
- detail
- routine count
- a short preview of routine names

### Group detail

Show:

- list of routines in the group
- actions to start, edit, favorite, or duplicate

### Creation flow

In the medium term, the ideal flow is no longer only create routine:

1. create group
2. add routines to group
3. create a new routine inside group or reuse an existing one

## What To Do With isSystem

No need to remove it now.

Recommendation:

- keep isSystem in routines and routine_groups
- use it for internal logic only
- stop making it the main UX headline

So:

- internally: seeded versus custom still exists
- externally: users see organization, not origin

## Favorites Strategy

With groups, two valid options exist:

### Option A

Favorite at routine and group levels.

Pros:

- more flexible

Cons:

- more UI rules

### Option B

Favorite only at group level for now.

Pros:

- simpler first version

Cons:

- less granular

### Recommendation

Keep current routine favorite support and add favorite to routine_groups when groups land.

This preserves work already done and lets us decide later whether both levels should be exposed in UI.

## Query Changes

Today, the app loads system routines directly.

After this refactor, the preferred direction is group-oriented hooks:

- useRoutineGroups for main screen
- useRoutineGroupDetail(groupId) for group detail

### Expected shape for main query

```ts
type RoutineGroupListItem = {
  id: string;
  name: string;
  detail: string | null;
  description: string | null;
  isFavorite: boolean;
  routineCount: number;
  routinesPreview: {
    id: string;
    name: string;
    detail: string | null;
  }[];
};
```

This reduces coupling to the app catalog concept.

## Implementation Plan

### Phase 1: Schema

1. Create routine_groups table.
2. Create routine_group_routines table.
3. Add Drizzle relations.
4. Update db migration file.

### Phase 2: Seed

1. Convert seeded catalog into seeded groups.
2. Reuse existing routines inside those groups.
3. Stop treating seed as a flat routine list.

### Phase 3: Read layer

1. Create useRoutineGroups.
2. Create useRoutineGroupDetail.
3. Adjust favorite loading to support the new level.

### Phase 4: UI

1. Update routines main screen to show groups.
2. Build group card.
3. Build group detail screen or expandable section.
4. Remove LyteLog routines as the main organizational section.

### Phase 5: Create and edit

1. Allow creating groups.
2. Allow adding and removing routines in groups.
3. Allow creating new routines from inside a group.
4. Allow duplicating seeded groups into custom ones.

### Phase 6: Polish

1. Review localization.
2. Review empty states.
3. Review filters and favorites.
4. Reassess whether standalone routines should still be highlighted.

## Migration Strategy

Because the app is not launched yet, migration risk is low.

Practical approach:

1. create the new tables
2. seed new groups
3. link seeded routines into seeded groups
4. keep temporary compatibility with old routine loading for a short period
5. remove the legacy system routines flow

This avoids a big-bang break and allows staged UI validation.

## Risks

### Low risk

- new schema tables
- new seed paths
- new hooks

### Medium risk

- deciding the right creation flow
- deciding whether routines can exist outside groups
- deciding how favorites appear in UI

### Highest risk

- trying to solve everything at once: groups, weekly scheduling, periodization, duplication, templates, and history

Best path: implement group-based organization first.

## Final Recommendation

This refactor is worth doing.

Not because LyteLog routines is technically wrong, but because groups align the product with what users actually want:

- build training blocks
- navigate faster
- reuse structures
- adapt templates without caring about internal naming

## Minimum Scope To Implement First

1. routine_groups
2. routine_group_routines
3. group-based seed
4. group-first main listing
5. group detail with routines

If this is solid, then move to:

1. create group in app
2. edit group
3. duplicate seeded groups
4. reorder routines inside groups

## Open Decisions

Before coding, close these 3 points:

1. can a routine exist without a group, or must it always belong to at least one group?
2. should favorites be visible at group level, routine level, or both?
3. should the main CTA become Create Group, or stay Create Routine for now?
