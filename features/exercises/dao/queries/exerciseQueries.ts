import type { AppLocale } from "@/components/providers/i18n-provider";
import { db } from "@/db/client";
import { entityTranslations, exercises, muscleGroups } from "@/db/schema";
import { and, asc, count, eq, like, notInArray, or } from "drizzle-orm";

const PAGE_SIZE = 20;

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
  imageUrl: string | null;
};

type GetExerciseLibraryPageArgs = {
  page: number;
  query: string;
  locale: AppLocale;
  excludeIds: string[];
};

type ExerciseLibraryFilterArgs = {
  query: string;
  locale: AppLocale;
  excludeIds: string[];
};

function buildExerciseLibraryWhereClause({ query, locale, excludeIds }: ExerciseLibraryFilterArgs) {
  const searchColumn = locale === "pt-BR" ? exercises.searchPt : exercises.searchEn;
  const conditions = [] as (ReturnType<typeof like> | ReturnType<typeof notInArray>)[];

  if (query) {
    conditions.push(
      or(like(searchColumn, `%${query}%`), like(exercises.muscleGroup, `%${query}%`))!,
    );
  }

  if (excludeIds.length > 0) {
    conditions.push(notInArray(exercises.id, excludeIds));
  }

  if (conditions.length === 0) {
    return undefined;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return and(...conditions);
}

export async function getExerciseLibraryPage({
  page,
  query,
  locale,
  excludeIds,
}: GetExerciseLibraryPageArgs): Promise<ExerciseLibraryItem[]> {
  const whereClause = buildExerciseLibraryWhereClause({
    query,
    locale,
    excludeIds,
  });

  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      isCustom: exercises.isCustom,
      imageUrl: exercises.imageUrl,
      translatedName: entityTranslations.value,
    })
    .from(exercises)
    .leftJoin(
      entityTranslations,
      and(
        eq(entityTranslations.entityId, exercises.id),
        eq(entityTranslations.entityType, "exercise"),
        eq(entityTranslations.field, "name"),
        eq(entityTranslations.locale, locale),
      ),
    )
    .where(whereClause)
    .orderBy(asc(exercises.name))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);

  return rows.map((row) => ({
    id: row.id,
    name: row.translatedName ?? row.name,
    muscleGroup: row.muscleGroup,
    isCustom: row.isCustom,
    imageUrl: row.imageUrl,
  }));
}

export async function getExerciseLibraryCount({
  query,
  locale,
  excludeIds,
}: ExerciseLibraryFilterArgs): Promise<number> {
  const whereClause = buildExerciseLibraryWhereClause({
    query,
    locale,
    excludeIds,
  });

  const [row] = await db.select({ total: count() }).from(exercises).where(whereClause);

  return row?.total ?? 0;
}

export async function getMuscleGroupNames(): Promise<string[]> {
  const rows = await db
    .select({ name: muscleGroups.name })
    .from(muscleGroups)
    .orderBy(asc(muscleGroups.name));

  return rows.map((row) => row.name);
}
