import { DEFAULT_EXERCISES } from "@/constants/seed/exercises";
import { DEFAULT_MUSCLE_GROUPS } from "@/constants/seed/muscleGroups";
import {
  DEFAULT_ROUTINE_GROUP_ROUTINES,
  DEFAULT_ROUTINE_GROUPS,
} from "@/constants/seed/routineGroups";
import {
  DEFAULT_ROUTINE_EXERCISES,
  DEFAULT_ROUTINE_TAG_LINKS,
  DEFAULT_ROUTINES,
} from "@/constants/seed/routines";
import { DEFAULT_ROUTINE_TAGS } from "@/constants/seed/routineTags";
import { count, eq, isNull, or } from "drizzle-orm";
import { db } from "./client";
import {
  entityTranslations,
  exercises,
  muscleGroups,
  routineGroupRoutines,
  routineGroups,
  routineExercises,
  routines,
  routineTagLinks,
  routineTags,
} from "./schema";
import { DEFAULT_ENTITY_TRANSLATIONS } from "./seed-data/entityTranslations";

// NOTE: entity_translations seed rows must come from db/seed-data/entityTranslations.ts,
// never from constants/translations.ts.

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildSearchIndex(exercise: { name: string; labelPt?: string; labelEn?: string }) {
  const ptLabel = exercise.labelPt ?? exercise.name;
  const enLabel = exercise.labelEn ?? exercise.name;

  return {
    searchPt: normalizeSearchText(`${ptLabel} ${exercise.name}`),
    searchEn: normalizeSearchText(`${enLabel} ${exercise.name}`),
  };
}

function buildRoutineTagSearchIndex(tag: { slug: string; labelPt: string; labelEn: string }) {
  return {
    searchPt: normalizeSearchText(`${tag.labelPt} ${tag.slug}`),
    searchEn: normalizeSearchText(`${tag.labelEn} ${tag.slug}`),
  };
}

function buildRoutineSearchIndex(routine: { name: string; labelPt: string; labelEn: string }) {
  return {
    searchPt: normalizeSearchText(`${routine.labelPt} ${routine.name}`),
    searchEn: normalizeSearchText(`${routine.labelEn} ${routine.name}`),
  };
}

function buildRoutineGroupSearchIndex(group: { name: string; labelPt: string; labelEn: string }) {
  return {
    searchPt: normalizeSearchText(`${group.labelPt} ${group.name}`),
    searchEn: normalizeSearchText(`${group.labelEn} ${group.name}`),
  };
}

function buildBackfillTranslationRows(args: {
  routinesRows: {
    id: string;
    name: string;
    detail: string | null;
    description: string | null;
    createdAt: string;
  }[];
  exerciseRows: {
    id: string;
    name: string;
  }[];
  muscleGroupRows: {
    id: string;
    name: string;
  }[];
  routineTagRows: {
    id: string;
    slug: string;
  }[];
  routineGroupRows: {
    id: string;
    name: string;
    detail: string | null;
    description: string | null;
    createdAt: string;
  }[];
}) {
  const rows: {
    entityType: "routine" | "routine_group";
    entityId: string;
    field: "name" | "detail" | "description";
    locale: "pt-BR" | "en-US";
    value: string;
    createdAt: string;
    updatedAt: string;
  }[] = [];

  for (const routine of args.routinesRows) {
    for (const locale of ["pt-BR", "en-US"] as const) {
      rows.push({
        entityType: "routine",
        entityId: routine.id,
        field: "name",
        locale,
        value: routine.name,
        createdAt: routine.createdAt,
        updatedAt: routine.createdAt,
      });

      if (routine.detail) {
        rows.push({
          entityType: "routine",
          entityId: routine.id,
          field: "detail",
          locale,
          value: routine.detail,
          createdAt: routine.createdAt,
          updatedAt: routine.createdAt,
        });
      }

      if (routine.description) {
        rows.push({
          entityType: "routine",
          entityId: routine.id,
          field: "description",
          locale,
          value: routine.description,
          createdAt: routine.createdAt,
          updatedAt: routine.createdAt,
        });
      }
    }
  }

  for (const exercise of args.exerciseRows) {
    for (const locale of ["pt-BR", "en-US"] as const) {
      rows.push({
        entityType: "exercise",
        entityId: exercise.id,
        field: "name",
        locale,
        value: exercise.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const muscleGroup of args.muscleGroupRows) {
    for (const locale of ["pt-BR", "en-US"] as const) {
      rows.push({
        entityType: "muscle_group",
        entityId: muscleGroup.id,
        field: "name",
        locale,
        value: muscleGroup.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const routineTag of args.routineTagRows) {
    for (const locale of ["pt-BR", "en-US"] as const) {
      rows.push({
        entityType: "routine_tag",
        entityId: routineTag.id,
        field: "name",
        locale,
        value: routineTag.slug,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  for (const group of args.routineGroupRows) {
    for (const locale of ["pt-BR", "en-US"] as const) {
      rows.push({
        entityType: "routine_group",
        entityId: group.id,
        field: "name",
        locale,
        value: group.name,
        createdAt: group.createdAt,
        updatedAt: group.createdAt,
      });

      if (group.detail) {
        rows.push({
          entityType: "routine_group",
          entityId: group.id,
          field: "detail",
          locale,
          value: group.detail,
          createdAt: group.createdAt,
          updatedAt: group.createdAt,
        });
      }

      if (group.description) {
        rows.push({
          entityType: "routine_group",
          entityId: group.id,
          field: "description",
          locale,
          value: group.description,
          createdAt: group.createdAt,
          updatedAt: group.createdAt,
        });
      }
    }
  }

  return rows;
}

/**
 * Inserts default database data on first launch.
 */
export async function seedDatabase(): Promise<void> {
  await db
    .insert(muscleGroups)
    .values(
      DEFAULT_MUSCLE_GROUPS.map((group) => ({
        id: group.id,
        name: group.name,
      })),
    )
    .onConflictDoNothing({ target: muscleGroups.id });

  await db
    .insert(routineTags)
    .values(
      DEFAULT_ROUTINE_TAGS.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        ...buildRoutineTagSearchIndex(tag),
      })),
    )
    .onConflictDoNothing({ target: routineTags.id });

  const [exerciseRow] = await db.select({ total: count() }).from(exercises);
  if (exerciseRow.total === 0) {
    await db.insert(exercises).values(
      DEFAULT_EXERCISES.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        isCustom: exercise.isCustom,
        ...buildSearchIndex(exercise),
      })),
    );
  } else {
    // Backfill search index columns for existing local rows.
    const rows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        muscleGroup: exercises.muscleGroup,
      })
      .from(exercises);

    for (const row of rows) {
      const { searchPt, searchEn } = buildSearchIndex({
        name: row.name,
        labelPt: row.name,
        labelEn: row.name,
      });

      await db.update(exercises).set({ searchPt, searchEn }).where(eq(exercises.id, row.id));
    }
  }

  await db
    .insert(routines)
    .values(
      DEFAULT_ROUTINES.map((routine) => ({
        id: routine.id,
        name: routine.name,
        detail: routine.detail,
        description: routine.description,
        isSystem: routine.isSystem,
        createdAt: routine.createdAt,
        ...buildRoutineSearchIndex(routine),
      })),
    )
    .onConflictDoNothing({ target: routines.id });

  await db
    .insert(routineGroups)
    .values(
      DEFAULT_ROUTINE_GROUPS.map((group) => ({
        id: group.id,
        name: group.name,
        detail: group.detail,
        description: group.description,
        isSystem: group.isSystem,
        createdAt: group.createdAt,
        ...buildRoutineGroupSearchIndex(group),
      })),
    )
    .onConflictDoNothing({ target: routineGroups.id });

  await db
    .insert(routineTagLinks)
    .values(DEFAULT_ROUTINE_TAG_LINKS.map((link) => ({ ...link })))
    .onConflictDoNothing({ target: [routineTagLinks.routineId, routineTagLinks.tagId] });

  await db
    .insert(routineExercises)
    .values(DEFAULT_ROUTINE_EXERCISES.map((exercise) => ({ ...exercise })))
    .onConflictDoNothing({ target: routineExercises.id });

  await db
    .insert(routineGroupRoutines)
    .values(DEFAULT_ROUTINE_GROUP_ROUTINES.map((entry) => ({ ...entry })))
    .onConflictDoNothing({
      target: [routineGroupRoutines.routineGroupId, routineGroupRoutines.routineId],
    });

  await db
    .insert(entityTranslations)
    .values(DEFAULT_ENTITY_TRANSLATIONS)
    .onConflictDoNothing({
      target: [
        entityTranslations.entityType,
        entityTranslations.entityId,
        entityTranslations.field,
        entityTranslations.locale,
      ],
    });

  const existingRoutines = await db
    .select({
      id: routines.id,
      name: routines.name,
      detail: routines.detail,
      description: routines.description,
      createdAt: routines.createdAt,
    })
    .from(routines);

  const existingExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
    })
    .from(exercises);

  const existingMuscleGroups = await db
    .select({
      id: muscleGroups.id,
      name: muscleGroups.name,
    })
    .from(muscleGroups);

  const existingRoutineTags = await db
    .select({
      id: routineTags.id,
      slug: routineTags.slug,
    })
    .from(routineTags);

  const existingRoutineGroups = await db
    .select({
      id: routineGroups.id,
      name: routineGroups.name,
      detail: routineGroups.detail,
      description: routineGroups.description,
      createdAt: routineGroups.createdAt,
    })
    .from(routineGroups);

  const backfillRows = buildBackfillTranslationRows({
    routinesRows: existingRoutines,
    exerciseRows: existingExercises,
    muscleGroupRows: existingMuscleGroups,
    routineTagRows: existingRoutineTags,
    routineGroupRows: existingRoutineGroups,
  });

  if (backfillRows.length > 0) {
    await db
      .insert(entityTranslations)
      .values(backfillRows)
      .onConflictDoNothing({
        target: [
          entityTranslations.entityType,
          entityTranslations.entityId,
          entityTranslations.field,
          entityTranslations.locale,
        ],
      });
  }

  if (__DEV__) {
    const missingSearchRows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        muscleGroup: exercises.muscleGroup,
      })
      .from(exercises)
      .where(or(isNull(exercises.searchPt), isNull(exercises.searchEn)));

    console.log(`[seed] search index validation: missing=${missingSearchRows.length}`);

    if (missingSearchRows.length > 0) {
      console.log("[seed] rows missing search fields:", missingSearchRows.slice(0, 5));
    } else {
      const [sample] = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          muscleGroup: exercises.muscleGroup,
          searchPt: exercises.searchPt,
          searchEn: exercises.searchEn,
        })
        .from(exercises)
        .limit(1);

      console.log("[seed] sample indexed row:", sample);
    }
  }
}
