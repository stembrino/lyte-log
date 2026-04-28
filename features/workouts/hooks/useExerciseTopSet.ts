import {
  getCompletedExerciseSnapshotByWorkoutId,
  getHeaviestCompletedExerciseSetSnapshot,
  type LastCompletedExerciseSnapshot,
  type HeaviestCompletedExerciseSetSnapshot,
} from "@/features/workouts/dao/queries/workoutSetQueries";
import { useCallback, useState } from "react";

type LoadedTopSetSnapshot = {
  topSet: HeaviestCompletedExerciseSetSnapshot;
  session: LastCompletedExerciseSnapshot | null;
};

type ExerciseTopSetState =
  | {
      status: "idle";
      snapshot: null;
    }
  | {
      status: "loading";
      snapshot: null;
    }
  | {
      status: "loaded";
      snapshot: LoadedTopSetSnapshot;
    }
  | {
      status: "empty";
      snapshot: null;
    }
  | {
      status: "error";
      snapshot: null;
    };

const IDLE_STATE: ExerciseTopSetState = {
  status: "idle",
  snapshot: null,
};

export function useExerciseTopSet(activeWorkoutId: string | null, activeGymId: string | null) {
  const [stateByExerciseId, setStateByExerciseId] = useState<Record<string, ExerciseTopSetState>>(
    {},
  );

  const ensureLoaded = useCallback(
    async (exerciseId: string, scope: "currentGym" | "allGyms" = "allGyms") => {
      const currentState = stateByExerciseId[exerciseId];

      if (
        currentState?.status === "loading" ||
        currentState?.status === "loaded" ||
        currentState?.status === "empty"
      ) {
        return;
      }

      setStateByExerciseId((prev) => ({
        ...prev,
        [exerciseId]: {
          status: "loading",
          snapshot: null,
        },
      }));

      try {
        const snapshot = await getHeaviestCompletedExerciseSetSnapshot({
          exerciseId,
          excludeWorkoutId: activeWorkoutId ?? undefined,
          gymId: scope === "currentGym" ? activeGymId : undefined,
        });

        const session = snapshot
          ? await getCompletedExerciseSnapshotByWorkoutId({
              exerciseId,
              workoutId: snapshot.workoutId,
            })
          : null;

        setStateByExerciseId((prev) => ({
          ...prev,
          [exerciseId]: snapshot
            ? {
                status: "loaded",
                snapshot: {
                  topSet: snapshot,
                  session,
                },
              }
            : {
                status: "empty",
                snapshot: null,
              },
        }));
      } catch {
        setStateByExerciseId((prev) => ({
          ...prev,
          [exerciseId]: {
            status: "error",
            snapshot: null,
          },
        }));
      }
    },
    [activeGymId, activeWorkoutId, stateByExerciseId],
  );

  const retry = useCallback(
    async (exerciseId: string, scope: "currentGym" | "allGyms" = "allGyms") => {
      setStateByExerciseId((prev) => ({
        ...prev,
        [exerciseId]: IDLE_STATE,
      }));

      await ensureLoaded(exerciseId, scope);
    },
    [ensureLoaded],
  );

  const getState = useCallback(
    (exerciseId: string): ExerciseTopSetState => {
      return stateByExerciseId[exerciseId] ?? IDLE_STATE;
    },
    [stateByExerciseId],
  );

  const resetAll = useCallback(() => {
    setStateByExerciseId({});
  }, []);

  return {
    getState,
    ensureLoaded,
    retry,
    resetAll,
  };
}

export type { ExerciseTopSetState };
