export const DEFAULT_ROUTINES = [
  {
    id: "routine-01", // Pull Upper (Machine Focus)
    name: "Pull Upper (Machine Focus)",
    estimatedDurationMin: 50,
    isSystem: true,
    i18nKey: "pullUpperMachine",
    labelPt: "Pull Superior (Foco em Maquinas)",
    labelEn: "Pull Upper (Machine Focus)",
    createdAt: "2026-04-10T00:00:00.000Z",
  },
] as const;

export const DEFAULT_ROUTINE_TAG_LINKS = [
  { routineId: "routine-01", tagId: "rt-01" }, // routine: Pull Upper (Machine Focus), tag: machine
  { routineId: "routine-01", tagId: "rt-02" }, // routine: Pull Upper (Machine Focus), tag: upper
  { routineId: "routine-01", tagId: "rt-03" }, // routine: Pull Upper (Machine Focus), tag: pull
  { routineId: "routine-01", tagId: "rt-08" }, // routine: Pull Upper (Machine Focus), tag: hypertrophy
  { routineId: "routine-01", tagId: "rt-10" }, // routine: Pull Upper (Machine Focus), tag: intermediate
] as const;

export const DEFAULT_ROUTINE_EXERCISES = [
  {
    id: "rte-01",
    routineId: "routine-01", // Pull Upper (Machine Focus)
    exerciseId: "ex-08", // Lat Pulldown
    exerciseOrder: 1,
    setsTarget: 4,
    repsTarget: "8-12",
  },
  {
    id: "rte-02",
    routineId: "routine-01", // Pull Upper (Machine Focus)
    exerciseId: "ex-09", // Seated Cable Row
    exerciseOrder: 2,
    setsTarget: 4,
    repsTarget: "8-12",
  },
  {
    id: "rte-03",
    routineId: "routine-01", // Pull Upper (Machine Focus)
    exerciseId: "ex-19", // Face Pull
    exerciseOrder: 3,
    setsTarget: 3,
    repsTarget: "12-15",
  },
  {
    id: "rte-04",
    routineId: "routine-01", // Pull Upper (Machine Focus)
    exerciseId: "ex-21", // Hammer Curl
    exerciseOrder: 4,
    setsTarget: 3,
    repsTarget: "10-12",
  },
] as const;
