# Database Schema (Drizzle)

This document is the single source of truth for the current relational model used by the app.

## Tables

### Core workout flow

- gyms
- workouts
- workout_exercises
- sets

### Exercise catalog

- muscle_groups
- exercises

### Routine domain

- routines
- routine_groups
- routine_exercises
- routine_tags
- routine_tag_links
- routine_group_routines

### Localization

- entity_translations

## ER Diagram

```mermaid
erDiagram
  gyms ||--o{ workouts : "gym_id"
  workouts ||--o{ workout_exercises : "workout_id"
  exercises ||--o{ workout_exercises : "exercise_id"
  workout_exercises ||--o{ sets : "workout_exercise_id"

  routines ||--o{ routine_exercises : "routine_id"
  exercises ||--o{ routine_exercises : "exercise_id"

  routine_groups ||--o{ routine_group_routines : "routine_group_id"
  routines ||--o{ routine_group_routines : "routine_id"

  routines ||--o{ routine_tag_links : "routine_id"
  routine_tags ||--o{ routine_tag_links : "tag_id"

  gyms {
    text id PK
    text name
    boolean is_default
    text created_at
  }

  workouts {
    text id PK
    text date
    int duration
    text notes
    text gym_id FK
    text created_at
  }

  workout_exercises {
    text id PK
    text workout_id FK
    text exercise_id FK
    int exercise_order
  }

  sets {
    text id PK
    text workout_exercise_id FK
    int reps
    real weight
    boolean completed
    text timestamp
  }

  muscle_groups {
    text id PK
    text name
  }

  exercises {
    text id PK
    text name
    text muscle_group
    boolean is_custom
    text search_pt
    text search_en
  }

  routines {
    text id PK
    text name
    text detail
    text description
    boolean is_system
    boolean is_favorite
    text search_pt
    text search_en
    text created_at
  }

  routine_groups {
    text id PK
    text name
    text detail
    text description
    boolean is_system
    boolean is_favorite
    text search_pt
    text search_en
    text created_at
  }

  routine_exercises {
    text id PK
    text routine_id FK
    text exercise_id FK
    int exercise_order
    int sets_target
    text reps_target
  }

  routine_tags {
    text id PK
    text slug
    text search_pt
    text search_en
  }

  routine_tag_links {
    text routine_id FK
    text tag_id FK
  }

  routine_group_routines {
    text routine_group_id FK
    text routine_id FK
    int position
    text label
  }

  entity_translations {
    text entity_type PK
    text entity_id PK
    text field PK
    text locale PK
    text value
    text created_at
    text updated_at
  }
```

## Notes

- `routine_tag_links` has composite PK: (`routine_id`, `tag_id`).
- `routine_group_routines` has composite PK: (`routine_group_id`, `routine_id`).
- `entity_translations` has composite PK: (`entity_type`, `entity_id`, `field`, `locale`).
- User-facing localized labels come from `entity_translations`; base columns are fallback values.
