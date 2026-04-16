import type { AppLocale } from "@/constants/translations";
import { db } from "@/db/client";
import { entityTranslations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type {
  TranslationEntityType,
  TranslationField,
} from "@/features/translations/dao/queries/translationQueries";

type TranslationWriteClient = Pick<typeof db, "insert" | "delete">;

export async function upsertEntityTranslation(
  client: TranslationWriteClient,
  args: {
    entityType: TranslationEntityType;
    entityId: string;
    field: TranslationField;
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

export async function syncOptionalEntityTranslation(
  client: TranslationWriteClient,
  args: {
    entityType: TranslationEntityType;
    entityId: string;
    field: TranslationField;
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

export async function deleteEntityTranslationsByEntity(
  client: TranslationWriteClient,
  args: {
    entityType: TranslationEntityType;
    entityId: string;
  },
) {
  await client
    .delete(entityTranslations)
    .where(
      and(
        eq(entityTranslations.entityType, args.entityType),
        eq(entityTranslations.entityId, args.entityId),
      ),
    );
}
