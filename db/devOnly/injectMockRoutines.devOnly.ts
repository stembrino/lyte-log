import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { routineExercises, routines, routineTagLinks } from "@/db/schema";
import {
  DEV_MOCK_ROUTINE_EXERCISES,
  DEV_MOCK_ROUTINE_IDS,
  DEV_MOCK_ROUTINE_TAG_LINKS,
  DEV_MOCK_ROUTINES,
} from "./mockRoutines.devOnly";

export async function runDevOnlyInjectMockRoutines(database = db): Promise<void> {
  if (!__DEV__ || !FEATURE_FLAGS.devInjectMockRoutinesOnStart) {
    return;
  }

  console.log("[devOnly] runDevOnlyInjectMockRoutines: starting...");

  await database
    .delete(routineTagLinks)
    .where(inArray(routineTagLinks.routineId, [...DEV_MOCK_ROUTINE_IDS]));

  await database
    .delete(routineExercises)
    .where(inArray(routineExercises.routineId, [...DEV_MOCK_ROUTINE_IDS]));

  await database.delete(routines).where(inArray(routines.id, [...DEV_MOCK_ROUTINE_IDS]));

  await database.insert(routines).values(
    DEV_MOCK_ROUTINES.map((r) => ({
      id: r.id,
      name: r.name,
      detail: r.detail,
      description: r.description,
      isSystem: r.isSystem,
      createdAt: r.createdAt,
      ...buildRoutineSearchIndex(r),
    })),
  );

  await database.insert(routineTagLinks).values(DEV_MOCK_ROUTINE_TAG_LINKS.map((l) => ({ ...l })));

  await database.insert(routineExercises).values(DEV_MOCK_ROUTINE_EXERCISES.map((e) => ({ ...e })));

  console.log(
    `[devOnly] runDevOnlyInjectMockRoutines: done — ${DEV_MOCK_ROUTINES.length} routines inserted`,
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function buildRoutineSearchIndex(routine: { name: string; labelPt: string; labelEn: string }) {
  return {
    searchPt: normalizeSearchText(`${routine.labelPt} ${routine.name}`),
    searchEn: normalizeSearchText(`${routine.labelEn} ${routine.name}`),
  };
}
