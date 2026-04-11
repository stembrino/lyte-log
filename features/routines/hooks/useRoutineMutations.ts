import type { AppLocale } from "@/constants/translations";
import { db } from "@/db/client";
import {
  entityTranslations,
  routineExercises,
  routineGroupRoutines,
  routineGroups,
  routines,
  routineTagLinks,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { useCallback } from "react";

export type RoutineSubmitPayload = {
  groupId: string | null;
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

export type GroupSubmitPayload = {
  name: string;
  detail?: string;
  description?: string;
  routineIds: string[];
};

type DbLike = Pick<typeof db, "insert" | "update" | "delete" | "select">;

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function upsertEntityTranslation(
  client: DbLike,
  args: {
    entityType: "routine" | "routine_group";
    entityId: string;
    field: "name" | "detail" | "description";
    locale: AppLocale;
    value: string;
    now: string;
  },
) {
  await client
    .insert(entityTranslations)
    .values({
      entityType: args.entityType,
      entityId: args.entityId,
      field: args.field,
      locale: args.locale,
      value: args.value,
      createdAt: args.now,
      updatedAt: args.now,
    })
    .onConflictDoUpdate({
      target: [
        entityTranslations.entityType,
        entityTranslations.entityId,
        entityTranslations.field,
        entityTranslations.locale,
      ],
      set: {
        value: args.value,
        updatedAt: args.now,
      },
    });
}

async function syncOptionalTranslation(
  client: DbLike,
  args: {
    entityType: "routine" | "routine_group";
    entityId: string;
    field: "detail" | "description";
    locale: AppLocale;
    value: string | null;
    now: string;
  },
) {
  if (args.value) {
    await upsertEntityTranslation(client, {
      entityType: args.entityType,
      entityId: args.entityId,
      field: args.field,
      locale: args.locale,
      value: args.value,
      now: args.now,
    });
    return;
  }

  await client
    .delete(entityTranslations)
    .where(
      and(
        eq(entityTranslations.entityType, args.entityType),
        eq(entityTranslations.entityId, args.entityId),
        eq(entityTranslations.field, args.field),
        eq(entityTranslations.locale, args.locale),
      ),
    );
}

export function useRoutineMutations(locale: AppLocale, reload: () => Promise<void>) {
  const createRoutine = useCallback(
    async (routineData: RoutineSubmitPayload) => {
      await db.transaction(async (tx) => {
        const routineId = `routine-${Date.now()}`;
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

        if (routineData.groupId !== null) {
          const currentLinks = await tx
            .select({ routineGroupId: routineGroupRoutines.routineGroupId })
            .from(routineGroupRoutines)
            .where(eq(routineGroupRoutines.routineGroupId, routineData.groupId));

          await tx.insert(routineGroupRoutines).values({
            routineGroupId: routineData.groupId,
            routineId,
            position: currentLinks.length + 1,
            label: null,
          });
        }

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

        await syncOptionalTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "detail",
          locale,
          value: trimmedDetail,
          now: createdAt,
        });

        await syncOptionalTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "description",
          locale,
          value: trimmedDescription,
          now: createdAt,
        });
      });

      await reload();
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

        await tx.delete(routineGroupRoutines).where(eq(routineGroupRoutines.routineId, routineId));

        if (routineData.groupId !== null) {
          const currentLinks = await tx
            .select({ routineGroupId: routineGroupRoutines.routineGroupId })
            .from(routineGroupRoutines)
            .where(eq(routineGroupRoutines.routineGroupId, routineData.groupId));

          await tx.insert(routineGroupRoutines).values({
            routineGroupId: routineData.groupId,
            routineId,
            position: currentLinks.length + 1,
            label: null,
          });
        }

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

        await syncOptionalTranslation(tx, {
          entityType: "routine",
          entityId: routineId,
          field: "detail",
          locale,
          value: trimmedDetail,
          now,
        });

        await syncOptionalTranslation(tx, {
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

  const createGroup = useCallback(
    async (groupData: GroupSubmitPayload) => {
      await db.transaction(async (tx) => {
        const groupId = `rg-${Date.now()}`;
        const createdAt = new Date().toISOString();
        const trimmedName = groupData.name.trim();
        const trimmedDetail = groupData.detail?.trim() || null;
        const trimmedDescription = groupData.description?.trim() || null;

        await tx.insert(routineGroups).values({
          id: groupId,
          name: trimmedName,
          detail: trimmedDetail,
          description: trimmedDescription,
          isSystem: false,
          isFavorite: false,
          searchPt: locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
          searchEn: locale === "en-US" ? normalizeSearchText(trimmedName) : null,
          createdAt,
        });

        await upsertEntityTranslation(tx, {
          entityType: "routine_group",
          entityId: groupId,
          field: "name",
          locale,
          value: trimmedName,
          now: createdAt,
        });

        await syncOptionalTranslation(tx, {
          entityType: "routine_group",
          entityId: groupId,
          field: "detail",
          locale,
          value: trimmedDetail,
          now: createdAt,
        });

        await syncOptionalTranslation(tx, {
          entityType: "routine_group",
          entityId: groupId,
          field: "description",
          locale,
          value: trimmedDescription,
          now: createdAt,
        });

        if (groupData.routineIds.length > 0) {
          await tx.insert(routineGroupRoutines).values(
            groupData.routineIds.map((routineId, index) => ({
              routineGroupId: groupId,
              routineId,
              position: index + 1,
              label: null,
            })),
          );
        }
      });

      await reload();
    },
    [locale, reload],
  );

  const updateGroup = useCallback(
    async (groupId: string, groupData: GroupSubmitPayload) => {
      await db.transaction(async (tx) => {
        const now = new Date().toISOString();
        const trimmedName = groupData.name.trim();
        const trimmedDetail = groupData.detail?.trim() || null;
        const trimmedDescription = groupData.description?.trim() || null;

        await tx
          .update(routineGroups)
          .set({
            name: trimmedName,
            detail: trimmedDetail,
            description: trimmedDescription,
            searchPt: locale === "pt-BR" ? normalizeSearchText(trimmedName) : null,
            searchEn: locale === "en-US" ? normalizeSearchText(trimmedName) : null,
          })
          .where(eq(routineGroups.id, groupId));

        await tx
          .delete(routineGroupRoutines)
          .where(eq(routineGroupRoutines.routineGroupId, groupId));

        if (groupData.routineIds.length > 0) {
          await tx.insert(routineGroupRoutines).values(
            groupData.routineIds.map((routineId, index) => ({
              routineGroupId: groupId,
              routineId,
              position: index + 1,
              label: null,
            })),
          );
        }

        await upsertEntityTranslation(tx, {
          entityType: "routine_group",
          entityId: groupId,
          field: "name",
          locale,
          value: trimmedName,
          now,
        });

        await syncOptionalTranslation(tx, {
          entityType: "routine_group",
          entityId: groupId,
          field: "detail",
          locale,
          value: trimmedDetail,
          now,
        });

        await syncOptionalTranslation(tx, {
          entityType: "routine_group",
          entityId: groupId,
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
        await tx.delete(routineGroupRoutines).where(eq(routineGroupRoutines.routineId, routineId));
        await tx.delete(routineTagLinks).where(eq(routineTagLinks.routineId, routineId));
        await tx.delete(routineExercises).where(eq(routineExercises.routineId, routineId));
        await tx
          .delete(entityTranslations)
          .where(
            and(
              eq(entityTranslations.entityType, "routine"),
              eq(entityTranslations.entityId, routineId),
            ),
          );
        await tx.delete(routines).where(eq(routines.id, routineId));
      });

      await reload();
    },
    [reload],
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await db.transaction(async (tx) => {
        await tx
          .delete(routineGroupRoutines)
          .where(eq(routineGroupRoutines.routineGroupId, groupId));
        await tx
          .delete(entityTranslations)
          .where(
            and(
              eq(entityTranslations.entityType, "routine_group"),
              eq(entityTranslations.entityId, groupId),
            ),
          );
        await tx.delete(routineGroups).where(eq(routineGroups.id, groupId));
      });

      await reload();
    },
    [reload],
  );

  return {
    createRoutine,
    updateRoutine,
    createGroup,
    updateGroup,
    deleteRoutine,
    deleteGroup,
  };
}
