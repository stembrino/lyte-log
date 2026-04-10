/**
 * Default exercise library seeded on first launch.
 * `i18nKey` maps to `exerciseLibrary.<key>` in translations.ts.
 * Custom exercises created by the user will have i18nKey = null and use `name` directly.
 */
export const DEFAULT_EXERCISES = [
  // Chest
  {
    id: "ex-01",
    name: "Bench Press",
    muscleGroup: "Chest",
    isCustom: false,
    i18nKey: "benchPress",
  },
  {
    id: "ex-02",
    name: "Incline Bench Press",
    muscleGroup: "Chest",
    isCustom: false,
    i18nKey: "inclineBenchPress",
  },
  {
    id: "ex-03",
    name: "Dumbbell Fly",
    muscleGroup: "Chest",
    isCustom: false,
    i18nKey: "dumbbellFly",
  },
  {
    id: "ex-04",
    name: "Push-Up",
    muscleGroup: "Chest",
    isCustom: false,
    i18nKey: "pushUp",
  },

  // Back
  {
    id: "ex-05",
    name: "Deadlift",
    muscleGroup: "Back",
    isCustom: false,
    i18nKey: "deadlift",
  },
  {
    id: "ex-06",
    name: "Pull-Up",
    muscleGroup: "Back",
    isCustom: false,
    i18nKey: "pullUp",
  },
  {
    id: "ex-07",
    name: "Barbell Row",
    muscleGroup: "Back",
    isCustom: false,
    i18nKey: "barbellRow",
  },
  {
    id: "ex-08",
    name: "Lat Pulldown",
    muscleGroup: "Back",
    isCustom: false,
    i18nKey: "latPulldown",
  },
  {
    id: "ex-09",
    name: "Seated Cable Row",
    muscleGroup: "Back",
    isCustom: false,
    i18nKey: "seatedCableRow",
  },

  // Legs
  {
    id: "ex-10",
    name: "Squat",
    muscleGroup: "Legs",
    isCustom: false,
    i18nKey: "squat",
  },
  {
    id: "ex-11",
    name: "Leg Press",
    muscleGroup: "Legs",
    isCustom: false,
    i18nKey: "legPress",
  },
  {
    id: "ex-12",
    name: "Romanian Deadlift",
    muscleGroup: "Legs",
    isCustom: false,
    i18nKey: "romanianDeadlift",
  },
  {
    id: "ex-13",
    name: "Leg Curl",
    muscleGroup: "Legs",
    isCustom: false,
    i18nKey: "legCurl",
  },
  {
    id: "ex-14",
    name: "Leg Extension",
    muscleGroup: "Legs",
    isCustom: false,
    i18nKey: "legExtension",
  },
  {
    id: "ex-15",
    name: "Calf Raise",
    muscleGroup: "Legs",
    isCustom: false,
    i18nKey: "calfRaise",
  },

  // Shoulders
  {
    id: "ex-16",
    name: "Overhead Press",
    muscleGroup: "Shoulders",
    isCustom: false,
    i18nKey: "overheadPress",
  },
  {
    id: "ex-17",
    name: "Lateral Raise",
    muscleGroup: "Shoulders",
    isCustom: false,
    i18nKey: "lateralRaise",
  },
  {
    id: "ex-18",
    name: "Front Raise",
    muscleGroup: "Shoulders",
    isCustom: false,
    i18nKey: "frontRaise",
  },
  {
    id: "ex-19",
    name: "Face Pull",
    muscleGroup: "Shoulders",
    isCustom: false,
    i18nKey: "facePull",
  },

  // Arms
  {
    id: "ex-20",
    name: "Barbell Curl",
    muscleGroup: "Arms",
    isCustom: false,
    i18nKey: "barbellCurl",
  },
  {
    id: "ex-21",
    name: "Hammer Curl",
    muscleGroup: "Arms",
    isCustom: false,
    i18nKey: "hammerCurl",
  },
  {
    id: "ex-22",
    name: "Tricep Dip",
    muscleGroup: "Arms",
    isCustom: false,
    i18nKey: "tricepDip",
  },
  {
    id: "ex-23",
    name: "Tricep Pushdown",
    muscleGroup: "Arms",
    isCustom: false,
    i18nKey: "tricepPushdown",
  },
  {
    id: "ex-24",
    name: "Skull Crusher",
    muscleGroup: "Arms",
    isCustom: false,
    i18nKey: "skullCrusher",
  },

  // Core
  {
    id: "ex-25",
    name: "Plank",
    muscleGroup: "Core",
    isCustom: false,
    i18nKey: "plank",
  },
  {
    id: "ex-26",
    name: "Crunch",
    muscleGroup: "Core",
    isCustom: false,
    i18nKey: "crunch",
  },
  {
    id: "ex-27",
    name: "Cable Crunch",
    muscleGroup: "Core",
    isCustom: false,
    i18nKey: "cableCrunch",
  },
  {
    id: "ex-28",
    name: "Hanging Leg Raise",
    muscleGroup: "Core",
    isCustom: false,
    i18nKey: "hangingLegRaise",
  },

  // Full Body
  {
    id: "ex-29",
    name: "Clean and Press",
    muscleGroup: "Full Body",
    isCustom: false,
    i18nKey: "cleanAndPress",
  },
  {
    id: "ex-30",
    name: "Kettlebell Swing",
    muscleGroup: "Full Body",
    isCustom: false,
    i18nKey: "kettlebellSwing",
  },
  {
    id: "ex-31",
    name: "Burpee",
    muscleGroup: "Full Body",
    isCustom: false,
    i18nKey: "burpee",
  },
  {
    id: "ex-32",
    name: "Thruster",
    muscleGroup: "Full Body",
    isCustom: false,
    i18nKey: "thruster",
  },
] as const;
