import { DEFAULT_EXERCISES } from "@/constants/seed/exercises";
import { DEFAULT_MUSCLE_GROUPS } from "@/constants/seed/muscleGroups";
import {
  DEFAULT_ROUTINE_EXERCISES,
  DEFAULT_ROUTINE_TAG_LINKS,
  DEFAULT_ROUTINES,
} from "@/constants/seed/routines";
import { DEFAULT_ROUTINE_TAGS } from "@/constants/seed/routineTags";
import { translations } from "@/constants/translations";
import { count, eq, isNull, or } from "drizzle-orm";
import { db } from "./client";
import {
  exercises,
  muscleGroups,
  routineExercises,
  routines,
  routineTagLinks,
  routineTags,
} from "./schema";

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildSearchIndex(exercise: { name: string; i18nKey?: string | null }) {
  const ptLibrary = translations["pt-BR"].exerciseLibrary as Record<string, string>;
  const ptLabel = exercise.i18nKey ? ptLibrary[exercise.i18nKey] : undefined;

  return {
    searchPt: normalizeSearchText(ptLabel ? `${ptLabel} ${exercise.name}` : exercise.name),
    searchEn: normalizeSearchText(exercise.name),
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

/**
 * Inserts default database data on first launch.
 */
export async function seedDatabase(): Promise<void> {
  await db
    .insert(muscleGroups)
    .values(DEFAULT_MUSCLE_GROUPS.map((group) => ({ ...group })))
    .onConflictDoNothing({ target: muscleGroups.id });

  await db
    .insert(routineTags)
    .values(
      DEFAULT_ROUTINE_TAGS.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        i18nKey: tag.i18nKey,
        ...buildRoutineTagSearchIndex(tag),
      })),
    )
    .onConflictDoNothing({ target: routineTags.id });

  const [exerciseRow] = await db.select({ total: count() }).from(exercises);
  if (exerciseRow.total === 0) {
    await db.insert(exercises).values(
      DEFAULT_EXERCISES.map((exercise) => ({
        ...exercise,
        ...buildSearchIndex(exercise),
      })),
    );
  } else {
    // Backfill search index columns for existing local rows.
    const rows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        i18nKey: exercises.i18nKey,
      })
      .from(exercises);

    for (const row of rows) {
      const { searchPt, searchEn } = buildSearchIndex({
        name: row.name,
        i18nKey: row.i18nKey,
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
        estimatedDurationMin: routine.estimatedDurationMin,
        isSystem: routine.isSystem,
        i18nKey: routine.i18nKey,
        createdAt: routine.createdAt,
        ...buildRoutineSearchIndex(routine),
      })),
    )
    .onConflictDoNothing({ target: routines.id });

  await db
    .insert(routineTagLinks)
    .values(DEFAULT_ROUTINE_TAG_LINKS.map((link) => ({ ...link })))
    .onConflictDoNothing({ target: [routineTagLinks.routineId, routineTagLinks.tagId] });

  await db
    .insert(routineExercises)
    .values(DEFAULT_ROUTINE_EXERCISES.map((exercise) => ({ ...exercise })))
    .onConflictDoNothing({ target: routineExercises.id });

  if (__DEV__) {
    const missingSearchRows = await db
      .select({
        id: exercises.id,
        name: exercises.name,
        muscleGroup: exercises.muscleGroup,
        i18nKey: exercises.i18nKey,
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
          i18nKey: exercises.i18nKey,
          searchPt: exercises.searchPt,
          searchEn: exercises.searchEn,
        })
        .from(exercises)
        .limit(1);

      console.log("[seed] sample indexed row:", sample);
    }
  }
}
