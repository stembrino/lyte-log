import type { AppLocale } from "@/constants/translations";
import { db } from "@/db/client";
import { routineExercises, routines, routineTagLinks } from "@/db/schema";
import {
  deleteEntityTranslationsByEntity,
  syncOptionalEntityTranslation,
  upsertEntityTranslation,
} from "@/features/translations/dao/mutations/translationMutations";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

export type RoutineSubmitPayload = {
  name: string;
  detail?: string;
  description?: string;
  tagIds: string[];
  exercises: {
    exerciseId: string;
    exerciseOrder: number;
    setsTarget?: number;
    repsTarget?: number;
  }[];
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function useRoutineMutations(locale: AppLocale, reload: () => Promise<void>) {
  const createRoutine = useCallback(
    async (routineData: RoutineSubmitPayload) => {
      const routineId = `routine-${Date.now()}`;

      await db.transaction(async (tx) => {
        const createdAt = new Date().toISOString();

        const trimmedName = routineData.name.trim();
        const trimmedDetail = routineData.detail?.trim() || null;
        const trimmedDescription = routineData.description?.trim() || null;

        await tx.insert(routines).values({
          id: routineId,
          name: trimmedName,
          detail: trimmedDetail,
          description: trimmedDescription,
          isSystem: false,
          isFavorite: false,
          searchPt: locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
          searchEn: locale === "en-US" ? normalizeSearchText(trimmedName) : null,
          createdAt,
        });

        if (routineData.tagIds.length > 0) {
          await tx.insert(routineTagLinks).values(
            routineData.tagIds.map((tagId) => ({
              routineId,
              tagId,
            })),
          );
        }

        if (routineData.exercises.length > 0) {
          await tx.insert(routineExercises).values(
            routineData.exercises.map((exercise, index) => ({
              id: `rte-${routineId}-${index + 1}`,
              routineId,
              exerciseId: exercise.exerciseId,
              exerciseOrder: exercise.exerciseOrder,
              setsTarget: exercise.setsTarget ?? null,
              repsTarget: exercise.repsTarget?.toString() ?? null,
            })),
          );
        }

        await upsertEntityTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "name",
          locale,
          value: trimmedName,
          now: createdAt,
        });

        await syncOptionalEntityTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "detail",
          locale,
          value: trimmedDetail,
          now: createdAt,
        });

        await syncOptionalEntityTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "description",
          locale,
          value: trimmedDescription,
          now: createdAt,
        });
      });

      await reload();

      return routineId;
    },
    [locale, reload],
  );

  const updateRoutine = useCallback(
    async (routineId: string, routineData: RoutineSubmitPayload) => {
      await db.transaction(async (tx) => {
        const now = new Date().toISOString();
        const trimmedName = routineData.name.trim();
        const trimmedDetail = routineData.detail?.trim() || null;
        const trimmedDescription = routineData.description?.trim() || null;

        await tx
          .update(routines)
          .set({
            name: trimmedName,
            detail: trimmedDetail,
            description: trimmedDescription,
            searchPt: locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
            searchEn: locale === "en-US" ? normalizeSearchText(trimmedName) : null,
          })
          .where(eq(routines.id, routineId));

        await tx.delete(routineTagLinks).where(eq(routineTagLinks.routineId, routineId));
        if (routineData.tagIds.length > 0) {
          await tx.insert(routineTagLinks).values(
            routineData.tagIds.map((tagId) => ({
              routineId,
              tagId,
            })),
          );
        }

        await tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId));
        if (routineData.exercises.length > 0) {
          await tx.insert(routineExercises).values(
            routineData.exercises.map((exercise, index) => ({
              id: `rte-${routineId}-${index + 1}`,
              routineId,
              exerciseId: exercise.exerciseId,
              exerciseOrder: exercise.exerciseOrder,
              setsTarget: exercise.setsTarget ?? null,
              repsTarget: exercise.repsTarget?.toString() ?? null,
            })),
          );
        }

        await upsertEntityTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "name",
          locale,
          value: trimmedName,
          now,
        });

        await syncOptionalEntityTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "detail",
          locale,
          value: trimmedDetail,
          now,
        });

        await syncOptionalEntityTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "description",
          locale,
          value: trimmedDescription,
          now,
        });
      });

      await reload();
    },
    [locale, reload],
  );

  const deleteRoutine = useCallback(
    async (routineId: string) => {
      await db.transaction(async (tx) => {
        await tx.delete(routineTagLinks).where(eq(routineTagLinks.routineId, routineId));
        await tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId));
        await deleteEntityTranslationsByEntity(tx, {
          entityType: "routine",
          entityId: routineId,
        });
        await tx.delete(routines).where(eq(routines.id, routineId));
      });

      await reload();
    },
    [reload],
  );

  return {
    createRoutine,
    updateRoutine,
    deleteRoutine,
  };
}
