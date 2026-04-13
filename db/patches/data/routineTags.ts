/**
 * Default routine tags seeded on first launch.
 */
export const DEFAULT_ROUTINE_TAGS = [
  { id: "rt-01", slug: "machine", labelPt: "maquina", labelEn: "machine" },
  { id: "rt-02", slug: "upper", labelPt: "superior", labelEn: "upper" },
  { id: "rt-03", slug: "pull", labelPt: "puxar", labelEn: "pull" },
  { id: "rt-04", slug: "push", labelPt: "empurrar", labelEn: "push" },
  { id: "rt-05", slug: "legs", labelPt: "pernas", labelEn: "legs" },
  { id: "rt-06", slug: "core", labelPt: "core", labelEn: "core" },
  { id: "rt-07", slug: "strength", labelPt: "forca", labelEn: "strength" },
  {
    id: "rt-08",
    slug: "hypertrophy",
    labelPt: "hipertrofia",
    labelEn: "hypertrophy",
  },
  { id: "rt-09", slug: "beginner", labelPt: "iniciante", labelEn: "beginner" },
  {
    id: "rt-10",
    slug: "intermediate",
    labelPt: "intermediario",
    labelEn: "intermediate",
  },
] as const;
