import type { AppLocale } from "@/components/providers/i18n-provider";
import { db } from "@/db/client";
import { exercises, muscleGroups } from "@/db/schema";
import { getEntityFieldTranslationsMap } from "@/features/translations/dao/queries/translationQueries";
import { and, asc, count, inArray, like, notInArray, or } from "drizzle-orm";

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
  muscleGroups: string[];
};

type ExerciseLibraryFilterArgs = {
  query: string;
  locale: AppLocale;
  excludeIds: string[];
  muscleGroups: string[];
};

function buildExerciseLibraryWhereClause({
  query,
  locale,
  excludeIds,
  muscleGroups,
}: ExerciseLibraryFilterArgs) {
  const searchColumn = locale === "pt-BR" ? exercises.searchPt : exercises.searchEn;
  const conditions = [];

  if (query) {
    conditions.push(
      or(like(searchColumn, `%${query}%`), like(exercises.muscleGroup, `%${query}%`))!,
    );
  }

  if (excludeIds.length > 0) {
    conditions.push(notInArray(exercises.id, excludeIds));
  }

  if (muscleGroups.length > 0) {
    conditions.push(inArray(exercises.muscleGroup, muscleGroups));
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
  muscleGroups,
}: GetExerciseLibraryPageArgs): Promise<ExerciseLibraryItem[]> {
  const whereClause = buildExerciseLibraryWhereClause({
    query,
    locale,
    excludeIds,
    muscleGroups,
  });

  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      isCustom: exercises.isCustom,
      imageUrl: exercises.imageUrl,
    })
    .from(exercises)
    .where(whereClause)
    .orderBy(asc(exercises.name))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE);

  const translationMap = await getEntityFieldTranslationsMap({
    locale,
    entityType: "exercise",
    field: "name",
    entityIds: rows.map((row) => row.id),
  });

  return rows.map((row) => ({
    id: row.id,
    name: translationMap.get(row.id) ?? row.name,
    muscleGroup: row.muscleGroup,
    isCustom: row.isCustom,
    imageUrl: row.imageUrl,
  }));
}

export async function getExerciseLibraryCount({
  query,
  locale,
  excludeIds,
  muscleGroups,
}: ExerciseLibraryFilterArgs): Promise<number> {
  const whereClause = buildExerciseLibraryWhereClause({
    query,
    locale,
    excludeIds,
    muscleGroups,
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
