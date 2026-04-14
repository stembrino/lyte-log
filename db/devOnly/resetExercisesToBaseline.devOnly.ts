import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { DEFAULT_EXERCISES } from "@/db/patches/data/exercises";
import type { SQLiteDatabase } from "expo-sqlite";

export function runDevOnlyResetExercisesToBaseline(database: SQLiteDatabase, source: string): void {
  if (!__DEV__ || !FEATURE_FLAGS.devResetCustomExercisesOnStart) {
    return;
  }

  try {
    const beforeCount = getExercisesCount(database);
    const hasImageUrlColumn = hasExercisesImageUrlColumn(database);
    console.log(
      `DEV [${source}] reset start (baseline=${DEFAULT_EXERCISES.length}, before=${beforeCount}, image_url=${hasImageUrlColumn}).`,
    );

    const baselineIdsSql = DEFAULT_EXERCISES.map(
      (exercise) => `'${escapeSqlValue(exercise.id)}'`,
    ).join(", ");

    if (!baselineIdsSql) {
      console.log(`DEV [${source}] reset skipped: no baseline ids.`);
      return;
    }

    const seedSyncSql = DEFAULT_EXERCISES.map((exercise) => {
      const id = escapeSqlValue(exercise.id);
      const name = escapeSqlValue(exercise.name);
      const muscleGroup = escapeSqlValue(exercise.muscleGroup);
      const searchPt = escapeSqlValue(normalizeSearchText(`${exercise.labelPt} ${exercise.name}`));
      const searchEn = escapeSqlValue(normalizeSearchText(`${exercise.labelEn} ${exercise.name}`));
      const imageUrl = exercise.imageUrl ? `'${escapeSqlValue(exercise.imageUrl)}'` : "NULL";

      const insertSql = hasImageUrlColumn
        ? `INSERT OR IGNORE INTO exercises (id, name, muscle_group, is_custom, search_pt, search_en, image_url)
        VALUES ('${id}', '${name}', '${muscleGroup}', 0, '${searchPt}', '${searchEn}', ${imageUrl});`
        : `INSERT OR IGNORE INTO exercises (id, name, muscle_group, is_custom, search_pt, search_en)
        VALUES ('${id}', '${name}', '${muscleGroup}', 0, '${searchPt}', '${searchEn}');`;

      const updateSql = hasImageUrlColumn
        ? `
        UPDATE exercises
        SET
          name = '${name}',
          muscle_group = '${muscleGroup}',
          is_custom = 0,
          search_pt = '${searchPt}',
          search_en = '${searchEn}',
          image_url = ${imageUrl}
        WHERE id = '${id}';
      `
        : `
        UPDATE exercises
        SET
          name = '${name}',
          muscle_group = '${muscleGroup}',
          is_custom = 0,
          search_pt = '${searchPt}',
          search_en = '${searchEn}'
        WHERE id = '${id}';
      `;

      return `
        ${insertSql}
        ${updateSql}
      `;
    }).join("\n");

    const translationSyncSql = DEFAULT_EXERCISES.map((exercise) => {
      const id = escapeSqlValue(exercise.id);
      const labelPt = escapeSqlValue(exercise.labelPt);
      const labelEn = escapeSqlValue(exercise.labelEn);

      return `
        INSERT OR REPLACE INTO entity_translations
          (entity_type, entity_id, field, locale, value, created_at, updated_at)
        VALUES
          ('exercise', '${id}', 'name', 'pt-BR', '${labelPt}', datetime('now'), datetime('now')),
          ('exercise', '${id}', 'name', 'en-US', '${labelEn}', datetime('now'), datetime('now'));
      `;
    }).join("\n");

    database.execSync(`
      BEGIN TRANSACTION;
      DELETE FROM routine_exercises
      WHERE exercise_id NOT IN (${baselineIdsSql});
      DELETE FROM workout_exercises
      WHERE exercise_id NOT IN (${baselineIdsSql});
      DELETE FROM entity_translations
      WHERE entity_type = 'exercise'
        AND entity_id NOT IN (${baselineIdsSql});
      DELETE FROM exercises WHERE id NOT IN (${baselineIdsSql});
      ${seedSyncSql}
      ${translationSyncSql}
      COMMIT;
    `);

    const afterCount = getExercisesCount(database);

    console.log(
      `DEV [${source}] reset done (after=${afterCount}, baseline=${DEFAULT_EXERCISES.length}).`,
    );
  } catch (error) {
    console.error(`DEV [${source}] reset failed.`, error);

    try {
      database.execSync("ROLLBACK;");
    } catch {
      // no-op
    }
  }
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeSqlValue(value: string): string {
  return value.replace(/'/g, "''");
}

function getExercisesCount(database: SQLiteDatabase): number {
  try {
    const rows = (database as any).getAllSync("SELECT COUNT(*) as count FROM exercises;") as {
      count: number;
    }[];
    return rows[0]?.count ?? -1;
  } catch {
    return -1;
  }
}

function hasExercisesImageUrlColumn(database: SQLiteDatabase): boolean {
  try {
    const rows = (database as any).getAllSync("PRAGMA table_info(exercises);") as {
      name: string;
    }[];
    return rows.some((row) => row.name === "image_url");
  } catch {
    return false;
  }
}
