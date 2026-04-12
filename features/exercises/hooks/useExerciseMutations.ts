import { db } from "@/db/client";
import { exercises } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { useCallback } from "react";

export type CreateExerciseInput = {
  name: string;
  muscleGroup: string;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function useExerciseMutations(reload: () => Promise<void>) {
  const createExercise = useCallback(
    async (input: CreateExerciseInput) => {
      const trimmedName = input.name.trim();
      const trimmedMuscleGroup = input.muscleGroup.trim();

      const existingExercise = await db
        .select({ id: exercises.id })
        .from(exercises)
        .where(eq(exercises.name, trimmedName))
        .limit(1);

      if (existingExercise.length > 0) {
        throw new Error("duplicate_exercise");
      }

      const searchValue = normalizeSearchText(`${trimmedName} ${trimmedMuscleGroup}`);

      await db.insert(exercises).values({
        id: `ex-custom-${Date.now()}`,
        name: trimmedName,
        muscleGroup: trimmedMuscleGroup,
        isCustom: true,
        searchPt: searchValue,
        searchEn: searchValue,
      });

      await reload();
    },
    [reload],
  );

  const deleteExercise = useCallback(
    async (id: string) => {
      await db.delete(exercises).where(and(eq(exercises.id, id), eq(exercises.isCustom, true)));
      await reload();
    },
    [reload],
  );

  return { createExercise, deleteExercise };
}
