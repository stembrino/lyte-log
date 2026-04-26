import type { AppLocale } from "@/components/providers/i18n-provider";
import { db } from "@/db/client";
import { gyms, routines, workouts } from "@/db/schema";
import { getEntityFieldTranslationsMap } from "@/features/translations/dao/queries/translationQueries";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";

export const LOGBOOK_PAGE_SIZE = 20;

export type LogbookWorkoutItem = {
  id: string;
  date: string;
  createdAt: string;
  duration: number | null;
  sourceRoutine: {
    id: string;
    name: string;
  } | null;
  gym: {
    id: string;
    name: string;
  } | null;
  exerciseCount: number;
  totalSets: number;
  completedSets: number;
  setDetails: {
    id: string;
    exerciseName: string;
    setOrder: number;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
  totalLoadKg: number;
};

export type LogbookGymGroup = {
  gymId: string | null;
  gymName: string | null;
  workoutsCount: number;
};

export type LogbookRoutineGroup = {
  routineId: string | null;
  routineName: string | null;
  workoutsCount: number;
};

type RoutineRow = {
  id: string;
  name: string;
};

function buildCompletedWorkoutFilter(gymId?: string | null, routineId?: string | null) {
  const notDeleted = isNull(workouts.deletedAt);
  const baseFilter = and(eq(workouts.status, "completed"), notDeleted);

  if (gymId === undefined && routineId === undefined) {
    return baseFilter;
  }

  const gymFilter =
    gymId === undefined
      ? undefined
      : gymId === null
        ? isNull(workouts.gymId)
        : eq(workouts.gymId, gymId);

  const routineFilter =
    routineId === undefined
      ? undefined
      : routineId === null
        ? isNull(workouts.sourceRoutineId)
        : eq(workouts.sourceRoutineId, routineId);

  return and(baseFilter, gymFilter, routineFilter);
}

async function getRoutinesByIds(routineIds: string[]): Promise<RoutineRow[]> {
  if (routineIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: routines.id,
      name: routines.name,
    })
    .from(routines)
    .where(inArray(routines.id, routineIds));
}

export async function getLogbookWorkoutsCount(args?: {
  gymId?: string | null;
  routineId?: string | null;
}): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workouts)
    .where(buildCompletedWorkoutFilter(args?.gymId, args?.routineId));

  return Number(row?.count ?? 0);
}

export async function getLogbookWorkoutsPage(args: {
  page: number;
  gymId?: string | null;
  routineId?: string | null;
  locale: AppLocale;
}): Promise<LogbookWorkoutItem[]> {
  const rows = await db.query.workouts.findMany({
    where: buildCompletedWorkoutFilter(args.gymId, args.routineId),
    orderBy: [desc(workouts.date), desc(workouts.createdAt)],
    limit: LOGBOOK_PAGE_SIZE,
    offset: args.page * LOGBOOK_PAGE_SIZE,
    with: {
      gym: {
        columns: {
          id: true,
          name: true,
        },
      },
      workoutExercises: {
        columns: {
          id: true,
          exerciseOrder: true,
        },
        orderBy: (table, operators) => [operators.asc(table.exerciseOrder)],
        with: {
          exercise: {
            columns: {
              id: true,
              name: true,
            },
          },
          sets: {
            orderBy: (table, operators) => [operators.asc(table.timestamp)],
            columns: {
              id: true,
              reps: true,
              weight: true,
              completed: true,
            },
          },
        },
      },
    },
  });

  const translationMap = await getEntityFieldTranslationsMap({
    locale: args.locale,
    entityType: "exercise",
    field: "name",
    entityIds: rows.flatMap((row) =>
      row.workoutExercises.map((workoutExercise) => workoutExercise.exercise.id),
    ),
  });

  const sourceRoutineIdByWorkoutId = new Map<string, string>();
  for (const row of rows) {
    const sourceRoutineId = row.sourceRoutineId ?? null;
    if (sourceRoutineId) {
      sourceRoutineIdByWorkoutId.set(row.id, sourceRoutineId);
    }
  }

  const sourceRoutineIds = Array.from(new Set(sourceRoutineIdByWorkoutId.values()));
  const sourceRoutineRows = await getRoutinesByIds(sourceRoutineIds);

  const routineNameTranslationMap = await getEntityFieldTranslationsMap({
    locale: args.locale,
    entityType: "routine",
    field: "name",
    entityIds: sourceRoutineRows.map((routine) => routine.id),
  });

  const sourceRoutineById = new Map(
    sourceRoutineRows.map((routine) => [
      routine.id,
      {
        id: routine.id,
        name: routineNameTranslationMap.get(routine.id) ?? routine.name,
      },
    ]),
  );

  return rows.map((row) => {
    const totalSets = row.workoutExercises.reduce((sum, workoutExercise) => {
      return sum + workoutExercise.sets.length;
    }, 0);

    const completedSets = row.workoutExercises.reduce((sum, workoutExercise) => {
      return sum + workoutExercise.sets.filter((set) => set.completed).length;
    }, 0);

    const setDetails = row.workoutExercises.flatMap((workoutExercise) => {
      const exerciseName =
        translationMap.get(workoutExercise.exercise.id) ?? workoutExercise.exercise.name;

      return workoutExercise.sets.map((set, index) => ({
        id: set.id,
        exerciseName,
        setOrder: index + 1,
        reps: set.reps,
        weight: set.weight,
        completed: set.completed,
      }));
    });

    const totalLoadKg = row.workoutExercises.reduce((sum, workoutExercise) => {
      return (
        sum +
        workoutExercise.sets.reduce((setsSum, set) => {
          if (!set.completed) return setsSum;
          return setsSum + Math.max(0, set.reps) * Math.max(0, set.weight);
        }, 0)
      );
    }, 0);

    return {
      id: row.id,
      date: row.date,
      createdAt: row.createdAt,
      duration: row.duration,
      sourceRoutine: sourceRoutineById.get(sourceRoutineIdByWorkoutId.get(row.id) ?? "") ?? null,
      gym: row.gym ? { id: row.gym.id, name: row.gym.name } : null,
      exerciseCount: row.workoutExercises.length,
      totalSets,
      completedSets,
      setDetails,
      totalLoadKg,
    };
  });
}

export async function getLogbookGymGroups(): Promise<LogbookGymGroup[]> {
  const rows = await db
    .select({
      gymId: workouts.gymId,
      gymName: gyms.name,
      workoutsCount: sql<number>`count(${workouts.id})`,
    })
    .from(workouts)
    .leftJoin(gyms, eq(gyms.id, workouts.gymId))
    .where(and(eq(workouts.status, "completed"), isNull(workouts.deletedAt)))
    .groupBy(workouts.gymId, gyms.name)
    .orderBy(asc(gyms.name));

  return rows.map((row) => ({
    gymId: row.gymId,
    gymName: row.gymName,
    workoutsCount: Number(row.workoutsCount),
  }));
}

export async function getLogbookRoutineGroups(locale: AppLocale): Promise<LogbookRoutineGroup[]> {
  const rows = await db
    .select({
      routineId: workouts.sourceRoutineId,
      routineName: routines.name,
      workoutsCount: sql<number>`count(${workouts.id})`,
    })
    .from(workouts)
    .leftJoin(routines, eq(routines.id, workouts.sourceRoutineId))
    .where(and(eq(workouts.status, "completed"), isNull(workouts.deletedAt)))
    .groupBy(workouts.sourceRoutineId, routines.name)
    .orderBy(asc(routines.name));

  const routineIds = rows
    .map((row) => row.routineId)
    .filter((routineId): routineId is string => Boolean(routineId));

  const routineNameTranslationMap = await getEntityFieldTranslationsMap({
    locale,
    entityType: "routine",
    field: "name",
    entityIds: routineIds,
  });

  return rows.map((row) => ({
    routineId: row.routineId,
    routineName: row.routineId
      ? (routineNameTranslationMap.get(row.routineId) ?? row.routineName)
      : null,
    workoutsCount: Number(row.workoutsCount),
  }));
}
