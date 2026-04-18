import { db } from "@/db/client";
import { routineExercises, routines, sets, workoutExercises, workouts } from "@/db/schema";
import type { AppLocale } from "@/constants/translations";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { WORKOUT_ACTIVE_STATUSES } from "@/features/workouts/dao/queries/workoutQueries";

type StartWorkoutArgs = {
  gymId: string | null;
  sourceRoutineId?: string | null;
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

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

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
      notes: JSON.stringify({
        sourceRoutineId: args.sourceRoutineId ?? null,
      }),
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

export async function removeWorkoutSet(args: { setId: string }): Promise<void> {
  await db.delete(sets).where(eq(sets.id, args.setId));
}

export async function addWorkoutExercise(args: { workoutId: string; exerciseId: string }): Promise<{
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseOrder: number;
}> {
  const [latestExercise] = await db
    .select({ exerciseOrder: workoutExercises.exerciseOrder })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, args.workoutId))
    .orderBy(desc(workoutExercises.exerciseOrder))
    .limit(1);

  const nextOrder = (latestExercise?.exerciseOrder ?? 0) + 1;
  const workoutExerciseId = `wte-${args.workoutId}-${Date.now()}`;

  await db.insert(workoutExercises).values({
    id: workoutExerciseId,
    workoutId: args.workoutId,
    exerciseId: args.exerciseId,
    exerciseOrder: nextOrder,
  });

  return {
    id: workoutExerciseId,
    workoutId: args.workoutId,
    exerciseId: args.exerciseId,
    exerciseOrder: nextOrder,
  };
}

export async function addWorkoutExerciseWithInitialSet(args: {
  workoutId: string;
  exerciseId: string;
}): Promise<{
  exercise: {
    id: string;
    workoutId: string;
    exerciseId: string;
    exerciseOrder: number;
  };
  initialSet: {
    id: string;
    reps: number;
    weight: number;
    completed: boolean;
    timestamp: string;
  };
}> {
  return db.transaction(async (tx) => {
    const [latestExercise] = await tx
      .select({ exerciseOrder: workoutExercises.exerciseOrder })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, args.workoutId))
      .orderBy(desc(workoutExercises.exerciseOrder))
      .limit(1);

    const nextOrder = (latestExercise?.exerciseOrder ?? 0) + 1;
    const workoutExerciseId = `wte-${args.workoutId}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const setId = `set-${workoutExerciseId}-1`;

    await tx.insert(workoutExercises).values({
      id: workoutExerciseId,
      workoutId: args.workoutId,
      exerciseId: args.exerciseId,
      exerciseOrder: nextOrder,
    });

    await tx.insert(sets).values({
      id: setId,
      workoutExerciseId,
      reps: 0,
      weight: 0,
      completed: false,
      timestamp,
    });

    return {
      exercise: {
        id: workoutExerciseId,
        workoutId: args.workoutId,
        exerciseId: args.exerciseId,
        exerciseOrder: nextOrder,
      },
      initialSet: {
        id: setId,
        reps: 0,
        weight: 0,
        completed: false,
        timestamp,
      },
    };
  });
}

export async function removeWorkoutExercise(args: {
  workoutId: string;
  workoutExerciseId: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(workoutExercises).where(eq(workoutExercises.id, args.workoutExerciseId));

    const remaining = await tx
      .select({ id: workoutExercises.id, exerciseOrder: workoutExercises.exerciseOrder })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, args.workoutId))
      .orderBy(asc(workoutExercises.exerciseOrder));

    for (let index = 0; index < remaining.length; index += 1) {
      const row = remaining[index];
      if (!row) {
        continue;
      }

      const nextOrder = index + 1;
      if (row.exerciseOrder !== nextOrder) {
        await tx
          .update(workoutExercises)
          .set({ exerciseOrder: nextOrder })
          .where(eq(workoutExercises.id, row.id));
      }
    }
  });
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

export async function updateWorkoutGym(args: {
  workoutId: string;
  gymId: string | null;
}): Promise<void> {
  await db
    .update(workouts)
    .set({
      gymId: args.gymId,
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

export async function softDeleteWorkout(workoutId: string): Promise<void> {
  await db
    .update(workouts)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(workouts.id, workoutId));
}

export async function updateCompletedWorkoutFromLogbook(args: {
  workoutId: string;
  duration: number | null;
  sets: {
    setId: string;
    reps: number;
    weight: number;
    completed: boolean;
  }[];
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(workouts)
      .set({
        duration: args.duration,
      })
      .where(eq(workouts.id, args.workoutId));

    for (const setRow of args.sets) {
      await tx
        .update(sets)
        .set({
          reps: setRow.reps,
          weight: setRow.weight,
          completed: setRow.completed,
        })
        .where(eq(sets.id, setRow.setId));
    }
  });
}

export async function saveWorkoutAsRoutine(args: {
  locale: AppLocale;
  routineName: string;
  exercises: {
    exerciseId: string;
    exerciseOrder: number;
    sets: {
      reps: number;
    }[];
  }[];
}): Promise<{ routineId: string }> {
  const routineId = `routine-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const trimmedName = args.routineName.trim();

  await db.transaction(async (tx) => {
    await tx.insert(routines).values({
      id: routineId,
      name: trimmedName,
      detail: null,
      description: null,
      isSystem: false,
      isFavorite: false,
      searchPt: args.locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
      searchEn: args.locale === "en-US" ? normalizeSearchText(trimmedName) : null,
      createdAt,
    });

    const routineExerciseRows = args.exercises
      .slice()
      .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
      .map((exercise, index) => {
        const setsTarget = exercise.sets.length > 0 ? exercise.sets.length : null;
        const repsValues = exercise.sets
          .map((set) => set.reps)
          .filter((reps) => Number.isFinite(reps) && reps > 0);
        const avgReps =
          repsValues.length > 0
            ? Math.round(repsValues.reduce((sum, reps) => sum + reps, 0) / repsValues.length)
            : null;

        return {
          id: `rte-${routineId}-${index + 1}`,
          routineId,
          exerciseId: exercise.exerciseId,
          exerciseOrder: exercise.exerciseOrder,
          setsTarget,
          repsTarget: avgReps !== null ? String(avgReps) : null,
        };
      });

    if (routineExerciseRows.length > 0) {
      await tx.insert(routineExercises).values(routineExerciseRows);
    }
  });

  return { routineId };
}
