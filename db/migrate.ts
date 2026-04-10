import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Runs all DDL migrations synchronously at app startup.
 * Uses CREATE TABLE IF NOT EXISTS so it is safe to run every launch.
 */
export function runMigrations(database: SQLiteDatabase): void {
  database.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS muscle_groups (
      id          TEXT PRIMARY KEY NOT NULL,
      name        TEXT NOT NULL UNIQUE,
      i18n_key    TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id               TEXT PRIMARY KEY NOT NULL,
      name             TEXT NOT NULL,
      muscle_group     TEXT NOT NULL,
      is_custom        INTEGER NOT NULL DEFAULT 0,
      i18n_key         TEXT,
      search_pt        TEXT,
      search_en        TEXT
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id          TEXT PRIMARY KEY NOT NULL,
      date        TEXT NOT NULL,
      duration    INTEGER,
      notes       TEXT,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id               TEXT PRIMARY KEY NOT NULL,
      workout_id       TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id      TEXT NOT NULL REFERENCES exercises(id),
      exercise_order   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sets (
      id                    TEXT PRIMARY KEY NOT NULL,
      workout_exercise_id   TEXT NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      reps                  INTEGER NOT NULL,
      weight                REAL NOT NULL,
      completed             INTEGER NOT NULL DEFAULT 0,
      timestamp             TEXT NOT NULL
    );
  `);

  ensureExercisesSearchColumns(database);
}

function ensureExercisesSearchColumns(database: SQLiteDatabase): void {
  try {
    const rows = (database as any).getAllSync("PRAGMA table_info(exercises);") as {
      name: string;
    }[];
    const columnNames = new Set(rows.map((row) => row.name));

    if (!columnNames.has("search_pt")) {
      database.execSync("ALTER TABLE exercises ADD COLUMN search_pt TEXT;");
    }

    if (!columnNames.has("search_en")) {
      database.execSync("ALTER TABLE exercises ADD COLUMN search_en TEXT;");
    }
  } catch {
    // Ignore column backfill failures; app can still run without search index.
  }
}
