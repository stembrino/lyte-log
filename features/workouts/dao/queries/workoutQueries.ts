import { db } from "@/db/client";
import type { AppLocale } from "@/constants/translations";
import { workouts } from "@/db/schema";
import { getEntityFieldTranslationsMap } from "@/features/translations/dao/queries/translationQueries";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

export const WORKOUT_ACTIVE_STATUSES = ["in_progress", "paused"] as const;

export type WorkoutStatus = "preparing" | "in_progress" | "paused" | "completed" | "canceled";

export type ActiveWorkoutRow = {
  id: string;
  status: WorkoutStatus;
  date: string;
  sourceRoutineId: string | null;
  gymId: string | null;
  notes: string | null;
  createdAt: string;
  gym: {
    id: string;
    name: string;
  } | null;
  exercises: {
    id: string;
    exerciseOrder: number;
    exercise: {
      id: string;
      name: string;
      muscleGroup: string;
    };
    sets: {
      id: string;
      reps: number;
      weight: number;
      completed: boolean;
      timestamp: string;
    }[];
  }[];
};

/**
 * Fast check for any active workout (in progress or paused), newest first.
 */
export async function getActiveWorkout(locale?: AppLocale): Promise<ActiveWorkoutRow | null> {
  const row = await db.query.workouts.findFirst({
    where: inArray(workouts.status, WORKOUT_ACTIVE_STATUSES),
    orderBy: [desc(workouts.createdAt)],
    with: {
      gym: {
        columns: {
          id: true,
          name: true,
        },
      },
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.exerciseOrder)],
        with: {
          exercise: {
            columns: {
              id: true,
              name: true,
              muscleGroup: true,
            },
          },
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.timestamp)],
          },
        },
      },
    },
  });

  if (!row) {
    return null;
  }

  const exerciseIds = row.workoutExercises.map((workoutExercise) => workoutExercise.exercise.id);
  const translationMap = locale
    ? await getEntityFieldTranslationsMap({
        locale,
        entityType: "exercise",
        field: "name",
        entityIds: exerciseIds,
      })
    : new Map<string, string>();

  return {
    id: row.id,
    status: row.status as WorkoutStatus,
    date: row.date,
    sourceRoutineId: row.sourceRoutineId ?? null,
    gymId: row.gymId ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    gym: row.gym ? { id: row.gym.id, name: row.gym.name } : null,
    exercises: row.workoutExercises.map((workoutExercise) => ({
      id: workoutExercise.id,
      exerciseOrder: workoutExercise.exerciseOrder,
      exercise: {
        id: workoutExercise.exercise.id,
        name: translationMap.get(workoutExercise.exercise.id) ?? workoutExercise.exercise.name,
        muscleGroup: workoutExercise.exercise.muscleGroup,
      },
      sets: workoutExercise.sets.map((set) => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight,
        completed: set.completed,
        timestamp: set.timestamp,
      })),
    })),
  };
}

export async function getCompletedWorkoutsCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(${workouts.id})` })
    .from(workouts)
    .where(and(eq(workouts.status, "completed"), isNull(workouts.deletedAt)))
    .limit(1);

  return Number(row?.count ?? 0);
}
