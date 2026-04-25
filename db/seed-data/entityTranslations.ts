import { DEFAULT_EXERCISES } from "@/db/patches/data/exercises";
import { DEFAULT_MUSCLE_GROUPS } from "@/db/patches/data/muscleGroups";
import { DEFAULT_ROUTINES } from "@/db/patches/data/routines";
import { DEFAULT_ROUTINE_TAGS } from "@/db/patches/data/routineTags";

/**
 * Seed source for entity_translations.
 * Keep this independent from constants/translations.ts.
 */

type SeedEntityType = "exercise" | "muscle_group" | "routine" | "routine_tag";
type SeedField = "name" | "detail" | "description";
type SeedLocale = "pt-BR" | "en-US";

type TranslationRow = {
  entityType: SeedEntityType;
  entityId: string;
  field: SeedField;
  locale: SeedLocale;
  value: string;
  createdAt: string;
  updatedAt: string;
};

function makeRows(args: {
  entityType: SeedEntityType;
  entityId: string;
  namePt: string;
  nameEn: string;
  detailPt?: string | null;
  detailEn?: string | null;
  descriptionPt?: string | null;
  descriptionEn?: string | null;
  createdAt: string;
}): TranslationRow[] {
  const rows: TranslationRow[] = [
    {
      entityType: args.entityType,
      entityId: args.entityId,
      field: "name",
      locale: "pt-BR",
      value: args.namePt,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
    },
    {
      entityType: args.entityType,
      entityId: args.entityId,
      field: "name",
      locale: "en-US",
      value: args.nameEn,
      createdAt: args.createdAt,
      updatedAt: args.createdAt,
    },
  ];

  if (args.detailPt && args.detailEn) {
    rows.push(
      {
        entityType: args.entityType,
        entityId: args.entityId,
        field: "detail",
        locale: "pt-BR",
        value: args.detailPt,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
      },
      {
        entityType: args.entityType,
        entityId: args.entityId,
        field: "detail",
        locale: "en-US",
        value: args.detailEn,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
      },
    );
  }

  if (args.descriptionPt && args.descriptionEn) {
    rows.push(
      {
        entityType: args.entityType,
        entityId: args.entityId,
        field: "description",
        locale: "pt-BR",
        value: args.descriptionPt,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
      },
      {
        entityType: args.entityType,
        entityId: args.entityId,
        field: "description",
        locale: "en-US",
        value: args.descriptionEn,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
      },
    );
  }

  return rows;
}

const STATIC_CREATED_AT = new Date().toISOString();

const exerciseRows = DEFAULT_EXERCISES.flatMap((exercise) =>
  makeRows({
    entityType: "exercise",
    entityId: exercise.id,
    namePt: exercise.labelPt,
    nameEn: exercise.labelEn,
    createdAt: STATIC_CREATED_AT,
  }),
);

const muscleGroupRows = DEFAULT_MUSCLE_GROUPS.flatMap((group) =>
  makeRows({
    entityType: "muscle_group",
    entityId: group.id,
    namePt: group.labelPt,
    nameEn: group.labelEn,
    createdAt: STATIC_CREATED_AT,
  }),
);

const routineRows = (
  DEFAULT_ROUTINES as readonly {
    id: string;
    labelPt: string;
    labelEn: string;
    detail?: string | null;
    description?: string | null;
    createdAt: string;
  }[]
).flatMap((routine) =>
  makeRows({
    entityType: "routine",
    entityId: routine.id,
    namePt: routine.labelPt,
    nameEn: routine.labelEn,
    detailPt: routine.detail,
    detailEn: routine.detail,
    descriptionPt: routine.description,
    descriptionEn: routine.description,
    createdAt: routine.createdAt,
  }),
);

const routineTagRows = DEFAULT_ROUTINE_TAGS.flatMap((tag) =>
  makeRows({
    entityType: "routine_tag",
    entityId: tag.id,
    namePt: tag.labelPt,
    nameEn: tag.labelEn,
    createdAt: STATIC_CREATED_AT,
  }),
);

export const DEFAULT_ENTITY_TRANSLATIONS = [
  ...exerciseRows,
  ...muscleGroupRows,
  ...routineRows,
  ...routineTagRows,
] as const;
