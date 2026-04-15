import { db } from "@/db/client";
import { gyms, workouts } from "@/db/schema";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

export const LOGBOOK_PAGE_SIZE = 20;

export type LogbookWorkoutItem = {
  id: string;
  date: string;
  createdAt: string;
  duration: number | null;
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

  return rows.map((row) => {
    const totalSets = row.workoutExercises.reduce((sum, workoutExercise) => {
      return sum + workoutExercise.sets.length;
    }, 0);

    const completedSets = row.workoutExercises.reduce((sum, workoutExercise) => {
      return sum + workoutExercise.sets.filter((set) => set.completed).length;
    }, 0);

    const setDetails = row.workoutExercises.flatMap((workoutExercise) => {
      return workoutExercise.sets.map((set, index) => ({
        id: set.id,
        exerciseName: workoutExercise.exercise.name,
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
          return setsSum + Math.max(0, set.reps) * Math.max(0, set.weight);
        }, 0)
      );
    }, 0);

    return {
      id: row.id,
      date: row.date,
      createdAt: row.createdAt,
      duration: row.duration,
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
