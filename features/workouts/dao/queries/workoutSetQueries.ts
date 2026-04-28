import { db } from "@/db/client";
import { gyms, sets, workoutExercises, workouts } from "@/db/schema";
import { and, asc, desc, eq, isNull, ne } from "drizzle-orm";

export type ExerciseHistorySetSnapshot = {
  id: string;
  setOrder: number;
  reps: number;
  weight: number;
  completed: boolean;
};

export type LastCompletedExerciseSnapshot = {
  exerciseId: string;
  workoutId: string;
  workoutDate: string;
  gymName: string | null;
  sets: ExerciseHistorySetSnapshot[];
  bestSet: {
    weight: number;
    reps: number;
  } | null;
  totalVolume: number;
};

export type HeaviestCompletedExerciseSetSnapshot = {
  exerciseId: string;
  workoutId: string;
  workoutDate: string;
  gymName: string | null;
  set: {
    id: string;
    reps: number;
    weight: number;
  };
};

export async function getLastCompletedExerciseSnapshot(args: {
  exerciseId: string;
  excludeWorkoutId?: string;
  gymId?: string | null;
}): Promise<LastCompletedExerciseSnapshot | null> {
  const { exerciseId, excludeWorkoutId, gymId } = args;

  const whereClauses = [
    eq(workoutExercises.exerciseId, exerciseId),
    eq(workouts.status, "completed"),
    isNull(workouts.deletedAt),
  ];

  if (excludeWorkoutId) {
    whereClauses.push(ne(workouts.id, excludeWorkoutId));
  }

  if (gymId === null) {
    whereClauses.push(isNull(workouts.gymId));
  } else if (gymId !== undefined) {
    whereClauses.push(eq(workouts.gymId, gymId));
  }

  const [latestWorkout] = await db
    .select({
      workoutId: workouts.id,
      workoutDate: workouts.date,
      gymName: gyms.name,
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .leftJoin(gyms, eq(gyms.id, workouts.gymId))
    .where(and(...whereClauses))
    .orderBy(desc(workouts.date), desc(workouts.createdAt))
    .limit(1);

  if (!latestWorkout) {
    return null;
  }

  const setRows = await db
    .select({
      id: sets.id,
      reps: sets.reps,
      weight: sets.weight,
      completed: sets.completed,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .where(
      and(
        eq(workoutExercises.workoutId, latestWorkout.workoutId),
        eq(workoutExercises.exerciseId, exerciseId),
      ),
    )
    .orderBy(asc(sets.timestamp));

  const mappedSets: ExerciseHistorySetSnapshot[] = setRows.map((setRow, index) => ({
    id: setRow.id,
    setOrder: index + 1,
    reps: setRow.reps,
    weight: setRow.weight,
    completed: setRow.completed,
  }));

  const bestSetRow = mappedSets.reduce<ExerciseHistorySetSnapshot | null>((best, current) => {
    if (!best) {
      return current;
    }

    if (current.weight > best.weight) {
      return current;
    }

    if (current.weight === best.weight && current.reps > best.reps) {
      return current;
    }

    return best;
  }, null);

  const totalVolume = mappedSets.reduce((sum, setRow) => {
    if (!setRow.completed) {
      return sum;
    }

    return sum + Math.max(0, setRow.reps) * Math.max(0, setRow.weight);
  }, 0);

  return {
    exerciseId,
    workoutId: latestWorkout.workoutId,
    workoutDate: latestWorkout.workoutDate,
    gymName: latestWorkout.gymName ?? null,
    sets: mappedSets,
    bestSet: bestSetRow
      ? {
          weight: bestSetRow.weight,
          reps: bestSetRow.reps,
        }
      : null,
    totalVolume,
  };
}

export async function getHeaviestCompletedExerciseSetSnapshot(args: {
  exerciseId: string;
  excludeWorkoutId?: string;
  gymId?: string | null;
}): Promise<HeaviestCompletedExerciseSetSnapshot | null> {
  const { exerciseId, excludeWorkoutId, gymId } = args;

  const whereClauses = [
    eq(workoutExercises.exerciseId, exerciseId),
    eq(workouts.status, "completed"),
    isNull(workouts.deletedAt),
    eq(sets.completed, true),
  ];

  if (excludeWorkoutId) {
    whereClauses.push(ne(workouts.id, excludeWorkoutId));
  }

  if (gymId === null) {
    whereClauses.push(isNull(workouts.gymId));
  } else if (gymId !== undefined) {
    whereClauses.push(eq(workouts.gymId, gymId));
  }

  const [row] = await db
    .select({
      setId: sets.id,
      reps: sets.reps,
      weight: sets.weight,
      workoutId: workouts.id,
      workoutDate: workouts.date,
      gymName: gyms.name,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .leftJoin(gyms, eq(gyms.id, workouts.gymId))
    .where(and(...whereClauses))
    .orderBy(
      desc(sets.weight),
      desc(sets.reps),
      desc(workouts.date),
      desc(workouts.createdAt),
      desc(sets.timestamp),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    exerciseId,
    workoutId: row.workoutId,
    workoutDate: row.workoutDate,
    gymName: row.gymName ?? null,
    set: {
      id: row.setId,
      reps: row.reps,
      weight: row.weight,
    },
  };
}

export async function getCompletedExerciseSnapshotByWorkoutId(args: {
  exerciseId: string;
  workoutId: string;
}): Promise<LastCompletedExerciseSnapshot | null> {
  const { exerciseId, workoutId } = args;

  const [workoutRow] = await db
    .select({
      workoutId: workouts.id,
      workoutDate: workouts.date,
      gymName: gyms.name,
    })
    .from(workouts)
    .leftJoin(gyms, eq(gyms.id, workouts.gymId))
    .where(
      and(eq(workouts.id, workoutId), eq(workouts.status, "completed"), isNull(workouts.deletedAt)),
    )
    .limit(1);

  if (!workoutRow) {
    return null;
  }

  const setRows = await db
    .select({
      id: sets.id,
      reps: sets.reps,
      weight: sets.weight,
      completed: sets.completed,
    })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .where(
      and(eq(workoutExercises.workoutId, workoutId), eq(workoutExercises.exerciseId, exerciseId)),
    )
    .orderBy(asc(sets.timestamp));

  const mappedSets: ExerciseHistorySetSnapshot[] = setRows.map((setRow, index) => ({
    id: setRow.id,
    setOrder: index + 1,
    reps: setRow.reps,
    weight: setRow.weight,
    completed: setRow.completed,
  }));

  const bestSetRow = mappedSets.reduce<ExerciseHistorySetSnapshot | null>((best, current) => {
    if (!best) {
      return current;
    }

    if (current.weight > best.weight) {
      return current;
    }

    if (current.weight === best.weight && current.reps > best.reps) {
      return current;
    }

    return best;
  }, null);

  const totalVolume = mappedSets.reduce((sum, setRow) => {
    if (!setRow.completed) {
      return sum;
    }

    return sum + Math.max(0, setRow.reps) * Math.max(0, setRow.weight);
  }, 0);

  return {
    exerciseId,
    workoutId: workoutRow.workoutId,
    workoutDate: workoutRow.workoutDate,
    gymName: workoutRow.gymName ?? null,
    sets: mappedSets,
    bestSet: bestSetRow
      ? {
          weight: bestSetRow.weight,
          reps: bestSetRow.reps,
        }
      : null,
    totalVolume,
  };
}
