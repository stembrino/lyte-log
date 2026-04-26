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

type RoutineRow = {
  id: string;
  name: string;
};

function buildCompletedWorkoutFilter(gymId?: string | null) {
  const notDeleted = isNull(workouts.deletedAt);

  if (gymId === undefined) {
    return and(eq(workouts.status, "completed"), notDeleted);
  }

  if (gymId === null) {
    return and(eq(workouts.status, "completed"), notDeleted, isNull(workouts.gymId));
  }

  return and(eq(workouts.status, "completed"), notDeleted, eq(workouts.gymId, gymId));
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

export async function getLogbookWorkoutsCount(args?: { gymId?: string | null }): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(workouts)
    .where(buildCompletedWorkoutFilter(args?.gymId));

  return Number(row?.count ?? 0);
}

export async function getLogbookWorkoutsPage(args: {
  page: number;
  gymId?: string | null;
  locale: AppLocale;
}): Promise<LogbookWorkoutItem[]> {
  const rows = await db.query.workouts.findMany({
    where: buildCompletedWorkoutFilter(args.gymId),
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
