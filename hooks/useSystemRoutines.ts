import { db } from "@/db/client";
import { routines as routinesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";

type SystemRoutineTag = {
  id: string;
  slug: string;
  i18nKey: string;
};

type SystemRoutineExercise = {
  id: string;
  name: string;
  i18nKey: string | null;
  exerciseOrder: number;
  setsTarget: number | null;
  repsTarget: string | null;
};

export type SystemRoutine = {
  id: string;
  name: string;
  i18nKey: string | null;
  estimatedDurationMin: number | null;
  createdAt: string;
  tags: SystemRoutineTag[];
  exercises: SystemRoutineExercise[];
};

type UseSystemRoutinesResult = {
  systemRoutines: SystemRoutine[];
  loading: boolean;
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
              i18nKey: link.tag.i18nKey,
            });

            return acc;
          }, []);

          const exercises = routine.routineExercises.map((entry) => {
            const exercise = entry.exercise;

            return {
              id: entry.id,
              name: exercise?.name ?? entry.exerciseId,
              i18nKey: exercise?.i18nKey ?? null,
              exerciseOrder: entry.exerciseOrder,
              setsTarget: entry.setsTarget,
              repsTarget: entry.repsTarget,
            };
          });

          return {
            id: routine.id,
            name: routine.name,
            i18nKey: routine.i18nKey ?? null,
            estimatedDurationMin: routine.estimatedDurationMin,
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

  return { systemRoutines, loading };
}
