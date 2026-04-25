import type { AppLocale } from "@/constants/translations";
import { db } from "@/db/client";
import { routines as routinesTable } from "@/db/schema";
import {
  buildTranslationKey,
  getTranslationsMap,
} from "@/features/translations/dao/queries/translationQueries";
import { count, like, or } from "drizzle-orm";

const ROUTINE_PAGE_SIZE = 20;

type RoutinePickerFilterArgs = {
  query: string;
  locale: AppLocale;
};

function buildRoutinePickerWhereClause({ query, locale }: RoutinePickerFilterArgs) {
  if (!query) {
    return undefined;
  }

  const searchColumn = locale === "pt-BR" ? routinesTable.searchPt : routinesTable.searchEn;

  return or(like(searchColumn, `%${query}%`), like(routinesTable.name, `%${query}%`));
}

export type RoutineExercise = {
  id: string;
  exerciseId: string;
  name: string;
  exerciseOrder: number;
  setsTarget: number | null;
  repsTarget: string | null;
};

export type RoutineItem = {
  id: string;
  name: string;
  detail: string | null;
  description: string | null;
  isFavorite: boolean;
  createdAt: string;
  exercises: RoutineExercise[];
};

type TranslationMap = Map<string, string>;

function pickTranslated(
  map: TranslationMap,
  entityType: "routine" | "exercise",
  entityId: string,
  field: "name" | "detail" | "description",
  fallback: string | null,
): string | null {
  const translated = map.get(buildTranslationKey(entityType, entityId, field));
  if (translated !== undefined) {
    return translated;
  }
  return fallback;
}

async function loadTranslations(
  locale: AppLocale,
  routineIds: string[],
  exerciseIds: string[],
): Promise<TranslationMap> {
  const uniqueRoutineIds = Array.from(new Set(routineIds));
  const uniqueExerciseIds = Array.from(new Set(exerciseIds));

  if (uniqueRoutineIds.length === 0 && uniqueExerciseIds.length === 0) {
    return new Map();
  }

  return getTranslationsMap({
    locale,
    entityTypes: ["routine", "exercise"],
    fields: ["name", "detail", "description"],
    entityIds: [...uniqueRoutineIds, ...uniqueExerciseIds],
  });
}

function mapRoutine(
  routineRow: {
    id: string;
    name: string;
    detail: string | null;
    description: string | null;
    isFavorite: boolean;
    createdAt: string;
    routineExercises: {
      id: string;
      exerciseId: string;
      exerciseOrder: number;
      setsTarget: number | null;
      repsTarget: string | null;
      exercise: {
        name: string;
      } | null;
    }[];
  },
  translationMap: TranslationMap,
): RoutineItem {
  const exercises = routineRow.routineExercises.map((routineExercise) => {
    const exercise = routineExercise.exercise;
    return {
      id: routineExercise.id,
      exerciseId: routineExercise.exerciseId,
      name:
        pickTranslated(
          translationMap,
          "exercise",
          routineExercise.exerciseId,
          "name",
          exercise?.name ?? routineExercise.exerciseId,
        ) ?? routineExercise.exerciseId,
      exerciseOrder: routineExercise.exerciseOrder,
      setsTarget: routineExercise.setsTarget,
      repsTarget: routineExercise.repsTarget,
    };
  });

  return {
    id: routineRow.id,
    name: pickTranslated(translationMap, "routine", routineRow.id, "name", routineRow.name) ?? "",
    detail: pickTranslated(
      translationMap,
      "routine",
      routineRow.id,
      "detail",
      routineRow.detail ?? null,
    ),
    description: pickTranslated(
      translationMap,
      "routine",
      routineRow.id,
      "description",
      routineRow.description ?? null,
    ),
    isFavorite: routineRow.isFavorite,
    createdAt: routineRow.createdAt,
    exercises,
  };
}

/**
 * Load a single routine by ID, with exercises.
 */
export async function getRoutineById(
  routineId: string,
  locale: AppLocale,
): Promise<RoutineItem | null> {
  const routineRow = await db.query.routines.findFirst({
    where: (routine, { eq }) => eq(routine.id, routineId),
    with: {
      routineExercises: {
        orderBy: (routineExercise, { asc }) => [asc(routineExercise.exerciseOrder)],
        with: {
          exercise: true,
        },
      },
    },
  });

  if (!routineRow) {
    return null;
  }

  const exerciseIds = routineRow.routineExercises
    .map((routineExercise) => routineExercise.exerciseId)
    .filter((id): id is string => Boolean(id));

  const translationMap = await loadTranslations(locale, [routineRow.id], exerciseIds);

  return mapRoutine(routineRow, translationMap);
}

/**
 * Load all routines as a flat list.
 */
export async function getRoutinesFlat(locale: AppLocale): Promise<RoutineItem[]> {
  const allRoutineRows = await db.query.routines.findMany({
    orderBy: (routine, { asc }) => [asc(routine.createdAt)],
    with: {
      routineExercises: {
        orderBy: (routineExercise, { asc }) => [asc(routineExercise.exerciseOrder)],
        with: {
          exercise: true,
        },
      },
    },
  });

  const routineIds = allRoutineRows.map((routine) => routine.id);
  const exerciseIds = allRoutineRows.flatMap((routine) =>
    routine.routineExercises
      .map((routineExercise) => routineExercise.exerciseId)
      .filter((id): id is string => Boolean(id)),
  );

  const translationMap = await loadTranslations(locale, routineIds, exerciseIds);

  return allRoutineRows.map((routine) => mapRoutine(routine, translationMap));
}

/**
 * Load a page of routines for the picker (supports search).
 */
export async function getRoutinesPage({
  page,
  query,
  locale,
}: {
  page: number;
  query: string;
  locale: AppLocale;
}): Promise<RoutineItem[]> {
  const whereClause = buildRoutinePickerWhereClause({ query, locale });

  const routineRows = await db.query.routines.findMany({
    where: whereClause ? () => whereClause : undefined,
    orderBy: (routine, { asc: ascOrder }) => [ascOrder(routine.name)],
    limit: ROUTINE_PAGE_SIZE,
    offset: page * ROUTINE_PAGE_SIZE,
    with: {
      routineExercises: {
        orderBy: (routineExercise, { asc: ascOrder }) => [ascOrder(routineExercise.exerciseOrder)],
        with: {
          exercise: true,
        },
      },
    },
  });

  const routineIds = routineRows.map((routine) => routine.id);
  const exerciseIds = routineRows.flatMap((routine) =>
    routine.routineExercises
      .map((routineExercise) => routineExercise.exerciseId)
      .filter((id): id is string => Boolean(id)),
  );

  const translationMap = await loadTranslations(locale, routineIds, exerciseIds);

  return routineRows.map((routine) => mapRoutine(routine, translationMap));
}

/**
 * Count routines matching an optional search query.
 */
export async function getRoutinesCount({
  query,
  locale,
}: {
  query: string;
  locale: AppLocale;
}): Promise<number> {
  const whereClause = buildRoutinePickerWhereClause({ query, locale });

  const [row] = await db.select({ total: count() }).from(routinesTable).where(whereClause);

  return row?.total ?? 0;
}
