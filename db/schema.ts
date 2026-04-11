import { relations } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gyms = sqliteTable("gyms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const muscleGroups = sqliteTable("muscle_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  /** Localized search index (normalized) for pt-BR queries. */
  searchPt: text("search_pt"),
  /** Localized search index (normalized) for en-US queries. */
  searchEn: text("search_en"),
});

export const workouts = sqliteTable("workouts", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  duration: integer("duration"), // minutes, nullable until workout ends
  notes: text("notes"),
  gymId: text("gym_id").references(() => gyms.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull(),
});

export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  detail: text("detail"),
  description: text("description"),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  searchPt: text("search_pt"),
  searchEn: text("search_en"),
  createdAt: text("created_at").notNull(),
});

export const routineGroups = sqliteTable("routine_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  detail: text("detail"),
  description: text("description"),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  searchPt: text("search_pt"),
  searchEn: text("search_en"),
  createdAt: text("created_at").notNull(),
});

export const routineTags = sqliteTable("routine_tags", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  searchPt: text("search_pt"),
  searchEn: text("search_en"),
});

export const routineTagLinks = sqliteTable(
  "routine_tag_links",
  {
    routineId: text("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => routineTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.routineId, table.tagId] }),
  }),
);

export const routineExercises = sqliteTable("routine_exercises", {
  id: text("id").primaryKey(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  exerciseOrder: integer("exercise_order").notNull(),
  setsTarget: integer("sets_target"),
  repsTarget: text("reps_target"),
});

export const routineGroupRoutines = sqliteTable(
  "routine_group_routines",
  {
    routineGroupId: text("routine_group_id")
      .notNull()
      .references(() => routineGroups.id, { onDelete: "cascade" }),
    routineId: text("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    label: text("label"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.routineGroupId, table.routineId] }),
  }),
);

export const entityTranslations = sqliteTable(
  "entity_translations",
  {
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    locale: text("locale").notNull(),
    value: text("value").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.entityType, table.entityId, table.field, table.locale],
    }),
  }),
);

export const workoutExercises = sqliteTable("workout_exercises", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  exerciseOrder: integer("exercise_order").notNull(),
});

export const sets = sqliteTable("sets", {
  id: text("id").primaryKey(),
  workoutExerciseId: text("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  reps: integer("reps").notNull(),
  weight: real("weight").notNull(), // kg
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  timestamp: text("timestamp").notNull(),
});

export const exercisesRelations = relations(exercises, ({ many }) => ({
  routineExercises: many(routineExercises),
  workoutExercises: many(workoutExercises),
}));

export const routinesRelations = relations(routines, ({ many }) => ({
  routineTagLinks: many(routineTagLinks),
  routineExercises: many(routineExercises),
  routineGroupRoutines: many(routineGroupRoutines),
}));

export const routineGroupsRelations = relations(routineGroups, ({ many }) => ({
  routineGroupRoutines: many(routineGroupRoutines),
}));

export const routineTagsRelations = relations(routineTags, ({ many }) => ({
  routineTagLinks: many(routineTagLinks),
}));

export const routineTagLinksRelations = relations(routineTagLinks, ({ one }) => ({
  routine: one(routines, {
    fields: [routineTagLinks.routineId],
    references: [routines.id],
  }),
  tag: one(routineTags, {
    fields: [routineTagLinks.tagId],
    references: [routineTags.id],
  }),
}));

export const routineExercisesRelations = relations(routineExercises, ({ one }) => ({
  routine: one(routines, {
    fields: [routineExercises.routineId],
    references: [routines.id],
  }),
  exercise: one(exercises, {
    fields: [routineExercises.exerciseId],
    references: [exercises.id],
  }),
}));

export const routineGroupRoutinesRelations = relations(routineGroupRoutines, ({ one }) => ({
  routineGroup: one(routineGroups, {
    fields: [routineGroupRoutines.routineGroupId],
    references: [routineGroups.id],
  }),
  routine: one(routines, {
    fields: [routineGroupRoutines.routineId],
    references: [routines.id],
  }),
}));

export const gymsRelations = relations(gyms, ({ many }) => ({
  workouts: many(workouts),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  gym: one(gyms, {
    fields: [workouts.gymId],
    references: [gyms.id],
  }),
  workoutExercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one, many }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutExercises.exerciseId],
    references: [exercises.id],
  }),
  sets: many(sets),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));
