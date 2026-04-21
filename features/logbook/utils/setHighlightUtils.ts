import type { LogbookWorkoutItem } from "@/features/logbook/dao/queries/logbookQueries";

/**
 * Identifies the best set for each exercise based on weight and reps.
 *
 * Logic:
 * 1. Find the set with the maximum weight for each exercise
 * 2. If multiple sets have the same weight, pick the one with most reps
 * 3. If weight and reps are identical, pick the LAST occurrence (user was more fatigued)
 *
 * @param setDetails - Array of set details from a workout
 * @returns Set of set IDs that should be highlighted
 */
export function getHighlightedSetIds(setDetails: LogbookWorkoutItem["setDetails"]): Set<string> {
  const maxSetByExercise = new Map<string, { id: string; weight: number; reps: number }>();

  setDetails.forEach((set) => {
    const current = maxSetByExercise.get(set.exerciseName);
    if (
      !current ||
      set.weight > current.weight ||
      (set.weight === current.weight && set.reps >= current.reps)
    ) {
      maxSetByExercise.set(set.exerciseName, {
        id: set.id,
        weight: set.weight,
        reps: set.reps,
      });
    }
  });

  return new Set(Array.from(maxSetByExercise.values()).map((v) => v.id));
}
