import { db } from "@/db/client";
import { exercises } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { useCallback } from "react";

export function useExerciseMutations(reload: () => Promise<void>) {
  const deleteExercise = useCallback(
    async (id: string) => {
      await db.delete(exercises).where(and(eq(exercises.id, id), eq(exercises.isCustom, true)));
      await reload();
    },
    [reload],
  );

  return { deleteExercise };
}
