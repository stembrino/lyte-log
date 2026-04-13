/**
 * Default routine groups seeded on first launch.
 */
export const DEFAULT_ROUTINE_GROUPS = [
  {
    id: "rg-debug-01",
    name: "Debug Group",
    detail: "Debug",
    description: "Default debug routine group for development.",
    isSystem: true,
    labelPt: "Grupo Debug",
    labelEn: "Debug Group",
    createdAt: "2026-04-10T00:10:00.000Z",
  },
  {
    id: "rg-debug-02",
    name: "Debug Group 2",
    detail: "Debug",
    description: "Second default debug routine group for development.",
    isSystem: true,
    labelPt: "Grupo Debug 2",
    labelEn: "Debug Group 2",
    createdAt: "2026-04-10T00:11:00.000Z",
  },
] as const;

export const DEFAULT_ROUTINE_GROUP_ROUTINES = [
  {
    routineGroupId: "rg-debug-01",
    routineId: "routine-debug-01",
    position: 1,
    label: "Debug",
  },
  {
    routineGroupId: "rg-debug-02",
    routineId: "routine-debug-02",
    position: 1,
    label: "Debug 2",
  },
] as const;
