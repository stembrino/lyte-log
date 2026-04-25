import { db } from "@/db/client";
import { gyms } from "@/db/schema";
import { eq } from "drizzle-orm";

export type GymItem = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export async function getGyms(): Promise<GymItem[]> {
  const rows = await db.query.gyms.findMany({
    orderBy: (table, operators) => [
      operators.desc(table.isDefault),
      operators.asc(table.createdAt),
      operators.asc(table.name),
    ],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
  }));
}

export async function createGym(name: string): Promise<GymItem> {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Gym name is required");
  }

  const existingRows = await db.query.gyms.findMany();
  const normalized = normalizeName(trimmedName);
  const existing = existingRows.find((row) => normalizeName(row.name) === normalized);

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      isDefault: existing.isDefault,
      createdAt: existing.createdAt,
    };
  }

  const gymId = `gym-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const shouldBeDefault = existingRows.length === 0;

  await db.insert(gyms).values({
    id: gymId,
    name: trimmedName,
    isDefault: shouldBeDefault,
    createdAt,
  });

  const created = await db.query.gyms.findFirst({
    where: eq(gyms.id, gymId),
  });

  if (!created) {
    throw new Error("Failed to create gym");
  }

  return {
    id: created.id,
    name: created.name,
    isDefault: created.isDefault,
    createdAt: created.createdAt,
  };
}

export async function getDefaultGymId(): Promise<string | null> {
  const row = await db.query.gyms.findFirst({
    where: eq(gyms.isDefault, true),
    columns: {
      id: true,
    },
  });

  return row?.id ?? null;
}

export async function setDefaultGym(gymId: string | null): Promise<void> {
  await db.update(gyms).set({ isDefault: false });

  if (!gymId) {
    return;
  }

  await db.update(gyms).set({ isDefault: true }).where(eq(gyms.id, gymId));
}
