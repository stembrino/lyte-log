import { db } from "@/db/client";
import { exercises } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { ExerciseLibraryItem } from "../queries/exerciseQueries";

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

export async function createCustomExercise(
  input: CreateExerciseInput,
): Promise<ExerciseLibraryItem> {
  const trimmedName = input.name.trim().toUpperCase();
  const trimmedMuscleGroup = input.muscleGroup.trim();
  const id = `ex-custom-${Date.now()}`;
  const normalizedName = trimmedName.toLowerCase();

  const existingExercise = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(sql`trim(lower(${exercises.name})) = ${normalizedName}`)
    .limit(1);

  if (existingExercise.length > 0) {
    throw new Error("duplicate_exercise");
  }

  const searchValue = normalizeSearchText(`${trimmedName} ${trimmedMuscleGroup}`);

  await db.insert(exercises).values({
    id,
    name: trimmedName,
    muscleGroup: trimmedMuscleGroup,
    isCustom: true,
    searchPt: searchValue,
    searchEn: searchValue,
  });

  return {
    id,
    name: trimmedName,
    muscleGroup: trimmedMuscleGroup,
    isCustom: true,
    imageUrl: null,
  };
}

export async function deleteCustomExercise(id: string): Promise<void> {
  await db.delete(exercises).where(and(eq(exercises.id, id), eq(exercises.isCustom, true)));
}
