import { db, expoDb } from "@/db/client";
import { runV1InitialSeedPatch } from "@/db/patches/v001_initial_seed";
import { dataPatches } from "@/db/schema";
import { eq } from "drizzle-orm";

type PatchDb = typeof db;

type DataPatch = {
  id: string;
  run: (database: PatchDb) => Promise<void>;
};

const PATCHES: DataPatch[] = [
  {
    id: "v001_initial_seed",
    run: runV1InitialSeedPatch,
  },
];

function ensurePatchTable(): void {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS __data_patches (
      id          TEXT PRIMARY KEY NOT NULL,
      applied_at  TEXT NOT NULL
    );
  `);
}

export async function runDataPatches(): Promise<void> {
  ensurePatchTable();

  for (const patch of PATCHES) {
    const [existing] = await db
      .select({ id: dataPatches.id })
      .from(dataPatches)
      .where(eq(dataPatches.id, patch.id))
      .limit(1);

    if (existing) {
      continue;
    }

    await db.transaction(async (tx) => {
      await patch.run(tx as unknown as PatchDb);

      await tx.insert(dataPatches).values({
        id: patch.id,
        appliedAt: new Date().toISOString(),
      });
    });
  }
}
