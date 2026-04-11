import { db } from "@/db/client";
import { routines as routinesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";

type SystemRoutineTag = {
  id: string;
  slug: string;
};

type SystemRoutineExercise = {
  id: string;
  name: string;
  exerciseOrder: number;
  setsTarget: number | null;
  repsTarget: string | null;
};

export type SystemRoutine = {
  id: string;
  name: string;
  detail: string | null;
  description: string | null;
  isFavorite: boolean;
  createdAt: string;
  tags: SystemRoutineTag[];
  exercises: SystemRoutineExercise[];
};

type UseSystemRoutinesResult = {
  systemRoutines: SystemRoutine[];
  loading: boolean;
  toggleFavorite: (routineId: string) => Promise<void>;
};

export function useSystemRoutines(): UseSystemRoutinesResult {
  const [systemRoutines, setSystemRoutines] = useState<SystemRoutine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSystemRoutines = async () => {
      try {
        const routineRows = await db.query.routines.findMany({
          where: eq(routinesTable.isSystem, true),
          orderBy: (routine, { asc }) => [asc(routine.createdAt)],
          with: {
            routineTagLinks: {
              orderBy: (routineTagLink, { asc }) => [asc(routineTagLink.tagId)],
              with: {
                tag: true,
              },
            },
            routineExercises: {
              orderBy: (routineExercise, { asc }) => [asc(routineExercise.exerciseOrder)],
              with: {
                exercise: true,
              },
            },
          },
        });

        if (!mounted) {
          return;
        }

        const hydrated = routineRows.map<SystemRoutine>((routine) => {
          const tags = routine.routineTagLinks.reduce<SystemRoutineTag[]>((acc, link) => {
            if (!link.tag) {
              return acc;
            }

            acc.push({
              id: link.tag.id,
              slug: link.tag.slug,
            });

            return acc;
          }, []);

          const exercises = routine.routineExercises.map((entry) => {
            const exercise = entry.exercise;

            return {
              id: entry.id,
              name: exercise?.name ?? entry.exerciseId,
              exerciseOrder: entry.exerciseOrder,
              setsTarget: entry.setsTarget,
              repsTarget: entry.repsTarget,
            };
          });

          return {
            id: routine.id,
            name: routine.name,
            detail: routine.detail ?? null,
            description: routine.description ?? null,
            isFavorite: routine.isFavorite,
            createdAt: routine.createdAt,
            tags,
            exercises,
          };
        });

        setSystemRoutines(hydrated);
      } catch {
        if (mounted) {
          setSystemRoutines([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSystemRoutines();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleFavorite = async (routineId: string) => {
    const routine = systemRoutines.find((item) => item.id === routineId);

    if (!routine) {
      return;
    }

    const nextFavoriteValue = !routine.isFavorite;

    setSystemRoutines((prev) =>
      prev.map((item) =>
        item.id === routineId ? { ...item, isFavorite: nextFavoriteValue } : item,
      ),
    );

    try {
      await db
        .update(routinesTable)
        .set({ isFavorite: nextFavoriteValue })
        .where(eq(routinesTable.id, routineId));
    } catch {
      setSystemRoutines((prev) =>
        prev.map((item) =>
          item.id === routineId ? { ...item, isFavorite: routine.isFavorite } : item,
        ),
      );
    }
  };

  return { systemRoutines, loading, toggleFavorite };
}
