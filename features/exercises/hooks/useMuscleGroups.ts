import { db } from "@/db/client";
import { muscleGroups } from "@/db/schema";
import { asc } from "drizzle-orm";
import { useEffect, useState } from "react";

export function useMuscleGroups() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const rows = await db
        .select({ name: muscleGroups.name })
        .from(muscleGroups)
        .orderBy(asc(muscleGroups.name));

      if (!mounted) {
        return;
      }

      setItems(rows.map((row) => row.name));
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return { items };
}
