import AsyncStorage from "@react-native-async-storage/async-storage";
import { runDevOnlyResetExercisesToBaseline } from "@/db/devOnly/resetExercisesToBaseline.devOnly";
import { runDevOnlyInjectMockRoutines } from "@/db/devOnly/injectMockRoutines.devOnly";
import { DEFAULT_EXERCISES } from "@/db/patches/data/exercises";
import { DEFAULT_MUSCLE_GROUPS } from "@/db/patches/data/muscleGroups";
// import {
//   DEFAULT_ROUTINE_GROUP_ROUTINES,
//   DEFAULT_ROUTINE_GROUPS,
// } from "@/db/patches/data/routineGroups";
// import {
//   DEFAULT_ROUTINE_EXERCISES,
//   DEFAULT_ROUTINE_TAG_LINKS,
//   DEFAULT_ROUTINES,
// } from "@/db/patches/data/routines";
import { DEFAULT_ROUTINE_TAGS } from "@/db/patches/data/routineTags";
import { count, eq, isNull, or } from "drizzle-orm";
import { db, expoDb } from "./client";
import {
  entityTranslations,
  exercises,
  muscleGroups,
  // routineGroupRoutines,
  routineGroups,
  // routineExercises,
  routines,
  // routineTagLinks,
  routineTags,
} from "./schema";
import { DEFAULT_ENTITY_TRANSLATIONS } from "./seed-data/entityTranslations";

// Bump this version whenever search index logic or labelPt/labelEn data changes.
const EXERCISE_SEARCH_INDEX_VERSION = "v1";
const EXERCISE_SEARCH_INDEX_KEY = "exercise_search_index_version";

type SeedDatabaseOptions = {
  database?: typeof db;
  includeRoutineGroups?: boolean;
};

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

// function buildRoutineSearchIndex(routine: { name: string; labelPt: string; labelEn: string }) {
//   return {
//     searchPt: normalizeSearchText(`${routine.labelPt} ${routine.name}`),
//     searchEn: normalizeSearchText(`${routine.labelEn} ${routine.name}`),
//   };
// }
//
// function buildRoutineGroupSearchIndex(group: { name: string; labelPt: string; labelEn: string }) {
//   return {
//     searchPt: normalizeSearchText(`${group.labelPt} ${group.name}`),
//     searchEn: normalizeSearchText(`${group.labelEn} ${group.name}`),
//   };
// }

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
    entityType: "exercise" | "muscle_group" | "routine" | "routine_group" | "routine_tag";
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
export async function seedDatabase(options: SeedDatabaseOptions = {}): Promise<void> {
  const database = options.database ?? db;
  const includeRoutineGroups = options.includeRoutineGroups ?? false;

  runDevOnlyResetExercisesToBaseline(expoDb, "seed");

  await database
    .insert(muscleGroups)
    .values(
      DEFAULT_MUSCLE_GROUPS.map((group) => ({
        id: group.id,
        name: group.name,
      })),
    )
    .onConflictDoNothing({ target: muscleGroups.id });

  await database
    .insert(routineTags)
    .values(
      DEFAULT_ROUTINE_TAGS.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        ...buildRoutineTagSearchIndex(tag),
      })),
    )
    .onConflictDoNothing({ target: routineTags.id });

  const [exerciseRow] = await database.select({ total: count() }).from(exercises);
  if (exerciseRow.total === 0) {
    await database.insert(exercises).values(
      DEFAULT_EXERCISES.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        isCustom: exercise.isCustom,
        imageUrl: exercise.imageUrl ?? null,
        ...buildSearchIndex(exercise),
      })),
    );
  } else {
    const currentVersion = await AsyncStorage.getItem(EXERCISE_SEARCH_INDEX_KEY);

    if (currentVersion !== EXERCISE_SEARCH_INDEX_VERSION) {
      const labelMap = new Map<string, { labelPt: string; labelEn: string }>(
        DEFAULT_EXERCISES.map((e) => [e.id, { labelPt: e.labelPt, labelEn: e.labelEn }]),
      );

      // Re-index system exercises from DEFAULT_EXERCISES (source of truth).
      // Only backfill custom exercises that have NULL search columns.
      const rowsToIndex = await database
        .select({
          id: exercises.id,
          name: exercises.name,
          isCustom: exercises.isCustom,
          searchPt: exercises.searchPt,
          searchEn: exercises.searchEn,
        })
        .from(exercises);

      for (const row of rowsToIndex) {
        const isSystemExercise = !row.isCustom && labelMap.has(row.id);
        const needsBackfill = row.searchPt === null || row.searchEn === null;

        if (!isSystemExercise && !needsBackfill) continue;

        const labels = labelMap.get(row.id);
        const { searchPt, searchEn } = buildSearchIndex({
          name: row.name,
          labelPt: labels?.labelPt ?? row.name,
          labelEn: labels?.labelEn ?? row.name,
        });

        await database
          .update(exercises)
          .set({ searchPt, searchEn })
          .where(eq(exercises.id, row.id));
      }

      await AsyncStorage.setItem(EXERCISE_SEARCH_INDEX_KEY, EXERCISE_SEARCH_INDEX_VERSION);
      console.log(`[seed] exercise search index updated to ${EXERCISE_SEARCH_INDEX_VERSION}`);
    } else if (__DEV__) {
      console.log(
        `[seed] exercise search index already at ${EXERCISE_SEARCH_INDEX_VERSION}, skipping`,
      );
    }
  }

  const translationSeedRows = includeRoutineGroups
    ? Array.from(DEFAULT_ENTITY_TRANSLATIONS)
    : Array.from(DEFAULT_ENTITY_TRANSLATIONS).filter((row) => row.entityType !== "routine_group");

  await database
    .insert(entityTranslations)
    .values(translationSeedRows)
    .onConflictDoNothing({
      target: [
        entityTranslations.entityType,
        entityTranslations.entityId,
        entityTranslations.field,
        entityTranslations.locale,
      ],
    });

  const existingRoutines = await database
    .select({
      id: routines.id,
      name: routines.name,
      detail: routines.detail,
      description: routines.description,
      createdAt: routines.createdAt,
    })
    .from(routines);

  const existingExercises = await database
    .select({
      id: exercises.id,
      name: exercises.name,
    })
    .from(exercises);

  const existingMuscleGroups = await database
    .select({
      id: muscleGroups.id,
      name: muscleGroups.name,
    })
    .from(muscleGroups);

  const existingRoutineTags = await database
    .select({
      id: routineTags.id,
      slug: routineTags.slug,
    })
    .from(routineTags);

  const existingRoutineGroups = includeRoutineGroups
    ? await database
        .select({
          id: routineGroups.id,
          name: routineGroups.name,
          detail: routineGroups.detail,
          description: routineGroups.description,
          createdAt: routineGroups.createdAt,
        })
        .from(routineGroups)
    : [];

  const backfillRows = buildBackfillTranslationRows({
    routinesRows: existingRoutines,
    exerciseRows: existingExercises,
    muscleGroupRows: existingMuscleGroups,
    routineTagRows: existingRoutineTags,
    routineGroupRows: existingRoutineGroups,
  });

  if (backfillRows.length > 0) {
    await database
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
    const missingSearchRows = await database
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
      const [sample] = await database
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

  // Must run after exercises and routineTags are seeded — routineExercises and routineTagLinks
  // reference those tables via FK and would fail if inserted before parent rows exist.
  await runDevOnlyInjectMockRoutines(database);
}
