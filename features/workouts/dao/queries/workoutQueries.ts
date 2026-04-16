import { db } from "@/db/client";
import { workouts } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";

export const WORKOUT_ACTIVE_STATUSES = ["in_progress", "paused"] as const;

export type WorkoutStatus = "preparing" | "in_progress" | "paused" | "completed" | "canceled";

export type ActiveWorkoutRow = {
  id: string;
  status: WorkoutStatus;
  date: string;
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
export async function getActiveWorkout(): Promise<ActiveWorkoutRow | null> {
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

  return {
    id: row.id,
    status: row.status as WorkoutStatus,
    date: row.date,
    gymId: row.gymId ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    gym: row.gym ? { id: row.gym.id, name: row.gym.name } : null,
    exercises: row.workoutExercises.map((workoutExercise) => ({
      id: workoutExercise.id,
      exerciseOrder: workoutExercise.exerciseOrder,
      exercise: {
        id: workoutExercise.exercise.id,
        name: workoutExercise.exercise.name,
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
