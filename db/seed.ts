import { DEFAULT_EXERCISES } from "@/constants/exercises";
import { DEFAULT_MUSCLE_GROUPS } from "@/constants/muscleGroups";
import { translations } from "@/constants/translations";
import { count, eq, isNull, or } from "drizzle-orm";
import { db } from "./client";
import { exercises, muscleGroups } from "./schema";

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

/**
 * Inserts the default exercise library on first launch.
 * Does nothing if the table already has rows.
 */
export async function seedDatabase(): Promise<void> {
  await db
    .insert(muscleGroups)
    .values(DEFAULT_MUSCLE_GROUPS.map((group) => ({ ...group })))
    .onConflictDoNothing({ target: muscleGroups.id });

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
