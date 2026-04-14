import { db } from "@/db/client";
import { sets, workoutExercises, workouts } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { WORKOUT_ACTIVE_STATUSES } from "@/features/workouts/dao/queries/workoutQueries";

type StartWorkoutArgs = {
  gymId: string | null;
  exercises: {
    exerciseId: string;
    exerciseOrder: number;
    setsTarget: number | null;
    repsTarget: number | null;
  }[];
};

type StartWorkoutResult = {
  workoutId: string;
  reusedActiveWorkout: boolean;
};

export async function startWorkout(args: StartWorkoutArgs): Promise<StartWorkoutResult> {
  return db.transaction(async (tx) => {
    const [activeWorkout] = await tx
      .select({ id: workouts.id })
      .from(workouts)
      .where(inArray(workouts.status, WORKOUT_ACTIVE_STATUSES))
      .orderBy(desc(workouts.createdAt))
      .limit(1);

    if (activeWorkout) {
      return {
        workoutId: activeWorkout.id,
        reusedActiveWorkout: true,
      };
    }

    const now = new Date().toISOString();
    const workoutId = `workout-${Date.now()}`;

    await tx.insert(workouts).values({
      id: workoutId,
      date: now,
      status: "in_progress",
      duration: null,
      notes: null,
      gymId: args.gymId,
      createdAt: now,
    });

    if (args.exercises.length > 0) {
      const exerciseRows = args.exercises.map((exercise, index) => ({
        id: `wte-${workoutId}-${index + 1}`,
        workoutId,
        exerciseId: exercise.exerciseId,
        exerciseOrder: exercise.exerciseOrder,
        setsTarget: exercise.setsTarget,
        repsTarget: exercise.repsTarget,
      }));

      await tx
        .insert(workoutExercises)
        .values(exerciseRows.map(({ setsTarget, repsTarget, ...row }) => row));

      const setRows = exerciseRows.flatMap((exerciseRow) => {
        const targetSets = Math.max(0, exerciseRow.setsTarget ?? 0);

        return Array.from({ length: targetSets }, (_, setIndex) => ({
          id: `set-${exerciseRow.id}-${setIndex + 1}`,
          workoutExerciseId: exerciseRow.id,
          reps: exerciseRow.repsTarget ?? 0,
          weight: 0,
          completed: false,
          timestamp: now,
        }));
      });

      if (setRows.length > 0) {
        await tx.insert(sets).values(setRows);
      }
    }

    return {
      workoutId,
      reusedActiveWorkout: false,
    };
  });
}

export async function cancelWorkout(workoutId: string): Promise<void> {
  await db.update(workouts).set({ status: "canceled" }).where(eq(workouts.id, workoutId));
}

export async function updateWorkoutSet(args: {
  setId: string;
  reps: number;
  weight: number;
}): Promise<void> {
  await db
    .update(sets)
    .set({
      reps: args.reps,
      weight: args.weight,
    })
    .where(eq(sets.id, args.setId));
}

export async function updateWorkoutSetCompleted(args: {
  setId: string;
  completed: boolean;
}): Promise<void> {
  await db
    .update(sets)
    .set({
      completed: args.completed,
    })
    .where(eq(sets.id, args.setId));
}

export async function addWorkoutSet(args: {
  workoutExerciseId: string;
  reps?: number;
  weight?: number;
}): Promise<{
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
  timestamp: string;
}> {
  const timestamp = new Date().toISOString();
  const setId = `set-${args.workoutExerciseId}-${Date.now()}-${Math.floor(Math.random() * 1_000)}`;
  const reps = args.reps ?? 0;
  const weight = args.weight ?? 0;

  await db.insert(sets).values({
    id: setId,
    workoutExerciseId: args.workoutExerciseId,
    reps,
    weight,
    completed: false,
    timestamp,
  });

  return {
    id: setId,
    reps,
    weight,
    completed: false,
    timestamp,
  };
}

export async function updateWorkoutStatus(args: {
  workoutId: string;
  status: "in_progress" | "paused";
}): Promise<void> {
  await db
    .update(workouts)
    .set({
      status: args.status,
    })
    .where(eq(workouts.id, args.workoutId));
}

export async function finishWorkout(workoutId: string): Promise<void> {
  const [workout] = await db
    .select({
      createdAt: workouts.createdAt,
    })
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);

  const durationMinutes = workout
    ? Math.max(1, Math.round((Date.now() - new Date(workout.createdAt).getTime()) / 60000))
    : null;

  await db
    .update(workouts)
    .set({
      status: "completed",
      duration: durationMinutes,
    })
    .where(eq(workouts.id, workoutId));
}
