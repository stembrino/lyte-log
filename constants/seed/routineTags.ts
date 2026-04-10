/**
 * Default routine tags seeded on first launch.
 */
export const DEFAULT_ROUTINE_TAGS = [
  { id: "rt-01", slug: "machine", i18nKey: "machine", labelPt: "maquina", labelEn: "machine" },
  { id: "rt-02", slug: "upper", i18nKey: "upper", labelPt: "superior", labelEn: "upper" },
  { id: "rt-03", slug: "pull", i18nKey: "pull", labelPt: "puxar", labelEn: "pull" },
  { id: "rt-04", slug: "push", i18nKey: "push", labelPt: "empurrar", labelEn: "push" },
  { id: "rt-05", slug: "legs", i18nKey: "legs", labelPt: "pernas", labelEn: "legs" },
  { id: "rt-06", slug: "core", i18nKey: "core", labelPt: "core", labelEn: "core" },
  { id: "rt-07", slug: "strength", i18nKey: "strength", labelPt: "forca", labelEn: "strength" },
  {
    id: "rt-08",
    slug: "hypertrophy",
    i18nKey: "hypertrophy",
    labelPt: "hipertrofia",
    labelEn: "hypertrophy",
  },
  { id: "rt-09", slug: "beginner", i18nKey: "beginner", labelPt: "iniciante", labelEn: "beginner" },
  {
    id: "rt-10",
    slug: "intermediate",
    i18nKey: "intermediate",
    labelPt: "intermediario",
    labelEn: "intermediate",
  },
] as const;
