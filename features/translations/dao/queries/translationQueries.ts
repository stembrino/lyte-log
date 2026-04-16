import type { AppLocale } from "@/constants/translations";
import { db } from "@/db/client";
import { entityTranslations } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export type TranslationEntityType = "routine" | "routine_group" | "exercise";
export type TranslationField = "name" | "detail" | "description";

export function buildTranslationKey(
  entityType: TranslationEntityType,
  entityId: string,
  field: TranslationField,
): string {
  return `${entityType}:${entityId}:${field}`;
}

export async function getEntityFieldTranslationsMap(args: {
  locale: AppLocale;
  entityType: TranslationEntityType;
  field: TranslationField;
  entityIds: string[];
}): Promise<Map<string, string>> {
  const uniqueEntityIds = Array.from(new Set(args.entityIds));

  if (uniqueEntityIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      entityId: entityTranslations.entityId,
      value: entityTranslations.value,
    })
    .from(entityTranslations)
    .where(
      and(
        eq(entityTranslations.locale, args.locale),
        eq(entityTranslations.entityType, args.entityType),
        eq(entityTranslations.field, args.field),
        inArray(entityTranslations.entityId, uniqueEntityIds),
      ),
    );

  return new Map(rows.map((row) => [row.entityId, row.value]));
}

export async function getTranslationsMap(args: {
  locale: AppLocale;
  entityTypes: TranslationEntityType[];
  fields: TranslationField[];
  entityIds: string[];
}): Promise<Map<string, string>> {
  const uniqueEntityTypes = Array.from(new Set(args.entityTypes));
  const uniqueFields = Array.from(new Set(args.fields));
  const uniqueEntityIds = Array.from(new Set(args.entityIds));

  if (uniqueEntityTypes.length === 0 || uniqueFields.length === 0 || uniqueEntityIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      entityType: entityTranslations.entityType,
      entityId: entityTranslations.entityId,
      field: entityTranslations.field,
      value: entityTranslations.value,
    })
    .from(entityTranslations)
    .where(
      and(
        eq(entityTranslations.locale, args.locale),
        inArray(entityTranslations.entityType, uniqueEntityTypes),
        inArray(entityTranslations.field, uniqueFields),
        inArray(entityTranslations.entityId, uniqueEntityIds),
      ),
    );

  return new Map(
    rows.map((row) => [
      buildTranslationKey(
        row.entityType as TranslationEntityType,
        row.entityId,
        row.field as TranslationField,
      ),
      row.value,
    ]),
  );
}
