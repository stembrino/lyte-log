export const DEFAULT_ROUTINES = [
  {
    id: "routine-debug-01",
    name: "Debug Routine",
    detail: "Debug",
    description: "Default debug routine for development.",
    isSystem: true,
    labelPt: "Rotina Debug",
    labelEn: "Debug Routine",
    createdAt: "2026-04-10T00:00:00.000Z",
  },
  {
    id: "routine-debug-02",
    name: "Debug Routine 2",
    detail: "Debug",
    description: "Second default debug routine for development.",
    isSystem: true,
    labelPt: "Rotina Debug 2",
    labelEn: "Debug Routine 2",
    createdAt: "2026-04-10T00:01:00.000Z",
  },
] as const;

export const DEFAULT_ROUTINE_TAG_LINKS = [
  { routineId: "routine-debug-01", tagId: "rt-01" },
  { routineId: "routine-debug-01", tagId: "rt-10" },
  { routineId: "routine-debug-02", tagId: "rt-02" },
  { routineId: "routine-debug-02", tagId: "rt-08" },
] as const;

export const DEFAULT_ROUTINE_EXERCISES = [
  {
    id: "rte-debug-01",
    routineId: "routine-debug-01",
    exerciseId: "ex-08", // Lat Pulldown
    exerciseOrder: 1,
    setsTarget: 3,
    repsTarget: "10-12",
  },
  {
    id: "rte-debug-02",
    routineId: "routine-debug-01",
    exerciseId: "ex-09", // Seated Cable Row
    exerciseOrder: 2,
    setsTarget: 3,
    repsTarget: "10-12",
  },
  {
    id: "rte-debug-03",
    routineId: "routine-debug-02",
    exerciseId: "ex-01", // Bench Press
    exerciseOrder: 1,
    setsTarget: 3,
    repsTarget: "8-10",
  },
  {
    id: "rte-debug-04",
    routineId: "routine-debug-02",
    exerciseId: "ex-16", // Overhead Press
    exerciseOrder: 2,
    setsTarget: 3,
    repsTarget: "8-10",
  },
] as const;
