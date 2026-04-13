import { runDevOnlyResetExercisesToBaseline } from "@/db/devOnly/resetExercisesToBaseline.devOnly";
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
      name        TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id               TEXT PRIMARY KEY NOT NULL,
      name             TEXT NOT NULL,
      muscle_group     TEXT NOT NULL,
      is_custom        INTEGER NOT NULL DEFAULT 0,
      search_pt        TEXT,
      search_en        TEXT
    );

    CREATE TABLE IF NOT EXISTS gyms (
      id          TEXT PRIMARY KEY NOT NULL,
      name        TEXT NOT NULL,
      is_default  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id          TEXT PRIMARY KEY NOT NULL,
      date        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'completed',
      duration    INTEGER,
      notes       TEXT,
      gym_id      TEXT REFERENCES gyms(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routines (
      id                      TEXT PRIMARY KEY NOT NULL,
      name                    TEXT NOT NULL,
      detail                  TEXT,
      description             TEXT,
      is_system               INTEGER NOT NULL DEFAULT 0,
      is_favorite             INTEGER NOT NULL DEFAULT 0,
      search_pt               TEXT,
      search_en               TEXT,
      created_at              TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_groups (
      id                      TEXT PRIMARY KEY NOT NULL,
      name                    TEXT NOT NULL,
      detail                  TEXT,
      description             TEXT,
      is_system               INTEGER NOT NULL DEFAULT 0,
      is_favorite             INTEGER NOT NULL DEFAULT 0,
      search_pt               TEXT,
      search_en               TEXT,
      created_at              TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routine_tags (
      id          TEXT PRIMARY KEY NOT NULL,
      slug        TEXT NOT NULL UNIQUE,
      search_pt   TEXT,
      search_en   TEXT
    );

    CREATE TABLE IF NOT EXISTS routine_tag_links (
      routine_id  TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      tag_id      TEXT NOT NULL REFERENCES routine_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (routine_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS routine_exercises (
      id               TEXT PRIMARY KEY NOT NULL,
      routine_id       TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      exercise_id      TEXT NOT NULL REFERENCES exercises(id),
      exercise_order   INTEGER NOT NULL,
      sets_target      INTEGER,
      reps_target      TEXT
    );

    CREATE TABLE IF NOT EXISTS routine_group_routines (
      routine_group_id TEXT NOT NULL REFERENCES routine_groups(id) ON DELETE CASCADE,
      routine_id       TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      position         INTEGER NOT NULL,
      label            TEXT,
      PRIMARY KEY (routine_group_id, routine_id)
    );

    CREATE TABLE IF NOT EXISTS entity_translations (
      entity_type   TEXT NOT NULL,
      entity_id     TEXT NOT NULL,
      field         TEXT NOT NULL,
      locale        TEXT NOT NULL,
      value         TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      PRIMARY KEY (entity_type, entity_id, field, locale)
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

    CREATE TABLE IF NOT EXISTS __data_patches (
      id          TEXT PRIMARY KEY NOT NULL,
      applied_at  TEXT NOT NULL
    );
  `);

  ensureExercisesSearchColumns(database);
  ensureRoutinesFavoriteColumn(database);
  ensureRoutinesDetailDescriptionColumns(database);
  ensureWorkoutsGymIdColumn(database);
  ensureWorkoutsStatusColumn(database);
  removeLegacyI18nColumns(database);

  if (__DEV__) {
    runDevOnlyResetExercisesToBaseline(database, "migrate");
  }
}

function getTableColumns(database: SQLiteDatabase, tableName: string): Set<string> {
  const rows = (database as any).getAllSync(`PRAGMA table_info(${tableName});`) as {
    name: string;
  }[];
  return new Set(rows.map((row) => row.name));
}

function hasColumn(database: SQLiteDatabase, tableName: string, columnName: string): boolean {
  try {
    return getTableColumns(database, tableName).has(columnName);
  } catch {
    return false;
  }
}

function rebuildTableWithoutI18nColumn(
  database: SQLiteDatabase,
  args: {
    tableName: string;
    createSql: string;
    targetColumns: string[];
    sourceByColumn: Record<string, string>;
  },
): void {
  if (!hasColumn(database, args.tableName, "i18n_key")) {
    return;
  }

  const existingColumns = getTableColumns(database, args.tableName);
  const temporaryTableName = `${args.tableName}__new`;

  const selectList = args.targetColumns
    .map((column) => {
      const source = args.sourceByColumn[column] ?? column;
      if (source === "NULL" || source === "0") {
        return `${source} AS ${column}`;
      }
      return existingColumns.has(source) ? `${source} AS ${column}` : `NULL AS ${column}`;
    })
    .join(", ");

  database.execSync(`
    PRAGMA foreign_keys = OFF;
    BEGIN TRANSACTION;
    DROP TABLE IF EXISTS ${temporaryTableName};
    ${args.createSql}
    INSERT INTO ${temporaryTableName} (${args.targetColumns.join(", ")})
    SELECT ${selectList}
    FROM ${args.tableName};
    DROP TABLE ${args.tableName};
    ALTER TABLE ${temporaryTableName} RENAME TO ${args.tableName};
    COMMIT;
    PRAGMA foreign_keys = ON;
  `);
}

function removeLegacyI18nColumns(database: SQLiteDatabase): void {
  try {
    rebuildTableWithoutI18nColumn(database, {
      tableName: "muscle_groups",
      createSql: `CREATE TABLE muscle_groups__new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL UNIQUE
      );`,
      targetColumns: ["id", "name"],
      sourceByColumn: {
        id: "id",
        name: "name",
      },
    });

    rebuildTableWithoutI18nColumn(database, {
      tableName: "exercises",
      createSql: `CREATE TABLE exercises__new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        muscle_group TEXT NOT NULL,
        is_custom INTEGER NOT NULL DEFAULT 0,
        search_pt TEXT,
        search_en TEXT
      );`,
      targetColumns: ["id", "name", "muscle_group", "is_custom", "search_pt", "search_en"],
      sourceByColumn: {
        id: "id",
        name: "name",
        muscle_group: "muscle_group",
        is_custom: "is_custom",
        search_pt: "search_pt",
        search_en: "search_en",
      },
    });

    rebuildTableWithoutI18nColumn(database, {
      tableName: "routines",
      createSql: `CREATE TABLE routines__new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        detail TEXT,
        description TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        search_pt TEXT,
        search_en TEXT,
        created_at TEXT NOT NULL
      );`,
      targetColumns: [
        "id",
        "name",
        "detail",
        "description",
        "is_system",
        "is_favorite",
        "search_pt",
        "search_en",
        "created_at",
      ],
      sourceByColumn: {
        id: "id",
        name: "name",
        detail: "detail",
        description: "description",
        is_system: "is_system",
        is_favorite: "is_favorite",
        search_pt: "search_pt",
        search_en: "search_en",
        created_at: "created_at",
      },
    });

    rebuildTableWithoutI18nColumn(database, {
      tableName: "routine_groups",
      createSql: `CREATE TABLE routine_groups__new (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        detail TEXT,
        description TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        search_pt TEXT,
        search_en TEXT,
        created_at TEXT NOT NULL
      );`,
      targetColumns: [
        "id",
        "name",
        "detail",
        "description",
        "is_system",
        "is_favorite",
        "search_pt",
        "search_en",
        "created_at",
      ],
      sourceByColumn: {
        id: "id",
        name: "name",
        detail: "detail",
        description: "description",
        is_system: "is_system",
        is_favorite: "is_favorite",
        search_pt: "search_pt",
        search_en: "search_en",
        created_at: "created_at",
      },
    });

    rebuildTableWithoutI18nColumn(database, {
      tableName: "routine_tags",
      createSql: `CREATE TABLE routine_tags__new (
        id TEXT PRIMARY KEY NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        search_pt TEXT,
        search_en TEXT
      );`,
      targetColumns: ["id", "slug", "search_pt", "search_en"],
      sourceByColumn: {
        id: "id",
        slug: "slug",
        search_pt: "search_pt",
        search_en: "search_en",
      },
    });
  } catch {
    // Ignore legacy rebuild failures to avoid blocking app startup.
  }
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

function ensureRoutinesFavoriteColumn(database: SQLiteDatabase): void {
  try {
    const rows = (database as any).getAllSync("PRAGMA table_info(routines);") as {
      name: string;
    }[];
    const columnNames = new Set(rows.map((row) => row.name));

    if (!columnNames.has("is_favorite")) {
      database.execSync("ALTER TABLE routines ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;");
    }
  } catch {
    // Ignore backfill failures; app can still run without favorite support.
  }
}

function ensureRoutinesDetailDescriptionColumns(database: SQLiteDatabase): void {
  try {
    const rows = (database as any).getAllSync("PRAGMA table_info(routines);") as {
      name: string;
    }[];
    const columnNames = new Set(rows.map((row) => row.name));

    if (!columnNames.has("detail")) {
      database.execSync("ALTER TABLE routines ADD COLUMN detail TEXT;");
    }

    if (!columnNames.has("description")) {
      database.execSync("ALTER TABLE routines ADD COLUMN description TEXT;");
    }
  } catch {
    // Ignore backfill failures; app can still run without optional routine copy fields.
  }
}

function ensureWorkoutsGymIdColumn(database: SQLiteDatabase): void {
  try {
    const rows = (database as any).getAllSync("PRAGMA table_info(workouts);") as {
      name: string;
    }[];
    const columnNames = new Set(rows.map((row) => row.name));

    if (!columnNames.has("gym_id")) {
      database.execSync(
        "ALTER TABLE workouts ADD COLUMN gym_id TEXT REFERENCES gyms(id) ON DELETE SET NULL;",
      );
    }
  } catch {
    // Ignore backfill failures; app can still run without gym support.
  }
}

function ensureWorkoutsStatusColumn(database: SQLiteDatabase): void {
  try {
    const rows = (database as any).getAllSync("PRAGMA table_info(workouts);") as {
      name: string;
    }[];
    const columnNames = new Set(rows.map((row) => row.name));

    if (!columnNames.has("status")) {
      database.execSync(
        "ALTER TABLE workouts ADD COLUMN status TEXT NOT NULL DEFAULT 'completed';",
      );
    }

    database.execSync(
      "CREATE INDEX IF NOT EXISTS idx_workouts_status_created_at ON workouts(status, created_at DESC);",
    );
  } catch {
    // Ignore backfill/index failures; app can still run without status support.
  }
}
