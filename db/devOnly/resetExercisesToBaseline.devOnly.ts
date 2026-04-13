import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { DEFAULT_EXERCISES } from "@/db/patches/data/exercises";
import type { SQLiteDatabase } from "expo-sqlite";

export function runDevOnlyResetExercisesToBaseline(database: SQLiteDatabase, source: string): void {
  if (!__DEV__ || !FEATURE_FLAGS.devResetCustomExercisesOnStart) {
    return;
  }

  try {
    const baselineIdsSql = DEFAULT_EXERCISES.map(
      (exercise) => `'${escapeSqlValue(exercise.id)}'`,
    ).join(", ");

    if (!baselineIdsSql) {
      return;
    }

    const seedSyncSql = DEFAULT_EXERCISES.map((exercise) => {
      const id = escapeSqlValue(exercise.id);
      const name = escapeSqlValue(exercise.name);
      const muscleGroup = escapeSqlValue(exercise.muscleGroup);
      const searchPt = escapeSqlValue(normalizeSearchText(`${exercise.labelPt} ${exercise.name}`));
      const searchEn = escapeSqlValue(normalizeSearchText(`${exercise.labelEn} ${exercise.name}`));

      return `
        INSERT OR IGNORE INTO exercises (id, name, muscle_group, is_custom, search_pt, search_en)
        VALUES ('${id}', '${name}', '${muscleGroup}', 0, '${searchPt}', '${searchEn}');
        UPDATE exercises
        SET
          name = '${name}',
          muscle_group = '${muscleGroup}',
          is_custom = 0,
          search_pt = '${searchPt}',
          search_en = '${searchEn}'
        WHERE id = '${id}';
      `;
    }).join("\n");

    database.execSync(`
      BEGIN TRANSACTION;
      DELETE FROM routine_exercises
      WHERE exercise_id NOT IN (${baselineIdsSql});
      DELETE FROM workout_exercises
      WHERE exercise_id NOT IN (${baselineIdsSql});
      DELETE FROM exercises WHERE id NOT IN (${baselineIdsSql});
      ${seedSyncSql}
      COMMIT;
    `);

    console.log(
      `DEV [${source}] Dev-only exercises reset to baseline (${DEFAULT_EXERCISES.length}).`,
    );
  } catch {
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
