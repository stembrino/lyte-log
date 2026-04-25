import { seedDatabase } from "@/db/seed";
import type { db } from "@/db/client";

type PatchDb = typeof db;

export async function runV1InitialSeedPatch(database: PatchDb): Promise<void> {
  await seedDatabase({
    database,
  });
}
